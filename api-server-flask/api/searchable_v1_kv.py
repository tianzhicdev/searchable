from flask_restx import Resource
from flask import request
from .routes import token_required, token_optional
from .track_metrics import *
from . import rest_api
from .helper import (
    get_db_connection, 
    execute_sql, 
    setup_logger,
    get_invoices,
    get_payments,
    update_payment_metadata,
    create_rating
)

# Set up the logger
logger = setup_logger(__name__, 'searchable_v1_kv.log')

@rest_api.route('/api/v1/tracking', methods=['POST'])
class CreateTracking(Resource):
    """
    Creates or updates tracking information for a payment
    """
    @token_required
    @track_metrics('create_tracking')
    def post(self, current_user, request_origin='unknown'):
        data = request.json
        tracking = data.get('tracking')
        
        payment_id = data.get('payment_id')  # This is external_id (BTCPay/Stripe ID)
        # Validate payment_id is provided
        if not payment_id:
            return {"error": "payment_id is required"}, 400
            
        try:
            # Get the invoice using external_id
            invoice_records = get_invoices(external_id=payment_id)
            
            if not invoice_records:
                return {"error": "Invoice not found"}, 404
                
            invoice_record = invoice_records[0]
            
            # Verify the current user is the seller (owner of the searchable)
            if str(invoice_record['seller_id']) != str(current_user.id):
                return {"error": "Unauthorized access to payment data"}, 403
            
            # Get the payment record
            payments = get_payments(invoice_id=invoice_record['id'])
            
            if not payments:
                return {"error": "Payment not found"}, 404
                
            payment_record = payments[0]
            
            # Update tracking information in payment metadata
            if tracking:
                metadata_updates = {'tracking': tracking}
                success = update_payment_metadata(payment_record['id'], metadata_updates)
                
                if success:
                    logger.info(f"Tracking information added for payment_id: {payment_id}")
                    return {"tracking": tracking}, 200
                else:
                    logger.error(f"Error updating tracking data for payment_id: {payment_id}")
                    return {"error": "Failed to update tracking information"}, 500
            else:
                logger.warning(f"No tracking information provided for payment_id: {payment_id}")
                return {"error": "No tracking information provided"}, 400
                
        except Exception as e:
            logger.error(f"Error verifying payment ownership: {str(e)}")
            return {"error": f"Database error: {str(e)}"}, 500


@rest_api.route('/api/v1/rating', methods=['POST'])
class RatePayment(Resource):
    """
    Allows a seller to add a rating to a payment
    """
    @token_required
    @track_metrics('rate_payment')
    def post(self, current_user, request_origin='unknown'):
        try:
            # Get the rating from the request
            data = request.get_json()
            if not data or 'rating' not in data or 'review' not in data or 'payment_id' not in data:
                return {"error": "Rating, review, and payment_id are required"}, 400
                
            rating = data.get('rating')
            review = data.get('review')
            payment_id = data.get('payment_id')  # This is external_id (BTCPay/Stripe ID)
            
            # Validate rating (assuming 0-5 scale)
            try:
                rating = float(rating)
                if rating < 0 or rating > 5:
                    return {"error": "Rating must be between 0 and 5"}, 400
            except (ValueError, TypeError):
                return {"error": "Invalid rating format"}, 400
            
            # Get the invoice using external_id
            invoice_records = get_invoices(external_id=payment_id)
            
            if not invoice_records:
                return {"error": "Invoice not found"}, 404
                
            invoice_record = invoice_records[0]
            
            # Verify the current user is the seller (owner of the searchable)
            if str(invoice_record['seller_id']) != str(current_user.id):
                return {"error": "Unauthorized access to payment data"}, 403
            
            # Create rating record
            rating_record = create_rating(
                invoice_id=invoice_record['id'],
                user_id=current_user.id,
                rating=rating,
                review=review
            )
            
            if rating_record:
                logger.info(f"Rating created for payment_id: {payment_id}")
                return {"success": True, "rating": rating, "rating_id": rating_record['id']}, 200
            else:
                logger.error(f"Error creating rating for payment_id: {payment_id}")
                return {"error": "Failed to create rating"}, 500
            
        except Exception as e:
            logger.error(f"Error processing rating: {str(e)}")
            return {"error": f"Server error: {str(e)}"}, 500


