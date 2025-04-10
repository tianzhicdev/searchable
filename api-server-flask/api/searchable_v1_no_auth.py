import os
import time
from functools import wraps

import requests
from flask import request
from flask_restx import Resource
from prometheus_client import Counter, Histogram

import stripe
stripe.api_key = os.getenv('STRIPE_API_KEY')

from . import rest_api
from .helper import (
    get_db_connection,
    check_payment, 
    check_stripe_payment,
    Json,
)

from .track_metrics import *

@rest_api.route('/api/v1/check-payment/<string:invoice_id>', methods=['GET'])
class CheckPayment(Resource):
    """
    Checks the status of a payment via BTCPay Server
    """
    @track_metrics('check_payment')
    def get(self, invoice_id, request_origin='unknown'):
        try:
            # Use our helper function to check payment status
            invoice_data = check_payment(invoice_id)
            
            if "error" in invoice_data:
                return invoice_data, 500
                
            # Return the payment status to the client
            return invoice_data, 200
            
        except Exception as e:
            print(f"Error checking payment status: {str(e)}")
            return {"error": str(e)}, 500


@rest_api.route('/api/v1/refresh-payment', methods=['POST'])
class RefreshPayment(Resource):
    """
    Refreshes the payment status for a given invoice_id or session_id
    """
    @track_metrics('refresh_payment')
    def post(self, request_origin='unknown'):
        data = request.json
        
        if not data:
            return {"error": "No data provided"}, 400
            
        invoice_type = data.get('invoice_type')
        
        if not invoice_type:
            return {"error": "invoice_type is required"}, 400
            
        if invoice_type == 'lightning':
            invoice_id = data.get('invoice_id')
            if not invoice_id:
                return {"error": "invoice_id is required for lightning payments"}, 400
                
            # Use our helper function to check lightning payment status
            invoice_data = check_payment(invoice_id)
            return invoice_data, 200
            
        elif invoice_type == 'stripe':
            session_id = data.get('session_id')
            if not session_id:
                return {"error": "session_id is required for stripe payments"}, 400
                
            # Use our helper function to check stripe payment status
            payment_data = check_stripe_payment(session_id)
            return payment_data, 200
            
        else:
            return {"error": "Invalid invoice_type. Must be 'lightning' or 'stripe'"}, 400


@rest_api.route('/api/v1/create-checkout-session', methods=['POST'])
class CreateCheckoutSession(Resource):
    @track_metrics('create_checkout_session')
    def post(self, request_origin='unknown'):
        # Get the request data
        data = request.get_json()
  
        # Extract name and amount from the request data
        name = data.get('name', 'Product')
        amount = data.get('amount', 2000)  # Default to 2000 cents ($20.00) if not provided
        
        # Ensure amount is an integer (Stripe requires amount in cents)
        try:
            amount = int(amount)
        except (ValueError, TypeError):
            return {"error": "Invalid amount format"}, 400
        session = stripe.checkout.Session.create(
            line_items=[{
            'price_data': {
                'currency': 'usd',
                'product_data': {
                'name': name,
                },
                'unit_amount': amount,
            },
            'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:4242/success',
            cancel_url='http://localhost:4242/cancel',
        )
        print('stripe session: ', session)

        return {
            'url': session.url
        }, 200


# BTC price cache
btc_price_cache = {
    'price': None,
    'timestamp': 0
}

@rest_api.route('/api/v1/get-btc-price', methods=['GET'])
class GetBtcPrice(Resource):
    """
    Retrieves the current BTC price in USD with caching
    """
    @track_metrics('get_btc_price')
    def get(self, request_origin='unknown'):
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
