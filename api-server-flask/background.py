import threading
import time
import logging
import traceback
import requests
import json
import os
from datetime import datetime, timedelta

from api import get_db_connection
from api.helper import pay_lightning_invoice, check_payment, Json, execute_sql, get_data_from_kv, get_db_connection

# from api.searchable_routes import Json, execute_sql, get_data_from_kv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('background')

# BTCPay Server configuration
BTC_PAY_URL = "https://generous-purpose.metalseed.io"
STORE_ID = "Gzuaf7U3aQtHKA1cpsrWAkxs3Lc5ZnKiCaA6WXMMXmDn"
BTCPAY_SERVER_GREENFIELD_API_KEY = os.environ.get('BTCPAY_SERVER_GREENFIELD_API_KEY', '')

# Configuration
CHECK_INVOICE_INTERVAL = 60  # Check invoices every 60 seconds
PROCESS_WITHDRAWAL_INTERVAL = 5  # Process withdrawals every 120 seconds
MAX_INVOICE_AGE_HOURS = 24  # Only check invoices created in the last 24 hours


def check_invoice_payments():
    """
    Checks for pending invoices and updates their status if paid
    """
    logger.info("Starting invoice payment check")
    try:
        # Get all invoices without corresponding payments
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get timestamp for filtering (only check recent invoices)
        cutoff_time = int((datetime.now() - timedelta(hours=MAX_INVOICE_AGE_HOURS)).timestamp())
        
        # Find all invoices
        invoice_records = get_data_from_kv(type='invoice')
        # todo: improve the perf by using timestamp cutoff_time
        
        # Track processed invoices
        processed_count = 0
        paid_count = 0
        
        for invoice in invoice_records:
            # Skip older invoices
            if invoice.get('timestamp', 0) < cutoff_time:
                continue
                
            invoice_id = invoice.get('pkey')
            searchable_id = invoice.get('fkey')
            
            if not invoice_id or not searchable_id:
                # this never happens
                continue
                
            # Check if payment already exists
            payment_records = get_data_from_kv(type='payment', pkey=invoice_id)
            if payment_records:
                # Already processed this invoice
                continue
                
            # Check payment status using our helper function
            try:
                invoice_data = check_payment(invoice_id)
                processed_count += 1
                
                # If payment is settled, it has been recorded by the helper function
                if invoice_data.get('status', '').lower() in ('settled', 'complete'):
                    paid_count += 1
                    logger.info(f"Recorded payment for invoice {invoice_id}")
                
            except Exception as e:
                logger.error(f"Error checking payment status for invoice {invoice_id}: {str(e)}")
        
        cur.close()
        conn.close()
        
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
        # Get pending withdrawals
        withdrawal_records = get_data_from_kv(type='withdrawal')
        
        # Track stats
        processed_count = 0
        
        for withdrawal in withdrawal_records:
            # Check if this withdrawal is pending
            status_history = withdrawal.get('status', [])
            
            # Get the most recent status
            current_status = status_history[-1][0] if status_history else 'unknown'
            
            # Skip if already processed or failed
            if current_status.lower() not in ('pending', 'unknown'):
                continue
                
            invoice = withdrawal.get('invoice')
            if not invoice:
                continue
                
            processed_count += 1
            
            try:
                payment_response = pay_lightning_invoice(invoice)
                if "error" in payment_response:
                    logger.error(f"Lightning payment failed: {payment_response['error']}")
                    raise Exception(f"Lightning payment failed: {payment_response['error']}")
                else:
                    fee_sat = payment_response.get('fee_sat', 0)
                    value_sat = payment_response.get('value_sat', 0)
                    
                    # Update the withdrawal record with payment response
                    conn = get_db_connection()
                    cur = conn.cursor()
                    
                    execute_sql(cur, f"""
                        UPDATE kv 
                        SET data = {Json({
                            **withdrawal,
                            'fee_sat': fee_sat,
                            'value_sat': value_sat,
                            'amount': int(value_sat) + int(fee_sat),
                            'status': status_history + [(payment_response.get('status', 'unknown'), int(time.time()))]
                        })}
                        WHERE type = 'withdrawal' AND pkey = '{invoice}'
                    """, commit=True, connection=conn)
                    
                    cur.close()
                    conn.close()
                    
                    logger.info(f"Processed withdrawal for invoice {invoice}: {payment_response.get('status', 'unknown')}")
                
            except Exception as e:
                logger.error(f"Error processing withdrawal {invoice}: {str(e)}")
                
                # Update status to failed
                try:
                    conn = get_db_connection()
                    cur = conn.cursor()
                    
                    execute_sql(cur, f"""
                        UPDATE kv 
                        SET data = {Json({
                            **withdrawal,
                            'status': status_history + [('failed', int(time.time()))],
                            'error': str(e)
                        })}
                        WHERE type = 'withdrawal' AND pkey = '{invoice}'
                    """, commit=True, connection=conn)
                    
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
    
    return invoice_thread, withdrawal_thread


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

