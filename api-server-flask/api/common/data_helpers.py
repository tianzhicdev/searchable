import os
import time
import stripe
from psycopg2.extras import Json
from .database import get_db_connection, execute_sql
from .database_context import database_cursor, database_transaction, db
from .logging_config import setup_logger
from .models import PaymentStatus, PaymentType, Currency
from .payment_helpers import calc_invoice

# Set up the logger
logger = setup_logger(__name__, 'data_helpers.log')

stripe.api_key = os.environ.get('STRIPE_API_KEY')

def get_searchableIds_by_user(user_id):
    """
    Retrieves all searchable IDs for a specific user
    
    Args:
        user_id: The user ID to query for
        
    Returns:
        List of searchable IDs belonging to the user
    """
    try:
        rows = db.fetch_all("""
            SELECT searchable_id
            FROM searchables
            WHERE user_id = %s AND removed = FALSE
        """, (user_id,))
        return [row[0] for row in rows]
    except Exception as e:
        logger.error(f"Error retrieving searchable IDs for user {user_id}: {str(e)}")
        return []

def get_searchable(searchable_id, include_removed=False):
    """
    Retrieves a searchable item by its ID
    
    Args:
        searchable_id: The ID of the searchable item to retrieve
        include_removed: If True, will also return removed items (default: False)
        
    Returns:
        dict: The searchable data including the searchable_id, or None if not found
    """
    try:
        where_clause = "WHERE searchable_id = %s"
        if not include_removed:
            where_clause += " AND removed = FALSE"
            
        query = f"""
            SELECT searchable_id, type, searchable_data, user_id, removed
            FROM searchables
            {where_clause}
        """
        
        result = db.fetch_one(query, (searchable_id,))
        
        if not result:
            return None
            
        searchable_id, searchable_type, searchable_data, user_id, removed = result
        
        # Add searchable_id, type, user_id, and removed status to the data object for convenience
        item_data = dict(searchable_data)
        item_data['searchable_id'] = searchable_id
        item_data['type'] = searchable_type
        item_data['user_id'] = user_id
        item_data['removed'] = removed
        
        return item_data
        
    except Exception as e:
        logger.error(f"Error retrieving searchable item {searchable_id}: {str(e)}")
        return None

def get_invoices(buyer_id=None, seller_id=None, searchable_id=None, external_id=None, status=None):
    """
    Retrieves invoices from the invoice table based on specified parameters
    Note: Status is now determined by related payment records
    """
    try:
        # Build query dynamically
        conditions = []
        params = []
        
        if buyer_id is not None:
            if isinstance(buyer_id, list):
                placeholders = ','.join(['%s'] * len(buyer_id))
                conditions.append(f"i.buyer_id IN ({placeholders})")
                params.extend([str(b) for b in buyer_id])
            else:
                conditions.append(f"i.buyer_id = %s")
                params.append(str(buyer_id))
        
        if seller_id is not None:
            if isinstance(seller_id, list):
                placeholders = ','.join(['%s'] * len(seller_id))
                conditions.append(f"i.seller_id IN ({placeholders})")
                params.extend([str(s) for s in seller_id])
            else:
                conditions.append(f"i.seller_id = %s")
                params.append(str(seller_id))
        
        if searchable_id is not None:
            if isinstance(searchable_id, list):
                placeholders = ','.join(['%s'] * len(searchable_id))
                conditions.append(f"i.searchable_id IN ({placeholders})")
                params.extend([str(s) for s in searchable_id])
            else:
                conditions.append(f"i.searchable_id = %s")
                params.append(str(searchable_id))
        
        if external_id:
            conditions.append(f"i.external_id = %s")
            params.append(external_id)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        # Join with payment table to get status
        query = f"""
            SELECT i.id, i.buyer_id, i.seller_id, i.searchable_id, i.amount, i.fee, i.currency, 
                   i.type, i.external_id, i.created_at, i.metadata,
                   COALESCE(p.status, 'pending') as status
            FROM invoice i 
            LEFT JOIN payment p ON i.id = p.invoice_id
            WHERE {where_clause}
        """
        
        # Add status filter if provided
        if status:
            if status == 'pending':
                query += " AND p.status IS NULL"
            else:
                query += " AND p.status = %s"
                params.append(status)
        
        query += " ORDER BY i.created_at DESC"
        
        rows = db.fetch_all(query, tuple(params) if params else None)
        
        results = []
        for row in rows:
            invoice = {
                'id': row[0],
                'buyer_id': row[1],
                'seller_id': row[2],
                'searchable_id': row[3],
                'amount': float(row[4]),
                'fee': float(row[5]),
                'currency': row[6],
                'type': row[7],
                'external_id': row[8],
                'created_at': row[9].isoformat() if row[9] else None,
                'metadata': row[10],
                'status': row[11]  # Status from payment or 'pending'
            }
            results.append(invoice)
        
        return results
        
    except Exception as e:
        logger.error(f"Error retrieving invoices: {str(e)}")
        return []

def get_payments(invoice_id=None, invoice_ids=None, status=None):
    """
    Retrieves payments from the payment table
    """
    try:
        conditions = []
        params = []
        
        if invoice_id is not None:
            conditions.append("invoice_id = %s")
            params.append(invoice_id)
        
        if invoice_ids is not None:
            # Create placeholder for each invoice ID
            placeholders = ','.join(['%s'] * len(invoice_ids))
            conditions.append(f"invoice_id IN ({placeholders})")
            params.extend(invoice_ids)
        
        if status:
            conditions.append("status = %s")
            params.append(status)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT id, invoice_id, amount, fee, currency, type, external_id, 
                   status, created_at, metadata
            FROM payment
            WHERE {where_clause}
            ORDER BY created_at DESC
        """
        
        rows = db.fetch_all(query, tuple(params) if params else None)
        
        results = []
        for row in rows:
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
            results.append(payment)
        
        return results
        
    except Exception as e:
        logger.error(f"Error retrieving payments: {str(e)}")
        return []

def get_withdrawals(user_id=None, status=None, currency=None):
    """
    Retrieves withdrawals from the withdrawal table
    """
    try:
        conditions = []
        params = []
        
        if user_id is not None:
            conditions.append("user_id = %s")
            params.append(user_id)
        
        if status:
            conditions.append("status = %s")
            params.append(status)
        
        if currency:
            conditions.append("currency = %s")
            params.append(currency)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT id, user_id, amount, fee, currency, type, external_id, 
                   status, created_at, metadata
            FROM withdrawal
            WHERE {where_clause}
            ORDER BY created_at DESC
        """
        
        rows = db.fetch_all(query, tuple(params) if params else None)
        
        results = []
        for row in rows:
            withdrawal = {
                'id': row[0],
                'user_id': row[1],
                'amount': float(row[2]),
                'fee': float(row[3]),
                'currency': row[4],
                'type': row[5],
                'external_id': row[6],
                'status': row[7],
                'created_at': row[8].isoformat() if row[8] else None,
                'metadata': row[9]
            }
            results.append(withdrawal)
        
        return results
        
    except Exception as e:
        logger.error(f"Error retrieving withdrawals: {str(e)}")
        return []

def create_invoice(buyer_id, seller_id, searchable_id, amount, fee, currency, invoice_type, external_id, metadata=None):
    """
    Creates a new invoice record
    Note: Status is now determined by related payment records, not stored in invoice
    """
    try:
        metadata = metadata or {}
        
        row = db.execute_insert("""
            INSERT INTO invoice (buyer_id, seller_id, searchable_id, amount, fee, currency, type, external_id, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, buyer_id, seller_id, searchable_id, amount, fee, currency, type, external_id, created_at, metadata
        """, (buyer_id, seller_id, searchable_id, amount, fee, currency, invoice_type, external_id, Json(metadata)))
        
        if not row:
            return None
        
        return {
            'id': row[0],
            'buyer_id': row[1],
            'seller_id': row[2],
            'searchable_id': row[3],
            'amount': float(row[4]),
            'fee': float(row[5]),
            'currency': row[6],
            'type': row[7],
            'external_id': row[8],
            'created_at': row[9].isoformat() if row[9] else None,
            'metadata': row[10],
            'status': 'pending'  # New invoices start as pending
        }
        
    except Exception as e:
        logger.error(f"Error creating invoice: {str(e)}")
        return None

def create_payment(invoice_id, amount, fee, currency, payment_type, external_id=None, metadata=None):
    """
    Creates a new payment record
    """
    try:
        metadata = metadata or {}
        
        row = db.execute_insert("""
            INSERT INTO payment (invoice_id, amount, fee, currency, type, external_id, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, invoice_id, amount, fee, currency, type, external_id, status, created_at, metadata
        """, (invoice_id, amount, fee, currency, payment_type, external_id, Json(metadata)))
        
        if not row:
            return None
        
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
        
    except Exception as e:
        logger.error(f"Error creating payment: {str(e)}")
        return None

def update_payment_status(payment_id, status, metadata=None):
    """
    Updates the status and metadata of an existing payment record
    """
    try:
        if metadata is not None:
            row = db.execute_insert("""
                UPDATE payment 
                SET status = %s, metadata = %s
                WHERE id = %s
                RETURNING id, invoice_id, amount, fee, currency, type, external_id, status, created_at, metadata
            """, (status, Json(metadata), payment_id))
        else:
            row = db.execute_insert("""
                UPDATE payment 
                SET status = %s
                WHERE id = %s
                RETURNING id, invoice_id, amount, fee, currency, type, external_id, status, created_at, metadata
            """, (status, payment_id))
        
        if not row:
            return None
            
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
        
    except Exception as e:
        logger.error(f"Error updating payment status: {str(e)}")
        return None

def create_withdrawal(user_id, amount, fee, currency, withdrawal_type, external_id=None, metadata=None):
    """
    Creates a new withdrawal record
    """
    try:
        metadata = metadata or {}
        
        row = db.execute_insert("""
            INSERT INTO withdrawal (user_id, amount, fee, currency, type, external_id, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, amount, fee, currency, type, external_id, status, created_at, metadata
        """, (user_id, amount, fee, currency, withdrawal_type, external_id, Json(metadata)))
        
        if not row:
            return None
        
        return {
            'id': row[0],
            'user_id': row[1],
            'amount': float(row[2]),
            'fee': float(row[3]),
            'currency': row[4],
            'type': row[5],
            'external_id': row[6],
            'status': row[7],
            'created_at': row[8].isoformat() if row[8] else None,
            'metadata': row[9]
        }
        
    except Exception as e:
        logger.error(f"Error creating withdrawal: {str(e)}")
        return None

def check_payment(session_id):
    """
    Checks the status of a payment session in the database.
    Read-only operation that only checks local database status.
    """
    try:
        # Check the database for existing payment status
        invoice_records = get_invoices(external_id=session_id)
        
        if invoice_records:
            invoice_record = invoice_records[0]
            
            # Check if payment exists and is complete
            existing_payments = get_payments(invoice_id=invoice_record['id'])
            
            if existing_payments:
                payment_record = existing_payments[0]
                if payment_record['status'] == PaymentStatus.COMPLETE.value:
                    # Payment is complete, return the stored information
                    return {
                        'status': 'complete',
                        'amount_total': int(invoice_record['amount'] * 100),
                        'currency': Currency.USD.value,
                        'session_id': session_id
                    }
        
        # If we reach here, either no payment exists or it's not complete
        return {
            'status': 'incomplete',
            'amount_total': 0,
            'currency': Currency.USD.value,
            'session_id': session_id
        }
        
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        return {"error": str(e)}

def refresh_stripe_payment(session_id):
    """
    Checks the status of a Stripe payment session and updates the payment status accordingly
    """
    try:
        # Retrieve the checkout session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(session_id)
        # Log the checkout session for debugging
        logger.info(f"Stripe checkout session: {checkout_session}")
        
        # Get payment status
        payment_status = checkout_session.payment_status
        
        # If payment is successful, update the payment status in our database
        if payment_status == 'paid' or payment_status == 'complete':
            # Get the invoice record from our database using external_id
            invoice_records = get_invoices(external_id=session_id)
            
            if invoice_records:
                invoice_record = invoice_records[0]
                
                # Check if payment already exists
                existing_payments = get_payments(invoice_id=invoice_record['id'])
                
                if existing_payments:
                    # Update existing payment record
                    payment_record = existing_payments[0]
                    payment_metadata = {
                        **payment_record['metadata'],  # Preserve existing metadata
                        "stripe_status": payment_status,
                        "timestamp": int(time.time()),
                        "address": invoice_record['metadata'].get('address', ''),
                        "tel": invoice_record['metadata'].get('tel', ''),
                        "description": invoice_record['metadata'].get('description', ''),
                        "stripe_session_id": session_id,
                        "amount_total": checkout_session.amount_total,
                    }
                    
                    update_payment_status(
                        payment_id=payment_record['id'],
                        status=PaymentStatus.COMPLETE.value,
                        metadata=payment_metadata
                    )
                else:
                    # Fallback: Create payment record if none exists (shouldn't happen with new flow)
                    logger.warning(f"No payment record found for invoice {invoice_record['id']}, creating new payment record")
                    payment_metadata = {
                        "stripe_status": payment_status,
                        "timestamp": int(time.time()),
                        "address": invoice_record['metadata'].get('address', ''),
                        "tel": invoice_record['metadata'].get('tel', ''),
                        "description": invoice_record['metadata'].get('description', ''),
                        "stripe_session_id": session_id,
                        "amount_total": checkout_session.amount_total,
                    }
                    
                    create_payment(
                        invoice_id=invoice_record['id'],
                        amount=invoice_record['amount'],
                        currency=Currency.USD.value,
                        payment_type=PaymentType.STRIPE.value,
                        external_id=session_id,
                        metadata=payment_metadata
                    )
        
        # Return the payment status information
        return {
            "status": payment_status,
            "session_id": session_id,
            "amount_total": checkout_session.amount_total,
            "currency": Currency.USD.value
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error checking payment status: {str(e)}")
        return {"error": str(e)}
    except Exception as e:
        logger.error(f"Error checking Stripe payment status: {str(e)}")
        return {"error": str(e)}


def get_user_paid_files(user_id, searchable_id):
    """
    Get the specific files that a user has paid for in a searchable item
    Returns a set of file IDs that the user can download
    """
    try:
        # Get all completed payments by this user for this searchable item
        query = """
            SELECT i.metadata
            FROM invoice i 
            JOIN payment p ON i.id = p.invoice_id 
            WHERE i.buyer_id = %s
            AND i.searchable_id = %s
            AND p.status = %s
        """
        
        results = db.fetch_all(query, (user_id, searchable_id, 'complete'))
        
        paid_file_ids = set()
        
        for result in results:
            invoice_metadata = result[0]
            if invoice_metadata and 'selections' in invoice_metadata:
                selections = invoice_metadata['selections']
                for selection in selections:
                    if selection.get('type') == 'downloadable':
                        paid_file_ids.add(str(selection.get('id')))
        
        return paid_file_ids
        
    except Exception as e:
        logger.error(f"Error retrieving user paid files: {str(e)}")
        return set()

def get_balance_by_currency(user_id):
    """
    Get user balance from payments and withdrawals using new table structure
    """
    try:
        logger.info(f"Calculating balance for user_id: {user_id}")
        
        # Single query to calculate the entire balance
        query = """
        WITH balance_sources AS (
            -- Income from sales (seller earnings after fees)
            SELECT 
                'sale' as source_type,
                (i.amount - i.fee) as net_amount,
                i.currency
            FROM invoice i
            JOIN payment p ON i.id = p.invoice_id
            WHERE i.seller_id = %s
            AND p.status = %s
            AND i.currency = 'usd'
            
            UNION ALL
            
            -- Rewards
            SELECT 
                'reward' as source_type,
                r.amount as net_amount,
                r.currency
            FROM rewards r
            WHERE r.user_id = %s
            AND r.currency = 'usd'
            
            UNION ALL
            
            -- Completed deposits
            SELECT 
                'deposit' as source_type,
                d.amount as net_amount,
                d.currency
            FROM deposit d
            WHERE d.user_id = %s
            AND d.status = 'complete'
            AND d.currency = 'usd'
            
            UNION ALL
            
            -- Withdrawals (negative amounts)
            SELECT 
                'withdrawal' as source_type,
                -w.amount as net_amount,
                w.currency
            FROM withdrawal w
            WHERE w.user_id = %s
            AND w.status IN (%s, %s, %s)
            AND w.currency = 'usd'
            
            UNION ALL
            
            -- Balance payments (negative amounts) - purchases made with balance
            SELECT 
                'balance_payment' as source_type,
                -i.amount as net_amount,
                i.currency
            FROM invoice i
            JOIN payment p ON i.id = p.invoice_id
            WHERE i.buyer_id = %s
            AND p.type = 'balance'
            AND p.status = %s
            AND i.currency = 'usd'
        )
        SELECT 
            COALESCE(SUM(net_amount), 0) as total_balance
        FROM balance_sources
        """
        
        with database_cursor() as (cur, conn):
            execute_sql(cur, query, params=(
                user_id,  # for sales
                PaymentStatus.COMPLETE.value,
                user_id,  # for rewards
                user_id,  # for deposits
                user_id,  # for withdrawals
                PaymentStatus.COMPLETE.value,
                PaymentStatus.PENDING.value,
                PaymentStatus.DELAYED.value,
                user_id,  # for balance payments (buyer_id)
                PaymentStatus.COMPLETE.value  # for balance payments status
            ))
            
            result = cur.fetchone()
            total_balance = float(result[0]) if result and result[0] else 0.0
        
        balance_by_currency = {
            'usd': total_balance
        }
        
        logger.info(f"Final balance for user {user_id}: {balance_by_currency}")
        return balance_by_currency
        
    except Exception as e:
        logger.error(f"Error calculating balance for user {user_id}: {str(e)}")
        raise e

def get_ratings(invoice_id=None, user_id=None):
    """
    Retrieves ratings from the rating table
    """
    try:
        conditions = []
        params = []
        
        if invoice_id is not None:
            conditions.append("invoice_id = %s")
            params.append(invoice_id)
        
        if user_id is not None:
            conditions.append("user_id = %s")
            params.append(user_id)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT id, invoice_id, user_id, rating, review, metadata, created_at
            FROM rating
            WHERE {where_clause}
            ORDER BY created_at DESC
        """
        
        rows = db.fetch_all(query, tuple(params) if params else None)
        
        results = []
        for row in rows:
            rating = {
                'id': row[0],
                'invoice_id': row[1],
                'user_id': row[2],
                'rating': float(row[3]),
                'review': row[4],
                'metadata': row[5],
                'created_at': row[6].isoformat() if row[6] else None
            }
            results.append(rating)
        
        return results
        
    except Exception as e:
        logger.error(f"Error retrieving ratings: {str(e)}")
        return []

def can_user_rate_invoice(user_id, invoice_id):
    """
    Check if a user can rate an invoice (must have completed payment and not already rated)
    """
    try:
        with database_cursor() as (cur, conn):
            # Check if user has a completed payment for this invoice
            payment_query = """
                SELECT p.status, i.buyer_id
                FROM payment p
                JOIN invoice i ON p.invoice_id = i.id
                WHERE i.id = %s
                AND i.buyer_id = %s
                AND p.status = %s
            """
            
            execute_sql(cur, payment_query, params=(invoice_id, user_id, 'complete'))
            payment_result = cur.fetchone()
            
            if not payment_result:
                return False, "No completed payment found for this invoice"
            
            # Check if user has already rated this invoice
            rating_query = """
                SELECT id FROM rating
                WHERE invoice_id = %s
                AND user_id = %s
            """
            
            execute_sql(cur, rating_query, params=(invoice_id, user_id))
            rating_result = cur.fetchone()
            
            if rating_result:
                return False, "You have already rated this item"
        
        return True, "User can rate this invoice"
        
    except Exception as e:
        logger.error(f"Error checking if user can rate invoice: {str(e)}")
        return False, f"Error: {str(e)}"

def create_rating(user_id, invoice_id, rating_value, review=None, metadata=None):
    """
    Create a new rating for an invoice
    """
    try:
        # Validate rating value
        if not (0 <= rating_value <= 5):
            raise ValueError("Rating must be between 0 and 5")
        
        # Check if user can rate this invoice
        can_rate, message = can_user_rate_invoice(user_id, invoice_id)
        if not can_rate:
            raise ValueError(message)
        
        # Set default metadata if none provided
        if metadata is None:
            metadata = {}
        
        # Insert rating
        query = """
            INSERT INTO rating (invoice_id, user_id, rating, review, metadata, created_at)
            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING id
        """
        
        with database_transaction() as (cur, conn):
            execute_sql(cur, query, params=(invoice_id, user_id, rating_value, review, Json(metadata)))
            rating_id = cur.fetchone()[0]
        
        logger.info(f"Rating created with ID: {rating_id}")
        return {
            'id': rating_id,
            'invoice_id': invoice_id,
            'user_id': user_id,
            'rating': rating_value,
            'review': review,
            'metadata': metadata
        }
        
    except Exception as e:
        logger.error(f"Error creating rating: {str(e)}")
        raise e

def get_invoice_notes(invoice_id):
    """
    Get all notes for a specific invoice
    """
    try:
        query = """
            SELECT n.id, n.invoice_id, n.user_id, n.buyer_seller, n.content, 
                   n.metadata, n.created_at, u.username
            FROM invoice_note n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE n.invoice_id = %s
            ORDER BY n.created_at ASC
        """
        
        rows = db.fetch_all(query, (invoice_id,))
        notes = []
        
        for row in rows:
            metadata = row[5] if row[5] else {}
            note = {
                'note_id': row[0],  # Use note_id as expected by tests
                'id': row[0],  # Keep original for backward compatibility
                'invoice_id': row[1],
                'user_id': row[2],
                'buyer_seller': row[3],
                'content': row[4],
                'note_text': row[4],  # Add note_text as expected by tests
                'note_type': metadata.get('note_type', ''),  # Extract from metadata
                'visibility': metadata.get('visibility', ''),  # Extract from metadata
                'metadata': metadata,
                'created_at': row[6].isoformat() if row[6] else None,
                'created_by': row[7],  # Use username as created_by
                'username': row[7]
            }
            notes.append(note)
        
        return notes
        
    except Exception as e:
        logger.error(f"Error retrieving invoice notes: {str(e)}")
        return []

def create_invoice_note(invoice_id, user_id, content, buyer_seller, metadata=None):
    """
    Create a new note for an invoice
    """
    try:
        if metadata is None:
            metadata = {}
        
        query = """
            INSERT INTO invoice_note (invoice_id, user_id, buyer_seller, content, metadata, created_at)
            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING id
        """
        
        with database_transaction() as (cur, conn):
            execute_sql(cur, query, params=(invoice_id, user_id, buyer_seller, content, Json(metadata)))
            note_id = cur.fetchone()[0]
        
        logger.info(f"Invoice note created with ID: {note_id}")
        return {
            'id': note_id,
            'invoice_id': invoice_id,
            'user_id': user_id,
            'buyer_seller': buyer_seller,
            'content': content,
            'metadata': metadata
        }
        
    except Exception as e:
        logger.error(f"Error creating invoice note: {str(e)}")
        raise e

def get_invoices_for_searchable(searchable_id, user_id, user_role='buyer'):
    """
    Get invoices for a searchable item filtered by user role
    """
    try:
        with database_cursor() as (cur, conn):
            if user_role == 'seller':
                # Sellers see all invoices for their searchable items
                query = """
                    SELECT i.id, i.buyer_id, i.seller_id, i.searchable_id, i.amount, 
                           i.fee, i.currency, i.type, i.external_id, i.created_at, 
                           i.metadata, p.status as payment_status, p.created_at as payment_date,
                           u.username as buyer_username,
                           s.searchable_data->'payloads'->'public'->>'title' as item_title,
                           s.type as searchable_type
                    FROM invoice i
                    LEFT JOIN payment p ON i.id = p.invoice_id
                    LEFT JOIN users u ON i.buyer_id = u.id
                    LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
                    WHERE i.searchable_id = %s
                    AND i.seller_id = %s
                    AND p.status = %s
                    ORDER BY i.created_at DESC
                """
                execute_sql(cur, query, params=(searchable_id, user_id, 'complete'))
            else:
                # Buyers see their own paid invoices and pending invoices from past 24 hours
                query = """
                    SELECT i.id, i.buyer_id, i.seller_id, i.searchable_id, i.amount, 
                           i.fee, i.currency, i.type, i.external_id, i.created_at, 
                           i.metadata, p.status as payment_status, p.created_at as payment_date,
                           u.username as seller_username,
                           s.searchable_data->'payloads'->'public'->>'title' as item_title,
                           s.type as searchable_type
                    FROM invoice i
                    LEFT JOIN payment p ON i.id = p.invoice_id
                    LEFT JOIN users u ON i.seller_id = u.id
                    LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
                    WHERE i.searchable_id = %s
                    AND i.buyer_id = %s
                    AND (p.status = %s OR (p.status = %s AND i.created_at >= NOW() - INTERVAL '24 hours'))
                    ORDER BY i.created_at DESC
                """
                execute_sql(cur, query, params=(searchable_id, user_id, 'complete', 'pending'))
            invoices = []
            
            for row in cur.fetchall():
                invoice = {
                    'id': row[0],
                    'buyer_id': row[1],
                    'seller_id': row[2],
                    'searchable_id': row[3],
                    'amount': float(row[4]),
                    'fee': float(row[5]) if row[5] else 0,
                    'currency': row[6],
                    'type': row[7],
                    'external_id': row[8],
                    'created_at': row[9].isoformat() if row[9] else None,
                    'metadata': row[10],
                    'payment_status': row[11],
                    'payment_date': row[12].isoformat() if row[12] else None,
                    'other_party_username': row[13],  # buyer_username for seller, seller_username for buyer
                    'item_title': row[14],
                    'searchable_type': row[15]
                }
                invoices.append(invoice)
            
            return invoices
        
    except Exception as e:
        logger.error(f"Error retrieving invoices for searchable: {str(e)}")
        return []

def get_user_all_invoices(user_id):
    """
    Get all invoices for a user (both as buyer and seller)
    """
    try:
        # Get invoices where user is buyer
        buyer_query = """
            SELECT i.id, i.buyer_id, i.seller_id, i.searchable_id, i.amount, 
                   i.fee, i.currency, i.type, i.external_id, i.created_at, 
                   i.metadata, p.status as payment_status, p.created_at as payment_date,
                   u.username as seller_username, s.searchable_data->'payloads'->'public'->>'title' as item_title,
                   s.type as searchable_type,
                   'buyer' as user_role
            FROM invoice i
            LEFT JOIN payment p ON i.id = p.invoice_id
            LEFT JOIN users u ON i.seller_id = u.id
            LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
            WHERE i.buyer_id = %s
            AND p.status = %s
        """
        
        # Get invoices where user is seller
        seller_query = """
            SELECT i.id, i.buyer_id, i.seller_id, i.searchable_id, i.amount, 
                   i.fee, i.currency, i.type, i.external_id, i.created_at, 
                   i.metadata, p.status as payment_status, p.created_at as payment_date,
                   u.username as buyer_username, s.searchable_data->'payloads'->'public'->>'title' as item_title,
                   s.type as searchable_type,
                   'seller' as user_role
            FROM invoice i
            LEFT JOIN payment p ON i.id = p.invoice_id
            LEFT JOIN users u ON i.buyer_id = u.id
            LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
            WHERE i.seller_id = %s
            AND p.status = %s
        """
        
        # Combine both queries with UNION
        combined_query = f"""
            ({buyer_query})
            UNION ALL
            ({seller_query})
            ORDER BY payment_date DESC
        """
        
        rows = db.fetch_all(combined_query, (user_id, 'complete', user_id, 'complete'))
        invoices = []
        
        for row in rows:
            invoice = {
                'id': row[0],
                'buyer_id': row[1],
                'seller_id': row[2],
                'searchable_id': row[3],
                'amount': float(row[4]),
                'fee': float(row[5]) if row[5] else 0,
                'currency': row[6],
                'type': row[7],
                'external_id': row[8],
                'created_at': row[9].isoformat() if row[9] else None,
                'metadata': row[10],
                'payment_status': row[11],
                'payment_date': row[12].isoformat() if row[12] else None,
                'other_party_username': row[13],
                'item_title': row[14],
                'searchable_type': row[15],
                'user_role': row[16]  # 'buyer' or 'seller'
            }
            invoices.append(invoice)
        
        return invoices
        
    except Exception as e:
        logger.error(f"Error retrieving user invoices: {str(e)}")
        raise e

def get_user_profile(user_id):
    """
    Retrieve a user profile by user_id
    
    Args:
        user_id: The user ID to retrieve the profile for
        
    Returns:
        dict: The user profile data or None if not found
    """
    try:
        result = db.fetch_one("""
            SELECT id, user_id, username, profile_image_url, introduction, 
                   metadata, is_guest, created_at, updated_at
            FROM user_profile
            WHERE user_id = %s
        """, (user_id,))
        
        if not result:
            return None
            
        return {
            'id': result[0],
            'user_id': result[1],
            'username': result[2],
            'profile_image_url': result[3],
            'introduction': result[4],
            'metadata': result[5],
            'is_guest': result[6],
            'created_at': result[7].isoformat() if result[7] else None,
            'updated_at': result[8].isoformat() if result[8] else None
        }
    except Exception as e:
        logger.error(f"Error retrieving user profile for user_id {user_id}: {str(e)}")
        return None

def create_user_profile(user_id, username, profile_image_url=None, introduction=None, metadata=None):
    """
    Create a new user profile
    
    Args:
        user_id: The user ID
        username: The username
        profile_image_url: Optional profile image URL
        introduction: Optional user introduction
        metadata: Optional additional metadata
        
    Returns:
        dict: The created user profile data or None if failed
    """
    try:
        metadata = metadata or {}
        
        with database_transaction() as (cur, conn):
            execute_sql(cur, """
                INSERT INTO user_profile (user_id, username, profile_image_url, introduction, metadata)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, user_id, username, profile_image_url, introduction, 
                          metadata, created_at, updated_at
            """, params=(user_id, username, profile_image_url, introduction, Json(metadata)))
            
            result = cur.fetchone()
            
            profile = {
                'id': result[0],
                'user_id': result[1],
                'username': result[2],
                'profile_image_url': result[3],
                'introduction': result[4],
                'metadata': result[5],
                'created_at': result[6].isoformat() if result[6] else None,
                'updated_at': result[7].isoformat() if result[7] else None
            }
            
            return profile
        
    except Exception as e:
        logger.error(f"Error creating user profile: {str(e)}")
        return None

def update_user_profile(user_id, username=None, profile_image_url=None, introduction=None, metadata=None):
    """
    Update an existing user profile
    
    Args:
        user_id: The user ID
        username: Optional new username
        profile_image_url: Optional new profile image URL
        introduction: Optional new introduction
        metadata: Optional new metadata
        
    Returns:
        dict: The updated user profile data or None if failed
    """
    try:
        # Build dynamic update query based on provided fields
        update_fields = []
        params = []
        
        if username is not None:
            update_fields.append("username = %s")
            params.append(username)
            
        if profile_image_url is not None:
            update_fields.append("profile_image_url = %s")
            params.append(profile_image_url)
            
        if introduction is not None:
            update_fields.append("introduction = %s")
            params.append(introduction)
            
        if metadata is not None:
            update_fields.append("metadata = %s")
            params.append(Json(metadata))
        
        # Add user_id as the last parameter for WHERE clause
        params.append(user_id)
        
        if not update_fields:
            # No fields to update
            return get_user_profile(user_id)
        
        query = f"""
            UPDATE user_profile 
            SET {', '.join(update_fields)}
            WHERE user_id = %s
            RETURNING id, user_id, username, profile_image_url, introduction, 
                      metadata, created_at, updated_at
        """
        
        with database_transaction() as (cur, conn):
            execute_sql(cur, query, params=params)
            
            result = cur.fetchone()
            
            if not result:
                return None
                
            profile = {
                'id': result[0],
                'user_id': result[1],
                'username': result[2],
                'profile_image_url': result[3],
                'introduction': result[4],
                'metadata': result[5],
                'created_at': result[6].isoformat() if result[6] else None,
                'updated_at': result[7].isoformat() if result[7] else None
            }
            
            return profile
        
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        return None

def get_rewards(user_id=None):
    """
    Retrieves rewards from the rewards table
    """
    try:
        conditions = []
        params = []
        
        if user_id is not None:
            conditions.append("user_id = %s")
            params.append(user_id)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT id, amount, currency, user_id, created_at, metadata
            FROM rewards
            WHERE {where_clause}
            ORDER BY created_at DESC
        """
        
        rows = db.fetch_all(query, tuple(params) if params else ())
        
        results = []
        for row in rows:
            reward = {
                'id': row[0],
                'amount': float(row[1]),
                'currency': row[2],
                'user_id': row[3],
                'created_at': row[4].isoformat() if row[4] else None,
                'metadata': row[5]
            }
            results.append(reward)
        
        return results
        
    except Exception as e:
        logger.error(f"Error retrieving rewards: {str(e)}")
        return []

def get_downloadable_items_by_user_id(user_id):
    """
    Get all downloadable items purchased by a user
    
    Args:
        user_id: The user ID to get purchases for
        
    Returns:
        list: List of downloadable items with their details
    """
    try:
        # Query to get all completed purchases for the user
        query = """
            SELECT 
                i.id as invoice_id,
                i.searchable_id,
                i.amount,
                i.fee,
                i.currency,
                i.metadata as invoice_metadata,
                p.created_at as purchase_date,
                s.searchable_data,
                u.username as seller_username
            FROM invoice i
            INNER JOIN payment p ON i.id = p.invoice_id
            INNER JOIN searchables s ON i.searchable_id = s.searchable_id
            INNER JOIN users u ON i.seller_id = u.id
            WHERE i.buyer_id = %s
            AND p.status = %s
            ORDER BY p.created_at DESC
        """
        
        rows = db.fetch_all(query, (user_id, 'complete'))
        downloadable_items = []
        
        for row in rows:
            invoice_id = row[0]
            searchable_id = row[1]
            amount = float(row[2])
            fee = float(row[3]) if row[3] else 0
            currency = row[4]
            invoice_metadata = row[5] or {}
            purchase_date = row[6]
            searchable_data = row[7] or {}
            seller_username = row[8]
            
            # Extract public data from searchable
            public_data = searchable_data.get('payloads', {}).get('public', {})
            
            # Extract downloadable files from invoice metadata selections
            downloadable_files = []
            selections = invoice_metadata.get('selections', [])
            
            for selection in selections:
                if selection.get('type') == 'downloadable':
                    downloadable_files.append({
                        'id': selection.get('id'),
                        'name': selection.get('name'),
                        'price': selection.get('price'),
                        'file_uri': selection.get('file_uri', ''),  # This would be set during purchase
                        'download_url': f"/v1/download-file/{searchable_id}/{selection.get('id')}"  # API endpoint for download
                    })
            
            # If no selections in metadata, fallback to public downloadableFiles
            if not downloadable_files and public_data.get('downloadableFiles'):
                for file_data in public_data.get('downloadableFiles', []):
                    downloadable_files.append({
                        'id': file_data.get('id', ''),
                        'name': file_data.get('name', ''),
                        'price': file_data.get('price', 0),
                        'file_uri': '',  # Would need to be populated from actual purchase
                        'download_url': f"/v1/download-file/{searchable_id}/{file_data.get('id', '')}"
                    })
            
            item = {
                'invoice_id': invoice_id,
                'searchable_id': searchable_id,
                'searchable_title': public_data.get('title', 'Untitled'),
                'searchable_description': public_data.get('description', ''),
                'seller_username': seller_username,
                'amount_paid': amount,
                'fee_paid': fee,
                'currency': currency,
                'purchase_date': purchase_date.isoformat() if purchase_date else None,
                'downloadable_files': downloadable_files,
                'item_type': public_data.get('type', 'downloadable'),
                'images': public_data.get('images', [])
            }
            
            downloadable_items.append(item)
        
        logger.info(f"Retrieved {len(downloadable_items)} downloadable items for user {user_id}")
        return downloadable_items
        
    except Exception as e:
        logger.error(f"Error retrieving downloadable items for user {user_id}: {str(e)}")
        raise e


def get_receipts(user_id):
    """
    Get receipts for a user (alias for get_downloadable_items_by_user_id).
    This function returns all items that a user has purchased.
    """
    return get_downloadable_items_by_user_id(user_id)


__all__ = [
    'get_searchableIds_by_user', 
    'get_searchable',
    'get_invoices',
    'get_payments',
    'get_withdrawals',
    'create_invoice',
    'create_payment', 
    'update_payment_status',
    'create_withdrawal',
    'check_payment',
    'refresh_stripe_payment',
    'get_receipts',
    'get_balance_by_currency',
    'get_ratings',
    'get_user_paid_files',
    'can_user_rate_invoice',
    'create_rating',
    'get_invoice_notes',
    'create_invoice_note',
    'get_invoices_for_searchable',
    'get_user_all_invoices',
    'get_user_profile',
    'create_user_profile',
    'update_user_profile',
    'get_rewards',
    'get_downloadable_items_by_user_id'
]