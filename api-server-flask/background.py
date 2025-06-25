import threading
import time
import logging
import traceback
import requests
import json
import os
from datetime import datetime, timedelta

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
PROCESS_WITHDRAWAL_INTERVAL = 5  # Process withdrawals every 5 seconds
MAX_INVOICE_AGE_HOURS = 24  # Only check invoices created in the last 24 hours


INFURA_DOMAIN = os.getenv("INFURA_DOMAIN", "")

if INFURA_DOMAIN == "mainnet.infura.io":
    USDT_DECIMALS = 6
elif INFURA_DOMAIN == "sepolia.infura.io":
    USDT_DECIMALS = 6  # Default to Sepolia/testnet
else:
    raise ValueError("Invalid INFURA_DOMAIN configuration")

def get_delayed_withdrawals_for_retry():
    """
    Get delayed withdrawals that are eligible for retry (nonce collision errors)
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get delayed withdrawals that have nonce errors and were delayed less than 5 minutes ago
        five_minutes_ago = int(time.time()) - 300
        
        execute_sql(cur, f"""
            SELECT id, user_id, amount, currency, type, external_id, metadata
            FROM withdrawal 
            WHERE status = '{PaymentStatus.DELAYED.value}'
            AND metadata->>'error_type' = 'nonce_collision'
            AND metadata->>'retry_eligible' = 'true'
            AND CAST(metadata->>'delayed_timestamp' AS INTEGER) > {five_minutes_ago}
            ORDER BY created_at ASC
            LIMIT 5
        """)
        
        delayed_records = []
        rows = cur.fetchall()
        
        for row in rows:
            delayed_records.append({
                'id': row[0],
                'user_id': row[1], 
                'amount': row[2],
                'currency': row[3],
                'type': row[4],
                'external_id': row[5],
                'metadata': row[6] or {}
            })
        
        cur.close()
        conn.close()
        
        if delayed_records:
            logger.info(f"Found {len(delayed_records)} delayed withdrawals eligible for nonce retry")
        
        return delayed_records
        
    except Exception as e:
        logger.error(f"Error getting delayed withdrawals for retry: {str(e)}")
        return []

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


def process_pending_withdrawals():
    """
    Processes pending withdrawal requests
    """
    logger.info("Starting withdrawal processing")
    try:
        # Get pending withdrawals using the new helper function
        withdrawal_records = get_withdrawals(status=PaymentStatus.PENDING.value)
        
        # Also get delayed withdrawals that are eligible for retry (nonce errors)
        delayed_retry_records = get_delayed_withdrawals_for_retry()
        
        # Combine both types for processing
        all_withdrawal_records = withdrawal_records + delayed_retry_records
        
        # Track stats
        processed_count = 0
        
        for withdrawal in all_withdrawal_records:
            withdrawal_id = withdrawal['id']
            user_id = withdrawal['user_id']
            amount = withdrawal['amount']
            currency = withdrawal['currency']
            withdrawal_type = withdrawal['type']
            external_id = withdrawal['external_id']
            metadata = withdrawal.get('metadata', {})
            
            processed_count += 1
            
            try:
                if currency.lower() == 'usd':
                    # Process USDT withdrawal
                    address = metadata.get('address')
                    if not address:
                        raise Exception("USDT withdrawal missing address")
                    
                    response = requests.post('http://usdt-api:3100/send', json={
                        'to': address,
                        'amount': amount * 10 ** USDT_DECIMALS,
                        'request_id': f'withdrawal_{withdrawal_id}'
                    }, timeout=30)
                    
                    response_data = response.json()
                    logger.info(f"USDT server response: {response_data}")
                    
                    if response.status_code == 200 and response_data.get('success'):
                        # Get transaction ID from response
                        tx_hash = response_data.get('txHash')
                        response_status = response_data.get('status', 'processing')
                        
                        # Update the withdrawal record with processing status (since USDT service now returns immediately)
                        conn = get_db_connection()
                        cur = conn.cursor()
                        
                        if response_status == 'processing':
                            # Transaction was signed and broadcasted but not yet confirmed
                            updated_metadata = {
                                **metadata,
                                'tx_hash': tx_hash,
                                'processing_timestamp': int(time.time())
                            }
                            
                            execute_sql(cur, f"""
                                UPDATE withdrawal 
                                SET status = '{PaymentStatus.PROCESSING.value}', 
                                    external_id = '{tx_hash}',
                                    metadata = '{json.dumps(updated_metadata)}'
                                WHERE id = '{withdrawal_id}'
                            """)
                            
                            logger.info(f"USDT withdrawal {withdrawal_id} processing - tx_hash: {tx_hash}")
                        else:
                            # Legacy: transaction was confirmed (old behavior)
                            updated_metadata = {
                                **metadata,
                                'tx_hash': tx_hash,
                                'processed_timestamp': int(time.time()),
                                'status': PaymentStatus.COMPLETE.value,
                                'block_number': response_data.get('blockNumber'),
                                'gas_used': response_data.get('gasUsed')
                            }
                            
                            execute_sql(cur, f"""
                                UPDATE withdrawal 
                                SET status = '{PaymentStatus.COMPLETE.value}', 
                                    external_id = '{tx_hash}',
                                    metadata = '{json.dumps(updated_metadata)}'
                                WHERE id = '{withdrawal_id}'
                            """)
                            
                            logger.info(f"Completed USDT withdrawal {withdrawal_id} to {address} for ${amount} USD, tx_hash: {tx_hash}")
                        
                        conn.commit()
                        cur.close()
                        conn.close()
                    else:
                        # Got error response but might have tx hash
                        tx_hash = response_data.get('txHash')
                        error_msg = response_data.get('error', 'Unknown error')
                        
                        if tx_hash:
                            # We have a tx hash, so transaction was signed and possibly sent
                            raise Exception(f"USDT service error (with txHash): {error_msg}")
                        else:
                            # No tx hash, transaction never made it to blockchain
                            raise Exception(f"USDT service error (no txHash): {error_msg}")
                        
                else:
                    logger.warning(f"Unsupported currency for withdrawal: {currency}")
                
            except Exception as e:
                logger.error(f"Error processing withdrawal {withdrawal_id}: {str(e)}")
                
                # Determine if this should be failed immediately or delayed
                error_message = str(e).lower()
                should_fail_immediately = (
                    'invalid recipient address' in error_message or
                    'invalid address format' in error_message or
                    'invalid amount' in error_message or
                    'insufficient funds' in error_message
                )
                
                # Handle nonce collision errors as delayed (recoverable)
                is_nonce_error = (
                    'replacement transaction underpriced' in error_message or
                    'nonce too low' in error_message or
                    'already known' in error_message
                )
                
                try:
                    conn = get_db_connection()
                    cur = conn.cursor()
                    
                    # Extract tx_hash from error if available
                    tx_hash = None
                    if 'response_data' in locals() and response_data:
                        tx_hash = response_data.get('txHash')
                    
                    if should_fail_immediately:
                        # Mark as failed for validation errors that won't recover
                        updated_metadata = {
                            **metadata,
                            'error': str(e),
                            'failed_timestamp': int(time.time()),
                            'failure_reason': 'Invalid withdrawal parameters'
                        }
                        
                        status = PaymentStatus.FAILED.value
                        logger.warning(f"Marked withdrawal {withdrawal_id} as failed due to validation error: {str(e)}")
                    elif is_nonce_error:
                        # Mark as delayed for nonce collision errors (recoverable with retry)
                        updated_metadata = {
                            **metadata,
                            'error': str(e),
                            'delayed_timestamp': int(time.time()),
                            'error_type': 'nonce_collision',
                            'retry_eligible': True
                        }
                        
                        status = PaymentStatus.DELAYED.value
                        logger.warning(f"Marked withdrawal {withdrawal_id} as delayed due to nonce collision: {str(e)}")
                    else:
                        # Mark as delayed for potential recoverable errors
                        updated_metadata = {
                            **metadata,
                            'error': str(e),
                            'delayed_timestamp': int(time.time())
                        }
                        
                        if tx_hash:
                            updated_metadata['tx_hash'] = tx_hash
                            logger.info(f"Withdrawal {withdrawal_id} has tx_hash: {tx_hash} despite error")
                        
                        status = PaymentStatus.DELAYED.value
                        logger.warning(f"Marked withdrawal {withdrawal_id} as delayed due to: {str(e)}")
                    
                    execute_sql(cur, """
                        UPDATE withdrawal 
                        SET status = '{status}', 
                            metadata = '{json.dumps(updated_metadata)}'
                            {f", external_id = '{tx_hash}'" if tx_hash else ""}
                        WHERE id = '{withdrawal_id}'
                    """)
                    
                    conn.commit()
                    cur.close()
                    conn.close()
                except Exception as e2:
                    logger.error(f"Error updating withdrawal status: {str(e2)}")
        
        logger.info(f"Completed withdrawal processing: processed {processed_count} withdrawals")
        
    except Exception as e:
        logger.error(f"Error in process_pending_withdrawals: {str(e)}")
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


def check_delayed_withdrawals():
    """
    Checks delayed and processing withdrawals by querying their transaction status on blockchain
    """
    logger.info("Starting delayed and processing withdrawal check")
    try:
        # Get delayed and processing withdrawals that have a tx_hash
        conn = get_db_connection()
        cur = conn.cursor()
        
        execute_sql(cur, f"""
            SELECT id, user_id, amount, currency, metadata, external_id, status
            FROM withdrawal 
            WHERE status IN ('{PaymentStatus.DELAYED.value}', '{PaymentStatus.PROCESSING.value}')
            AND (external_id IS NOT NULL OR metadata->>'tx_hash' IS NOT NULL)
            ORDER BY created_at ASC
            LIMIT 20
        """)
        
        withdrawals_to_check = cur.fetchall()
        cur.close()
        conn.close()
        
        checked_count = 0
        
        for withdrawal_row in withdrawals_to_check:
            withdrawal_id, user_id, amount, currency, metadata, external_id, current_status = withdrawal_row
            
            # Get tx_hash from external_id or metadata
            tx_hash = external_id or (metadata and metadata.get('tx_hash'))
            
            if not tx_hash:
                logger.warning(f"{current_status.title()} withdrawal {withdrawal_id} has no tx_hash to check")
                continue
            
            try:
                logger.info(f"Checking status of {current_status} withdrawal {withdrawal_id} with tx_hash: {tx_hash}")
                
                # Query transaction status from USDT service
                response = requests.get(f'http://usdt-api:3100/tx-status/{tx_hash}', timeout=10)
                
                if response.status_code == 200:
                    tx_status = response.json()
                    logger.info(f"Transaction status for withdrawal {withdrawal_id}: {tx_status}")
                    
                    conn = get_db_connection()
                    cur = conn.cursor()
                    
                    if tx_status['status'] == 'confirmed' and tx_status['success']:
                        # Transaction confirmed and successful
                        updated_metadata = {
                            **metadata,
                            'tx_status_check': tx_status,
                            'confirmed_timestamp': int(time.time()),
                            'confirmations': tx_status['confirmations'],
                            'block_number': tx_status['blockNumber'],
                            'gas_used': tx_status.get('gasUsed'),
                            'receipt_info': tx_status.get('receiptInfo', {})
                        }
                        
                        execute_sql(cur, f"""
                            UPDATE withdrawal 
                            SET status = '{PaymentStatus.COMPLETE.value}',
                                metadata = '{json.dumps(updated_metadata)}'
                            WHERE id = '{withdrawal_id}'
                        """)
                        
                        logger.info(f"{current_status.title()} withdrawal {withdrawal_id} confirmed as complete with {tx_status['confirmations']} confirmations")
                        
                    elif tx_status['status'] == 'confirmed' and not tx_status['success']:
                        # Transaction confirmed but reverted/failed
                        updated_metadata = {
                            **metadata,
                            'tx_status_check': tx_status,
                            'failed_timestamp': int(time.time()),
                            'failure_reason': 'Transaction reverted on-chain'
                        }
                        
                        execute_sql(cur, f"""
                            UPDATE withdrawal 
                            SET status = '{PaymentStatus.FAILED.value}',
                                metadata = '{json.dumps(updated_metadata)}'
                            WHERE id = '{withdrawal_id}'
                        """)
                        
                        logger.error(f"{current_status.title()} withdrawal {withdrawal_id} failed - transaction reverted")
                        
                    elif tx_status['status'] == 'not_found':
                        # Transaction not found - mark as failed immediately
                        updated_metadata = {
                            **metadata,
                            'tx_status_check': tx_status,
                            'failed_timestamp': int(time.time()),
                            'failure_reason': 'Transaction not found on blockchain - likely rejected by network'
                        }
                        
                        execute_sql(cur, f"""
                            UPDATE withdrawal 
                            SET status = '{PaymentStatus.FAILED.value}',
                                metadata = '{json.dumps(updated_metadata)}'
                            WHERE id = '{withdrawal_id}'
                        """)
                        
                        logger.error(f"{current_status.title()} withdrawal {withdrawal_id} failed - transaction not found (likely rejected by network)")
                    
                    # If status is 'pending', we leave it as delayed and check again later
                    
                    conn.commit()
                    cur.close()
                    conn.close()
                elif response.status_code == 503:
                    # Network connectivity issue - should retry
                    try:
                        error_data = response.json()
                        if error_data.get('retryable'):
                            logger.warning(f"Network error checking {current_status} withdrawal {withdrawal_id}: {error_data.get('error')}, will retry later")
                        else:
                            logger.error(f"Non-retryable error checking {current_status} withdrawal {withdrawal_id}: {error_data.get('error')}")
                    except:
                        logger.warning(f"Network error checking {current_status} withdrawal {withdrawal_id}, will retry later")
                else:
                    # Other error status codes
                    logger.warning(f"Failed to get transaction status for {current_status} withdrawal {withdrawal_id} (HTTP {response.status_code}), will retry later")
                    
                checked_count += 1
                    
            except Exception as e:
                logger.error(f"Error checking {current_status} withdrawal {withdrawal_id}: {str(e)}")
        
        logger.info(f"Completed delayed and processing withdrawal check: checked {checked_count} withdrawals")
        
    except Exception as e:
        logger.error(f"Error in check_delayed_withdrawals: {str(e)}")
        logger.error(traceback.format_exc())

def withdrawal_processing_thread():
    """Thread function that periodically processes pending withdrawals"""
    check_counter = 0
    while True:
        try:
            # Process pending withdrawals
            process_pending_withdrawals()
            
            # Check delayed and processing withdrawals every 3 iterations (15 seconds)
            check_counter += 1
            if check_counter >= 3:
                check_delayed_withdrawals()
                check_counter = 0
                
        except Exception as e:
            logger.error(f"Error in withdrawal processing thread: {str(e)}")
            logger.error(traceback.format_exc())
        
        time.sleep(PROCESS_WITHDRAWAL_INTERVAL)


def start_background_threads():
    """Start all background processing threads"""
    logger.info("Starting background processing threads")
    
    # Start invoice check thread
    invoice_thread = threading.Thread(
        target=invoice_check_thread,
        daemon=True,
        name="invoice-check"
    )
    invoice_thread.start()
    
    # Start withdrawal processing thread
    withdrawal_thread = threading.Thread(
        target=withdrawal_processing_thread,
        daemon=True,
        name="withdrawal-processing"
    )
    withdrawal_thread.start()
    
    logger.info("Background threads started")
    
    return [invoice_thread, withdrawal_thread]


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

