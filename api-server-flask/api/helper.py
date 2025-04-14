import paramiko
import json
import os
import requests
import time
from psycopg2.extras import Json
import psycopg2
import stripe

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

def get_data_from_kv(type=None, pkey=None, fkey=None):
    """
    Retrieves data from the key-value store based on specified parameters
    
    Args:
        type: The type of data to retrieve (required) - can be a single value or list
        pkey: The primary key to filter by (optional) - can be a single value or list
        fkey: The foreign key to filter by (optional) - can be a single value or list
        
    Returns:
        List of data records matching the criteria, or empty list if none found
    """
    try:
        if not type:
            print("Error: type parameter is required for get_data_from_kv")
            return []
        
        # Build query dynamically based on provided parameters
        query = "SELECT data, pkey, fkey FROM kv WHERE "
        
        # Handle type parameter (single value or list)
        if isinstance(type, list):
            if not type:  # Empty list check
                print("Error: type list cannot be empty")
                return []
            type_values = "', '".join([str(t) for t in type])
            query += f"type IN ('{type_values}')"
        else:
            query += f"type = '{type}'"
        
        # Handle pkey parameter (single value or list)
        if pkey:
            if isinstance(pkey, list):
                if pkey:  # Only if list is not empty
                    pkey_values = "', '".join([str(p) for p in pkey])
                    query += f" AND pkey IN ('{pkey_values}')"
            else:
                query += f" AND pkey = '{pkey}'"
        
        # Handle fkey parameter (single value or list)
        if fkey:
            if isinstance(fkey, list):
                if fkey:  # Only if list is not empty
                    fkey_values = "', '".join([str(f) for f in fkey])
                    query += f" AND fkey IN ('{fkey_values}')"
            else:
                query += f" AND fkey = '{fkey}'"
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Execute the query with string interpolation
        execute_sql(cur, query)
        
        results = []
        for row in cur.fetchall():
            data = row[0].copy() if row[0] else {}  # Make a copy to avoid modifying the original
            data['pkey'] = row[1]
            data['fkey'] = row[2]
            results.append(data)
            
        cur.close()
        conn.close()
        
        return results
    except Exception as e:
        print(f"Error retrieving data from KV store: {str(e)}")
        return []

def get_balance_by_currency(user_id):
    """
    Get user balance from payments and withdrawals
    """
    try:
        balance_by_currency = {
            'sats': 0,
            'usdt': 0,
        }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        print(f"Calculating balance for user_id: {user_id}")
        
        execute_sql(cur, f"""SELECT s.searchable_id, s.searchable_data FROM searchables s WHERE s.terminal_id = {user_id};""")
        searchable_results = cur.fetchall()
        
        for searchable in searchable_results:
            searchable_id = searchable[0]
            searchable_data = searchable[1]
            
            if not isinstance(searchable_data, dict):
                searchable_data = json.loads(searchable[1])
                
            try:
                searchable_currency = searchable_data['payloads']['public']['currency'].lower()
                
                execute_sql(cur, f"""
                    SELECT i.data 
                    FROM kv i
                    JOIN kv p ON i.pkey = p.pkey AND p.type = 'payment' AND (LOWER(p.data->>'status') = 'complete' OR LOWER(p.data->>'status') = 'settled')
                    WHERE i.type = 'invoice' AND i.fkey = '{searchable_id}'
                """)
                invoice_results = cur.fetchall()
                
                for invoice_result in invoice_results:
                    invoice_data = invoice_result[0]
                    if invoice_data and 'selections' in invoice_data:
                        selections = invoice_data['selections']
                        
                        calculated_invoice = calc_invoice(searchable_data, selections)
                        
                        if searchable_currency == 'sats':
                            balance_by_currency['sats'] += calculated_invoice['amount_sats']
                            print(f"Added {calculated_invoice['amount_sats']} sats from searchable {searchable_id}")
                        elif searchable_currency == 'usdt':
                            balance_by_currency['usdt'] += calculated_invoice['amount_usd_cents'] / 100  # Convert cents to dollars
                            print(f"Added {calculated_invoice['amount_usd_cents'] / 100} USDT from searchable {searchable_id}")
            except KeyError as ke:
                print(f"KeyError processing searchable {searchable_id}: {str(ke)}")
                continue
        
        execute_sql(cur, f"""
            SELECT data->>'user_id' as user_id, data->>'amount' as amount, data->>'currency' as currency, pkey as withdraw_id 
            FROM kv 
            WHERE type = 'withdrawal' AND data->>'user_id' = '{user_id}'
        """)
        
        withdrawal_results = cur.fetchall()
        
        for withdrawal in withdrawal_results:
            amount = withdrawal[1]
            currency = withdrawal[2]
            withdraw_id = withdrawal[3]
            
            if amount is not None and currency is not None:
                try:
                    amount_float = float(amount)
                    if currency in balance_by_currency:
                        balance_by_currency[currency] -= amount_float
                        print(f"Subtracted {amount_float} {currency} from withdrawal {withdraw_id}")
                    else:
                        print(f"Unknown currency in withdrawal {withdraw_id}: {currency}")
                except ValueError:
                    print(f"Invalid amount format in withdrawal {withdraw_id}: {amount}")
        
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
            
            # Get the searchable_id from the invoice record
            invoice_records = get_data_from_kv(type='invoice', pkey=invoice_id)
            
            if invoice_records:
                invoice_record = invoice_records[0]
                searchable_id = invoice_record.get('fkey')
                
                # Store payment record
                payment_record = {
                    "amount": int(invoice_data.get('amount', invoice_record.get('amount', 0))),
                    "status": 'complete',
                    "buyer_id": invoice_record.get('buyer_id', 'unknown'),
                    "timestamp": int(time.time()),
                    "searchable_id": str(searchable_id),
                    "address": invoice_record.get('address', ''),
                    "tel": invoice_record.get('tel', ''),
                    "description": invoice_record.get('description', ''),
                    "buyer_paid_amount": int(invoice_record.get('amount', 0)),
                    "buyer_paid_currency": 'sats',
                }
                
                conn = get_db_connection()
                cur = conn.cursor()
                execute_sql(cur, f"""
                    INSERT INTO kv (type, pkey, fkey, data)
                    VALUES ('payment', '{invoice_id}', '{searchable_id}', {Json(payment_record)})
                    ON CONFLICT (type, pkey, fkey) 
                    DO NOTHING
                """, commit=True, connection=conn)
                cur.close()
                conn.close()
        
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
            # Get the invoice record from our database
            invoice_records = get_data_from_kv(type='invoice', pkey=session_id)
            
            if invoice_records:
                invoice_record = invoice_records[0]
                searchable_id = invoice_record.get('fkey')
                
                # Store payment record
                payment_record = {
                    "amount": invoice_record['amount'],  # Will raise KeyError if amount doesn't exist
                    "status": "complete",
                    "buyer_id": invoice_record.get('buyer_id', 'unknown'),
                    "timestamp": int(time.time()),
                    "searchable_id": str(searchable_id),
                    "address": invoice_record.get('address', ''),
                    "tel": invoice_record.get('tel', ''),
                    "payment_type": "stripe",
                    "description": invoice_record.get('description', ''),
                    "buyer_paid_amount": invoice_record['amount'],
                    "buyer_paid_currency": 'usdt',
                }
                
                conn = get_db_connection()
                cur = conn.cursor()
                execute_sql(cur, f"""
                    INSERT INTO kv (type, pkey, fkey, data)
                    VALUES ('payment', '{session_id}', '{searchable_id}', {Json(payment_record)})
                    ON CONFLICT (type, pkey, fkey) 
                    DO NOTHING
                """, commit=True, connection=conn)
                cur.close()
                conn.close()
        
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
    Retrieves payment receipts for a user or a specific searchable item
    
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
            where_conditions.append(f"(s.terminal_id = '{user_id}' OR p.data->>'buyer_id' = '{user_id}')")
        if searchable_id:
            where_conditions.append(f"s.searchable_id = '{searchable_id}'")
            
        where_clause = " AND ".join(where_conditions)

        seller_query = f"""
            SELECT s.searchable_id, 
                    s.searchable_data as searchable_data,
                    i.pkey as id, 
                    s.searchable_data->'payloads'->'public'->>'currency' as currency, 
                    i.data->'selections' AS selections, 
                    p.data->>'status' as status,
                    p.data as payment_data,
                    p.data->>'timestamp' as timestamp,
                    p.data->>'buyer_id' as buyer_id,
                    s.terminal_id as seller_id,
                    p.data->>'tracking' as tracking,
                    p.data->>'rating' as rating,
                    p.data->>'review' as review,
                    s.terminal_id as seller_id
            FROM searchables s 
            JOIN kv i ON s.searchable_id::text = i.fkey 
            JOIN kv p ON i.pkey = p.pkey 
            WHERE i.type = 'invoice' 
            AND p.type = 'payment' 
            AND {where_clause}
            AND (p.data->>'status' = 'complete' OR p.data->>'status' = 'Settled')
        """
        execute_sql(cur, seller_query)
        seller_results = cur.fetchall()

        payments = []
        
        for result in seller_results:
            searchable_id, searchable_data, invoice_id, currency, selections, status, payment_data, timestamp, buyer_id, seller_id, tracking, rating, review, seller_id = result
            
            # Calculate invoice details to get the seller's share
            try:
                invoice_details = calc_invoice(searchable_data, selections)
                
                # Create payment record with seller information
                payment_public = {
                    'item': str(searchable_id),
                    'id': invoice_id,
                    'currency': currency,
                    'description': invoice_details.get("description", ""),
                    'status': status,
                    'timestamp': payment_data.get('timestamp', ''),
                    'tracking': payment_data.get('tracking', ''),
                    'rating': payment_data.get('rating', ''),
                    'review': payment_data.get('review', ''),
                }

                if currency == 'usdt':
                    payment_public['amount'] = invoice_details.get("amount_usd", 0)
                elif currency == 'sats':
                    payment_public['amount'] = invoice_details.get("amount_sats", 0)
                
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
                print(f"Error calculating invoice details for searchable {searchable_id}: {str(calc_error)}")
        
        cur.close()
        conn.close()
        
        return payments
    except Exception as e:
        print(f"Error retrieving receipts: {str(e)}")
        return []

