import os
import json
import time
import paramiko
import requests
import stripe
from psycopg2.extras import Json
from .database import get_db_connection, execute_sql
from .logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'payment_helpers.log')

# Environment variables
stripe.api_key = os.environ.get('STRIPE_API_KEY')
PASSWORD = os.environ.get('BTCPAY_SERVER_SSH_PASSWORD')
HOST = "generous-purpose.metalseed.io"
BTC_PAY_URL = "https://generous-purpose.metalseed.io"
STORE_ID = os.environ.get('BTCPAY_STORE_ID', "")
BTCPAY_SERVER_GREENFIELD_API_KEY = os.environ.get('BTCPAY_SERVER_GREENFIELD_API_KEY', '')

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

def calc_invoice(searchable_data, selections):
    """
    Calculate invoice details based on searchable data and user selections
    
    Args:
        searchable_data (dict): The data for the searchable item
        selections (list): List of selected items with quantities
        
    Returns:
        dict: Contains total_price, currency, amount_sats, amount_usd_cents, and description details
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

def create_lightning_invoice(amount):
    """
    Creates a Lightning Network invoice via BTCPay Server
    """
    try:
        # Prepare payload for BTCPay Server
        payload = {
            "amount": amount,
            "currency": "SATS",
            "metadata": {},
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
            return {"error": f"Failed to create invoice: {response.text}"}
            
        invoice_data = response.json()
        logger.info(f"Created lightning invoice: {json.dumps(invoice_data, indent=2)}")
        
        return {"id": invoice_data['id'], "checkoutLink": invoice_data['checkoutLink']}
        
    except Exception as e:
        return {"error": str(e)}

def decode_lightning_invoice(invoice):
    """
    Decode a Lightning Network invoice without paying it.
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

def get_amount_to_withdraw(invoice):
    """Get amount from lightning invoice for withdrawal"""
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

__all__ = [
    'get_btc_price',
    'calc_invoice', 
    'create_lightning_invoice',
    'decode_lightning_invoice',
    'pay_lightning_invoice',
    'get_amount_to_withdraw'
] 