# Rating routes
from flask import request
from flask_restx import Resource

# Import from our new structure
from .. import rest_api
from .auth import token_required
from ..common.metrics import track_metrics
from ..common.data_helpers import (
    get_searchable,
    get_terminal
)
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'ratings.log')

@rest_api.route('/api/v1/rating/can-rate/<string:invoice_id>')
class RatingEligibility(Resource):
    """
    Check if user is eligible to rate a specific invoice
    """
    @token_required
    @track_metrics('check_rating_eligibility')
    def get(self, current_user, invoice_id, request_origin='unknown'):
        try:
            from ..common.database import get_db_connection, execute_sql
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get invoice details
            execute_sql(cur, """
                SELECT i.buyer_id, i.seller_id, p.status, i.searchable_id
                FROM invoice i
                LEFT JOIN payment p ON p.invoice_id = i.id
                WHERE i.id = %s OR i.external_id = %s
            """, params=(invoice_id, invoice_id))
            
            invoice_result = cur.fetchone()
            if not invoice_result:
                cur.close()
                conn.close()
                return {"error": "Invoice not found"}, 404
                
            buyer_id, seller_id, payment_status, searchable_id = invoice_result
            
            # Check if user is buyer or seller
            if current_user.id not in [buyer_id, seller_id]:
                cur.close()
                conn.close()
                return {"error": "Access denied - not buyer or seller for this invoice"}, 403
            
            # Check if payment is complete
            if payment_status != 'complete':
                cur.close()
                conn.close()
                return {
                    "can_rate": False,
                    "eligible": False,
                    "reason": "Payment not completed"
                }, 200
            
            # Check if user has already rated this invoice
            execute_sql(cur, """
                SELECT id FROM rating
                WHERE invoice_id = (SELECT id FROM invoice WHERE id = %s OR external_id = %s)
                AND user_id = %s
            """, params=(invoice_id, invoice_id, current_user.id))
            
            existing_rating = cur.fetchone()
            
            cur.close()
            conn.close()
            
            if existing_rating:
                return {
                    "can_rate": False,
                    "eligible": False,
                    "reason": "Already rated this invoice"
                }, 200
            
            return {
                "can_rate": True,
                "eligible": True,
                "invoice_id": invoice_id,
                "searchable_id": searchable_id
            }, 200
            
        except Exception as e:
            logger.error(f"Error checking rating eligibility: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rating/submit', methods=['POST'])
class SubmitRating(Resource):
    """
    Submit a rating for an invoice
    """
    @token_required
    @track_metrics('submit_rating')
    def post(self, current_user, request_origin='unknown'):
        try:
            from ..common.database import get_db_connection, execute_sql
            import json
            
            data = request.get_json()
            if not data:
                return {"error": "No data provided"}, 400
            
            invoice_id = data.get('invoice_id')
            rating = data.get('rating')
            review = data.get('review', '')
            
            if not invoice_id:
                return {"error": "invoice_id is required"}, 400
            
            if rating is None:
                return {"error": "rating is required"}, 400
            
            # Validate rating value
            try:
                rating_value = float(rating)
                if rating_value < 0 or rating_value > 5:
                    return {"error": "Rating must be between 0 and 5"}, 400
            except (ValueError, TypeError):
                return {"error": "Rating must be a valid number"}, 400
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get invoice details and verify eligibility
            execute_sql(cur, """
                SELECT i.id, i.buyer_id, i.seller_id, p.status, i.searchable_id
                FROM invoice i
                LEFT JOIN payment p ON p.invoice_id = i.id
                WHERE i.id = %s OR i.external_id = %s
            """, params=(invoice_id, invoice_id))
            
            invoice_result = cur.fetchone()
            if not invoice_result:
                cur.close()
                conn.close()
                return {"error": "Invoice not found"}, 404
                
            actual_invoice_id, buyer_id, seller_id, payment_status, searchable_id = invoice_result
            
            # Check if user is buyer or seller
            if current_user.id not in [buyer_id, seller_id]:
                cur.close()
                conn.close()
                return {"error": "Access denied - not buyer or seller for this invoice"}, 403
            
            # Check if payment is complete
            if payment_status != 'complete':
                cur.close()
                conn.close()
                return {"error": "Payment must be completed before rating"}, 400
            
            # Check if user has already rated this invoice
            execute_sql(cur, """
                SELECT id FROM rating
                WHERE invoice_id = %s AND user_id = %s
            """, params=(actual_invoice_id, current_user.id))
            
            existing_rating = cur.fetchone()
            if existing_rating:
                cur.close()
                conn.close()
                return {"error": "You have already rated this invoice"}, 400
            
            # Insert the rating
            metadata = {
                'review': review,
                'searchable_id': searchable_id,
                'user_role': 'buyer' if current_user.id == buyer_id else 'seller'
            }
            
            execute_sql(cur, """
                INSERT INTO rating (invoice_id, user_id, rating, review, metadata)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, params=(actual_invoice_id, current_user.id, rating_value, review, json.dumps(metadata)))
            
            rating_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                "success": True,
                "rating_id": rating_id,
                "message": "Rating submitted successfully"
            }, 201
            
        except Exception as e:
            logger.error(f"Error submitting rating: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rating/searchable/<string:searchable_id>')
class SearchableRatings(Resource):
    """
    Get all ratings for a searchable item
    """
    @track_metrics('get_searchable_ratings')
    def get(self, searchable_id, request_origin='unknown'):
        try:
            from ..common.database import get_db_connection, execute_sql
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get all ratings for this searchable through completed invoices
            execute_sql(cur, """
                SELECT r.id, r.rating, r.review, r.created_at, r.metadata,
                       t.terminal_data->>'profiles'->0->>'username' as reviewer_username
                FROM rating r
                JOIN invoice i ON i.id = r.invoice_id
                JOIN payment p ON p.invoice_id = i.id
                LEFT JOIN terminal t ON t.terminal_id = r.user_id
                WHERE i.searchable_id = %s AND p.status = 'complete'
                ORDER BY r.created_at DESC
            """, params=(searchable_id,))
            
            ratings = []
            total_rating = 0
            count = 0
            
            for row in cur.fetchall():
                rating_id, rating_value, review, created_at, metadata, reviewer_username = row
                ratings.append({
                    'id': rating_id,
                    'rating': rating_value,
                    'review': review,
                    'reviewer': reviewer_username or 'Anonymous',
                    'created_at': created_at.isoformat() if created_at else None,
                    'metadata': metadata
                })
                total_rating += rating_value
                count += 1
            
            average_rating = total_rating / count if count > 0 else 0
            
            cur.close()
            conn.close()
            
            return {
                "searchable_id": searchable_id,
                "ratings": ratings,
                "average_rating": round(average_rating, 2),
                "total_ratings": count
            }, 200
            
        except Exception as e:
            logger.error(f"Error getting searchable ratings: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rating/terminal/<string:terminal_id>')
class TerminalRatings(Resource):
    """
    Get all ratings for a terminal (user)
    """
    @track_metrics('get_terminal_ratings')
    def get(self, terminal_id, request_origin='unknown'):
        try:
            from ..common.database import get_db_connection, execute_sql
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get ratings where this terminal was the seller (received ratings)
            execute_sql(cur, """
                SELECT r.id, r.rating, r.review, r.created_at, r.metadata,
                       buyer_t.terminal_data->>'profiles'->0->>'username' as reviewer_username,
                       i.searchable_id
                FROM rating r
                JOIN invoice i ON i.id = r.invoice_id
                JOIN payment p ON p.invoice_id = i.id
                LEFT JOIN terminal buyer_t ON buyer_t.terminal_id = r.user_id
                WHERE i.seller_id = %s AND p.status = 'complete'
                ORDER BY r.created_at DESC
            """, params=(terminal_id,))
            
            received_ratings = []
            total_received = 0
            received_count = 0
            
            for row in cur.fetchall():
                rating_id, rating_value, review, created_at, metadata, reviewer_username, searchable_id = row
                received_ratings.append({
                    'id': rating_id,
                    'rating': rating_value,
                    'review': review,
                    'reviewer': reviewer_username or 'Anonymous',
                    'searchable_id': searchable_id,
                    'created_at': created_at.isoformat() if created_at else None,
                    'metadata': metadata
                })
                total_received += rating_value
                received_count += 1
            
            # Get ratings where this terminal was the buyer (given ratings)
            execute_sql(cur, """
                SELECT r.id, r.rating, r.review, r.created_at, r.metadata,
                       seller_t.terminal_data->>'profiles'->0->>'username' as seller_username,
                       i.searchable_id
                FROM rating r
                JOIN invoice i ON i.id = r.invoice_id
                JOIN payment p ON p.invoice_id = i.id
                LEFT JOIN terminal seller_t ON seller_t.terminal_id = i.seller_id
                WHERE i.buyer_id = %s AND p.status = 'complete'
                ORDER BY r.created_at DESC
            """, params=(terminal_id,))
            
            given_ratings = []
            for row in cur.fetchall():
                rating_id, rating_value, review, created_at, metadata, seller_username, searchable_id = row
                given_ratings.append({
                    'id': rating_id,
                    'rating': rating_value,
                    'review': review,
                    'seller': seller_username or 'Anonymous',
                    'searchable_id': searchable_id,
                    'created_at': created_at.isoformat() if created_at else None,
                    'metadata': metadata
                })
            
            average_received = total_received / received_count if received_count > 0 else 0
            
            cur.close()
            conn.close()
            
            return {
                "terminal_id": terminal_id,
                "received_ratings": {
                    "ratings": received_ratings,
                    "average_rating": round(average_received, 2),
                    "total_count": received_count
                },
                "given_ratings": {
                    "ratings": given_ratings,
                    "total_count": len(given_ratings)
                }
            }, 200
            
        except Exception as e:
            logger.error(f"Error getting terminal ratings: {str(e)}")
            return {"error": str(e)}, 500