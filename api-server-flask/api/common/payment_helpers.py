from .logging_config import setup_logger
from .models import Currency, PaymentStatus, PaymentType
from .invoice_calculator import calc_invoice_core
from psycopg2.extras import Json
import uuid

# Set up the logger
logger = setup_logger(__name__, 'payment_helpers.log')

def calc_invoice(searchable_data, selections):
    """
    Calculate invoice details for USD-based payments

    Args:
        searchable_data: Dictionary containing searchable item data
        selections: List of selected items/files (each with an 'id' field and optional 'count' field)
                   For 'direct' type, selection items should have 'amount' and 'type' fields

    Returns:
        dict: Invoice calculation results with amount_usd and description
    """
    try:
        logger.info("Calculating invoice with searchable_data and selections")
        logger.info(f"searchable_data: {searchable_data}")
        logger.info(f"selections: {selections}")

        # Use the pure calculation logic
        result = calc_invoice_core(searchable_data, selections)
        
        # Update the currency to use the enum value instead of hardcoded string
        result["currency"] = Currency.USD.value
        
        return result

    except Exception as e:
        logger.error(f"Error calculating invoice: {str(e)}")
        raise ValueError("Invalid searchable data or selections") from e


def create_balance_invoice_and_payment(buyer_id, seller_id, searchable_id, amount, currency, metadata=None):
    """
    Create a balance payment invoice and mark it as complete in one atomic transaction.
    
    Args:
        buyer_id: ID of the user making the payment
        seller_id: ID of the user receiving the payment
        searchable_id: ID of the searchable item being purchased
        amount: Total amount to pay (no fees for balance payments)
        currency: Currency (should be 'usd')
        metadata: Optional metadata dict
        
    Returns:
        dict: Payment record with invoice information
        
    Raises:
        ValueError: If insufficient balance or invalid parameters
        Exception: If database transaction fails
    """
    # Import here to avoid circular import
    from .data_helpers import create_invoice as db_create_invoice, db_transaction, execute_sql
    from .balance_utils import validate_sufficient_balance
    
    try:
        # Check user balance first
        has_sufficient, current_balance = validate_sufficient_balance(buyer_id, amount, currency)
        if not has_sufficient:
            raise ValueError(f"Insufficient balance. Available: ${current_balance:.2f}, Required: ${amount:.2f}")
        
        # Create unique external ID for tracking
        external_id = f"balance_{uuid.uuid4()}"
        
        with db_transaction() as (conn, cur):
            # Create invoice with type='balance' and fee=0
            invoice_data = {
                'buyer_id': buyer_id,
                'seller_id': seller_id,
                'searchable_id': searchable_id,
                'amount': amount,
                'fee': 0,  # No platform fee for balance payments
                'currency': currency,
                'invoice_type': PaymentType.BALANCE.value,
                'external_id': external_id,
                'metadata': metadata or {}
            }
            
            invoice = db_create_invoice(**invoice_data)
            
            if not invoice:
                raise Exception("Failed to create invoice")
            
            logger.info(f"Created balance invoice {invoice['id']} for user {buyer_id}")
            
            # Create payment record with status='complete' immediately
            payment_record = _create_complete_balance_payment(
                cur, conn, invoice['id'], amount, currency, external_id, metadata
            )
            
            logger.info(f"Created balance payment {payment_record['id']} for invoice {invoice['id']}")
            
            return payment_record
        
    except Exception as e:
        logger.error(f"Error creating balance invoice and payment: {str(e)}")
        raise


def _create_complete_balance_payment(cur, conn, invoice_id, amount, currency, external_id, metadata):
    """
    Helper function to create a complete balance payment record
    
    Args:
        cur: Database cursor
        conn: Database connection
        invoice_id: ID of the invoice
        amount: Payment amount
        currency: Currency
        external_id: External tracking ID
        metadata: Payment metadata
        
    Returns:
        dict: Payment record
    """
    execute_sql(cur, """
        INSERT INTO payment (invoice_id, amount, fee, currency, type, external_id, status, metadata)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, invoice_id, amount, fee, currency, type, external_id, status, created_at, metadata
    """, params=(
        invoice_id,
        amount,
        0,  # No processing fee for balance payments
        currency,
        PaymentType.BALANCE.value,
        external_id,
        PaymentStatus.COMPLETE.value,  # Set status to complete immediately
        Json(metadata or {})
    ), commit=True, connection=conn)
    
    row = cur.fetchone()
    
    return {
        'id': row[0],
        'invoice_id': row[1],
        'amount': float(row[2]),
        'fee': float(row[3]),
        'currency': row[4],
        'type': row[5],
        'external_id': row[6],
        'status': row[7],
        'created_at': row[8].isoformat() if row[8] else None,
        'metadata': row[9]
    }


def validate_balance_payment(buyer_id, amount, currency='usd'):
    """
    Validate if user has sufficient balance for payment.
    
    Args:
        buyer_id: User ID
        amount: Amount to validate
        currency: Currency (default 'usd')
        
    Returns:
        dict: Validation result with balance info
    """
    # Use the new balance utilities
    from .balance_utils import validate_sufficient_balance
    
    try:
        has_sufficient, current_balance = validate_sufficient_balance(buyer_id, amount, currency)
        
        return {
            'valid': has_sufficient,
            'balance': current_balance,
            'required': amount,
            'currency': currency
        }
        
    except Exception as e:
        logger.error(f"Error validating balance payment: {str(e)}")
        return {
            'valid': False,
            'error': str(e)
        }
        
    except Exception as e:
        logger.error(f"Error validating balance: {str(e)}")
        return {
            'valid': False,
            'balance': 0,
            'required': amount,
            'currency': currency,
            'error': str(e)
        }