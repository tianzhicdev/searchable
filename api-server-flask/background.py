import threading
import time
import logging
import traceback
import requests
import json
import os
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_DOWN
from psycopg2.extras import Json

# Import from the new common modules
from api.common.database import get_db_connection, execute_sql
from api.common.database_context import database_cursor, database_transaction, db
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
CHECK_INVOICE_INTERVAL = 1  # Check invoices every 1 second
WITHDRAWAL_SENDER_INTERVAL = 5  # Process pending withdrawals every 5 seconds
STATUS_CHECKER_INTERVAL = 300  # Check delayed withdrawals every 5 minutes
DEPOSIT_CHECK_INTERVAL = 30  # Check deposits every 30 seconds
MAX_INVOICE_AGE_HOURS = 24  # Only check invoices created in the last 24 hours

# Timeout settings
SENDING_TIMEOUT_MINUTES = 5  # Reset 'sending' to 'pending' after 5 minutes
SENT_TIMEOUT_HOURS = 24  # Mark 'sent' as 'failed' after 24 hours

USDT_SERVICE_URL = os.getenv('USDT_SERVICE_URL', 'http://usdt-api:3100')
SOLANA_USDC_SERVICE_URL = os.getenv(
    'SOLANA_USDC_SERVICE_URL',
    os.getenv('USDC_SOLANA_SERVICE_URL', 'http://usdc-solana-api:3200')
)
SOLANA_NETWORK = os.getenv('SOLANA_NETWORK', 'devnet')
USDT_DECIMALS = int(os.getenv('USDT_DECIMALS', '6'))
SOLANA_USDC_DECIMALS = int(os.getenv('SOLANA_USDC_DECIMALS', '6'))
CRYPTO_DEPOSIT_EXPIRATION_HOURS = int(os.getenv('CRYPTO_DEPOSIT_EXPIRATION_HOURS', '23'))

CRYPTO_RAIL_ALIASES = {
    'bank_transfer': 'usdt',
    'eth_usdt': 'usdt',
    'usdt_eth': 'usdt',
    'solana_usdc': 'usdc_solana',
    'usdc_sol': 'usdc_solana',
}


def decimal_json_encoder(obj):
    """JSON encoder that handles Decimal types"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def safe_json_dumps(data):
    """Safely serialize data to JSON, handling Decimal types"""
    return json.dumps(data, default=decimal_json_encoder)


def normalize_crypto_rail(raw_type):
    normalized = (raw_type or 'usdt').strip().lower()
    return CRYPTO_RAIL_ALIASES.get(normalized, normalized)


def get_withdrawal_rail(withdrawal_type, metadata):
    metadata = metadata or {}
    return normalize_crypto_rail(metadata.get('type') or withdrawal_type)


def get_deposit_rail(deposit_type, metadata):
    metadata = metadata or {}
    return normalize_crypto_rail(metadata.get('type') or deposit_type)


def get_asset_name(rail):
    return 'USDC' if rail == 'usdc_solana' else 'USDT'


def get_network_name(rail):
    return SOLANA_NETWORK if rail == 'usdc_solana' else 'ethereum'


def get_service_url(rail):
    if rail == 'usdc_solana':
        return SOLANA_USDC_SERVICE_URL
    if rail == 'usdt':
        return USDT_SERVICE_URL
    raise ValueError(f"Unsupported crypto rail: {rail}")


def get_decimals(rail):
    return SOLANA_USDC_DECIMALS if rail == 'usdc_solana' else USDT_DECIMALS


def is_valid_chain_tx_id(rail, chain_tx_id):
    if not isinstance(chain_tx_id, str) or not chain_tx_id:
        return False
    if rail == 'usdc_solana':
        return 32 <= len(chain_tx_id) <= 128
    return is_valid_tx_hash(chain_tx_id)


def to_base_units(amount, decimals):
    scaled = Decimal(str(amount)) * (Decimal(10) ** decimals)
    return str(int(scaled.quantize(Decimal('1'), rounding=ROUND_DOWN)))


def has_crypto_deposit_expired(created_at):
    naive_created_at = created_at.replace(tzinfo=None) if getattr(created_at, 'tzinfo', None) else created_at
    return datetime.utcnow() - naive_created_at > timedelta(hours=CRYPTO_DEPOSIT_EXPIRATION_HOURS)


def get_withdrawal_tracking_id(rail, response_data):
    return response_data.get('signature') if rail == 'usdc_solana' else response_data.get('txHash')


def update_chain_metadata(metadata, rail, chain_tx_id=None):
    updated_metadata = (metadata or {}).copy()
    updated_metadata.update({
        'type': rail,
        'asset': get_asset_name(rail),
        'network': get_network_name(rail),
    })

    if chain_tx_id:
        updated_metadata['chain_tx_id'] = chain_tx_id
        if rail == 'usdc_solana':
            updated_metadata['signature'] = chain_tx_id
        else:
            updated_metadata['tx_hash'] = chain_tx_id

    return updated_metadata


def check_invoice_payments():
    """
    Checks for pending invoices and updates their status if paid
    """
    logger.info("Starting invoice payment check")
    try:
        # Get timestamp for filtering (only check recent invoices)
        cutoff_time = datetime.now() - timedelta(hours=MAX_INVOICE_AGE_HOURS)
        
        # Get all invoices from the last 24 hours that don't have completed payments
        with database_cursor() as (cur, conn):
            # Query for invoices without completed payments within the time window
            # Exclude 'balance' type invoices as they are processed instantly
            execute_sql(cur, """
                SELECT i.id, i.external_id, i.type, i.searchable_id, i.buyer_id, i.seller_id,
                       i.amount, i.currency, i.created_at, i.metadata
                FROM invoice i 
                LEFT JOIN payment p ON i.id = p.invoice_id AND p.status = %s
                WHERE i.created_at >= %s
                AND p.id IS NULL
                AND i.type != 'balance'
            """, params=(PaymentStatus.COMPLETE.value, cutoff_time))
            
            invoices = cur.fetchall()
        
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
    if not isinstance(txhash, str):
        return False

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
    JOB 1: Process pending withdrawals by sending them to the configured chain service.
    Status flow: pending → complete/delayed/error
    """
    logger.info("Starting withdrawal sender job")
    try:
        with database_cursor() as (cur, conn):
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

                if currency.lower() != 'usd':
                    raise Exception(f"Unsupported currency for withdrawal: {currency}")

                rail = get_withdrawal_rail(withdrawal_type, metadata)
                address = metadata.get('address')
                if not address:
                    raise Exception(f"{rail} withdrawal missing address")

                response = requests.post(
                    f"{get_service_url(rail)}/send",
                    json={
                        'to': address,
                        'amount': to_base_units(amount, get_decimals(rail)),
                        'request_id': f'withdrawal_{withdrawal_id}',
                    },
                    timeout=60
                )

                response_data = response.json()
                logger.info(f"{rail} API response for withdrawal {withdrawal_id}: {response_data}")

                chain_tx_id = get_withdrawal_tracking_id(rail, response_data)

                with database_transaction() as (cur, conn):
                    if (
                        response_data.get('status') == 'complete' and
                        is_valid_chain_tx_id(rail, chain_tx_id)
                    ):
                        complete_metadata = update_chain_metadata(metadata, rail, chain_tx_id)
                        complete_metadata.update({
                            'complete_timestamp': int(time.time()),
                            'address': address,
                            'original_amount': metadata.get('original_amount'),
                            'fee_percentage': metadata.get('fee_percentage'),
                            'amount_after_fee': metadata.get('amount_after_fee'),
                        })

                        cur.execute("""
                            UPDATE withdrawal 
                            SET status = %s,
                                external_id = %s,
                                metadata = %s
                            WHERE id = %s
                        """, (
                            PaymentStatus.COMPLETE.value,
                            chain_tx_id,
                            safe_json_dumps(complete_metadata),
                            withdrawal_id
                        ))

                        logger.info(
                            f"✅ Withdrawal {withdrawal_id} sent successfully on {rail} - tx: {chain_tx_id}"
                        )

                    elif is_valid_chain_tx_id(rail, chain_tx_id):
                        error = response_data.get('error', 'Unknown error')
                        logger.error(
                            f"❌ Withdrawal {withdrawal_id} delayed on {rail}: {error} - tx: {chain_tx_id}"
                        )

                        delayed_metadata = update_chain_metadata(metadata, rail, chain_tx_id)
                        delayed_metadata.update({
                            'complete_timestamp': int(time.time()),
                            'address': address,
                            'original_amount': metadata.get('original_amount'),
                            'fee_percentage': metadata.get('fee_percentage'),
                            'amount_after_fee': metadata.get('amount_after_fee'),
                            'error': error,
                        })

                        cur.execute("""
                            UPDATE withdrawal 
                            SET status = %s,
                                external_id = %s,
                                metadata = %s
                            WHERE id = %s
                        """, (
                            PaymentStatus.DELAYED.value,
                            chain_tx_id,
                            safe_json_dumps(delayed_metadata),
                            withdrawal_id
                        ))
                    else:
                        error = response_data.get('error', 'Unknown error')
                        logger.error(f"❌ Withdrawal {withdrawal_id} failed on {rail}: {error}")

                        error_metadata = update_chain_metadata(metadata, rail)
                        error_metadata.update({
                            'error_timestamp': int(time.time()),
                            'address': address,
                            'original_amount': metadata.get('original_amount'),
                            'fee_percentage': metadata.get('fee_percentage'),
                            'amount_after_fee': metadata.get('amount_after_fee'),
                            'error': error,
                        })

                        cur.execute("""
                            UPDATE withdrawal 
                            SET status = %s,
                                metadata = %s
                            WHERE id = %s
                        """, (
                            PaymentStatus.ERROR.value,
                            safe_json_dumps(error_metadata),
                            withdrawal_id
                        ))
                
            except Exception as e:
                logger.error(f"Error processing withdrawal {withdrawal_id}: {str(e)}")
        
        logger.info(f"Withdrawal sender job completed: processed {processed_count} withdrawals")
        
    except Exception as e:
        logger.error(f"Error in process_pending_withdrawals: {str(e)}")
        logger.error(traceback.format_exc())


def check_delayed_withdrawals():
    """
    JOB 2: Check status of delayed withdrawals using the configured chain service.
    """
    logger.info("Starting status checker job")
    try:
        with database_cursor() as (cur, conn):
            execute_sql(cur, f"""
                SELECT id, user_id, amount, currency, type, metadata, external_id, status
                FROM withdrawal 
                WHERE status = '{PaymentStatus.DELAYED.value}'
                AND external_id IS NOT NULL
                ORDER BY created_at ASC
                LIMIT 1
            """)
            
            sent_withdrawals = cur.fetchall()
        
        checked_count = 0
        
        for withdrawal_row in sent_withdrawals:
            withdrawal_id, user_id, amount, currency, withdrawal_type, metadata, external_id, current_status = withdrawal_row
            metadata = metadata or {}

            rail = get_withdrawal_rail(withdrawal_type, metadata)
            chain_tx_id = external_id

            if not chain_tx_id or chain_tx_id in ['None', 'null', 'undefined']:
                # todo: it should not happen
                logger.warning(
                    f"Delayed withdrawal {withdrawal_id} has invalid chain tx id: '{chain_tx_id}'"
                )
                raise Exception(f"Invalid chain transaction id for withdrawal {withdrawal_id}")
            else:
                try:
                    logger.info(
                        f"Checking status of delayed withdrawal {withdrawal_id} on {rail} with tx id: {chain_tx_id}"
                    )

                    response = requests.get(
                        f"{get_service_url(rail)}/tx-status/{chain_tx_id}",
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        tx_status = response.json()
                        logger.info(f"Transaction status for withdrawal {withdrawal_id}: {tx_status}")
                        
                        with database_transaction() as (cur, conn):
                            if tx_status['status'] == 'complete':
                                updated_metadata = update_chain_metadata(metadata, rail, chain_tx_id)
                                updated_metadata.update({
                                    'confirmed_timestamp': int(time.time()),
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
                                updated_metadata = update_chain_metadata(metadata, rail, chain_tx_id)
                                updated_metadata.update({
                                    'failed_timestamp': int(time.time()),
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
                                
                                logger.error(f"❌ Withdrawal {withdrawal_id} failed on {rail} - transaction reverted on-chain")
                            else:
                                logger.info(f"⏳ Withdrawal {withdrawal_id} still pending on blockchain, will check again later")

                    else:
                        logger.warning(f"Failed to get transaction status for withdrawal {withdrawal_id} (HTTP {response.status_code}), will retry later")
                        
                    checked_count += 1
                        
                except Exception as e:
                    logger.error(f"Error checking sent withdrawal {withdrawal_id}: {str(e)}")
                    # Keep as 'sent' and retry later
        
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
            process_pending_withdrawals()
        except Exception as e:
            logger.error(f"Error in withdrawal sender thread: {str(e)}")
            logger.error(traceback.format_exc())

        time.sleep(WITHDRAWAL_SENDER_INTERVAL)


def deposit_check_thread():
    """Thread function that periodically checks pending deposits"""
    while True:
        try:
            check_deposit_confirmations()
        except Exception as e:
            logger.error(f"Error in deposit check thread: {str(e)}")
            logger.error(traceback.format_exc())

        time.sleep(DEPOSIT_CHECK_INTERVAL)


def status_checker_thread():
    """Thread function that periodically checks delayed withdrawals"""
    while True:
        try:
            check_delayed_withdrawals()
        except Exception as e:
            logger.error(f"Error in status checker thread: {str(e)}")
            logger.error(traceback.format_exc())

        time.sleep(STATUS_CHECKER_INTERVAL)



def check_deposit_confirmations():
    """Check pending deposits for crypto balance and Stripe payment status."""
    try:
        logger.info("Checking pending deposits...")
        
        with database_cursor() as (cur, conn):
            execute_sql(cur, """
                SELECT id, user_id, amount, metadata, created_at, external_id, type
                FROM deposit
                WHERE status = 'pending'
                AND type IN ('usdt', 'usdc_solana', 'stripe')
                ORDER BY created_at ASC
            """)
            
            pending_deposits = cur.fetchall()
            logger.info(f"Found {len(pending_deposits)} pending deposits to check")
        
        for deposit in pending_deposits:
            time.sleep(2)
            deposit_id, user_id, expected_amount, metadata, created_at, external_id, deposit_type = deposit
            metadata = metadata or {}
            
            try:
                if deposit_type == 'stripe':
                    logger.info(f"Checking Stripe deposit {deposit_id}")
                    
                    session_id = external_id
                    if not session_id:
                        logger.error(f"Stripe deposit {deposit_id} missing session_id")
                        continue
                        
                    payment_data = refresh_stripe_payment(session_id)
                    
                    with database_transaction() as (cur, conn):
                        if payment_data.get('status') == 'paid':
                            # Payment successful, mark deposit as complete
                            metadata['completed_at'] = datetime.utcnow().isoformat()
                            metadata['payment_status'] = 'paid'
                            
                            execute_sql(cur, """
                                UPDATE deposit 
                                SET status = 'complete',
                                    metadata = %s
                                WHERE id = %s
                            """, params=(Json(metadata), deposit_id))
                            
                            logger.info(f"Stripe deposit {deposit_id} completed for ${expected_amount}")
                            
                        elif payment_data.get('status') == 'expired':
                            # Payment session expired
                            metadata['error'] = 'Payment session expired'
                            metadata['expired_at'] = datetime.utcnow().isoformat()
                            
                            execute_sql(cur, """
                                UPDATE deposit 
                                SET status = 'failed',
                                    metadata = %s
                                WHERE id = %s
                            """, params=(Json(metadata), deposit_id))
                            
                            logger.info(f"Stripe deposit {deposit_id} expired")
                else:
                    rail = get_deposit_rail(deposit_type, metadata)
                    if rail not in ('usdt', 'usdc_solana'):
                        logger.warning(f"Skipping unsupported deposit rail '{rail}' for deposit {deposit_id}")
                        continue

                    if has_crypto_deposit_expired(created_at):
                        logger.info(f"{rail} deposit {deposit_id} has expired, marking as failed")
                        metadata['error'] = (
                            f"Deposit expired after {CRYPTO_DEPOSIT_EXPIRATION_HOURS} hours"
                        )
                        metadata['network'] = get_network_name(rail)
                        with database_transaction() as (cur, conn):
                            execute_sql(cur, """
                                UPDATE deposit 
                                SET status = 'failed', metadata = %s
                                WHERE id = %s
                            """, params=(Json(metadata), deposit_id))
                        continue

                    deposit_address = metadata.get('eth_address') or metadata.get('wallet_address') or external_id
                    if not deposit_address:
                        logger.error(f"Deposit {deposit_id} missing deposit address in metadata")
                        continue

                    logger.info(
                        f"Checking transactions for deposit {deposit_id} on {rail} at address {deposit_address}"
                    )

                    tx_response = requests.get(
                        f"{get_service_url(rail)}/transactions/{deposit_address}",
                        timeout=10
                    )
                
                    if tx_response.status_code != 200:
                        logger.error(
                            f"Failed to check transactions for {deposit_address}: {tx_response.text}"
                        )
                        continue
                    
                    tx_data = tx_response.json()
                    transactions = tx_data.get('transactions', [])
                    
                    if not transactions:
                        metadata['checked_at'] = datetime.utcnow().isoformat()
                        metadata['network'] = get_network_name(rail)
                        with database_transaction() as (cur, conn):
                            execute_sql(cur, """
                                UPDATE deposit 
                                SET metadata = %s
                                WHERE id = %s
                            """, params=(Json(metadata), deposit_id))
                        continue

                    if rail == 'usdc_solana' and metadata.get('token_account'):
                        matching_transactions = [
                            tx for tx in transactions
                            if tx.get('destination') == metadata.get('token_account')
                        ]
                        if matching_transactions:
                            transactions = matching_transactions

                    transactions.sort(
                        key=lambda x: int(x.get('blockNumber') or x.get('slot') or 0),
                        reverse=True
                    )
                    latest_tx = transactions[0]

                    chain_tx_id = latest_tx.get('txHash') or latest_tx.get('signature')
                    if not chain_tx_id:
                        logger.warning(f"Deposit {deposit_id} has transaction without chain id, skipping")
                        continue

                    tx_value_base_units = int(latest_tx.get('value') or 0)
                    tx_status_data = {}
                    try:
                        tx_status_response = requests.get(
                            f"{get_service_url(rail)}/tx-status/{chain_tx_id}",
                            timeout=10
                        )
                        if tx_status_response.status_code == 200:
                            tx_status_data = tx_status_response.json()
                            amount_key = 'usdcAmount' if rail == 'usdc_solana' else 'usdtAmount'
                            if tx_status_data.get(amount_key) is not None:
                                tx_value_base_units = int(tx_status_data[amount_key])
                    except Exception as e:
                        logger.warning(f"Could not get detailed tx status for {chain_tx_id}: {e}")

                    if tx_status_data and tx_status_data.get('status') != 'complete':
                        metadata['checked_at'] = datetime.utcnow().isoformat()
                        with database_transaction() as (cur, conn):
                            execute_sql(cur, """
                                UPDATE deposit 
                                SET metadata = %s
                                WHERE id = %s
                            """, params=(Json(metadata), deposit_id))
                        continue

                    tx_amount = Decimal(tx_value_base_units) / Decimal(10 ** get_decimals(rail))
                    asset_name = get_asset_name(rail)

                    logger.info(
                        f"Deposit {deposit_id}: Found latest transaction {chain_tx_id} with amount {tx_amount} {asset_name}"
                    )

                    with database_cursor() as (cur, conn):
                        execute_sql(cur, """
                            SELECT id FROM deposit 
                            WHERE tx_hash = %s
                        """, params=(chain_tx_id,))
                        
                        existing_deposit = cur.fetchone()
                    
                    if existing_deposit:
                        logger.info(
                            f"Transaction {chain_tx_id} already credited to deposit {existing_deposit[0]}"
                        )
                        metadata['checked_at'] = datetime.utcnow().isoformat()
                        metadata['skipped_tx'] = chain_tx_id
                        with database_transaction() as (cur, conn):
                            execute_sql(cur, """
                                UPDATE deposit 
                                SET metadata = %s
                                WHERE id = %s
                            """, params=(Json(metadata), deposit_id))
                        continue

                    metadata = update_chain_metadata(metadata, rail, chain_tx_id)
                    metadata['checked_at'] = datetime.utcnow().isoformat()
                    metadata['tx_from'] = tx_status_data.get('source') or latest_tx.get('from') or latest_tx.get('source')
                    metadata['tx_to'] = tx_status_data.get('destination') or latest_tx.get('destination')
                    metadata['tx_amount'] = str(tx_amount)
                    metadata['completed_at'] = datetime.utcnow().isoformat()
                    if rail == 'usdt':
                        metadata['tx_block'] = str(latest_tx.get('blockNumber'))
                    else:
                        metadata['tx_slot'] = str(latest_tx.get('slot') or tx_status_data.get('slot'))
                        metadata['signature'] = chain_tx_id
                    
                    with database_transaction() as (cur, conn):
                        execute_sql(cur, """
                            UPDATE deposit 
                            SET status = 'complete', 
                                amount = %s,
                                metadata = %s,
                                tx_hash = %s
                            WHERE id = %s
                        """, params=(tx_amount, Json(metadata), chain_tx_id, deposit_id))
                    
                    logger.info(
                        f"Deposit {deposit_id} completed with tx {chain_tx_id} for {tx_amount} {asset_name}"
                    )
                    
            except Exception as e:
                logger.error(f"Error processing deposit {deposit_id}: {str(e)}")
                logger.error(traceback.format_exc())
            
    except Exception as e:
        logger.error(f"Error in check_deposit_confirmations: {str(e)}")
        logger.error(traceback.format_exc())


def start_background_threads():
    """Start all background processing threads"""
    logger.info("Starting background processing threads with optimized timing")
    
    # Start invoice check thread
    invoice_thread = threading.Thread(
        target=invoice_check_thread,
        daemon=True,
        name="invoice-check"
    )
    invoice_thread.start()
    
    # Start withdrawal sender thread
    sender_thread = threading.Thread(
        target=withdrawal_sender_thread,
        daemon=True,
        name="withdrawal-sender"
    )
    sender_thread.start()
    
    # Start deposit check thread
    deposit_thread = threading.Thread(
        target=deposit_check_thread,
        daemon=True,
        name="deposit-check"
    )
    deposit_thread.start()
    
    # Start status checker thread for delayed withdrawals
    status_thread = threading.Thread(
        target=status_checker_thread,
        daemon=True,
        name="status-checker"
    )
    status_thread.start()
    
    logger.info("Background threads started:")
    logger.info(f"  - Invoice checker: every {CHECK_INVOICE_INTERVAL}s")
    logger.info(f"  - Withdrawal processor: every {WITHDRAWAL_SENDER_INTERVAL}s")
    logger.info(f"  - Deposit checker: every {DEPOSIT_CHECK_INTERVAL}s")
    logger.info(f"  - Delayed withdrawal checker: every {STATUS_CHECKER_INTERVAL}s")
    
    return [invoice_thread, sender_thread, deposit_thread, status_thread]


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
