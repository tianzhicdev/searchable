# Searchable routes
import os
import re
import math
import requests
from flask import request
from flask_restx import Resource

# Import from our new structure
from .. import rest_api
from .auth import token_required
from ..common.metrics import track_metrics
from ..common.data_helpers import (
    get_db_connection,
    execute_sql,
    Json,
    get_searchable,
    get_searchableIds_by_user,
    get_ratings,
    get_balance_by_currency,
    get_withdrawals,
    can_user_rate_invoice,
    create_rating,
    get_invoice_notes,
    create_invoice_note,
    get_invoices_for_searchable,
    get_user_all_invoices
)
from ..common.tag_helpers import get_searchable_tags
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'searchable.log')

@rest_api.route('/api/v1/searchable/<int:searchable_id>', methods=['GET'])
class GetSearchableItem(Resource):
    """
    Retrieves a specific searchable item by its ID
    """
    @token_required
    @track_metrics('get_searchable_item_v2')
    def get(self, current_user, searchable_id, request_origin='unknown'):
        try:
            searchable_data = get_searchable(searchable_id)
            
            if not searchable_data:
                return {"error": "Searchable item not found"}, 404
            
            # Enrich with username
            self._enrich_searchable_with_username(searchable_data)
            
            # Add tags
            tags = get_searchable_tags(searchable_id)
            searchable_data['tags'] = tags
            
            return searchable_data, 200
            
        except Exception as e:
            logger.error(f"Error retrieving searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500

    def _enrich_searchable_with_username(self, searchable_data):
        """Add username and seller rating information to a single searchable item"""
        try:
            user_id = searchable_data.get('user_id')
            if not user_id:
                return
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Query username and seller rating for this user_id
            execute_sql(cur, """
                SELECT u.username,
                       COALESCE((SELECT AVG(r.rating) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.seller_id = u.id), 0) as seller_rating,
                       COALESCE((SELECT COUNT(*) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.seller_id = u.id), 0) as seller_total_ratings
                FROM users u
                WHERE u.id = %s
            """, params=(user_id,))
            
            result = cur.fetchone()
            if result:
                username, seller_rating, seller_total_ratings = result
                searchable_data['username'] = username
                searchable_data['seller_rating'] = float(seller_rating) if seller_rating else 0.0
                searchable_data['seller_total_ratings'] = seller_total_ratings or 0
            
            cur.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error enriching searchable with username and rating: {str(e)}")
            # Continue without username rather than failing

@rest_api.route('/api/v1/searchable/create', methods=['POST'])
class CreateSearchable(Resource):
    """
    Creates a new searchable item
    """
    @token_required
    @track_metrics('create_searchable_v2')
    def post(self, current_user, request_origin='unknown'):
        logger.info(f"Creating searchable for user: {current_user.id} {current_user.username}")
        conn = None
        try:
            data = request.get_json()
            if not data:
                return {"error": "Invalid input"}, 400

            conn = get_db_connection()
            cur = conn.cursor()
            
            # Add user info to the searchable data
            data['user_id'] = str(current_user.id)
            
            # Extract type from payload, default to 'downloadable' for backward compatibility
            searchable_type = data.get('payloads', {}).get('public', {}).get('type', 'downloadable')
            
            # Insert into searchables table with type field
            logger.info("Executing database insert...")
            sql = "INSERT INTO searchables (user_id, type, searchable_data) VALUES (%s, %s, %s) RETURNING searchable_id;"
            execute_sql(cur, sql, params=(current_user.id, searchable_type, Json(data)))
            searchable_id = cur.fetchone()[0]
            
            
            logger.info(f"Added searchable {searchable_id}")
            
            conn.commit()
            cur.close()
            conn.close()
            return {"searchable_id": searchable_id}, 201
        except Exception as e:
            # Enhanced error logging
            import traceback
            error_traceback = traceback.format_exc()
            logger.error(f"Error creating searchable: {str(e)}")
            logger.error(f"Traceback: {error_traceback}")
            
            # Ensure database connection is closed
            if conn:
                try:
                    conn.rollback()
                    conn.close()
                except:
                    pass
            
            return {"error": str(e), "error_details": error_traceback}, 500

@rest_api.route('/api/v1/searchable/search', methods=['GET'])
class SearchSearchables(Resource):
    """
    Search for searchable items based on query terms
    """
    @token_required
    @track_metrics('search_searchables_v2')
    def get(self, current_user, request_origin='unknown'):
        try:
            # Parse and validate request parameters
            params = self._parse_request_params()
            if 'error' in params:
                return params, 400
            
            # Query database for results with pagination
            results, total_count = self._query_database(
                params['query_term'],
                params.get('filters', {}),
                params.get('tag_ids', []),
                params['page_number'],
                params['page_size']
            )
            
            # Format and return response
            return self._format_response(results, params['page_number'], params['page_size'], total_count), 200
            
        except Exception as e:
            logger.error(f"Error in search: {str(e)}")
            return {"error": str(e)}, 500

    def _parse_request_params(self):
        """Parse and validate request parameters"""
        try:
            # Get parameters with defaults
            lat = request.args.get('lat')
            lng = request.args.get('lng')
            query_term = request.args.get('q', '')
            page_number = int(request.args.get('page', 1))
            page_size = int(request.args.get('page_size', 20))
            filters_param = request.args.get('filters', '{}')
            tags_param = request.args.get('tags', '')
            
            # Location is no longer used
            lat = lng = None
            
            # Parse filters
            try:
                import json
                filters = json.loads(filters_param)
            except json.JSONDecodeError:
                filters = {}
            
            # Parse tags from comma-separated string
            tag_ids = []
            if tags_param:
                try:
                    # Split by comma and convert to integers
                    tag_ids = [int(tag_id.strip()) for tag_id in tags_param.split(',') if tag_id.strip()]
                except ValueError:
                    # If conversion fails, try to get tags from filters
                    pass
            
            # Also check if tags are in filters (for backward compatibility)
            if 'tags' in filters and isinstance(filters['tags'], list):
                tag_ids.extend(filters['tags'])
            
            # Remove duplicates
            tag_ids = list(set(tag_ids))
            
            # Validate pagination
            if page_number < 1:
                page_number = 1
            if page_size < 1 or page_size > 100:
                page_size = 20
            
            return {
                'lat': lat,
                'lng': lng,
                'query_term': query_term,
                'page_number': page_number,
                'page_size': page_size,
                'filters': filters,
                'tag_ids': tag_ids
            }
        except Exception as e:
            return {"error": f"Parameter parsing error: {str(e)}"}


    def _query_database(self, query_term, filters={}, tag_ids=[], page_number=1, page_size=20):
        """Query database for searchable items with pagination and simple text search"""
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            # Calculate offset for pagination
            offset = (page_number - 1) * page_size
            
            # Base query with username join and ratings
            base_query = """
                SELECT DISTINCT s.searchable_id, s.type, s.searchable_data, s.user_id, 
                       u.username, s.created_at,
                       COALESCE((SELECT AVG(r.rating) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.searchable_id = s.searchable_id), 0) as avg_rating,
                       COALESCE((SELECT COUNT(*) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.searchable_id = s.searchable_id), 0) as total_ratings,
                       COALESCE((SELECT AVG(r.rating) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.seller_id = s.user_id), 0) as seller_rating,
                       COALESCE((SELECT COUNT(*) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.seller_id = s.user_id), 0) as seller_total_ratings
                FROM searchables s
                LEFT JOIN users u ON s.user_id = u.id
            """
            
            # Build WHERE conditions
            where_conditions = ["s.removed = FALSE"]
            params = []
            
            # Add simple text search condition if query_term exists
            if query_term:
                # Search in title and description using ILIKE (case-insensitive)
                where_conditions.append("""
                    (
                        s.searchable_data->'payloads'->'public'->>'title' ILIKE %s
                        OR s.searchable_data->'payloads'->'public'->>'description' ILIKE %s
                    )
                """)
                search_pattern = f"%{query_term}%"
                params.extend([search_pattern, search_pattern])
            
            # Add user_id filtering if provided in filters
            if filters.get('user_id'):
                where_conditions.append("s.user_id = %s")
                params.append(filters['user_id'])
            
            # Add tag filtering if needed
            if tag_ids:
                tag_placeholders = ','.join(['%s'] * len(tag_ids))
                where_conditions.append(f"""
                    EXISTS (
                        SELECT 1 FROM searchable_tags st 
                        WHERE st.searchable_id = s.searchable_id 
                        AND st.tag_id IN ({tag_placeholders})
                    )
                """)
                params.extend(tag_ids)
            
            # Combine conditions
            where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""
            
            # Order by created_at desc
            order_clause = "ORDER BY s.created_at DESC"
            
            # Get total count first
            count_query = f"""
                SELECT COUNT(DISTINCT s.searchable_id)
                FROM searchables s
                {where_clause}
            """
            
            execute_sql(cur, count_query, params=params)
            total_count = cur.fetchone()[0]
            
            # Get paginated results
            final_query = f"""
                {base_query}
                {where_clause}
                {order_clause}
                LIMIT %s OFFSET %s
            """
            
            params.extend([page_size, offset])
            execute_sql(cur, final_query, params=params)
            results = cur.fetchall()
            
            # Convert to list format
            items = []
            searchable_ids = []
            searchable_map = {}
            
            for result in results:
                searchable_id, searchable_type, searchable_data, user_id, username, created_at, avg_rating, total_ratings, seller_rating, seller_total_ratings = result
                searchable_ids.append(searchable_id)
                searchable_map[searchable_id] = {
                    'type': searchable_type,
                    'data': searchable_data,
                    'user_id': user_id,
                    'username': username,
                    'created_at': created_at,
                    'avg_rating': float(avg_rating) if avg_rating else 0.0,
                    'total_ratings': total_ratings or 0,
                    'seller_rating': float(seller_rating) if seller_rating else 0.0,
                    'seller_total_ratings': seller_total_ratings or 0
                }
            
            # Fetch tags for all searchables in batch
            searchable_tags_map = {}
            if searchable_ids:
                tag_placeholders = ','.join(['%s'] * len(searchable_ids))
                tag_query = f"""
                    SELECT st.searchable_id, t.id, t.name, t.tag_type, t.description
                    FROM searchable_tags st
                    JOIN tags t ON st.tag_id = t.id
                    WHERE st.searchable_id IN ({tag_placeholders})
                    AND t.is_active = true
                    ORDER BY st.searchable_id, t.name
                """
                execute_sql(cur, tag_query, params=searchable_ids)
                tag_results = cur.fetchall()
                
                for searchable_id, tag_id, tag_name, tag_type, tag_description in tag_results:
                    if searchable_id not in searchable_tags_map:
                        searchable_tags_map[searchable_id] = []
                    searchable_tags_map[searchable_id].append({
                        'id': tag_id,
                        'name': tag_name,
                        'tag_type': tag_type,
                        'description': tag_description
                    })
            
            # Build items with all data
            for searchable_id in searchable_ids:
                searchable_info = searchable_map[searchable_id]
                
                # Build item data from searchable_data JSON
                item_data = dict(searchable_info['data'])
                
                # Add metadata
                item_data['searchable_id'] = searchable_id
                item_data['type'] = searchable_info['type']
                item_data['user_id'] = searchable_info['user_id']
                item_data['username'] = searchable_info['username']
                item_data['tags'] = searchable_tags_map.get(searchable_id, [])
                item_data['avg_rating'] = searchable_info['avg_rating']
                item_data['total_ratings'] = searchable_info['total_ratings']
                item_data['seller_rating'] = searchable_info['seller_rating']
                item_data['seller_total_ratings'] = searchable_info['seller_total_ratings']
                
                # No relevance score with simple LIKE search
                
                items.append(item_data)
            
            cur.close()
            conn.close()
            
            return items, total_count
            
        except Exception as e:
            logger.error(f"Database query error: {str(e)}")
            raise e
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if 'conn' in locals() and conn:
                conn.close()


    def _format_response(self, results, page_number, page_size, total_count):
        """Format the final response"""
        total_pages = math.ceil(total_count / page_size)
        
        return {
            "results": results,
            "pagination": {
                "current_page": page_number,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages
            }
        }

@rest_api.route('/api/v1/searchable/remove/<int:searchable_id>', methods=['PUT'])
class RemoveSearchableItem(Resource):
    """
    Soft removes a searchable item by marking it as removed
    """
    @token_required
    @track_metrics('remove_searchable_item')
    def put(self, current_user, searchable_id, request_origin='unknown'):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # First, check if the searchable exists and belongs to the current user
            execute_sql(cur, """
                SELECT 1 FROM searchables 
                WHERE searchable_id = %s 
                AND user_id = %s
                AND removed = FALSE
            """, params=(searchable_id, current_user.id))
            
            result = cur.fetchone()
            if not result:
                return {"error": "Searchable item not found or access denied"}, 404
            
            # Mark as removed using the new column
            execute_sql(cur, """
                UPDATE searchables 
                SET removed = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE searchable_id = %s
            """, params=(searchable_id,), commit=True, connection=conn)
            
            cur.close()
            conn.close()
            
            return {"success": True, "message": "Searchable item marked as removed"}, 200
            
        except Exception as e:
            logger.error(f"Error removing searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500



@rest_api.route('/api/v1/invoices-by-searchable/<string:searchable_id>', methods=['GET'])
class InvoicesBySearchable(Resource):
    """
    Retrieves invoices for a specific searchable item with proper user filtering
    """
    @token_required
    @track_metrics('invoices_by_searchable')
    def get(self, current_user, searchable_id, request_origin='unknown'):
        try:
            # Determine if user is seller or buyer for this searchable
            searchable = get_searchable(searchable_id)
            if not searchable:
                return {"error": "Searchable item not found"}, 404
            
            user_role = 'seller' if str(searchable.get('user_id')) == str(current_user.id) else 'buyer'
            
            invoices = get_invoices_for_searchable(searchable_id, current_user.id, user_role)
            return {"invoices": invoices, "user_role": user_role}, 200
            
        except Exception as e:
            logger.error(f"Error retrieving invoices for searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rating/searchable/<int:searchable_id>', methods=['GET'])
class SearchableRating(Resource):
    """
    Retrieves rating information for a searchable item
    """
    @token_required
    @track_metrics('searchable_rating')
    def get(self, current_user, searchable_id, request_origin='unknown'):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get ratings for this searchable from invoice/payment/rating tables
            sql = """
                SELECT AVG(r.rating::float) as avg_rating, COUNT(r.rating) as total_ratings
                FROM rating r
                JOIN invoice i ON r.invoice_id = i.id
                WHERE i.searchable_id = %s
            """
            
            execute_sql(cur, sql, params=(searchable_id,))
            result = cur.fetchone()
            
            if result and result[0] is not None:
                avg_rating = float(result[0])
                total_ratings = int(result[1])
            else:
                avg_rating = 0
                total_ratings = 0
            
            # Get individual ratings with reviews
            ratings_sql = """
                SELECT r.rating, r.review, r.created_at, u.username
                FROM rating r
                JOIN invoice i ON r.invoice_id = i.id
                LEFT JOIN users u ON r.user_id = u.id
                WHERE i.searchable_id = %s
                ORDER BY r.created_at DESC
                LIMIT 10
            """
            
            execute_sql(cur, ratings_sql, params=(searchable_id,))
            individual_ratings = []
            
            for row in cur.fetchall():
                rating, review, created_at, username = row
                individual_ratings.append({
                    "rating": float(rating),
                    "review": review,
                    "created_at": created_at.isoformat() if created_at else None,
                    "username": username
                })
            
            cur.close()
            conn.close()
            
            return {
                "searchable_id": searchable_id,
                "average_rating": round(avg_rating, 2),
                "total_ratings": total_ratings,
                "individual_ratings": individual_ratings
            }, 200
            
        except Exception as e:
            logger.error(f"Error retrieving ratings for searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rating/user/<int:user_id>', methods=['GET'])
class UserRating(Resource):
    """
    Retrieves rating information for a user
    """
    @token_required
    @track_metrics('user_rating')
    def get(self, current_user, user_id, request_origin='unknown'):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get average rating for all searchables belonging to this terminal
            sql = """
                SELECT AVG(r.rating::float) as avg_rating, COUNT(r.rating) as total_ratings
                FROM rating r
                JOIN invoice i ON r.invoice_id = i.id
                WHERE i.seller_id = %s
            """
            
            execute_sql(cur, sql, params=(user_id,))
            result = cur.fetchone()
            
            if result and result[0] is not None:
                avg_rating = float(result[0])
                total_ratings = int(result[1])
            else:
                avg_rating = 0
                total_ratings = 0
            
            # Get recent ratings for this terminal
            ratings_sql = """
                SELECT r.rating, r.review, r.created_at, u.username, s.searchable_data->'payloads'->'public'->>'title' as item_title
                FROM rating r
                JOIN invoice i ON r.invoice_id = i.id
                JOIN searchables s ON i.searchable_id = s.searchable_id
                LEFT JOIN users u ON r.user_id = u.id
                WHERE i.seller_id = %s
                ORDER BY r.created_at DESC
                LIMIT 10
            """
            
            execute_sql(cur, ratings_sql, params=(user_id,))
            individual_ratings = []
            
            for row in cur.fetchall():
                rating, review, created_at, username, item_title = row
                individual_ratings.append({
                    "rating": float(rating),
                    "review": review,
                    "created_at": created_at.isoformat() if created_at else None,
                    "username": username,
                    "item_title": item_title
                })
            
            cur.close()
            conn.close()
            
            return {
                "user_id": user_id,
                "average_rating": round(avg_rating, 2),
                "total_ratings": total_ratings,
                "individual_ratings": individual_ratings
            }, 200
            
        except Exception as e:
            logger.error(f"Error retrieving ratings for user {user_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rating/submit', methods=['POST'])
class SubmitRating(Resource):
    """
    Submit a rating for a purchased item
    """
    @token_required
    @track_metrics('submit_rating')
    def post(self, current_user, request_origin='unknown'):
        try:
            data = request.get_json()
            
            if not data:
                return {"error": "Request data is required"}, 400
            
            # Validate required fields
            invoice_id = data.get('invoice_id')
            rating_value = data.get('rating')
            review = data.get('review', '')
            
            if not invoice_id:
                return {"error": "invoice_id is required"}, 400
            
            if rating_value is None:
                return {"error": "rating is required"}, 400
            
            # Validate rating value
            try:
                rating_value = float(rating_value)
                if not (0 <= rating_value <= 5):
                    return {"error": "Rating must be between 0 and 5"}, 400
            except (ValueError, TypeError):
                return {"error": "Invalid rating value"}, 400
            
            # Create the rating
            rating_result = create_rating(
                user_id=current_user.id,
                invoice_id=invoice_id,
                rating_value=rating_value,
                review=review,
                metadata=data.get('metadata', {})
            )
            
            return {
                "success": True,
                "message": "Rating submitted successfully",
                "rating": rating_result
            }, 201
            
        except ValueError as ve:
            logger.warning(f"Rating validation error for user {current_user.id}: {str(ve)}")
            return {"error": str(ve)}, 400
        except Exception as e:
            logger.error(f"Error submitting rating for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rating/can-rate/<int:invoice_id>', methods=['GET'])
class CanRateInvoice(Resource):
    """
    Check if the current user can rate a specific invoice
    """
    @token_required
    @track_metrics('can_rate_invoice')
    def get(self, current_user, invoice_id, request_origin='unknown'):
        try:
            can_rate, message = can_user_rate_invoice(current_user.id, invoice_id)
            
            return {
                "can_rate": can_rate,
                "message": message,
                "invoice_id": invoice_id
            }, 200
            
        except Exception as e:
            logger.error(f"Error checking if user {current_user.id} can rate invoice {invoice_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/user/purchases', methods=['GET'])
class UserPurchases(Resource):
    """
    Get all purchases (completed payments) for the current user that can be rated
    """
    @token_required
    @track_metrics('user_purchases')
    def get(self, current_user, request_origin='unknown'):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get all completed payments for this user with invoice and searchable details
            query = """
                SELECT 
                    i.id as invoice_id,
                    i.searchable_id,
                    i.amount,
                    i.currency,
                    i.created_at as invoice_created,
                    p.created_at as payment_completed,
                    s.searchable_data->'payloads'->'public'->>'title' as item_title,
                    s.searchable_data->'payloads'->'public'->>'description' as item_description,
                    EXISTS(
                        SELECT 1 FROM rating r 
                        WHERE r.invoice_id = i.id AND r.user_id = %s
                    ) as already_rated
                FROM invoice i
                JOIN payment p ON i.id = p.invoice_id
                JOIN searchables s ON i.searchable_id = s.searchable_id
                WHERE i.buyer_id = %s
                AND p.status = %s
                ORDER BY p.created_at DESC
            """
            
            execute_sql(cur, query, params=(current_user.id, current_user.id, 'complete'))
            purchases = []
            
            for row in cur.fetchall():
                invoice_id, searchable_id, amount, currency, invoice_created, payment_completed, item_title, item_description, already_rated = row
                
                purchase = {
                    "invoice_id": invoice_id,
                    "searchable_id": searchable_id,
                    "amount": float(amount),
                    "currency": currency,
                    "invoice_created": invoice_created.isoformat() if invoice_created else None,
                    "payment_completed": payment_completed.isoformat() if payment_completed else None,
                    "item_title": item_title,
                    "item_description": item_description,
                    "already_rated": bool(already_rated),
                    "can_rate": not bool(already_rated)
                }
                purchases.append(purchase)
            
            cur.close()
            conn.close()
            
            return {
                "purchases": purchases,
                "total_count": len(purchases)
            }, 200
            
        except Exception as e:
            logger.error(f"Error retrieving purchases for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/invoice/<int:invoice_id>/notes', methods=['GET'])
class InvoiceNotes(Resource):
    """
    Get all notes for a specific invoice with proper user permissions
    """
    @token_required
    @track_metrics('get_invoice_notes')
    def get(self, current_user, invoice_id, request_origin='unknown'):
        try:
            logger.error(f"DEBUG: GET invoice notes - Step 1: Called for invoice {invoice_id} by user {current_user.id}")
            
            # First, determine user's role for this invoice
            conn = get_db_connection()
            cur = conn.cursor()
            
            query = """
                SELECT buyer_id, seller_id FROM invoice WHERE id = %s
            """
            execute_sql(cur, query, params=(invoice_id,))
            result = cur.fetchone()
            
            if not result:
                return {"error": "Invoice not found"}, 404
            
            buyer_id, seller_id = result
            cur.close()
            conn.close()
            
            # Determine user role
            if str(current_user.id) == str(buyer_id):
                user_role = 'buyer'
            elif str(current_user.id) == str(seller_id):
                user_role = 'seller'
            else:
                return {"error": "Access denied - not a party to this invoice"}, 403
            
            # Get all notes for the invoice
            all_notes = get_invoice_notes(invoice_id)
            logger.error(f"DEBUG: GET invoice notes - Step 2: Got {len(all_notes)} notes from database")
            
            # Filter notes based on user role
            if user_role == 'seller':
                # Sellers can see all notes
                filtered_notes = all_notes
            else:
                # Buyers can only see shared notes and their own notes
                filtered_notes = []
                for note in all_notes:
                    visibility = note.get('visibility', '')
                    note_user_id = str(note.get('user_id', ''))
                    
                    # Include if it's a shared note or the user's own note
                    if visibility == 'shared' or note_user_id == str(current_user.id):
                        filtered_notes.append(note)
            
            logger.error(f"DEBUG: GET invoice notes - Step 3: Filtered to {len(filtered_notes)} notes for {user_role}")
            return {"notes": filtered_notes}, 200
            
        except Exception as e:
            logger.error(f"Error retrieving notes for invoice {invoice_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/invoice/<int:invoice_id>/notes', methods=['POST'])
class CreateInvoiceNote(Resource):
    """
    Create a new note for an invoice
    """
    @token_required
    @track_metrics('create_invoice_note')
    def post(self, current_user, invoice_id, request_origin='unknown'):
        try:
            data = request.get_json()
            
            # Support both 'content' and 'note_text' for backwards compatibility
            content = data.get('content') or data.get('note_text')
            
            if not data or not content:
                return {"error": "Note content is required"}, 400
            
            content = content.strip()
            if not content:
                return {"error": "Note content cannot be empty"}, 400
            
            # Determine if user is buyer or seller for this invoice
            conn = get_db_connection()
            cur = conn.cursor()
            
            query = """
                SELECT buyer_id, seller_id FROM invoice WHERE id = %s
            """
            execute_sql(cur, query, params=(invoice_id,))
            result = cur.fetchone()
            
            if not result:
                return {"error": "Invoice not found"}, 404
            
            buyer_id, seller_id = result
            cur.close()
            conn.close()
            
            # Determine user role
            if str(current_user.id) == str(buyer_id):
                buyer_seller = 'buyer'
            elif str(current_user.id) == str(seller_id):
                buyer_seller = 'seller'
            else:
                return {"error": "Access denied - not a party to this invoice"}, 403
            
            # Build metadata from the request data
            metadata = data.get('metadata', {})
            
            # Include test-specific fields in metadata
            if 'note_type' in data:
                metadata['note_type'] = data['note_type']
            if 'visibility' in data:
                metadata['visibility'] = data['visibility']
            
            # Create the note
            note = create_invoice_note(
                invoice_id=invoice_id,
                user_id=current_user.id,
                content=content,
                buyer_seller=buyer_seller,
                metadata=metadata
            )
            
            return {
                "success": True,
                "message": "Note created successfully",
                "note_id": note['id'],  # Return note_id as expected by tests
                "note": note
            }, 201
            
        except Exception as e:
            logger.error(f"Error creating note for invoice {invoice_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/user/invoices', methods=['GET'])
class UserInvoices(Resource):
    """
    Get all invoices for the current user (both as buyer and seller)
    """
    @token_required
    @track_metrics('user_invoices')
    def get(self, current_user, request_origin='unknown'):
        try:
            invoices = get_user_all_invoices(current_user.id)
            
            # Separate into purchases and sales for easier frontend handling
            purchases = [inv for inv in invoices if inv['user_role'] == 'buyer']
            sales = [inv for inv in invoices if inv['user_role'] == 'seller']
            
            return {
                "invoices": invoices,
                "purchases": purchases,
                "sales": sales,
                "total_count": len(invoices),
                "purchases_count": len(purchases),
                "sales_count": len(sales)
            }, 200
            
        except Exception as e:
            logger.error(f"Error retrieving invoices for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500

# Legacy routes from searchable_routes.py for backward compatibility
@rest_api.route('/api/searchable-item/<int:searchable_id>', methods=['GET'])
class GetSearchableItemLegacy(Resource):
    """Legacy endpoint for backward compatibility"""
    def get(self, searchable_id):
        # Delegate to the new endpoint
        resource = GetSearchableItem()
        return resource.get(searchable_id)

@rest_api.route('/api/searchable', methods=['POST'], strict_slashes=False)
class CreateSearchableLegacy(Resource):
    """Legacy endpoint for backward compatibility"""
    @token_required
    def post(self, current_user):
        # Delegate to the new endpoint
        resource = CreateSearchable()
        return resource.post(current_user)

@rest_api.route('/api/searchable/search', methods=['GET'])
class SearchSearchablesLegacy(Resource):
    """Legacy endpoint for backward compatibility"""
    def get(self):
        # Delegate to the new endpoint
        resource = SearchSearchables()
        return resource.get()

@rest_api.route('/api/remove-searchable-item/<int:searchable_id>', methods=['PUT'])
class RemoveSearchableItemLegacy(Resource):
    """Legacy endpoint for backward compatibility"""
    @token_required
    def put(self, current_user, searchable_id):
        # Delegate to the new endpoint
        resource = RemoveSearchableItem()
        return resource.put(current_user, searchable_id)

@rest_api.route('/api/balance', methods=['GET'])
class BalanceResource(Resource):
    """Get user balance"""
    @token_required
    def get(self, current_user):
        try:
            balance = get_balance_by_currency(current_user.id)
            return {"balance": balance}, 200
        except Exception as e:
            logger.error(f"Error retrieving balance for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500

# @rest_api.route('/api/profile', methods=['GET', 'PUT'])
# class ProfileResource(Resource):
#     """User profile management"""
#     @token_required
#     def get(self, current_user):
#         try:
#             terminal_data = get_terminal(current_user.id)
#             return {"profile": terminal_data}, 200
#         except Exception as e:
#             logger.error(f"Error retrieving profile for user {current_user.id}: {str(e)}")
#             return {"error": str(e)}, 500

    @token_required
    def put(self, current_user):
        try:
            data = request.get_json()
            if not data:
                return {"error": "Invalid input"}, 400

            conn = get_db_connection()
            cur = conn.cursor()
            
            # Terminal table removed - no operation needed
            # Profile data should be stored in user_profile table instead
            
            cur.close()
            conn.close()
            
            return {"success": True, "message": "Profile updated successfully"}, 200
            
        except Exception as e:
            logger.error(f"Error updating profile for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/download-file/<int:searchable_id>/<int:file_id>', methods=['GET'])
class DownloadSearchableFile(Resource):
    """
    Download a file from a searchable item after verifying payment
    """
    @token_required
    def get(self, current_user, searchable_id, file_id, request_origin='unknown'):
        try:
            # Get buyer ID from authenticated user
            buyer_id = current_user.id
            
            # First check if buyer has paid for this file
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Query for completed payments for this searchable item by this buyer
            payment_query = """
                SELECT p.status, i.metadata
                FROM payment p
                JOIN invoice i ON p.invoice_id = i.id
                WHERE i.searchable_id = %s
                AND i.buyer_id = %s
                AND p.status = 'complete'
            """
            
            execute_sql(cur, payment_query, params=(searchable_id, buyer_id))
            payments = cur.fetchall()
            
            # Check if any payment includes this file
            has_paid_for_file = False
            target_file = None
            
            for payment_status, invoice_metadata in payments:
                if invoice_metadata and 'selections' in invoice_metadata:
                    for selection in invoice_metadata['selections']:
                        if selection.get('id') == file_id and selection.get('type') == 'downloadable':
                            has_paid_for_file = True
                            # Get file info from invoice metadata
                            target_file = {
                                'fileId': selection.get('id'),
                                'fileName': selection.get('name', 'download')
                            }
                            break
                    if has_paid_for_file:
                        break
            
            cur.close()
            conn.close()
            
            if not has_paid_for_file:
                return {"error": "Payment required to download this file"}, 403
            
            # If payment verified but we don't have file info from invoice,
            # try to get it from searchable data (including removed items)
            if not target_file or not target_file.get('fileName'):
                searchable_data = get_searchable(searchable_id, include_removed=True)
                if searchable_data:
                    downloadable_files = searchable_data.get('payloads', {}).get('public', {}).get('downloadableFiles', [])
                    for file_info in downloadable_files:
                        if file_info.get('fileId') == file_id:
                            target_file = target_file or {}
                            target_file['fileName'] = file_info.get('fileName', 'download')
                            break
            
            # If payment verified, get the file from the file server
            file_server_url = os.environ.get('FILE_SERVER_URL')
            if not file_server_url:
                return {"error": "File server not configured"}, 500
            
            # Get file metadata from database to get the UUID
            conn = get_db_connection()
            cur = conn.cursor()
            
            file_query = """
                SELECT uri, metadata
                FROM files
                WHERE file_id = %s
            """
            
            execute_sql(cur, file_query, params=(file_id,))
            file_result = cur.fetchone()
            
            if not file_result:
                return {"error": "File metadata not found"}, 404
                
            file_uri, file_metadata = file_result
            cur.close()
            conn.close()
            
            # Extract UUID from URI
            try:
                file_uuid = file_uri.split('file_id=')[1] if 'file_id=' in file_uri else None
                if not file_uuid:
                    return {"error": "Invalid file URI"}, 500
                    
                # Make request to file server
                download_response = requests.get(
                    f"{file_server_url}/api/file/download",
                    params={'file_id': file_uuid},
                    stream=True
                )
                
                if download_response.status_code != 200:
                    logger.error(f"File server error: {download_response.text}")
                    return {"error": "Failed to retrieve file from server"}, 500
                
                # Return the file content with appropriate headers
                from flask import Response
                from urllib.parse import quote
                
                # Use original filename from file metadata instead of searchable fileName
                original_filename = "download"
                if file_metadata and isinstance(file_metadata, dict):
                    original_filename = file_metadata.get('original_filename', 'download')
                elif target_file:
                    # Fallback to searchable fileName if metadata is unavailable
                    original_filename = target_file.get("fileName", "download")
                
                def generate():
                    for chunk in download_response.iter_content(chunk_size=8192):
                        if chunk:
                            yield chunk
                logger.info(f"Serving file: {original_filename}")
                
                # Handle Unicode filenames properly using RFC 2231 encoding
                # For ASCII filenames, use simple format. For non-ASCII, use filename*
                try:
                    # Try to encode as ASCII
                    original_filename.encode('ascii')
                    content_disposition = f'attachment; filename="{original_filename}"'
                except UnicodeEncodeError:
                    # Use RFC 2231 encoding for Unicode filenames
                    encoded_filename = quote(original_filename, safe='')
                    content_disposition = f"attachment; filename*=UTF-8''{encoded_filename}"
                
                response = Response(
                    generate(),
                    content_type=download_response.headers.get('content-type', 'application/octet-stream'),
                    headers={
                        'Content-Disposition': content_disposition,
                        'Content-Length': download_response.headers.get('content-length', '')
                    }
                )
                
                return response
                
            except Exception as e:
                logger.error(f"Error downloading file: {str(e)}")
                return {"error": "Failed to download file"}, 500
            
        except Exception as e:
            logger.error(f"Error in download endpoint: {str(e)}")
            return {"error": str(e)}, 500 