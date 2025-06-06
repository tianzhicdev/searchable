# Payment routes
import os
import stripe
from flask import request
from flask_restx import Resource

# Import from our new structure
from .. import rest_api
from .auth import token_required, token_optional
from ..common.metrics import track_metrics
from ..common.data_helpers import (
    check_payment, 
    check_stripe_payment,
    get_searchable,
    get_terminal,
    create_invoice,
    get_invoices
)
from ..common.payment_helpers import (
    get_btc_price,
    calc_invoice,
    create_lightning_invoice
)
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'payment.log')

stripe.api_key = os.getenv('STRIPE_API_KEY')

def validate_payment_request(data):
    """Validate payment request data"""
    if not data:
        raise ValueError("Request data is missing")     
        
    if 'searchable_id' not in data:
        raise ValueError("searchable_id is required")
        
    if 'invoice_type' not in data:
        raise ValueError("invoice_type is required")

    if 'selections' not in data:
        raise ValueError("selections is required")
    
    # Validate invoice_type if present
    invoice_type = data.get('invoice_type')
    if invoice_type and invoice_type not in ['lightning', 'stripe']:
        raise ValueError("Invalid invoice_type. Must be 'lightning' or 'stripe'")
    
    return {
        'invoice_type': invoice_type, 
        'searchable_id': data['searchable_id'],
        'selections': data['selections']
    }

def get_delivery_info(require_address, current_user):
    """Get delivery information if required"""
    if str(require_address).lower() == 'true':
        if current_user:
            return get_terminal(current_user.id)
        else:
            raise ValueError("User is not authenticated")
    else:
        return {}

def insert_invoice_record(buyer_id, seller_id, searchable_id, amount, currency, invoice_type, external_id, metadata):
    """Insert an invoice record into the database"""
    try:
        invoice = create_invoice(
            buyer_id=buyer_id,
            seller_id=seller_id,
            searchable_id=searchable_id,
            amount=amount,
            currency=currency,
            invoice_type=invoice_type,
            external_id=external_id,
            metadata=metadata
        )
        
        if invoice:
            logger.info(f"Invoice created with ID: {invoice['id']}")
            return invoice
        else:
            logger.error("Failed to create invoice")
            return None
            
    except Exception as e:
        logger.error(f"Error inserting invoice record: {str(e)}")
        return None

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
            logger.error(f"Error checking payment status: {str(e)}")
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

@rest_api.route('/api/v1/refresh-payments-by-searchable/<searchable_id>', methods=['GET'])
class RefreshPaymentsBySearchable(Resource):
    """
    Refreshes the payment status for all invoices associated with a searchable item
    """
    @track_metrics('refresh_payments_by_searchable')
    def get(self, searchable_id, request_origin='unknown'):
        try:
            # Get all invoices for this searchable_id
            invoices = get_invoices(searchable_id=searchable_id)
            
            if not invoices:
                return {"message": "No invoices found for this searchable item"}, 200
            
            results = []
            
            # Process each invoice
            for invoice in invoices:
                invoice_id = invoice['id']
                external_id = invoice['external_id']
                invoice_type = invoice['type']
                
                # Determine invoice type and check payment status
                if invoice_type == 'lightning':
                    payment_status = check_payment(external_id)
                    results.append({
                        "invoice_id": external_id,
                        "type": "lightning",
                        "status": payment_status.get('status', 'unknown'),
                        "data": payment_status
                    })
                elif invoice_type == 'stripe':
                    payment_status = check_stripe_payment(external_id)
                    results.append({
                        "invoice_id": external_id,
                        "type": "stripe",
                        "status": payment_status.get('status', 'unknown'),
                        "data": payment_status
                    })
            
            return {"searchable_id": searchable_id, "payments": results}, 200
            
        except Exception as e:
            logger.error(f"Error refreshing payments for searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500

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

@rest_api.route('/api/v1/get-btc-price', methods=['GET'])
class GetBtcPrice(Resource):
    """
    Retrieves the current BTC price in USD with caching
    """
    @track_metrics('get_btc_price')
    def get(self, request_origin='unknown'):
        try:
            btc_price_response, status_code = get_btc_price()
            return btc_price_response, status_code
        except Exception as e:
            logger.error(f"Error fetching BTC price: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/create-invoice', methods=['POST'])
class CreateInvoiceV1(Resource):
    """
    Creates a payment invoice - either Lightning Network or Stripe
    
    Supports both authenticated users and visitors
    """
    @token_optional
    @track_metrics('create_invoice_v1')
    def post(self, current_user=None, visitor_id=None, request_origin='unknown'):
        try:
            # ======= validation =======
            data = request.get_json()
            
            # Validate payment request
            validation_result = validate_payment_request(data)
            
            # ======= extract validated data =======
            buyer_id = current_user.id if current_user else visitor_id
            searchable_id = validation_result['searchable_id']
            invoice_type = validation_result['invoice_type']
            selections = validation_result['selections']
            
            # Get the searchable data
            searchable_data = get_searchable(searchable_id)

            require_address = searchable_data.get('payloads', {}).get('public', {}).get('require_address', False)
            # Print require_address and searchable_data for debugging
            logger.debug(f"require_address: {require_address}")
            logger.debug(f"searchable_data: {searchable_data}")
            delivery_info = get_delivery_info(require_address, current_user)
            
            # Get seller_id from searchable data
            seller_id = searchable_data.get('terminal_id')
            if not seller_id:
                return {"error": "Invalid searchable item - missing seller information"}, 400
            
            # Calculate invoice details using our new function
            invoice_details = calc_invoice(searchable_data, selections)
            
            amount_sats = invoice_details["amount_sats"]
            amount_usd_cents = invoice_details["amount_usd_cents"]
            description = invoice_details["description"]

            # ======= end of get searchable data =======
            
            if invoice_type == 'lightning':
                response = create_lightning_invoice(amount=amount_sats)
                logger.info(f"lightning invoice creation response: {response}")

                # Check if invoice ID exists
                if 'id' not in response:
                    return {"error": "failed to create invoice, please try again later"}, 500
                
                # Store invoice record metadata
                invoice_metadata = {
                    "address": delivery_info.get('address', ''),
                    "tel": delivery_info.get('tel', ''),
                    "description": description,
                    "selections": selections,
                }
                
                # Use the helper function to insert the record
                invoice_record = insert_invoice_record(
                    buyer_id=buyer_id,
                    seller_id=seller_id, 
                    searchable_id=searchable_id,
                    amount=amount_sats,
                    currency='sats',
                    invoice_type='lightning',
                    external_id=response['id'],
                    metadata=invoice_metadata
                )
                
                if not invoice_record:
                    return {"error": "Failed to create invoice record"}, 500
                
                return response, 200
                
            elif invoice_type == 'stripe':
                # Process Stripe checkout
                success_url = data.get('success_url')
                cancel_url = data.get('cancel_url')
                # Get item name
                item_name = searchable_data.get('payloads', {}).get('public', {}).get('title', f'Item #{searchable_id}')
                # Create Stripe checkout session
                amount_usd_cents_with_fee = int(amount_usd_cents * 1.035)
                session = stripe.checkout.Session.create(
                    line_items=[{
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': item_name, 
                            },
                            'unit_amount': amount_usd_cents_with_fee,
                        },
                        'quantity': 1,
                    }],
                    mode='payment',
                    success_url=success_url,
                    cancel_url=cancel_url,
                )
                
                # Store invoice record metadata
                invoice_metadata = {
                    "address": delivery_info.get('address', ''),
                    "tel": delivery_info.get('tel', ''),
                    "description": description,
                    "selections": selections,
                }
                
                # Use the helper function to insert the record
                invoice_record = insert_invoice_record(
                    buyer_id=buyer_id,
                    seller_id=seller_id,
                    searchable_id=searchable_id,
                    amount=amount_usd_cents_with_fee/100,
                    currency='usdt',
                    invoice_type='stripe',
                    external_id=session.id,
                    metadata=invoice_metadata
                )
                
                if not invoice_record:
                    return {"error": "Failed to create invoice record"}, 500
                
                return {
                    'url': session.url,
                    'session_id': session.id
                }, 200
            else:
                return {"error": "Invalid invoice type. Must be 'lightning' or 'stripe'"}, 400
            
        except Exception as e:
            logger.error(f"Error creating invoice: {str(e)}")
            return {"error": str(e)}, 500 