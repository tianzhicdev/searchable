import threading
import time
import logging
import traceback
import requests
import json
import os
from datetime import datetime, timedelta

# Import from the new common modules
from api.common.database import get_db_connection
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
        cur.execute("""
            SELECT i.id, i.external_id, i.type, i.searchable_id, i.buyer_id, i.seller_id,
                   i.amount, i.currency, i.created_at, i.metadata
            FROM invoice i 
            LEFT JOIN payment p ON i.id = p.invoice_id AND p.status = '{PaymentStatus.COMPLETE.value}'
            WHERE i.created_at >= %s 
            AND p.id IS NULL
        """, (cutoff_time,))
        
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
        
        # Track stats
        processed_count = 0
        
        for withdrawal in withdrawal_records:
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
                    # Process USD withdrawal (bank transfer)
                    address = metadata.get('address')
                    if not address:
                        raise Exception("USD withdrawal missing address")
                    
                    # For USD withdrawals, mark as complete immediately
                    # In a real system, this would integrate with a bank transfer API
                    conn = get_db_connection()
                    cur = conn.cursor()
                    
                    updated_metadata = {
                        **metadata,
                        'processed_timestamp': int(time.time()),
                        'status': PaymentStatus.COMPLETE.value
                    }
                    
                    cur.execute("""
                        UPDATE withdrawal 
                        SET status = %s, metadata = %s
                        WHERE id = %s
                    """, (PaymentStatus.COMPLETE.value, json.dumps(updated_metadata), withdrawal_id))
                    
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    logger.info(f"Processed USD withdrawal to {address} for amount ${amount}")
                    
                else:
                    logger.warning(f"Unsupported currency for withdrawal: {currency}")
                
            except Exception as e:
                logger.error(f"Error processing withdrawal {withdrawal_id}: {str(e)}")
                
                # Update status to failed
                try:
                    conn = get_db_connection()
                    cur = conn.cursor()
                    
                    updated_metadata = {
                        **metadata,
                        'error': str(e),
                        'timestamp': int(time.time())
                    }
                    
                    cur.execute("""
                        UPDATE withdrawal 
                        SET status = %s, metadata = %s
                        WHERE id = %s
                    """, (PaymentStatus.FAILED.value, json.dumps(updated_metadata), withdrawal_id))
                    
                    conn.commit()
                    cur.close()
                    conn.close()
                except Exception as e2:
                    logger.error(f"Error updating failed withdrawal status: {str(e2)}")
        
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


def withdrawal_processing_thread():
    """Thread function that periodically processes pending withdrawals"""
    while True:
        try:
            process_pending_withdrawals()
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

