import threading
import time
import logging
import traceback
import requests
import json
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Import from the new common modules
from api.common.database import get_db_connection, execute_sql
from api.common.data_helpers import (
    get_invoices, 
    get_payments, 
    get_withdrawals,
    update_payment_status,
    check_payment,
    refresh_stripe_payment
)
from api.common.models import PaymentStatus, PaymentType
from psycopg2.extras import Json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('background')

# Configuration
CHECK_INVOICE_INTERVAL = 1  # Check invoices every 60 seconds
WITHDRAWAL_SENDER_INTERVAL = 1  # Process pending withdrawals every 5 seconds
STATUS_CHECKER_INTERVAL = 15  # Check sent withdrawals every 15 seconds
DEPOSIT_CHECK_INTERVAL = 300  # Check deposits every 5 minutes
MAX_INVOICE_AGE_HOURS = 24  # Only check invoices created in the last 24 hours

# Timeout settings
SENDING_TIMEOUT_MINUTES = 5  # Reset 'sending' to 'pending' after 5 minutes
SENT_TIMEOUT_HOURS = 24  # Mark 'sent' as 'failed' after 24 hours

INFURA_DOMAIN = os.getenv("INFURA_DOMAIN", "")
USDT_SERVICE_URL = os.getenv('USDT_SERVICE_URL', 'http://usdt-api:3100')

if INFURA_DOMAIN == "mainnet.infura.io":
    USDT_DECIMALS = 6
elif INFURA_DOMAIN == "sepolia.infura.io":
    USDT_DECIMALS = 6  # Default to Sepolia/testnet
else:
    raise ValueError("Invalid INFURA_DOMAIN configuration")


def decimal_json_encoder(obj):
    """JSON encoder that handles Decimal types"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def safe_json_dumps(data):
    """Safely serialize data to JSON, handling Decimal types"""
    return json.dumps(data, default=decimal_json_encoder)


def check_invoice_payments():
    """
    Checks for pending invoices and updates their status if paid
    """
    logger.info("Starting invoice payment check")
    try:
        # Get timestamp for filtering (only check recent invoices)
        cutoff_time = datetime.now() - timedelta(hours=MAX_INVOICE_AGE_HOURS)
        
        # Get all invoices from the last 24 hours that don't have completed payments
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Query for invoices without completed payments within the time window
        execute_sql(cur, """
            SELECT i.id, i.external_id, i.type, i.searchable_id, i.buyer_id, i.seller_id,
                   i.amount, i.currency, i.created_at, i.metadata
            FROM invoice i 
            LEFT JOIN payment p ON i.id = p.invoice_id AND p.status = %s
            WHERE i.created_at >= %s
            AND p.id IS NULL
        """, params=(PaymentStatus.COMPLETE.value, cutoff_time))
        
        invoices = cur.fetchall()
        cur.close()
        conn.close()
        
        # Track processed invoices
        processed_count = 0
        paid_count = 0
        
        for invoice_row in invoices:
            invoice_id, external_id, invoice_type, searchable_id, buyer_id, seller_id, amount, currency, created_at, metadata = invoice_row
                
            # Check payment status for Stripe payments only
            if invoice_type == 'stripe':
                try:
                    session_id = external_id
                    payment_data = refresh_stripe_payment(session_id)
                    processed_count += 1
                    
                    # If payment is paid, it has been recorded by the helper function
                    if payment_data.get('status') == 'paid':
                        paid_count += 1
                        logger.info(f"Recorded Stripe payment for session {session_id}")
                        
                except Exception as e:
                    logger.error(f"Error checking Stripe payment status for session {external_id}: {str(e)}")
        
        logger.info(f"Completed invoice check: processed {processed_count} invoices, recorded {paid_count} payments")
        
    except Exception as e:
        logger.error(f"Error in check_invoice_payments: {str(e)}")
        logger.error(traceback.format_exc())


def is_valid_tx_hash(txhash):
    """
    Check if an Ethereum transaction hash is valid.
    
    Args:
        txhash (str): The transaction hash to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Remove '0x' prefix if present
    if txhash.startswith('0x'):
        txhash = txhash[2:]
    
    # Check if it's exactly 64 characters long
    if len(txhash) != 64:
        return False
    
    # Check if all characters are valid hexadecimal
    try:
        int(txhash, 16)
        return True
    except ValueError:
        return False

def process_pending_withdrawals():
    """
    JOB 1: Process pending withdrawals by sending them to USDT service
    Status flow: pending → sending → sent (or back to pending on error)
    """
    logger.info("Starting withdrawal sender job")
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, f"""
            SELECT id, user_id, amount, currency, type, external_id, metadata
            FROM withdrawal 
            WHERE status = '{PaymentStatus.PENDING.value}'
            ORDER BY created_at ASC
            LIMIT 1
        """) # do we need "FOR UPDATE" 
        
        pending_withdrawals = cur.fetchall()
        
        processed_count = 0
        
        for withdrawal_row in pending_withdrawals:
            withdrawal_id, user_id, amount, currency, withdrawal_type, external_id, metadata = withdrawal_row
            metadata = metadata or {}
            
            processed_count += 1
            
            try:
                logger.info(f"Processing pending withdrawal {withdrawal_id} for ${amount} {currency}")
                
                
                if currency.lower() == 'usd':
                    # Process USDT withdrawal
                    address = metadata.get('address')
                    if not address:
                        pass
                        # todo: mark as failed
                        # raise Exception("USDT withdrawal missing address")
                    
                    # Call USDT service (convert Decimal amount to float for JSON serialization)
                    usdt_amount = float(amount) * 10 ** USDT_DECIMALS
                    response = requests.post('http://usdt-api:3100/send', json={
                        'to': address,
                        'amount': usdt_amount,
                        'request_id': f'withdrawal_{withdrawal_id}'
                    }, timeout=60)
                    
                    response_data = response.json()
                    logger.info(f"USDT API response for withdrawal {withdrawal_id}: {response_data}")
                    
                    if 'txHash' in response_data and is_valid_tx_hash(response_data.get('txHash')) and 'status' in response_data and response_data.get('status') == 'complete':
                        # Success - got txHash, mark as 'sent'
                        tx_hash = response_data.get('txHash')

                        # Preserve existing metadata and add new fields
                        complete_metadata = metadata.copy()
                        complete_metadata.update({
                            'tx_hash': tx_hash,
                            'complete_timestamp': int(time.time()),
                            # Ensure important fields are preserved
                            'address': metadata.get('address'),
                            'original_amount': metadata.get('original_amount'),
                            'fee_percentage': metadata.get('fee_percentage'),
                            'amount_after_fee': metadata.get('amount_after_fee')
                        })
                        
                        cur.execute("""
                            UPDATE withdrawal 
                            SET status = %s,
                                external_id = %s,
                                metadata = %s
                            WHERE id = %s
                        """, (PaymentStatus.COMPLETE.value, tx_hash, safe_json_dumps(complete_metadata), withdrawal_id))
                        
                        logger.info(f"✅ Withdrawal {withdrawal_id} sent successfully - txHash: {tx_hash}")
                        
                    elif 'txHash' in response_data and is_valid_tx_hash(response_data.get('txHash')):
                        # we should check the status code to be 5xx
                        tx_hash = response_data.get('txHash')
                        error = response_data.get('error', 'Unknown error')
                        logger.error(f"❌ Withdrawal {withdrawal_id} sent but failed with error: {error} - txHash: {tx_hash}")
                        # Preserve existing metadata and add new fields
                        sent_metadata = metadata.copy()
                        sent_metadata.update({
                            'tx_hash': tx_hash,
                            'complete_timestamp': int(time.time()),
                            # Ensure important fields are preserved
                            'address': metadata.get('address'),
                            'original_amount': metadata.get('original_amount'),
                            'fee_percentage': metadata.get('fee_percentage'),
                            'amount_after_fee': metadata.get('amount_after_fee'),
                            'error': error
                        })
                        
                        cur.execute("""
                            UPDATE withdrawal 
                            SET status = %s,
                                external_id = %s,
                                metadata = %s
                            WHERE id = %s
                        """, (PaymentStatus.DELAYED.value, tx_hash, safe_json_dumps(sent_metadata), withdrawal_id))
                    else:
                        # Preserve existing metadata and add error timestamp
                        error_metadata = metadata.copy()

                        error = response_data.get('error', 'Unknown error')
                        logger.error(f"❌ Withdrawal {withdrawal_id} sent but failed with error: {error} - txHash: {tx_hash}")
                        
                        error_metadata.update({
                            'error_timestamp': int(time.time()),
                            # Ensure important fields are preserved
                            'address': metadata.get('address'),
                            'original_amount': metadata.get('original_amount'),
                            'fee_percentage': metadata.get('fee_percentage'),
                            'amount_after_fee': metadata.get('amount_after_fee'),
                            'error': error
                        })
                        # todo: error should be excluded from balance calculation
                        cur.execute("""
                            UPDATE withdrawal 
                            SET status = %s,
                                metadata = %s
                            WHERE id = %s
                        """, (PaymentStatus.ERROR.value, safe_json_dumps(error_metadata), withdrawal_id))
                        
                else:
                    raise Exception(f"Unsupported currency for withdrawal: {currency}")
                
            except Exception as e:
                logger.error(f"Error processing withdrawal {withdrawal_id}: {str(e)}")
                
            
            conn.commit()
        
        cur.close()
        conn.close()
        
        logger.info(f"Withdrawal sender job completed: processed {processed_count} withdrawals")
        
    except Exception as e:
        logger.error(f"Error in process_pending_withdrawals: {str(e)}")
        logger.error(traceback.format_exc())


def check_delayed_withdrawals():
    """
    JOB 2: Check status of sent withdrawals using USDT service
    Status flow: sent → complete/failed (or stay sent if pending)
    """
    logger.info("Starting status checker job")
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        execute_sql(cur, f"""
            SELECT id, user_id, amount, currency, metadata, external_id, status
            FROM withdrawal 
            WHERE status = '{PaymentStatus.DELAYED.value}'
            AND external_id IS NOT NULL
            ORDER BY created_at ASC
            LIMIT 1
        """)
        
        sent_withdrawals = cur.fetchall()
        
        checked_count = 0
        
        for withdrawal_row in sent_withdrawals:
            withdrawal_id, user_id, amount, currency, metadata, external_id, current_status = withdrawal_row
            metadata = metadata or {}
            
            tx_hash = external_id
            
            if not tx_hash or tx_hash in ['None', 'null', 'undefined']:
                # todo: it should not happen
                logger.warning(f"Sent withdrawal {withdrawal_id} has invalid tx_hash: '{tx_hash}', marking as failed")
                raise Exception(f"Invalid tx_hash for withdrawal {withdrawal_id}")
            else:
                try:
                    logger.info(f"Checking status of sent withdrawal {withdrawal_id} with tx_hash: {tx_hash}")
                    
                    # Query transaction status from USDT service
                    response = requests.get(f'http://usdt-api:3100/tx-status/{tx_hash}', timeout=10)
                    
                    if response.status_code == 200:
                        tx_status = response.json()
                        logger.info(f"Transaction status for withdrawal {withdrawal_id}: {tx_status}")
                        
                        if tx_status['status'] == 'complete':
                            # Transaction confirmed and successful - preserve existing metadata
                            updated_metadata = metadata.copy()
                            updated_metadata.update({
                                'tx_hash': tx_hash,
                                'confirmed_timestamp': int(time.time()),
                                # Ensure important fields are preserved
                                'address': metadata.get('address'),
                                'original_amount': metadata.get('original_amount'),
                                'fee_percentage': metadata.get('fee_percentage'),
                                'amount_after_fee': metadata.get('amount_after_fee')
                            })
                            
                            cur.execute("""
                                UPDATE withdrawal 
                                SET status = %s,
                                    metadata = %s
                                WHERE id = %s
                            """, (PaymentStatus.COMPLETE.value, safe_json_dumps(updated_metadata), withdrawal_id))
                            
                            logger.info(f"✅ Withdrawal {withdrawal_id} confirmed as complete ")
                            
                        elif tx_status['status'] == 'failed':
                            # Transaction confirmed but reverted/failed - preserve existing metadata
                            updated_metadata = metadata.copy()
                            updated_metadata.update({
                                'tx_hash': tx_hash,
                                'failed_timestamp': int(time.time()),
                                # Ensure important fields are preserved
                                'address': metadata.get('address'),
                                'original_amount': metadata.get('original_amount'),
                                'fee_percentage': metadata.get('fee_percentage'),
                                'amount_after_fee': metadata.get('amount_after_fee')
                            })
                            
                            cur.execute("""
                                UPDATE withdrawal 
                                SET status = %s,
                                    metadata = %s
                                WHERE id = %s
                            """, (PaymentStatus.FAILED.value, safe_json_dumps(updated_metadata), withdrawal_id))
                            
                            logger.error(f"❌ Withdrawal {withdrawal_id} failed - transaction reverted on-chain")
                        else:
                            # Transaction is still pending - leave as 'sent' for now
                            logger.info(f"⏳ Withdrawal {withdrawal_id} still pending on blockchain, will check again later")

                        conn.commit()

                    else:
                        # Other error - log but keep as 'sent' for now
                        logger.warning(f"Failed to get transaction status for withdrawal {withdrawal_id} (HTTP {response.status_code}), will retry later")
                        
                    checked_count += 1
                        
                except Exception as e:
                    logger.error(f"Error checking sent withdrawal {withdrawal_id}: {str(e)}")
                    # Keep as 'sent' and retry later
        
        cur.close()
        conn.close()
        
        logger.info(f"Status checker job completed: checked {checked_count} withdrawals")
        
    except Exception as e:
        logger.error(f"Error in check_delayed_withdrawals: {str(e)}")
        logger.error(traceback.format_exc())


def invoice_check_thread():
    """Thread function that periodically checks invoice payments"""
    while True:
        try:
            check_invoice_payments()
        except Exception as e:
            logger.error(f"Error in invoice check thread: {str(e)}")
            logger.error(traceback.format_exc())
        
        time.sleep(CHECK_INVOICE_INTERVAL)


def withdrawal_sender_thread():
    """Thread function that periodically processes pending withdrawals"""
    while True:
        try:
            check_pending_deposits()
            check_delayed_withdrawals()
            process_pending_withdrawals()
        except Exception as e:
            logger.error(f"Error in withdrawal sender thread: {str(e)}")
            logger.error(traceback.format_exc())
        
        time.sleep(WITHDRAWAL_SENDER_INTERVAL)




def check_pending_deposits():
    """Check pending deposits for USDT balance and update status"""
    try:
        logger.info("Checking pending deposits...")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            # Get pending deposits that haven't expired
            execute_sql(cur, """
                SELECT id, user_id, amount, metadata, created_at
                FROM deposit
                WHERE status = 'pending'
                AND created_at > NOW() - INTERVAL '24 hours'
                ORDER BY created_at ASC
            """)
            
            pending_deposits = cur.fetchall()
            logger.info(f"Found {len(pending_deposits)} pending deposits to check")
            
            for deposit in pending_deposits:
                deposit_id, user_id, expected_amount, metadata, created_at = deposit
                
                try:
                    # Check if deposit has expired (23 hours)
                    if datetime.utcnow() - created_at.replace(tzinfo=None) > timedelta(hours=24):
                        logger.info(f"Deposit {deposit_id} has expired, marking as failed")
                        metadata['error'] = 'Deposit expired after 23 hours'
                        execute_sql(cur, """
                            UPDATE deposit 
                            SET status = 'failed', metadata = %s
                            WHERE id = %s
                        """, params=(Json(metadata), deposit_id), commit=True, connection=conn)
                        continue
                    
                    eth_address = metadata.get('eth_address')
                    if not eth_address:
                        logger.error(f"Deposit {deposit_id} missing eth_address in metadata")
                        continue
                    
                    # Check balance at the deposit address
                    logger.info(f"Checking balance for deposit {deposit_id} at address {eth_address}")
                    
                    balance_response = requests.get(
                        f"{USDT_SERVICE_URL}/balance/{eth_address}",
                        timeout=10
                    )
                    
                    if balance_response.status_code != 200:
                        logger.error(f"Failed to check balance for {eth_address}: {balance_response.text}")
                        continue
                    
                    balance_data = balance_response.json()
                    balance_wei = int(balance_data['balance'])
                    
                    # Convert from wei (6 decimals for USDT) to decimal
                    balance_usdt = Decimal(balance_wei) / Decimal(10 ** USDT_DECIMALS)
                    
                    logger.info(f"Deposit {deposit_id}: Expected {expected_amount} USDT, found {balance_usdt} USDT")
                    
                    # Update checked_at timestamp
                    metadata['checked_at'] = datetime.utcnow().isoformat()
                    
                    # Check if balance meets or exceeds expected amount
                    if balance_usdt >= expected_amount:
                        logger.info(f"Deposit {deposit_id} has sufficient balance, marking as complete")
                        
                        # Get transaction details to find the actual deposit
                        try:
                            # Check for transactions to this address
                            tx_response = requests.get(
                                f"{USDT_SERVICE_URL}/transactions/{eth_address}",
                                timeout=10
                            )
                            
                            if tx_response.status_code == 200:
                                tx_data = tx_response.json()
                                transactions = tx_data.get('transactions', [])
                                
                                # Find the most recent incoming transaction
                                for tx in transactions:
                                    if tx.get('to', '').lower() == eth_address.lower():
                                        metadata['tx_hash'] = tx.get('hash')
                                        metadata['from_address'] = tx.get('from')
                                        break
                        except Exception as e:
                            logger.warning(f"Failed to get transaction details: {str(e)}")
                        
                        # Update the amount to the actual deposited amount
                        actual_amount = balance_usdt
                        
                        # For now, just mark as complete
                        metadata['balance_found'] = str(actual_amount)
                        metadata['completed_at'] = datetime.utcnow().isoformat()
                        
                        execute_sql(cur, """
                            UPDATE deposit 
                            SET status = 'complete', 
                                amount = %s,
                                metadata = %s
                            WHERE id = %s
                        """, params=(actual_amount, Json(metadata), deposit_id), commit=True, connection=conn)
                        
                        logger.info(f"Deposit {deposit_id} completed successfully")
                        
                    else:
                        # Just update the checked_at timestamp
                        execute_sql(cur, """
                            UPDATE deposit 
                            SET metadata = %s
                            WHERE id = %s
                        """, params=(Json(metadata), deposit_id), commit=True, connection=conn)
                        
                except Exception as e:
                    logger.error(f"Error processing deposit {deposit_id}: {str(e)}")
                    logger.error(traceback.format_exc())
                    
        finally:
            cur.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error in check_pending_deposits: {str(e)}")
        logger.error(traceback.format_exc())

# Removed separate deposit_check_thread - now runs in withdrawal_sender_thread

def start_background_threads():
    """Start all background processing threads"""
    logger.info("Starting background processing threads with new two-job withdrawal system")
    
    # Start invoice check thread
    invoice_thread = threading.Thread(
        target=invoice_check_thread,
        daemon=True,
        name="invoice-check"
    )
    invoice_thread.start()
    
    # Start withdrawal sender thread (Job 1)
    sender_thread = threading.Thread(
        target=withdrawal_sender_thread,
        daemon=True,
        name="withdrawal-sender"
    )
    sender_thread.start()
    
    logger.info("Background threads started:")
    logger.info(f"  - Invoice checker: every {CHECK_INVOICE_INTERVAL}s")
    logger.info(f"  - Withdrawal/Deposit processor: every {WITHDRAWAL_SENDER_INTERVAL}s")
    
    return [invoice_thread, sender_thread]


# This will be called when the module is imported
if __name__ == "__main__":
    # If run directly, start the threads
    threads = start_background_threads()
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(3600)  # Sleep for an hour
    except KeyboardInterrupt:
        logger.info("Shutting down background processor")