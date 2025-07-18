# Payment routes
import os
import stripe
from flask import request
from flask_restx import Resource
import time

# Import from our new structure
from .. import rest_api
from .auth import token_required
from ..common.metrics import track_metrics
from ..common.data_helpers import (
    check_payment, 
    refresh_stripe_payment,
    get_searchable,
    create_invoice,
    create_payment,
    update_payment_status,
    get_invoices,
    get_user_paid_files
)
from ..common.database_context import database_cursor, database_transaction, db
from ..common.payment_helpers import (
    calc_invoice,
    create_balance_invoice_and_payment,
    validate_balance_payment
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
    if invoice_type and invoice_type not in ['stripe', 'balance']:
        raise ValueError("Invalid invoice_type. Must be 'stripe' or 'balance'")
    
    return {
        'invoice_type': invoice_type, 
        'searchable_id': data['searchable_id'],
        'selections': data['selections']
    }


def enrich_selections_for_receipt(searchable_data, selections):
    """Enrich selections with item names and prices for receipt display"""
    try:
        enriched_selections = []
        public_data = searchable_data.get('payloads', {}).get('public', {})
        searchable_type = public_data.get('type', 'downloadable')
        
        if searchable_type == 'allinone':
            # Handle allinone type with components
            components = public_data.get('components', {})
            
            for sel in selections:
                component = sel.get('component')
                
                if component == 'downloadable':
                    files = components.get('downloadable', {}).get('files', [])
                    file_data = next((f for f in files if str(f.get('id')) == str(sel.get('id'))), None)
                    if file_data:
                        enriched_selections.append({
                            'id': sel.get('id'),
                            'name': file_data.get('name', 'Digital File'),
                            'price': float(file_data.get('price', 0)),
                            'count': sel.get('count', 1),
                            'type': 'downloadable'
                        })
                
                elif component == 'offline':
                    items = components.get('offline', {}).get('items', [])
                    item_data = next((i for i in items if str(i.get('id')) == str(sel.get('id'))), None)
                    if item_data:
                        enriched_selections.append({
                            'id': sel.get('id'),
                            'name': item_data.get('name', 'Physical Item'),
                            'price': float(item_data.get('price', 0)),
                            'count': sel.get('count', 1),
                            'type': 'offline'
                        })
                
                elif component == 'donation':
                    enriched_selections.append({
                        'id': 'donation',
                        'name': 'Support Creator',
                        'price': float(sel.get('amount', 0)),
                        'count': 1,
                        'type': 'donation'
                    })
        
        else:
            # Handle legacy searchable types
            if searchable_type == 'downloadable':
                files = public_data.get('downloadableFiles', [])
                for sel in selections:
                    file_data = next((f for f in files if str(f.get('fileId')) == str(sel.get('id'))), None)
                    if file_data:
                        enriched_selections.append({
                            'id': sel.get('id'),
                            'name': file_data.get('name', 'File'),
                            'price': float(file_data.get('price', 0)),
                            'count': sel.get('count', 1),
                            'type': 'downloadable'
                        })
                    else:
                        # Fallback if file not found
                        enriched_selections.append({
                            'id': sel.get('id'),
                            'name': f'File {sel.get("id")}',
                            'price': 0,
                            'count': sel.get('count', 1),
                            'type': 'downloadable'
                        })
            
            elif searchable_type == 'offline':
                items = public_data.get('offlineItems', [])
                for sel in selections:
                    item_data = next((i for i in items if str(i.get('itemId')) == str(sel.get('id'))), None)
                    if item_data:
                        enriched_selections.append({
                            'id': sel.get('id'),
                            'name': item_data.get('name', 'Item'),
                            'price': float(item_data.get('price', 0)),
                            'count': sel.get('count', 1),
                            'type': 'offline'
                        })
                    else:
                        # Fallback if item not found
                        enriched_selections.append({
                            'id': sel.get('id'),
                            'name': f'Item {sel.get("id")}',
                            'price': 0,
                            'count': sel.get('count', 1),
                            'type': 'offline'
                        })
            
            elif searchable_type == 'direct':
                # Direct payment selections (donations)
                for sel in selections:
                    enriched_selections.append({
                        'id': sel.get('id', 'donation'),
                        'name': 'Donation',
                        'price': float(sel.get('amount', 0)),
                        'count': sel.get('count', 1),
                        'type': 'donation'
                    })
        
        return enriched_selections
        
    except Exception as e:
        logger.error(f"Error enriching selections: {str(e)}")
        # Return original selections as fallback
        return selections


def insert_invoice_record(buyer_id, seller_id, searchable_id, amount, platform_fee, stripe_fee, currency, invoice_type, external_id, metadata):
    """Insert an invoice record and corresponding unpaid payment record into the database"""
    try:
        # Add fees to metadata for reference
        invoice_metadata = metadata.copy()
        invoice_metadata['stripe_fee'] = stripe_fee
        
        # Create the invoice record with platform fee
        invoice = create_invoice(
            buyer_id=buyer_id,
            seller_id=seller_id,
            searchable_id=searchable_id,
            amount=amount,
            fee=platform_fee,  # Platform fee (0.1%)
            currency=currency,
            invoice_type=invoice_type,
            external_id=external_id,
            metadata=invoice_metadata
        )
        
        if invoice:
            logger.info(f"Invoice created with ID: {invoice['id']}, amount: {amount}, platform_fee: {platform_fee}")
            
            # Create corresponding unpaid payment record
            # Payment amount includes the Stripe fee that user pays
            payment_amount = amount + stripe_fee
            
            payment_metadata = {
                "address": metadata.get('address', ''),
                "tel": metadata.get('tel', ''),
                "description": metadata.get('description', ''),
                "selections": metadata.get('selections', []),
                "timestamp": int(time.time())
            }
            
            payment = create_payment(
                invoice_id=invoice['id'],
                amount=payment_amount,  # Total amount user pays (including Stripe fee)
                fee=stripe_fee,         # Stripe fee
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



@rest_api.route('/api/v1/create-invoice', methods=['POST'])
class CreateInvoiceV1(Resource):
    """
    Creates a payment invoice using Stripe
    
    Supports both authenticated users and visitors
    """
    @token_required
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

            # Terminal table removed - delivery info no longer needed
            delivery_info = {}
            
            # Get seller_id from searchable data
            seller_id = searchable_data.get('user_id')
            if not seller_id:
                return {"error": "Invalid searchable item - missing seller information"}, 400
            
            # Calculate invoice details
            invoice_details = calc_invoice(searchable_data, selections)
            
            total_amount_usd = invoice_details["total_amount_usd"]
            description = invoice_details["description"]

            # Process Stripe checkout (USD only)
            if invoice_type == 'stripe':
                # Process Stripe checkout
                success_url = data.get('success_url')
                cancel_url = data.get('cancel_url')
                # Get item name
                item_name = searchable_data.get('payloads', {}).get('public', {}).get('title', f'Item #{searchable_id}')
                
                # Calculate fees
                # Platform fee: 0.1% of the total amount
                platform_fee = total_amount_usd * 0.001  # 0.1%
                
                # Stripe fee: 3.5% of total amount (which user pays on top)
                stripe_fee = total_amount_usd * 0.035  # 3.5%
                
                # Amount user pays = total + stripe fee
                amount_to_charge = total_amount_usd + stripe_fee
                
                # Create Stripe checkout session
                session = stripe.checkout.Session.create(
                    line_items=[{
                        'price_data': {
                            'currency': Currency.USD.value,
                            'product_data': {
                                'name': item_name, 
                            },
                            'unit_amount': int(amount_to_charge * 100), # stripe uses cents
                        },
                        'quantity': 1,
                    }],
                    mode='payment',
                    success_url=success_url,
                    cancel_url=cancel_url,
                )
                
                # Store invoice record metadata with enriched selections
                enriched_selections = enrich_selections_for_receipt(searchable_data, selections)
                invoice_metadata = {
                    "address": delivery_info.get('address', ''),
                    "tel": delivery_info.get('tel', ''),
                    "description": description,
                    "selections": enriched_selections,
                }
                
                # Use the helper function to insert the record
                # Invoice.amount = total price, Invoice.fee = platform fee (0.1%)
                invoice_record = insert_invoice_record(
                    buyer_id=buyer_id,
                    seller_id=seller_id,
                    searchable_id=searchable_id,
                    amount=total_amount_usd,  # Original amount without any fees
                    platform_fee=platform_fee,  # 0.1% platform fee
                    stripe_fee=stripe_fee,      # 3.5% Stripe fee (for reference)
                    currency=Currency.USD.value,
                    invoice_type=PaymentType.STRIPE.value,
                    external_id=session.id,
                    metadata=invoice_metadata
                )
                
                if not invoice_record:
                    return {"error": "Failed to create invoice record"}, 500
                
                return {
                    'url': session.url,
                    'session_id': session.id,
                    'invoice_id': invoice_record['id'],
                    'amount': total_amount_usd,
                    'platform_fee': platform_fee,
                    'stripe_fee': stripe_fee,
                    'total_charged': amount_to_charge
                }, 200
            else:
                return {"error": "Invalid invoice type. Must be 'stripe'"}, 400
            
        except Exception as e:
            logger.error(f"Error creating invoice: {str(e)}")
            return {"error": str(e)}, 500 


@rest_api.route('/api/v1/create-balance-invoice', methods=['POST'])
class CreateBalanceInvoiceV1(Resource):
    """
    Create an invoice that will be paid using account balance.
    Balance payments are processed instantly with no external payment processing.
    """
    require_auth = True  # Enable authentication
    @token_required
    @track_metrics('create_balance_invoice')
    def post(self, current_user=None, visitor_id=None, request_origin='unknown'):
        try:
            logger.info("CreateBalanceInvoiceV1 called")
            
            # Get user ID - must be authenticated for balance payments
            buyer_id = current_user.id if current_user else None
            
            if not buyer_id:
                return {"error": "Authentication required for balance payments"}, 401
            
            # Parse request data
            data = request.get_json()
            
            try:
                validated_data = validate_payment_request(data)
            except ValueError as e:
                logger.error(f"Validation error: {str(e)}")
                return {"error": str(e)}, 400
            
            searchable_id = validated_data['searchable_id']
            selections = validated_data['selections']
            
            # Get searchable data
            searchable_data = get_searchable(searchable_id)
            
            if not searchable_data:
                return {"error": "Searchable item not found"}, 404
            
            # Get seller ID from searchable data
            seller_id = searchable_data.get('user_id')
            
            if not seller_id:
                return {"error": "Invalid searchable item - no seller found"}, 400
            
            # Calculate invoice details
            invoice_details = calc_invoice(searchable_data, selections)
            
            if not invoice_details:
                return {"error": "Failed to calculate invoice"}, 400
            
            total_amount = invoice_details['amount_usd']
            description = invoice_details.get('description', 'Balance Payment')
            
            # Validate user has sufficient balance
            balance_check = validate_balance_payment(buyer_id, total_amount, Currency.USD.value)
            
            if not balance_check['valid']:
                return {
                    "error": "Insufficient balance",
                    "balance": balance_check['balance'],
                    "required": balance_check['required'],
                    "currency": balance_check['currency']
                }, 400
            
            # Get delivery info if provided
            delivery_info = data.get('delivery_info', {})
            
            # Prepare metadata with enriched selections
            enriched_selections = enrich_selections_for_receipt(searchable_data, selections)
            metadata = {
                "address": delivery_info.get('address', ''),
                "tel": delivery_info.get('tel', ''),
                "description": description,
                "selections": enriched_selections,
                "payment_method": "balance"
            }
            
            # Create balance invoice and payment atomically
            result = create_balance_invoice_and_payment(
                buyer_id=buyer_id,
                seller_id=seller_id,
                searchable_id=searchable_id,
                amount=total_amount,
                currency=Currency.USD.value,
                metadata=metadata
            )
            
            return {
                'success': True,
                'invoice_id': result['invoice']['id'],
                'payment_id': result['payment']['id'],
                'amount': total_amount,
                'balance_remaining': balance_check['balance'] - total_amount,
                'status': 'complete'
            }, 200
            
        except ValueError as e:
            logger.error(f"Balance payment error: {str(e)}")
            return {"error": str(e)}, 400
        except Exception as e:
            logger.error(f"Unexpected error in balance payment: {str(e)}")
            return {"error": "Failed to process balance payment"}, 500


@rest_api.route('/api/v1/user-paid-files/<searchable_id>', methods=['GET'])
class UserPaidFiles(Resource):
    """
    Get the files that the current user has paid for in a searchable item
    """
    @token_required
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
            from ..common.models import PaymentStatus
            import json
            
            # Get the invoice
            invoice_row = db.fetch_one("""
                SELECT i.id, i.buyer_id, i.seller_id, i.searchable_id, i.amount, i.currency, i.metadata
                FROM invoice i 
                WHERE i.external_id = %s AND i.type = 'stripe'
            """, (session_id,))
            
            if not invoice_row:
                return {"error": "Invoice not found"}, 404
            
            invoice_id, buyer_id, seller_id, searchable_id, amount, currency, metadata = invoice_row
            
            # Check if payment already exists
            existing_payment = db.fetch_one("""
                SELECT id, status FROM payment WHERE invoice_id = %s
            """, (invoice_id,))
            
            if existing_payment:
                payment_id, current_status = existing_payment
                if current_status == PaymentStatus.COMPLETE.value:
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
                success = db.execute_update("""
                    UPDATE payment 
                    SET status = %s, metadata = %s
                    WHERE id = %s
                """, (PaymentStatus.COMPLETE.value, json.dumps(payment_metadata), payment_id))
                
                if not success:
                    return {"error": "Failed to update payment"}, 500
            else:
                # Create new payment record
                payment_result = db.execute_insert("""
                    INSERT INTO payment (invoice_id, amount, currency, type, external_id, status, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (invoice_id, amount, currency, 'stripe', session_id, PaymentStatus.COMPLETE.value, json.dumps(payment_metadata)))
                
                if not payment_result:
                    return {"error": "Failed to create payment"}, 500
                    
                payment_id = payment_result[0]
            
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