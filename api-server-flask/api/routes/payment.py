# Payment routes
import os
import stripe
from flask import request
from flask_restx import Resource
import time

# Import from our new structure
from .. import rest_api
from .auth import token_required, token_optional
from ..common.metrics import track_metrics
from ..common.data_helpers import (
    check_payment, 
    refresh_stripe_payment,
    get_searchable,
    get_terminal,
    create_invoice,
    create_payment,
    update_payment_status,
    get_invoices,
    get_user_paid_files
)
from ..common.payment_helpers import (
    create_stripe_checkout_session,
    verify_stripe_payment,
    calc_invoice
)
from ..common.models import PaymentStatus, PaymentType, Currency
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
    if invoice_type and invoice_type not in ['stripe']:
        raise ValueError("Invalid invoice_type. Must be 'stripe'")
    
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
    """Insert an invoice record and corresponding unpaid payment record into the database"""
    try:
        # Create the invoice record
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
            
            # Create corresponding unpaid payment record
            payment_metadata = {
                "address": metadata.get('address', ''),
                "tel": metadata.get('tel', ''),
                "description": metadata.get('description', ''),
                "selections": metadata.get('selections', []),
                "timestamp": int(time.time())
            }
            
            payment = create_payment(
                invoice_id=invoice['id'],
                amount=amount,
                currency=currency,
                payment_type=invoice_type,
                external_id=external_id,
                metadata=payment_metadata,
            )
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
    Checks the status of a Stripe payment
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
            
        if invoice_type == 'stripe':
            session_id = data.get('session_id')
            if not session_id:
                return {"error": "session_id is required for stripe payments"}, 400
                
            # Use our helper function to check stripe payment status
            payment_data = refresh_stripe_payment(session_id)
            return payment_data, 200
            
        else:
            return {"error": "Invalid invoice_type. Must be 'stripe'"}, 400

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
                
                # Check payment status for Stripe payments only
                if invoice_type == 'stripe':
                    payment_status = refresh_stripe_payment(external_id)
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
        logger.info(f'Stripe session created: {session.id}')

        return {
            'url': session.url
        }, 200


@rest_api.route('/api/v1/create-invoice', methods=['POST'])
class CreateInvoiceV1(Resource):
    """
    Creates a payment invoice using Stripe
    
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
            
            # Calculate invoice details
            invoice_details = calc_invoice(searchable_data, selections)
            
            amount_usd_cents = invoice_details["amount_usd_cents"]
            description = invoice_details["description"]

            # Process Stripe checkout (USD only)
            if invoice_type == 'stripe':
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
                            'currency': Currency.USD.value,
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
                    currency=Currency.USD.value,
                    invoice_type=PaymentType.STRIPE.value,
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
                return {"error": "Invalid invoice type. Must be 'stripe'"}, 400
            
        except Exception as e:
            logger.error(f"Error creating invoice: {str(e)}")
            return {"error": str(e)}, 500 

@rest_api.route('/api/v1/user-paid-files/<searchable_id>', methods=['GET'])
class UserPaidFiles(Resource):
    """
    Get the files that the current user has paid for in a searchable item
    """
    @token_optional
    @track_metrics('user_paid_files')
    def get(self, searchable_id, current_user=None, visitor_id=None, request_origin='unknown'):
        try:
            # Get user ID - use account user ID if available, otherwise use visitor ID
            user_id = current_user.id if current_user else visitor_id
            
            if not user_id:
                return {"error": "User authentication required"}, 401
            
            # Get the files this user has paid for
            paid_file_ids = get_user_paid_files(user_id, searchable_id)
            
            return {
                "searchable_id": searchable_id,
                "user_id": str(user_id),
                "paid_file_ids": list(paid_file_ids)
            }, 200
            
        except Exception as e:
            logger.error(f"Error getting user paid files for searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500


@rest_api.route('/api/v1/test/complete-payment', methods=['POST'])
class TestCompletePayment(Resource):
    """
    Test endpoint to directly mark a payment as complete (for integration testing)
    This simulates what background.py would do when processing payments
    """
    @track_metrics('test_complete_payment')
    def post(self, request_origin='unknown'):
        try:
            data = request.get_json()
            
            if not data:
                return {"error": "No data provided"}, 400
            
            session_id = data.get('session_id')
            test_uuid = data.get('test_uuid')
            
            if not session_id:
                return {"error": "session_id is required"}, 400
            
            # Find the invoice with this session_id
            from ..common.database import get_db_connection, execute_sql
            from ..common.models import PaymentStatus
            import json
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get the invoice
            execute_sql(cur, """
                SELECT i.id, i.buyer_id, i.seller_id, i.searchable_id, i.amount, i.currency, i.metadata
                FROM invoice i 
                WHERE i.external_id = %s AND i.type = 'stripe'
            """, params=(session_id,))
            
            invoice_row = cur.fetchone()
            if not invoice_row:
                cur.close()
                conn.close()
                return {"error": "Invoice not found"}, 404
            
            invoice_id, buyer_id, seller_id, searchable_id, amount, currency, metadata = invoice_row
            
            # Check if payment already exists
            execute_sql(cur, """
                SELECT id, status FROM payment WHERE invoice_id = %s
            """, params=(invoice_id,))
            
            existing_payment = cur.fetchone()
            
            if existing_payment:
                payment_id, current_status = existing_payment
                if current_status == PaymentStatus.COMPLETE.value:
                    cur.close()
                    conn.close()
                    return {
                        "message": "Payment already completed",
                        "invoice_id": invoice_id,
                        "payment_id": payment_id
                    }, 200
            
            # Create or update payment record
            payment_metadata = {
                "test_completion": True,
                "test_uuid": test_uuid,
                "completed_via_api": True,
                "timestamp": int(time.time())
            }
            
            if existing_payment:
                # Update existing payment
                payment_id = existing_payment[0]
                execute_sql(cur, """
                    UPDATE payment 
                    SET status = %s, metadata = %s
                    WHERE id = %s
                """, params=(PaymentStatus.COMPLETE.value, json.dumps(payment_metadata), payment_id))
            else:
                # Create new payment record
                execute_sql(cur, """
                    INSERT INTO payment (invoice_id, amount, currency, type, external_id, status, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, params=(invoice_id, amount, currency, 'stripe', session_id, PaymentStatus.COMPLETE.value, json.dumps(payment_metadata)))
                
                payment_result = cur.fetchone()
                payment_id = payment_result[0] if payment_result else None
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info(f"Test payment completion: session_id={session_id}, invoice_id={invoice_id}, payment_id={payment_id}")
            
            return {
                "success": True,
                "message": "Payment marked as complete",
                "invoice_id": invoice_id,
                "payment_id": payment_id,
                "session_id": session_id,
                "test_uuid": test_uuid
            }, 200
            
        except Exception as e:
            logger.error(f"Error in test payment completion: {str(e)}")
            return {"error": str(e)}, 500 