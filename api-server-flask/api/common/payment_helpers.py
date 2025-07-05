from .logging_config import setup_logger
from .models import Currency, PaymentStatus, PaymentType
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

        payloads = searchable_data.get('payloads', {})
        public_data = payloads.get('public', {})
        searchable_type = public_data.get('type', 'downloadable')
        
        # Handle direct payment type with runtime amount
        if searchable_type == 'direct':
            total_amount_usd = 0.0
            total_item_count = 0
            
            for item in selections:
                if item.get('type') == 'direct' and item.get('amount'):
                    amount = float(item.get('amount'))
                    count = item.get('count', 1)
                    total_amount_usd += amount * count
                    total_item_count += count
            
            total_amount_usd = round(total_amount_usd, 2)
            
            # Generate description for direct payment
            title = public_data.get('title', 'Direct Payment Item')
            description = f"{title} - Direct Payment"
            
            return {
                "amount_usd": total_amount_usd,
                "total_amount_usd": total_amount_usd,
                "description": description,
                "currency": Currency.USD.value,
                "total_item_count": total_item_count
            }
        
        # Handle downloadable and offline items with predefined prices
        downloadable_files = public_data.get('downloadableFiles', [])
        offline_items = public_data.get('offlineItems', [])
        
        # Build mappings from id to price (as float)
        id_to_price = {}
        
        # Add downloadable files to mapping
        for file in downloadable_files:
            id_to_price[file.get('fileId')] = float(file.get('price'))
        
        # Add offline items to mapping  
        for item in offline_items:
            id_to_price[item.get('itemId')] = float(item.get('price'))

        # Calculate total amount in USD using ids from selections
        total_amount_usd = 0.0
        total_item_count = 0
        
        for item in selections:
            item_id = item.get('id')
            price = id_to_price.get(item_id)
            count = item.get('count', 1)  # Default to 1 if count not specified
            
            if price is not None:
                total_amount_usd += price * count
                total_item_count += count

        total_amount_usd = round(total_amount_usd, 2)

        # Generate description
        title = public_data.get('title', 'Item')
        if total_item_count > 1:
            description = f"{title} (x{total_item_count} items)"
        else:
            description = title

        return {
            "amount_usd": total_amount_usd,
            "total_amount_usd": total_amount_usd,
            "description": description,
            "currency": Currency.USD.value,
            "total_item_count": total_item_count
        }

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
    from .data_helpers import (
        get_balance_by_currency, 
        create_invoice as db_create_invoice, 
        create_payment as db_create_payment, 
        get_db_connection,
        execute_sql
    )
    
    conn = None
    cur = None
    
    try:
        # Start transaction
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check user balance inside transaction to prevent race conditions
        balance_data = get_balance_by_currency(buyer_id)
        balance = balance_data.get(currency.lower(), 0)
        logger.info(f"User {buyer_id} balance: {balance}, required: {amount}")
        
        if balance < amount:
            raise ValueError(f"Insufficient balance. Available: ${balance:.2f}, Required: ${amount:.2f}")
        
        # Create unique external ID for tracking
        external_id = f"balance_{uuid.uuid4()}"
        
        # Create invoice with type='balance' and fee=0
        invoice_data = {
            'buyer_id': buyer_id,
            'seller_id': seller_id,
            'searchable_id': searchable_id,
            'amount': amount,
            'fee': 0,  # No platform fee for balance payments
            'currency': currency,
            'invoice_type': PaymentType.BALANCE.value,  # Changed from 'type' to 'invoice_type'
            'external_id': external_id,
            'metadata': metadata or {}
        }
        
        invoice = db_create_invoice(**invoice_data)
        
        if not invoice:
            raise Exception("Failed to create invoice")
        
        logger.info(f"Created balance invoice {invoice['id']} for user {buyer_id}")
        
        # Create payment record with status='complete' immediately
        # We need to use raw SQL here because create_payment doesn't support setting status
        execute_sql(cur, """
            INSERT INTO payment (invoice_id, amount, fee, currency, type, external_id, status, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, invoice_id, amount, fee, currency, type, external_id, status, created_at, metadata
        """, params=(
            invoice['id'],
            amount,
            0,  # No processing fee for balance payments
            currency,
            PaymentType.BALANCE.value,
            external_id,
            PaymentStatus.COMPLETE.value,  # Set status to complete immediately
            Json(metadata or {})
        ), commit=False, connection=conn)
        
        row = cur.fetchone()
        payment = {
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
        
        if not payment:
            raise Exception("Failed to create payment")
        
        logger.info(f"Created balance payment {payment['id']} with status=complete")
        
        # Commit transaction (payment with status=complete already marks invoice as paid)
        conn.commit()
        
        logger.info(f"Balance payment completed successfully for invoice {invoice['id']}")
        
        # Return payment with invoice info
        return {
            'payment': payment,
            'invoice': invoice,
            'success': True
        }
        
    except ValueError as e:
        # Rollback on validation errors
        if conn:
            conn.rollback()
        logger.error(f"Balance payment validation error: {str(e)}")
        raise
        
    except Exception as e:
        # Rollback on any other errors
        if conn:
            conn.rollback()
        logger.error(f"Balance payment transaction error: {str(e)}")
        raise
        
    finally:
        # Clean up database connections
        if cur:
            cur.close()
        if conn:
            conn.close()


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
    # Import here to avoid circular import
    from .data_helpers import get_balance_by_currency
    
    try:
        balance_data = get_balance_by_currency(buyer_id)
        balance = balance_data.get(currency.lower(), 0)
        has_sufficient_balance = balance >= amount
        
        return {
            'valid': has_sufficient_balance,
            'balance': balance,
            'required': amount,
            'currency': currency
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