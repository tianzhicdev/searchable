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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('background')

# Configuration
CHECK_INVOICE_INTERVAL = 60  # Check invoices every 60 seconds
WITHDRAWAL_SENDER_INTERVAL = 5  # Process pending withdrawals every 5 seconds
STATUS_CHECKER_INTERVAL = 15  # Check sent withdrawals every 15 seconds
MAX_INVOICE_AGE_HOURS = 24  # Only check invoices created in the last 24 hours

# Timeout settings
SENDING_TIMEOUT_MINUTES = 5  # Reset 'sending' to 'pending' after 5 minutes
SENT_TIMEOUT_HOURS = 24  # Mark 'sent' as 'failed' after 24 hours

INFURA_DOMAIN = os.getenv("INFURA_DOMAIN", "")

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

                        complete_metadata = {
                            'tx_hash': tx_hash,
                            'complete_timestamp': int(time.time()),
                        }
                        
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
                        sent_metadata = {
                            'tx_hash': tx_hash,
                            'complete_timestamp': int(time.time()),
                        }
                        
                        cur.execute("""
                            UPDATE withdrawal 
                            SET status = %s,
                                external_id = %s,
                                metadata = %s
                            WHERE id = %s
                        """, (PaymentStatus.DELAYED.value, tx_hash, safe_json_dumps(sent_metadata), withdrawal_id))
                    else:
                        error_metadata = {
                            'error_timestamp': int(time.time()),
                        }
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
                            # Transaction confirmed and successful - keep only essential fields
                            updated_metadata = {
                                'tx_hash': tx_hash,
                                'confirmed_timestamp': int(time.time()),
                            }
                            
                            cur.execute("""
                                UPDATE withdrawal 
                                SET status = %s,
                                    metadata = %s
                                WHERE id = %s
                            """, (PaymentStatus.COMPLETE.value, safe_json_dumps(updated_metadata), withdrawal_id))
                            
                            logger.info(f"✅ Withdrawal {withdrawal_id} confirmed as complete ")
                            
                        elif tx_status['status'] == 'failed':
                            # Transaction confirmed but reverted/failed - keep only essential fields
                            updated_metadata = {
                                'tx_hash': tx_hash,
                                'failed_timestamp': int(time.time())
                            }
                            
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

            check_delayed_withdrawals()
            process_pending_withdrawals()
        except Exception as e:
            logger.error(f"Error in withdrawal sender thread: {str(e)}")
            logger.error(traceback.format_exc())
        
        time.sleep(WITHDRAWAL_SENDER_INTERVAL)




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
    logger.info(f"  - Withdrawal sender: every {WITHDRAWAL_SENDER_INTERVAL}s")
    logger.info(f"  - Status checker: every {STATUS_CHECKER_INTERVAL}s")
    
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