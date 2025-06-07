import os
import time
import stripe
from psycopg2.extras import Json
from .database import get_db_connection, execute_sql
from .logging_config import setup_logger
from .payment_helpers import calc_invoice

# Set up the logger
logger = setup_logger(__name__, 'data_helpers.log')

stripe.api_key = os.environ.get('STRIPE_API_KEY')

def get_terminal(terminal_id):
    """
    Retrieve a terminal by terminal_id
    
    Args:
        terminal_id: The terminal ID (user ID) to retrieve the profile for
        
    Returns:
        dict: The terminal data or None if not found
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Query to get the profile data for the specified terminal_id
        execute_sql(cur, f"""
            SELECT terminal_data FROM terminal
            WHERE terminal_id = '{terminal_id}'
        """)
        
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not result:
            return None
            
        return result[0]
    except Exception as e:
        print(f"Error retrieving profile for terminal_id {terminal_id}: {str(e)}")
        return None

def get_searchableIds_by_user(user_id):
    """
    Retrieves all searchable IDs for a specific user
    
    Args:
        user_id: The user ID to query for
        
    Returns:
        List of searchable IDs belonging to the user
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Query searchables with terminal_id matching the user
        execute_sql(cur, f"""
            SELECT searchable_id
            FROM searchables
            WHERE searchable_data->>'terminal_id' = '{str(user_id)}'
        """)
        
        searchable_ids = [row[0] for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        return searchable_ids
    except Exception as e:
        print(f"Error retrieving searchable IDs for user {user_id}: {str(e)}")
        return []

def get_searchable(searchable_id):
    """
    Retrieves a searchable item by its ID
    
    Args:
        searchable_id: The ID of the searchable item to retrieve
        
    Returns:
        dict: The searchable data including the searchable_id, or None if not found
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        execute_sql(cur, f"""
            SELECT searchable_id, searchable_data
            FROM searchables
            WHERE searchable_id = {searchable_id}
        """)
        
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not result:
            return None
            
        searchable_id, searchable_data = result
        
        # Add searchable_id to the data object for convenience
        item_data = dict(searchable_data)
        item_data['searchable_id'] = searchable_id
        
        return item_data
        
    except Exception as e:
        print(f"Error retrieving searchable item {searchable_id}: {str(e)}")
        # Ensure connection is closed even if an error occurs
        if 'conn' in locals() and conn:
            conn.close()
        return None

def get_invoices(buyer_id=None, seller_id=None, searchable_id=None, external_id=None, status=None):
    """
    Retrieves invoices from the invoice table based on specified parameters
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Build query dynamically
        conditions = []
        if buyer_id is not None:
            if isinstance(buyer_id, list):
                buyer_ids = "', '".join([str(b) for b in buyer_id])
                conditions.append(f"buyer_id IN ('{buyer_ids}')")
            else:
                conditions.append(f"buyer_id = '{buyer_id}'")
        
        if seller_id is not None:
            if isinstance(seller_id, list):
                seller_ids = "', '".join([str(s) for s in seller_id])
                conditions.append(f"seller_id IN ('{seller_ids}')")
            else:
                conditions.append(f"seller_id = '{seller_id}'")
        
        if searchable_id is not None:
            if isinstance(searchable_id, list):
                searchable_ids = "', '".join([str(s) for s in searchable_id])
                conditions.append(f"searchable_id IN ('{searchable_ids}')")
            else:
                conditions.append(f"searchable_id = '{searchable_id}'")
        
        if external_id:
            conditions.append(f"external_id = '{external_id}'")
        
        if status:
            conditions.append(f"status = '{status}'")
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT id, buyer_id, seller_id, searchable_id, amount, fee, currency, 
                   type, external_id, status, created_at, metadata
            FROM invoice
            WHERE {where_clause}
            ORDER BY created_at DESC
        """
        
        execute_sql(cur, query)
        
        results = []
        for row in cur.fetchall():
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
                'status': row[9],
                'created_at': row[10],
                'metadata': row[11]
            }
            results.append(invoice)
        
        cur.close()
        conn.close()
        return results
        
    except Exception as e:
        print(f"Error retrieving invoices: {str(e)}")
        return []

def get_payments(invoice_id=None, invoice_ids=None, status=None):
    """
    Retrieves payments from the payment table
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        conditions = []
        if invoice_id is not None:
            conditions.append(f"invoice_id = {invoice_id}")
        
        if invoice_ids is not None:
            invoice_ids_str = ','.join([str(i) for i in invoice_ids])
            conditions.append(f"invoice_id IN ({invoice_ids_str})")
        
        if status:
            conditions.append(f"status = '{status}'")
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT id, invoice_id, amount, fee, currency, type, external_id, 
                   status, created_at, metadata
            FROM payment
            WHERE {where_clause}
            ORDER BY created_at DESC
        """
        
        execute_sql(cur, query)
        
        results = []
        for row in cur.fetchall():
            payment = {
                'id': row[0],
                'invoice_id': row[1],
                'amount': float(row[2]),
                'fee': float(row[3]),
                'currency': row[4],
                'type': row[5],
                'external_id': row[6],
                'status': row[7],
                'created_at': row[8],
                'metadata': row[9]
            }
            results.append(payment)
        
        cur.close()
        conn.close()
        return results
        
    except Exception as e:
        print(f"Error retrieving payments: {str(e)}")
        return []

def get_withdrawals(user_id=None, status=None, currency=None):
    """
    Retrieves withdrawals from the withdrawal table
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        conditions = []
        if user_id is not None:
            conditions.append(f"user_id = {user_id}")
        
        if status:
            conditions.append(f"status = '{status}'")
        
        if currency:
            conditions.append(f"currency = '{currency}'")
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT id, user_id, amount, fee, currency, type, external_id, 
                   status, created_at, metadata
            FROM withdrawal
            WHERE {where_clause}
            ORDER BY created_at DESC
        """
        
        execute_sql(cur, query)
        
        results = []
        for row in cur.fetchall():
            withdrawal = {
                'id': row[0],
                'user_id': row[1],
                'amount': float(row[2]),
                'fee': float(row[3]),
                'currency': row[4],
                'type': row[5],
                'external_id': row[6],
                'status': row[7],
                'created_at': row[8],
                'metadata': row[9]
            }
            results.append(withdrawal)
        
        cur.close()
        conn.close()
        return results
        
    except Exception as e:
        print(f"Error retrieving withdrawals: {str(e)}")
        return []

def create_invoice(buyer_id, seller_id, searchable_id, amount, currency, invoice_type, external_id, metadata=None):
    """
    Creates a new invoice record
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        metadata = metadata or {}
        
        execute_sql(cur, f"""
            INSERT INTO invoice (buyer_id, seller_id, searchable_id, amount, currency, type, external_id, metadata)
            VALUES ({buyer_id}, {seller_id}, {searchable_id}, {amount}, '{currency}', '{invoice_type}', '{external_id}', {Json(metadata)})
            RETURNING id, buyer_id, seller_id, searchable_id, amount, fee, currency, type, external_id, status, created_at, metadata
        """, commit=True, connection=conn)
        
        row = cur.fetchone()
        
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
            'status': row[9],
            'created_at': row[10],
            'metadata': row[11]
        }
        
        cur.close()
        conn.close()
        return invoice
        
    except Exception as e:
        print(f"Error creating invoice: {str(e)}")
        return None

def create_payment(invoice_id, amount, currency, payment_type, external_id=None, metadata=None):
    """
    Creates a new payment record
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        metadata = metadata or {}
        
        execute_sql(cur, f"""
            INSERT INTO payment (invoice_id, amount, currency, type, external_id, metadata)
            VALUES ({invoice_id}, {amount}, '{currency}', '{payment_type}', '{external_id}', {Json(metadata)})
            RETURNING id, invoice_id, amount, fee, currency, type, external_id, status, created_at, metadata
        """, commit=True, connection=conn)
        
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
            'created_at': row[8],
            'metadata': row[9]
        }
        
        cur.close()
        conn.close()
        return payment
        
    except Exception as e:
        print(f"Error creating payment: {str(e)}")
        return None

def update_payment_status(payment_id, status, metadata=None):
    """
    Updates the status and metadata of an existing payment record
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if metadata is not None:
            execute_sql(cur, f"""
                UPDATE payment 
                SET status = '{status}', metadata = {Json(metadata)}
                WHERE id = {payment_id}
                RETURNING id, invoice_id, amount, fee, currency, type, external_id, status, created_at, metadata
            """, commit=True, connection=conn)
        else:
            execute_sql(cur, f"""
                UPDATE payment 
                SET status = '{status}'
                WHERE id = {payment_id}
                RETURNING id, invoice_id, amount, fee, currency, type, external_id, status, created_at, metadata
            """, commit=True, connection=conn)
        
        row = cur.fetchone()
        
        if not row:
            return None
            
        payment = {
            'id': row[0],
            'invoice_id': row[1],
            'amount': float(row[2]),
            'fee': float(row[3]),
            'currency': row[4],
            'type': row[5],
            'external_id': row[6],
            'status': row[7],
            'created_at': row[8],
            'metadata': row[9]
        }
        
        cur.close()
        conn.close()
        return payment
        
    except Exception as e:
        print(f"Error updating payment status: {str(e)}")
        return None

def create_withdrawal(user_id, amount, currency, withdrawal_type, external_id=None, metadata=None):
    """
    Creates a new withdrawal record
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        metadata = metadata or {}
        
        execute_sql(cur, f"""
            INSERT INTO withdrawal (user_id, amount, currency, type, external_id, metadata)
            VALUES ({user_id}, {amount}, '{currency}', '{withdrawal_type}', '{external_id}', {Json(metadata)})
            RETURNING id, user_id, amount, fee, currency, type, external_id, status, created_at, metadata
        """, commit=True, connection=conn)
        
        row = cur.fetchone()
        
        withdrawal = {
            'id': row[0],
            'user_id': row[1],
            'amount': float(row[2]),
            'fee': float(row[3]),
            'currency': row[4],
            'type': row[5],
            'external_id': row[6],
            'status': row[7],
            'created_at': row[8],
            'metadata': row[9]
        }
        
        cur.close()
        conn.close()
        return withdrawal
        
    except Exception as e:
        print(f"Error creating withdrawal: {str(e)}")
        return None

def check_payment(invoice_id):
    """
    Checks the status of a payment via BTCPay Server and updates the database if settled.
    """
    try:
        # Import here to avoid circular imports
        import requests
        import os
        
        BTC_PAY_URL = "https://generous-purpose.metalseed.io"
        STORE_ID = os.environ.get('BTCPAY_STORE_ID', "")
        BTCPAY_SERVER_GREENFIELD_API_KEY = os.environ.get('BTCPAY_SERVER_GREENFIELD_API_KEY', '')
        
        # Make request to BTCPay Server to check payment status
        response = requests.get(
            f"{BTC_PAY_URL}/api/v1/stores/{STORE_ID}/invoices/{invoice_id}",
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'token {BTCPAY_SERVER_GREENFIELD_API_KEY}'
            }
        )
        
        if response.status_code != 200:
            return {"error": f"Failed to check payment status: {response.text}"}
                
        invoice_data = response.json()
        
        # If payment is settled, update the payment status in our database
        if invoice_data['status'].lower() in ('settled', 'complete'):
            
            # Get the invoice record from our database using external_id
            invoice_records = get_invoices(external_id=invoice_id)
            
            if invoice_records:
                invoice_record = invoice_records[0]
                
                # Check if payment already exists
                existing_payments = get_payments(invoice_id=invoice_record['id'])
                
                if existing_payments:
                    # Update existing payment record
                    payment_record = existing_payments[0]
                    payment_metadata = {
                        **payment_record['metadata'],  # Preserve existing metadata
                        "btcpay_status": invoice_data['status'],
                        "timestamp": int(time.time()),
                        "address": invoice_record['metadata'].get('address', ''),
                        "tel": invoice_record['metadata'].get('tel', ''),
                        "description": invoice_record['metadata'].get('description', ''),
                    }
                    
                    update_payment_status(
                        payment_id=payment_record['id'],
                        status='complete',
                        metadata=payment_metadata
                    )
                else:
                    # Fallback: Create payment record if none exists (shouldn't happen with new flow)
                    payment_metadata = {
                        "btcpay_status": invoice_data['status'],
                        "timestamp": int(time.time()),
                        "address": invoice_record['metadata'].get('address', ''),
                        "tel": invoice_record['metadata'].get('tel', ''),
                        "description": invoice_record['metadata'].get('description', ''),
                    }
                    
                    create_payment(
                        invoice_id=invoice_record['id'],
                        amount=invoice_record['amount'],
                        currency=invoice_record['currency'],
                        payment_type=invoice_record['type'],
                        external_id=invoice_id,
                        metadata=payment_metadata
                    )
        
        # Return the payment status
        return invoice_data
        
    except Exception as e:
        print(f"Error checking payment status: {str(e)}")
        return {"error": str(e)}

def refresh_stripe_payment(session_id):
    """
    Checks the status of a Stripe payment session and updates the payment status accordingly
    """
    try:
        # Retrieve the checkout session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(session_id)
        # Log the checkout session for debugging
        print(f"Stripe checkout session: {checkout_session}")
        
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
                        status='complete',
                        metadata=payment_metadata
                    )
                else:
                    # Fallback: Create payment record if none exists (shouldn't happen with new flow)
                    print(f"Warning: No payment record found for invoice {invoice_record['id']}, creating new payment record")
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
                        currency=invoice_record['currency'],
                        payment_type=invoice_record['type'],
                        external_id=session_id,
                        metadata=payment_metadata
                    )
        
        # Return the payment status information
        return {
            "status": payment_status,
            "session_id": session_id,
            "amount_total": checkout_session.amount_total,
            "currency": checkout_session.currency
        }
        
    except stripe.error.StripeError as e:
        print(f"Stripe error checking payment status: {str(e)}")
        return {"error": str(e)}
    except Exception as e:
        print(f"Error checking Stripe payment status: {str(e)}")
        return {"error": str(e)}

def get_receipts(user_id=None, searchable_id=None):
    """
    Retrieves payment receipts for a user or a specific searchable item using new table structure
    """
    if user_id is None and searchable_id is None:
        print("Error: Either user_id or searchable_id must be provided")
        return []
        
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Build the WHERE clause based on provided parameters
        where_conditions = []
        if user_id:
            where_conditions.append(f"(i.seller_id = {user_id} OR i.buyer_id = {user_id})")
        if searchable_id:
            where_conditions.append(f"i.searchable_id = {searchable_id}")
            
        where_clause = " AND ".join(where_conditions)

        query = f"""
            SELECT i.id, i.buyer_id, i.seller_id, i.searchable_id, i.amount, i.currency, i.type,
                   i.external_id, i.created_at, i.metadata,
                   p.id as payment_id, p.amount as payment_amount, p.currency as payment_currency,
                   p.status as payment_status, p.created_at as payment_created_at, p.metadata as payment_metadata,
                   s.searchable_data
            FROM invoice i 
            JOIN payment p ON i.id = p.invoice_id 
            JOIN searchables s ON i.searchable_id = s.searchable_id
            WHERE {where_clause}
            AND p.status = 'complete'
            ORDER BY p.created_at DESC
        """
        
        execute_sql(cur, query)
        results = cur.fetchall()

        payments = []
        
        for result in results:
            (invoice_id, buyer_id, seller_id, searchable_id, invoice_amount, invoice_currency, invoice_type,
             external_id, invoice_created_at, invoice_metadata,
             payment_id, payment_amount, payment_currency, payment_status, payment_created_at, payment_metadata,
             searchable_data) = result
            
            # Calculate invoice details to get the seller's share
            try:
                # Get selections from invoice metadata
                selections = invoice_metadata.get('selections', [])
                
                if selections and searchable_data:
                    invoice_details = calc_invoice(searchable_data, selections)
                    description = invoice_details.get("description", "")
                else:
                    description = invoice_metadata.get('description', '')
                
                # Create payment record
                payment_public = {
                    'item': str(searchable_id),
                    'id': external_id,
                    'currency': invoice_currency,
                    'description': description,
                    'status': payment_status,
                    'timestamp': payment_metadata.get('timestamp', int(payment_created_at.timestamp())),
                    'tracking': payment_metadata.get('tracking', ''),
                    'rating': payment_metadata.get('rating', ''),
                    'review': payment_metadata.get('review', ''),
                    'amount': float(invoice_amount),
                    'selections': selections  # Include selections in the payment data
                }

                payment_private = {
                    'buyer_id': str(buyer_id),
                    'seller_id': str(seller_id),
                }
                
                payment = {
                    'public': payment_public,
                    'private': payment_private
                }
                
                payments.append(payment)
                
            except Exception as calc_error:
                print(f"Error processing receipt for invoice {invoice_id}: {str(calc_error)}")
        
        cur.close()
        conn.close()
        
        return payments
    except Exception as e:
        print(f"Error retrieving receipts: {str(e)}")
        return []

def get_balance_by_currency(user_id):
    """
    Get user balance from payments and withdrawals using new table structure
    """
    try:
        balance_by_currency = {
            'sats': 0,
            'usdt': 0,
        }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        print(f"Calculating balance for user_id: {user_id}")
        
        # Get all searchables published by this user
        execute_sql(cur, f"""SELECT s.searchable_id, s.searchable_data FROM searchables s WHERE s.terminal_id = {user_id};""")
        searchable_results = cur.fetchall()
        
        for searchable in searchable_results:
            searchable_id = searchable[0]
            searchable_data = searchable[1]
            
            if not isinstance(searchable_data, dict):
                import json
                searchable_data = json.loads(searchable[1])
                
            try:
                searchable_currency = searchable_data['payloads']['public']['currency'].lower()
                
                # Get paid invoices for this searchable (seller earnings)
                execute_sql(cur, f"""
                    SELECT i.amount, i.currency, i.metadata
                    FROM invoice i
                    JOIN payment p ON i.id = p.invoice_id
                    WHERE i.searchable_id = {searchable_id} 
                    AND i.seller_id = {user_id}
                    AND p.status = 'complete'
                """)
                
                paid_invoices = cur.fetchall()
                
                for invoice_result in paid_invoices:
                    amount, currency, metadata = invoice_result
                    
                    # Convert currency to standard format
                    if currency.lower() == 'sats':
                        balance_by_currency['sats'] += float(amount)
                        print(f"Added {amount} sats from searchable {searchable_id}")
                    elif currency.lower() in ['usdt', 'usd']:
                        balance_by_currency['usdt'] += float(amount)
                        print(f"Added {amount} USDT from searchable {searchable_id}")
                        
            except KeyError as ke:
                print(f"KeyError processing searchable {searchable_id}: {str(ke)}")
                continue
        
        # Subtract withdrawals
        execute_sql(cur, f"""
            SELECT amount, currency
            FROM withdrawal 
            WHERE user_id = {user_id}
            AND status IN ('complete', 'settled', 'SUCCEEDED')
        """)
        
        withdrawal_results = cur.fetchall()
        
        for withdrawal in withdrawal_results:
            amount, currency = withdrawal
            
            if amount is not None and currency is not None:
                try:
                    amount_float = float(amount)
                    if currency.lower() == 'sats':
                        balance_by_currency['sats'] -= amount_float
                        print(f"Subtracted {amount_float} sats from withdrawal")
                    elif currency.lower() in ['usdt', 'usd']:
                        balance_by_currency['usdt'] -= amount_float
                        print(f"Subtracted {amount_float} USDT from withdrawal")
                except ValueError:
                    print(f"Invalid amount format in withdrawal: {amount}")
        
        print(f"Final balance for user {user_id}: {balance_by_currency}")
        return balance_by_currency
        
    except Exception as e:
        print(f"Error calculating balance for user {user_id}: {str(e)}")
        raise e
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

def get_ratings(invoice_id=None, user_id=None):
    """
    Retrieves ratings from the rating table
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        conditions = []
        if invoice_id is not None:
            conditions.append(f"invoice_id = {invoice_id}")
        
        if user_id is not None:
            conditions.append(f"user_id = {user_id}")
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT id, invoice_id, user_id, rating, review, metadata, created_at
            FROM rating
            WHERE {where_clause}
            ORDER BY created_at DESC
        """
        
        execute_sql(cur, query)
        
        results = []
        for row in cur.fetchall():
            rating = {
                'id': row[0],
                'invoice_id': row[1],
                'user_id': row[2],
                'rating': float(row[3]),
                'review': row[4],
                'metadata': row[5],
                'created_at': row[6]
            }
            results.append(rating)
        
        cur.close()
        conn.close()
        return results
        
    except Exception as e:
        print(f"Error retrieving ratings: {str(e)}")
        return []

__all__ = [
    'get_terminal',
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
    'get_ratings'
] 