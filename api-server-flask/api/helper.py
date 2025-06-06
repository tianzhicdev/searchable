import paramiko
import json
import os
import requests
import time
from psycopg2.extras import Json
import psycopg2
import stripe
import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler

def setup_logger(name, log_file, level=logging.INFO):
    """Function to set up a logger with both file and console output
    
    Args:
        name (str): Name of the logger
        log_file (str): Name of the log file
        level (int): Logging level
        
    Returns:
        logging.Logger: Configured logger instance
    """
    # Create logs directory if it doesn't exist
    log_dir = Path('/logs')
    if not log_dir.exists():
        log_dir.mkdir(parents=True, exist_ok=True)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Setup file handler for the logger (using rotating file handler to avoid huge log files)
    file_handler = RotatingFileHandler(
        f'/logs/{log_file}', 
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    
    # Setup console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Setup logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Add handlers if they don't exist yet
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    return logger

# Create a logger for this file
logger = setup_logger(__name__, 'helper.log')

stripe.api_key = os.environ.get('STRIPE_API_KEY')
# Moved get_db_connection from routes.py
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', ''),
        port=os.getenv('DB_PORT', ''),
        dbname=os.getenv('DB_NAME', ''),
        user=os.getenv('DB_USERNAME', ''),
        password=os.getenv('DB_PASS', '')
    )
    
    # Log connection details
    with conn.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user, inet_client_addr(), inet_client_port()")
        connection_details = cursor.fetchone()
        print(f"Connected to database: {connection_details[0]}")
        print(f"Connected as user: {connection_details[1]}")
        print(f"Client address: {connection_details[2]}")
        print(f"Client port: {connection_details[3]}")
    return conn

PASSWORD = os.environ.get('BTCPAY_SERVER_SSH_PASSWORD')
HOST = "generous-purpose.metalseed.io"

BTC_PAY_URL = "https://generous-purpose.metalseed.io"
STORE_ID = os.environ.get('BTCPAY_STORE_ID', "")
BTCPAY_SERVER_GREENFIELD_API_KEY = os.environ.get('BTCPAY_SERVER_GREENFIELD_API_KEY', '')

def calc_invoice(searchable_data, selections):
    """
    Calculate invoice details based on searchable data and user selections
    
    Args:
        searchable_data (dict): The data for the searchable item
        selections (list): List of selected items with quantities
        
    Returns:
        dict: Contains total_price, currency, amount_sats, amount_usd_cents, and description details
        
    Raises:
        ValueError: If there are invalid selections or currency
        KeyError: If required data is missing
        Exception: For any other errors during calculation
    """
    description_parts = []
    amount = 0
    
    if not searchable_data:
        raise ValueError("Searchable data is missing or empty")
    
    # Check if we have selections and selectables
    selectables = searchable_data.get('payloads', {}).get('public', {}).get('selectables', [])
    
    # Get currency from searchable data, default to "sat" if not specified
    currency = searchable_data.get('payloads', {}).get('public', {}).get('currency', 'sats')
    
    if currency.lower() not in ['sats', 'usdt']:
        raise ValueError(f"Invalid currency: {currency}")
    
    if selections and selectables:
        # Create maps for efficient lookup
        selectable_prices = {item['id']: item['price'] for item in selectables}
        selectable_names = {item['id']: item['name'] for item in selectables}
        
        # Calculate total from selections
        for selection in selections:
            selectable_id = selection.get('id')
            if selectable_id is None:
                raise ValueError("Selection missing required 'id' field")
                
            try:
                quantity = int(selection.get('quantity', 0))
                if quantity <= 0:
                    raise ValueError(f"Invalid quantity for item {selectable_id}: {quantity}")
            except (ValueError, TypeError):
                raise ValueError(f"Invalid quantity format for item {selectable_id}")
            
            if selectable_id in selectable_prices:
                item_price = selectable_prices[selectable_id]
                amount += item_price * quantity
                
                # Add description part for this item
                item_name = selectable_names.get(selectable_id, f"Item {selectable_id}")
                description_parts.append(f"[{item_name}]({quantity})@{item_price}{currency}")
            else:
                raise ValueError(f"Invalid selectable ID: {selectable_id}")
    else:
        raise ValueError("Invalid selections or selectables")
    
    # Create the complete description string
    description = "/".join(description_parts)
    
    # Calculate both sats and USD amounts regardless of currency
    if currency.lower() == 'sats':
        amount_sats = amount
        # Convert sats to USD_CENTS using BTC price
        btc_price_response, status_code = get_btc_price()
        if status_code != 200:
            raise ValueError(f"Failed to get BTC price: {btc_price_response.get('error', 'Unknown error')}")
            
        if 'price' in btc_price_response:
            # Convert satoshis to BTC (1 BTC = 100,000,000 sats)
            btc_amount = amount / 100000000
            # Convert BTC to USD cents
            amount_usd_cents = btc_amount * btc_price_response['price'] * 100
        else:
            raise ValueError("BTC price data is missing")
    elif currency.lower() == 'usdt':
        amount_usd_cents = amount * 100
        # Convert USD_CENTS to sats using BTC price
        btc_price_response, status_code = get_btc_price()
        if status_code != 200:
            raise ValueError(f"Failed to get BTC price: {btc_price_response.get('error', 'Unknown error')}")
            
        if 'price' in btc_price_response:
            # Convert USD cents to USD
            usd_amount = amount 
            # Convert USD to BTC
            btc_amount = usd_amount / btc_price_response['price']
            # Convert BTC to satoshis
            amount_sats = int(btc_amount * 100000000)
        else:
            raise ValueError("BTC price data is missing")
    else:
        raise ValueError(f"Invalid currency: {currency}")
    
    return {
        "total_price": amount,
        "currency": currency,
        "amount_sats": amount_sats,
        "amount_usd_cents": amount_usd_cents,
        "amount_usd": round(amount_usd_cents/100, 2),
        "description": description
    }

def execute_sql(cursor, sql, commit=False, connection=None):
    """
    Execute SQL with logging and return results if applicable
    """
    print(f"Executing SQL: {sql.replace(chr(10), ' ')}")
    cursor.execute(sql)
    if commit and connection:
        connection.commit()
    return cursor

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

def get_invoices(buyer_id=None, seller_id=None, searchable_id=None, external_id=None, status=None):
    """
    Retrieves invoices from the invoice table based on specified parameters
    
    Args:
        buyer_id: Filter by buyer ID (optional)
        seller_id: Filter by seller ID (optional)
        searchable_id: Filter by searchable item ID (optional)
        external_id: Filter by external ID (BTCPay/Stripe ID) (optional)
        status: Filter by status (optional)
        
    Returns:
        List of invoice records matching the criteria
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
    
    Args:
        invoice_id: Filter by specific invoice ID (optional)
        invoice_ids: Filter by list of invoice IDs (optional)
        status: Filter by payment status (optional)
        
    Returns:
        List of payment records matching the criteria
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
    
    Args:
        user_id: Filter by user ID (optional)
        status: Filter by withdrawal status (optional)
        currency: Filter by currency (optional)
        
    Returns:
        List of withdrawal records matching the criteria
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
    
    Args:
        buyer_id: ID of the buyer
        seller_id: ID of the seller  
        searchable_id: ID of the searchable item
        amount: Invoice amount
        currency: Currency (sats, usdt)
        invoice_type: Type of invoice (lightning, stripe)
        external_id: External invoice ID (BTCPay, Stripe)
        metadata: Additional metadata (optional)
        
    Returns:
        dict: Created invoice record or None if failed
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
    
    Args:
        invoice_id: ID of the associated invoice
        amount: Payment amount
        currency: Currency (sats, usdt)
        payment_type: Type of payment (lightning, stripe)
        external_id: External payment ID (optional)
        metadata: Additional metadata (optional)
        
    Returns:
        dict: Created payment record or None if failed
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

def create_withdrawal(user_id, amount, currency, withdrawal_type, external_id=None, metadata=None):
    """
    Creates a new withdrawal record
    
    Args:
        user_id: ID of the user
        amount: Withdrawal amount
        currency: Currency (sats, usdt)
        withdrawal_type: Type of withdrawal (lightning, bank_transfer)
        external_id: External transaction ID (optional)
        metadata: Additional metadata (optional)
        
    Returns:
        dict: Created withdrawal record or None if failed
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

def decode_lightning_invoice(invoice):
    """
    Decode a Lightning Network invoice without paying it.
    
    Args:
        invoice (str): The Lightning Network invoice to decode
        
    Returns:
        dict: JSON response containing decoded invoice details
    """
    try:
        # Set up SSH client
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Connect to the remote host
        client.connect(HOST, username='root', password=PASSWORD)
        
        # Command to decode the invoice
        command = f"docker exec -i btcpayserver_lnd_bitcoin lncli --macaroonpath=/data/admin.macaroon --network=mainnet decodepayreq {invoice} --json"
        
        # Execute the command
        stdin, stdout, stderr = client.exec_command(command)
        
        # Get the output
        response = stdout.read().decode('utf-8')
        # Print the response for debugging
        print(f"Lightning invoice decode response: {response}")
        error = stderr.read().decode('utf-8')
        
        # Close the connection
        client.close()
        
        if error:
            print(f"Lightning invoice decode error: {error}")
            return {"error": error}
        
        # Parse the JSON response
        return json.loads(response)
    
    except Exception as e:
        print(f"Exception decoding invoice: {str(e)}")
        return {"error": str(e)}

def pay_lightning_invoice(invoice):
    """
    Pay a Lightning Network invoice remotely on the specified host and return the payment result.
    
    Args:
        invoice (str): The Lightning Network invoice to pay
        
    Returns:
        dict: JSON response from the payment command
    """
    try:
        # Set up SSH client
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Connect to the remote host
        client.connect(HOST, username='root', password=PASSWORD)
        
        # Command to pay the invoice
        command = f"docker exec -i btcpayserver_lnd_bitcoin lncli --macaroonpath=/data/admin.macaroon --network=mainnet payinvoice {invoice} -f --json --fee_limit 2000"
        
        # Execute the command
        stdin, stdout, stderr = client.exec_command(command)
        
        # Get the output
        response = stdout.read().decode('utf-8')
        # Print the response for debugging
        print(f"Lightning payment response: {response}")
        error = stderr.read().decode('utf-8')
        
        # Close the connection
        client.close()
        
        if error:
            print(f"Lightning payment error: {error}")
            return {"error": error}
        
        # Parse the JSON response
        return json.loads(response)
    
    except Exception as e:
        return {"error": str(e)}

def check_payment(invoice_id):
    """
    Checks the status of a payment via BTCPay Server and updates the database if settled.
    
    Args:
        invoice_id (str): The BTCPay invoice ID to check
        
    Returns:
        dict: Response from BTCPay Server with payment status
    """
    try:
        
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
        
        # If payment is settled, record it in our database
        if invoice_data['status'].lower() in ('settled', 'complete'):
            
            # Get the invoice record from our database using external_id
            invoice_records = get_invoices(external_id=invoice_id)
            
            if invoice_records:
                invoice_record = invoice_records[0]
                
                # Check if payment already exists
                existing_payments = get_payments(invoice_id=invoice_record['id'])
                
                if not existing_payments:
                    # Create payment record
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


def check_stripe_payment(session_id):
    """
    Checks the status of a Stripe payment session and records it in the database if successful
    
    Args:
        session_id (str): The Stripe checkout session ID to check
        
    Returns:
        dict: The payment status information
    """
    try:
        # Retrieve the checkout session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(session_id)
        # Log the checkout session for debugging
        print(f"Stripe checkout session: {checkout_session}")
        
        # Get payment status
        payment_status = checkout_session.payment_status
        
        # If payment is successful, record it in our database
        if payment_status == 'paid' or payment_status == 'complete':
            # Get the invoice record from our database using external_id
            invoice_records = get_invoices(external_id=session_id)
            
            if invoice_records:
                invoice_record = invoice_records[0]
                
                # Check if payment already exists
                existing_payments = get_payments(invoice_id=invoice_record['id'])
                
                if not existing_payments:
                    # Create payment record
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




def create_lightning_invoice(amount):
    """
    Creates a Lightning Network invoice via BTCPay Server and records it in the database
    
    Args:
        amount (int/str): Amount in sats
        searchable_id (str/int): ID of the searchable item
        buyer_id (str): ID of the buyer (can be user ID or visitor ID)
        address (str, optional): Shipping address
        tel (str, optional): Contact telephone number
        redirect_url (str, optional): URL to redirect after payment
        
    Returns:
        tuple: (invoice_data, status_code) - The invoice data from BTCPay and HTTP status code
    """
    try:
        # Prepare payload for BTCPay Server
        payload = {
            "amount": amount,
            "currency": "SATS",
            "metadata": {
            },
            "checkout": {
                "expirationMinutes": 60,
                "monitoringMinutes": 60,
                "paymentMethods": ["BTC-LightningNetwork"],
                "redirectURL": ""
            }
        }
        
        response = requests.post(
            f"{BTC_PAY_URL}/api/v1/stores/{STORE_ID}/invoices",
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'token {BTCPAY_SERVER_GREENFIELD_API_KEY}'
            }
        )
        
        if response.status_code != 200:
            return {"error": f"Failed to create invoice: {response.text}"}, 500
            
        invoice_data = response.json()
        # Log raw invoice data for debugging purposes
        print(f"Raw invoice data: {json.dumps(invoice_data, indent=2)}")
        
        return {"id": invoice_data['id'], "checkoutLink": invoice_data['checkoutLink']}
        
    except Exception as e:
        return {"error": str(e)}

def get_withdrawal_timestamp(status_list):
    """Extract the timestamp from withdrawal status entries"""
    try:
        # Example status_list: [["pending", 1743532517], ["SUCCEEDED", 1743532625]]
        if not status_list:
            return 0
        return min([status[1] for status in status_list if len(status) > 1], default=0)
    except Exception:
        return 0

def get_withdrawal_status(status_list):
    """Extract the latest status from withdrawal status entries"""
    try:
        # Example status_list: [["pending", 1743532517], ["SUCCEEDED", 1743532625]]
        # Sort by timestamp (second element in each status entry)
        sorted_statuses = sorted(status_list, key=lambda x: x[1] if len(x) > 1 else 0)
        # Get the last (most recent) status
        latest_statuses = sorted_statuses[-1:] if sorted_statuses else []
        # Extract the status string (first element)
        return next(iter([status[0] for status in latest_statuses]), '')
    except Exception:
        return ''



# BTC price cache
btc_price_cache = {
    'price': None,
    'timestamp': 0
}

def get_btc_price():
    """
    Retrieves the current BTC price in USD with caching
    Returns a tuple of (response_data, status_code)
    """
    try:
        current_time = int(time.time())
        cache_ttl = 600  # 10 minutes in seconds
        
        # Check if we have a cached price that's still valid
        if btc_price_cache['price'] and (current_time - btc_price_cache['timestamp'] < cache_ttl):
            return {
                'price': btc_price_cache['price'],
                'cached': True,
                'cache_time': btc_price_cache['timestamp']
            }, 200
        
        # If no valid cache, fetch new price
        response = requests.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        )
        
        if response.status_code == 200:
            data = response.json()
            if data and 'bitcoin' in data and 'usd' in data['bitcoin']:
                btc_price = data['bitcoin']['usd']
                
                # Update cache
                btc_price_cache['price'] = btc_price
                btc_price_cache['timestamp'] = current_time
                
                return {
                    'price': btc_price,
                    'cached': False
                }, 200
            else:
                return {"error": "Invalid response format from price API"}, 500
        else:
            return {"error": f"Failed to fetch BTC price: {response.status_code}"}, response.status_code
            
    except Exception as e:
        print(f"Error fetching BTC price: {str(e)}")
        return {"error": str(e)}, 500

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

                # Decode the invoice to get the amount
def get_amount_to_withdraw(invoice):
    try:
        # Use our decode function to get invoice details without paying
        decoded_invoice = decode_lightning_invoice(invoice)
        if 'error' in decoded_invoice:
            raise Exception(f"Failed to decode invoice: {decoded_invoice['error']}")
        
        # Check if num_satoshis exists in the decoded invoice
        if 'num_satoshis' not in decoded_invoice:
            raise Exception("Invoice missing amount information")
            
        # Get amount in satoshis from decoded invoice
        return int(decoded_invoice['num_satoshis'])
    except Exception as e:
        raise Exception(f"Invalid invoice format or unable to decode: {str(e)}")
    

def get_receipts(user_id=None, searchable_id=None):
    """
    Retrieves payment receipts for a user or a specific searchable item using new table structure
    
    Args:
        user_id (str, optional): The ID of the user to get receipts for
        searchable_id (str, optional): The ID of the searchable item to get receipts for
        
    Returns:
        list: A list of payment objects with public and private data
        
    Note:
        At least one of user_id or searchable_id must be provided
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
                    'amount': float(invoice_amount)
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

def create_rating(invoice_id, user_id, rating, review=None, metadata=None):
    """
    Creates a new rating record
    
    Args:
        invoice_id: ID of the associated invoice
        user_id: ID of the user creating the rating
        rating: Rating value (0-5)
        review: Review text (optional)
        metadata: Additional metadata (optional)
        
    Returns:
        dict: Created rating record or None if failed
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        metadata = metadata or {}
        
        execute_sql(cur, f"""
            INSERT INTO rating (invoice_id, user_id, rating, review, metadata)
            VALUES ({invoice_id}, {user_id}, {rating}, '{review or ''}', {Json(metadata)})
            RETURNING id, invoice_id, user_id, rating, review, metadata, created_at
        """, commit=True, connection=conn)
        
        row = cur.fetchone()
        
        rating_record = {
            'id': row[0],
            'invoice_id': row[1],
            'user_id': row[2],
            'rating': float(row[3]),
            'review': row[4],
            'metadata': row[5],
            'created_at': row[6]
        }
        
        cur.close()
        conn.close()
        return rating_record
        
    except Exception as e:
        print(f"Error creating rating: {str(e)}")
        return None

def get_ratings(invoice_id=None, user_id=None):
    """
    Retrieves ratings from the rating table
    
    Args:
        invoice_id: Filter by invoice ID (optional)
        user_id: Filter by user ID (optional)
        
    Returns:
        List of rating records matching the criteria
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

def create_invoice_note(invoice_id, user_id, buyer_seller, content, metadata=None):
    """
    Creates a new invoice note record
    
    Args:
        invoice_id: ID of the associated invoice
        user_id: ID of the user creating the note
        buyer_seller: 'buyer' or 'seller'
        content: Note content
        metadata: Additional metadata (optional)
        
    Returns:
        dict: Created note record or None if failed
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        metadata = metadata or {}
        
        execute_sql(cur, f"""
            INSERT INTO invoice_note (invoice_id, user_id, buyer_seller, content, metadata)
            VALUES ({invoice_id}, {user_id}, '{buyer_seller}', '{content}', {Json(metadata)})
            RETURNING id, invoice_id, user_id, buyer_seller, content, metadata, created_at
        """, commit=True, connection=conn)
        
        row = cur.fetchone()
        
        note = {
            'id': row[0],
            'invoice_id': row[1],
            'user_id': row[2],
            'buyer_seller': row[3],
            'content': row[4],
            'metadata': row[5],
            'created_at': row[6]
        }
        
        cur.close()
        conn.close()
        return note
        
    except Exception as e:
        print(f"Error creating invoice note: {str(e)}")
        return None

def get_invoice_notes(invoice_id=None, user_id=None):
    """
    Retrieves invoice notes from the invoice_note table
    
    Args:
        invoice_id: Filter by invoice ID (optional)
        user_id: Filter by user ID (optional)
        
    Returns:
        List of note records matching the criteria
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
            SELECT id, invoice_id, user_id, buyer_seller, content, metadata, created_at
            FROM invoice_note
            WHERE {where_clause}
            ORDER BY created_at DESC
        """
        
        execute_sql(cur, query)
        
        results = []
        for row in cur.fetchall():
            note = {
                'id': row[0],
                'invoice_id': row[1],
                'user_id': row[2],
                'buyer_seller': row[3],
                'content': row[4],
                'metadata': row[5],
                'created_at': row[6]
            }
            results.append(note)
        
        cur.close()
        conn.close()
        return results
        
    except Exception as e:
        print(f"Error retrieving invoice notes: {str(e)}")
        return []

def update_payment_metadata(payment_id, metadata_updates):
    """
    Updates payment metadata (for tracking, etc.)
    
    Args:
        payment_id: ID of the payment to update
        metadata_updates: Dictionary of metadata updates
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get current metadata
        execute_sql(cur, f"SELECT metadata FROM payment WHERE id = {payment_id}")
        result = cur.fetchone()
        
        if not result:
            return False
        
        current_metadata = result[0] or {}
        updated_metadata = {**current_metadata, **metadata_updates}
        
        execute_sql(cur, f"""
            UPDATE payment 
            SET metadata = {Json(updated_metadata)}
            WHERE id = {payment_id}
        """, commit=True, connection=conn)
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error updating payment metadata: {str(e)}")
        return False

def update_withdrawal_status(withdrawal_id, status, metadata_updates=None):
    """
    Updates withdrawal status
    
    Args:
        withdrawal_id: ID of the withdrawal to update
        status: New status
        metadata_updates: Optional metadata updates
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if metadata_updates:
            # Get current metadata and update it
            execute_sql(cur, f"SELECT metadata FROM withdrawal WHERE id = {withdrawal_id}")
            result = cur.fetchone()
            
            if result:
                current_metadata = result[0] or {}
                updated_metadata = {**current_metadata, **metadata_updates}
                
                execute_sql(cur, f"""
                    UPDATE withdrawal 
                    SET status = '{status}', metadata = {Json(updated_metadata)}
                    WHERE id = {withdrawal_id}
                """, commit=True, connection=conn)
            else:
                return False
        else:
            execute_sql(cur, f"""
                UPDATE withdrawal 
                SET status = '{status}'
                WHERE id = {withdrawal_id}
            """, commit=True, connection=conn)
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error updating withdrawal status: {str(e)}")
        return False

