import paramiko
import json
import os
import requests
import time
from psycopg2.extras import Json
import psycopg2


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

def check_balance(user_id):
    """
    Calculate user balance from payments and withdrawals
    
    Args:
        user_id: The user ID to check balance for
        
    Returns:
        float: The user's current balance in sats
    """
    try:
        # Step 1: Get all searchables published by this user using utility function
        searchable_ids = get_searchableIds_by_user(user_id)
        
        # Step 2: Calculate balance from payments and withdrawals
        balance = 0
        
        # If user has searchables, look for payments in a single query
        if searchable_ids:
            payment_records = get_data_from_kv(type='payment', fkey=searchable_ids)
            for record in payment_records:
                amount = record.get('amount')
                # Add payment amount to balance
                if amount is not None:
                    balance += float(amount)
        
        # Get all withdrawals for this user using utility function
        withdrawal_records = get_data_from_kv(type='withdrawal', fkey=str(user_id))
        for record in withdrawal_records:
            amount = record.get('amount')
            print(f"Withdrawal amount: {amount}")
            print(f"Balance before subtraction: {balance}")
            # Subtract withdrawal amount from balance
            if amount is not None:
                balance -= float(amount)
        
        return balance
    except Exception as e:
        print(f"Error calculating balance: {str(e)}")
        return 0

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
        command = f"docker exec -i btcpayserver_lnd_bitcoin lncli --macaroonpath=/data/admin.macaroon --network=mainnet payinvoice {invoice} -f --json --fee_limit 50"
        
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
                    "status": invoice_data['status'],
                    "buyer_id": invoice_record.get('buyer_id', 'unknown'),
                    "timestamp": int(time.time()),
                    "searchable_id": str(searchable_id),
                    "address": invoice_record.get('address', ''),
                    "tel": invoice_record.get('tel', ''),
                }
                
                conn = get_db_connection()
                cur = conn.cursor()
                execute_sql(cur, f"""
                    INSERT INTO kv (type, pkey, fkey, data)
                    VALUES ('payment', '{invoice_id}', '{searchable_id}', {Json(payment_record)})
                    ON CONFLICT (type, pkey, fkey) 
                    DO UPDATE SET data = {Json(payment_record)}
                """, commit=True, connection=conn)
                cur.close()
                conn.close()
        
        # Return the payment status
        return invoice_data
        
    except Exception as e:
        print(f"Error checking payment status: {str(e)}")
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