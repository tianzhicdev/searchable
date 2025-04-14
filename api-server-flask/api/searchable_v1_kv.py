from flask_restx import Resource
from flask import request
from .routes import token_required, token_optional
from .track_metrics import *
from . import rest_api
from .helper import get_db_connection, execute_sql

@rest_api.route('/api/v1/tracking', methods=['POST'])
class CreateTracking(Resource):
    """
    Creates a new tracking item
    """
    @token_required
    @track_metrics('create_tracking')
    def post(self, current_user, request_origin='unknown'):
        data = request.json
        tracking = data.get('tracking')
        
        payment_id = data.get('payment_id')
        # Validate payment_id is provided
        if not payment_id:
            return {"error": "payment_id is required"}, 400
            
        try:
            # Get database connection
            conn = get_db_connection()
            cur = conn.cursor()
            
            # First, verify that the payment exists and get the associated searchable_id
            execute_sql(cur, f"""
                SELECT DISTINCT(s.searchable_id), s.terminal_id 
                FROM kv p 
                JOIN kv i ON p.pkey = i.pkey 
                JOIN searchables s ON i.fkey = s.searchable_id::text 
                WHERE p.type = 'payment' AND p.pkey = '{payment_id}'
            """)
            
            result = cur.fetchone()
            
            if not result:
                return {"error": "Payment not found"}, 404
                
            searchable_id, terminal_id = result
            
            # Verify the current user is the owner of the searchable
            if str(terminal_id) != str(current_user.id):
                return {"error": "Unauthorized access to payment data"}, 403
            
            # Insert tracking information into the kv table
            if tracking:
                try:
                    # Insert tracking data associated with the payment_id
                    execute_sql(cur, f"""
                        UPDATE kv 
                        SET data = jsonb_set(data, '{{tracking}}', '"{tracking}"')
                        WHERE type = 'payment' AND pkey = '{payment_id}'
                    """)
                    
                    # Commit the transaction
                    conn.commit()
                    
                    print(f"Tracking information added for payment_id: {payment_id}")
                except Exception as e:
                    conn.rollback()
                    print(f"Error inserting tracking data: {str(e)}")
                    return {"error": f"Failed to update tracking information: {str(e)}"}, 500
            else:
                print(f"No tracking information provided for payment_id: {payment_id}")
            # Now that we've verified ownership, we can proceed with tracking
            
            # Close the database connection
            cur.close()
            conn.close()
            
        except Exception as e:
            print(f"Error verifying payment ownership: {str(e)}")
            return {"error": f"Database error: {str(e)}"}, 500
        

        return {"tracking": tracking}, 200


@rest_api.route('/api/v1/rating', methods=['POST'])
class RatePayment(Resource):
    """
    Allows a terminal owner to add a rating to a payment
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
            payment_id = data.get('payment_id')
            # Validate rating (assuming 1-5 scale)
            try:
                rating = int(rating)
                if rating < 0 or rating > 5:
                    return {"error": "Rating must be between 1 and 5"}, 400
            except (ValueError, TypeError):
                return {"error": "Invalid rating format"}, 400
                
            # Connect to the database
            conn = get_db_connection()
            cur = conn.cursor()
            
            # First, verify that the payment exists and get the associated searchable_id
            execute_sql(cur, f"""
                SELECT DISTINCT(s.searchable_id), s.terminal_id 
                FROM kv p 
                JOIN kv i ON p.pkey = i.pkey 
                JOIN searchables s ON i.fkey = s.searchable_id::text 
                WHERE p.type = 'payment' AND p.pkey = '{payment_id}'
            """)
            
            result = cur.fetchone()
            
            if not result:
                return {"error": "Payment not found"}, 404
                
            searchable_id, terminal_id = result
            
            # Verify the current user is the owner of the searchable
            if str(terminal_id) != str(current_user.id):
                return {"error": "Unauthorized access to payment data"}, 403
            
            # Insert rating information into the kv table
            try:
                # Update the payment record with the rating
                execute_sql(cur, f"""
                    UPDATE kv 
                    SET data = jsonb_set(
                        jsonb_set(data, '{{rating}}', '{rating}'),
                        '{{review}}', '"{review}"'
                        )
                    WHERE type = 'payment' AND pkey = '{payment_id}'
                """)
                
                # Commit the transaction
                conn.commit()
                
                print(f"Rating information added for payment_id: {payment_id}")
            except Exception as e:
                conn.rollback()
                print(f"Error inserting rating data: {str(e)}")
                return {"error": f"Failed to update rating information: {str(e)}"}, 500
            
            # Close the database connection
            cur.close()
            conn.close()
            
            return {"success": True, "rating": rating}, 200
            
        except Exception as e:
            print(f"Error processing rating: {str(e)}")
            return {"error": f"Server error: {str(e)}"}, 500


