# Searchable routes
import os
import re
import math
import requests
from flask import request
from flask_restx import Resource

# Import from our new structure
from .. import rest_api
from .auth import token_required, visitor_or_token_required
from ..common.metrics import track_metrics
from ..common.data_helpers import (
    get_db_connection,
    execute_sql,
    Json,
    get_searchable,
    get_searchableIds_by_user,
    get_terminal,
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
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'searchable.log')

@rest_api.route('/api/v1/searchable/<int:searchable_id>', methods=['GET'])
class GetSearchableItem(Resource):
    """
    Retrieves a specific searchable item by its ID
    """
    @visitor_or_token_required
    @track_metrics('get_searchable_item_v2')
    def get(self, current_user, visitor_id, searchable_id, request_origin='unknown'):
        try:
            searchable_data = get_searchable(searchable_id)
            
            if not searchable_data:
                return {"error": "Searchable item not found"}, 404
            
            # Enrich with username
            self._enrich_searchable_with_username(searchable_data)
            
            return searchable_data, 200
            
        except Exception as e:
            logger.error(f"Error retrieving searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500

    def _enrich_searchable_with_username(self, searchable_data):
        """Add username information to a single searchable item"""
        try:
            terminal_id = searchable_data.get('terminal_id')
            if not terminal_id:
                return
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Query username for this terminal_id
            execute_sql(cur, f"""
                SELECT username FROM users WHERE id = '{terminal_id}'
            """)
            
            result = cur.fetchone()
            if result:
                username = result[0]
                searchable_data['username'] = username
            
            cur.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error enriching searchable with username: {str(e)}")
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
            
            # Add terminal info to the searchable data
            data['terminal_id'] = str(current_user.id)
            
            
            # Insert into searchables table
            logger.info("Executing database insert...")
            sql = f"INSERT INTO searchables (terminal_id, searchable_data) VALUES ('{current_user.id}', {Json(data)}) RETURNING searchable_id;"
            execute_sql(cur, sql)
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
    @visitor_or_token_required
    @track_metrics('search_searchables_v2')
    def get(self, current_user, visitor_id, request_origin='unknown'):
        try:
            # Parse and validate request parameters
            params = self._parse_request_params()
            if 'error' in params:
                return params, 400
            
            # Query database for results
            results, total_count = self._query_database(
                params['query_term'],
                params.get('filters', {})
            )
            
            # Apply pagination
            paginated_results = self._apply_pagination(results, params['page_number'], params['page_size'])
            
            # Enrich paginated results with usernames
            self._enrich_results_with_usernames(paginated_results)
            
            # Format and return response
            return self._format_response(paginated_results, params['page_number'], params['page_size'], total_count), 200
            
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
            
            # Location is no longer used
            lat = lng = None
            
            # Parse filters
            try:
                import json
                filters = json.loads(filters_param)
            except json.JSONDecodeError:
                filters = {}
            
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
                'filters': filters
            }
        except Exception as e:
            return {"error": f"Parameter parsing error: {str(e)}"}


    def _tokenize_text(self, text):
        """Tokenize text for matching"""
        if not text:
            return []
        
        # Convert to lowercase and split by non-alphanumeric characters
        tokens = re.findall(r'[a-zA-Z0-9]+', text.lower())
        return tokens

    def _calculate_match_score(self, query_term, item_data):
        """Calculate relevance score for simple substring matching"""
        if not query_term:
            return 1.0  # Default score when no query
        
        query_lower = query_term.lower()
        score = 0.0
        
        # Search in various fields of the item for substring matches
        try:
            public_data = item_data.get('payloads', {}).get('public', {})
            
            # Check title (highest weight)
            title = public_data.get('title', '').lower()
            if query_lower in title:
                score += 2.0
            
            # Check description (medium weight)
            description = public_data.get('description', '').lower()
            if query_lower in description:
                score += 1.0
            
            # Check selectables (lower weight)
            selectables_text = ' '.join([item.get('name', '') for item in public_data.get('selectables', [])]).lower()
            if query_lower in selectables_text:
                score += 0.5
                
        except Exception as e:
            logger.error(f"Error calculating match score: {str(e)}")
            pass
        
        return score

    def _query_database(self, query_term, filters={}):
        """Query database for searchable items"""
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            # Query all searchables
            execute_sql(cur, """
                SELECT s.searchable_id, s.searchable_data
                FROM searchables s
                WHERE s.searchable_data->>'removed' IS NULL 
                OR s.searchable_data->>'removed' != 'true'
                ORDER BY s.searchable_id DESC
            """)
            results = cur.fetchall()
            
            # Convert to list format and apply text filtering
            items = []
            
            for result in results:
                searchable_id, searchable_data = result
                
                # Add searchable_id to data
                item_data = dict(searchable_data)
                item_data['searchable_id'] = searchable_id
                
                # Apply text filtering
                if query_term:
                    match_score = self._calculate_match_score(query_term, item_data)
                    if match_score == 0:
                        continue  # Skip items that don't match
                    item_data['relevance_score'] = match_score
                
                items.append(item_data)
            
            # Sort by relevance if text search was performed
            if query_term:
                items.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
            
            total_count = len(items)
            
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


    def _apply_pagination(self, results, page_number, page_size):
        """Apply pagination to results"""
        start_index = (page_number - 1) * page_size
        end_index = start_index + page_size
        return results[start_index:end_index]

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

    def _enrich_results_with_usernames(self, results):
        """Add username information to results"""
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get unique terminal_ids from results
            terminal_ids = set()
            for item in results:
                terminal_id = item.get('terminal_id')
                if terminal_id:
                    terminal_ids.add(terminal_id)
            
            if not terminal_ids:
                return
            
            # Query usernames for all terminal_ids
            terminal_ids_str = "', '".join(str(tid) for tid in terminal_ids)
            execute_sql(cur, f"""
                SELECT id, username FROM users WHERE id IN ('{terminal_ids_str}')
            """)
            
            # Create mapping
            username_map = {}
            for row in cur.fetchall():
                user_id, username = row
                username_map[str(user_id)] = username
            
            # Add usernames to results
            for item in results:
                terminal_id = item.get('terminal_id')
                if terminal_id and str(terminal_id) in username_map:
                    item['username'] = username_map[str(terminal_id)]
            
            cur.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error enriching with usernames: {str(e)}")
            # Continue without usernames rather than failing

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
            execute_sql(cur, f"""
                SELECT searchable_data FROM searchables 
                WHERE searchable_id = {searchable_id} 
                AND terminal_id = {current_user.id}
            """)
            
            result = cur.fetchone()
            if not result:
                return {"error": "Searchable item not found or access denied"}, 404
            
            searchable_data = result[0]
            
            # Mark as removed
            searchable_data['removed'] = 'true'
            
            # Update the database
            execute_sql(cur, f"""
                UPDATE searchables 
                SET searchable_data = {Json(searchable_data)}
                WHERE searchable_id = {searchable_id}
            """, commit=True, connection=conn)
            
            cur.close()
            conn.close()
            
            return {"success": True, "message": "Searchable item marked as removed"}, 200
            
        except Exception as e:
            logger.error(f"Error removing searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/terminal/<int:terminal_id>', methods=['GET'])
class GetUserTerminal(Resource):
    """
    Retrieves terminal information for a specific user
    """
    @token_required
    @track_metrics('get_terminal')
    def get(self, current_user, terminal_id, request_origin='unknown'):
        try:
            terminal_data = get_terminal(terminal_id)
            
            if not terminal_data:
                return {"error": "Terminal not found"}, 404
            
            return terminal_data, 200
            
        except Exception as e:
            logger.error(f"Error retrieving terminal {terminal_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/terminal', methods=['GET', 'PUT'])
class UserTerminal(Resource):
    """
    Get or update user terminal information
    """
    @token_required
    @track_metrics('get_terminal_v1')
    def get(self, current_user, request_origin='unknown'):
        try:
            terminal_data = get_terminal(current_user.id)
            
            if not terminal_data:
                return {"message": "Terminal not found", "terminal_id": current_user.id}, 404
            
            return terminal_data, 200
            
        except Exception as e:
            logger.error(f"Error retrieving terminal for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500

    @token_required
    @track_metrics('update_terminal')
    def put(self, current_user, request_origin='unknown'):
        try:
            data = request.get_json()
            if not data:
                return {"error": "Invalid input"}, 400

            conn = get_db_connection()
            cur = conn.cursor()
            
            # Check if terminal exists
            execute_sql(cur, f"""
                SELECT terminal_id FROM terminal WHERE terminal_id = '{current_user.id}'
            """)
            
            if cur.fetchone():
                # Update existing terminal
                execute_sql(cur, f"""
                    UPDATE terminal 
                    SET terminal_data = {Json(data)}
                    WHERE terminal_id = '{current_user.id}'
                """, commit=True, connection=conn)
                message = "Terminal updated successfully"
            else:
                # Create new terminal
                execute_sql(cur, f"""
                    INSERT INTO terminal (terminal_id, terminal_data) 
                    VALUES ('{current_user.id}', {Json(data)})
                """, commit=True, connection=conn)
                message = "Terminal created successfully"
            
            cur.close()
            conn.close()
            
            return {"success": True, "message": message}, 200
            
        except Exception as e:
            logger.error(f"Error updating terminal for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500


@rest_api.route('/api/v1/invoices-by-searchable/<string:searchable_id>', methods=['GET'])
class InvoicesBySearchable(Resource):
    """
    Retrieves invoices for a specific searchable item with proper user filtering
    """
    @visitor_or_token_required
    @track_metrics('invoices_by_searchable')
    def get(self, current_user, visitor_id, searchable_id, request_origin='unknown'):
        try:
            # Get user ID - authenticated user or visitor
            user_id = current_user.id if current_user else visitor_id
            
            # Determine if user is seller or buyer for this searchable
            searchable = get_searchable(searchable_id)
            if not searchable:
                return {"error": "Searchable item not found"}, 404
            
            user_role = 'seller' if str(searchable.get('terminal_id')) == str(user_id) else 'buyer'
            
            invoices = get_invoices_for_searchable(searchable_id, user_id, user_role)
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
            sql = f"""
                SELECT AVG(r.rating::float) as avg_rating, COUNT(r.rating) as total_ratings
                FROM rating r
                JOIN invoice i ON r.invoice_id = i.id
                WHERE i.searchable_id = {searchable_id}
            """
            
            execute_sql(cur, sql)
            result = cur.fetchone()
            
            if result and result[0] is not None:
                avg_rating = float(result[0])
                total_ratings = int(result[1])
            else:
                avg_rating = 0
                total_ratings = 0
            
            # Get individual ratings with reviews
            ratings_sql = f"""
                SELECT r.rating, r.review, r.created_at, u.username
                FROM rating r
                JOIN invoice i ON r.invoice_id = i.id
                LEFT JOIN users u ON r.user_id = u.id
                WHERE i.searchable_id = {searchable_id}
                ORDER BY r.created_at DESC
                LIMIT 10
            """
            
            execute_sql(cur, ratings_sql)
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

@rest_api.route('/api/v1/rating/terminal/<int:terminal_id>', methods=['GET'])
class TerminalRating(Resource):
    """
    Retrieves rating information for a terminal (user)
    """
    @token_required
    @track_metrics('terminal_rating')
    def get(self, current_user, terminal_id, request_origin='unknown'):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get average rating for all searchables belonging to this terminal
            sql = f"""
                SELECT AVG(r.rating::float) as avg_rating, COUNT(r.rating) as total_ratings
                FROM rating r
                JOIN invoice i ON r.invoice_id = i.id
                WHERE i.seller_id = {terminal_id}
            """
            
            execute_sql(cur, sql)
            result = cur.fetchone()
            
            if result and result[0] is not None:
                avg_rating = float(result[0])
                total_ratings = int(result[1])
            else:
                avg_rating = 0
                total_ratings = 0
            
            # Get recent ratings for this terminal
            ratings_sql = f"""
                SELECT r.rating, r.review, r.created_at, u.username, s.searchable_data->'payloads'->'public'->>'title' as item_title
                FROM rating r
                JOIN invoice i ON r.invoice_id = i.id
                JOIN searchables s ON i.searchable_id = s.searchable_id
                LEFT JOIN users u ON r.user_id = u.id
                WHERE i.seller_id = {terminal_id}
                ORDER BY r.created_at DESC
                LIMIT 10
            """
            
            execute_sql(cur, ratings_sql)
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
                "terminal_id": terminal_id,
                "average_rating": round(avg_rating, 2),
                "total_ratings": total_ratings,
                "individual_ratings": individual_ratings
            }, 200
            
        except Exception as e:
            logger.error(f"Error retrieving ratings for terminal {terminal_id}: {str(e)}")
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
            query = f"""
                SELECT 
                    i.id as invoice_id,
                    i.searchable_id,
                    i.amount,
                    i.currency,
                    i.created_at as invoice_created,
                    p.created_at as payment_completed,
                    s.searchable_data->>'payloads'->>'public'->>'title' as item_title,
                    s.searchable_data->>'payloads'->>'public'->>'description' as item_description,
                    EXISTS(
                        SELECT 1 FROM rating r 
                        WHERE r.invoice_id = i.id AND r.user_id = '{current_user.id}'
                    ) as already_rated
                FROM invoice i
                JOIN payment p ON i.id = p.invoice_id
                JOIN searchables s ON i.searchable_id = s.searchable_id
                WHERE i.buyer_id = '{current_user.id}'
                AND p.status = 'complete'
                ORDER BY p.created_at DESC
            """
            
            execute_sql(cur, query)
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
    Get all notes for a specific invoice
    """
    @token_required
    @track_metrics('get_invoice_notes')
    def get(self, current_user, invoice_id, request_origin='unknown'):
        try:
            notes = get_invoice_notes(invoice_id)
            return {"notes": notes}, 200
            
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
            
            if not data or not data.get('content'):
                return {"error": "Note content is required"}, 400
            
            content = data.get('content').strip()
            if not content:
                return {"error": "Note content cannot be empty"}, 400
            
            # Determine if user is buyer or seller for this invoice
            conn = get_db_connection()
            cur = conn.cursor()
            
            query = f"""
                SELECT buyer_id, seller_id FROM invoice WHERE id = {invoice_id}
            """
            execute_sql(cur, query)
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
            
            # Create the note
            note = create_invoice_note(
                invoice_id=invoice_id,
                user_id=current_user.id,
                content=content,
                buyer_seller=buyer_seller,
                metadata=data.get('metadata', {})
            )
            
            return {
                "success": True,
                "message": "Note created successfully",
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

@rest_api.route('/api/profile', methods=['GET', 'PUT'])
class ProfileResource(Resource):
    """User profile management"""
    @token_required
    def get(self, current_user):
        try:
            terminal_data = get_terminal(current_user.id)
            return {"profile": terminal_data}, 200
        except Exception as e:
            logger.error(f"Error retrieving profile for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500

    @token_required
    def put(self, current_user):
        try:
            data = request.get_json()
            if not data:
                return {"error": "Invalid input"}, 400

            conn = get_db_connection()
            cur = conn.cursor()
            
            # Update or create terminal record
            execute_sql(cur, f"""
                INSERT INTO terminal (terminal_id, terminal_data) 
                VALUES ('{current_user.id}', {Json(data)})
                ON CONFLICT (terminal_id) 
                DO UPDATE SET terminal_data = {Json(data)}
            """, commit=True, connection=conn)
            
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
            
            # Get the searchable item data
            searchable_data = get_searchable(searchable_id)
            if not searchable_data:
                return {"error": "Searchable item not found"}, 404
            
            # Check if this is a downloadable type searchable
            item_type = searchable_data.get('payloads', {}).get('public', {}).get('type')
            if item_type != 'downloadable':
                return {"error": "This item is not downloadable"}, 400
            
            # Get downloadable files from the searchable data
            downloadable_files = searchable_data.get('payloads', {}).get('public', {}).get('downloadableFiles', [])
            
            # Find the specific file
            target_file = None
            for file_info in downloadable_files:
                if file_info.get('fileId') == file_id:
                    target_file = file_info
                    break
            
            if not target_file:
                return {"error": "File not found"}, 404
            
            # Check if buyer has paid for this file
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Query for completed payments for this searchable item by this buyer
            payment_query = f"""
                SELECT p.status, i.metadata
                FROM payment p
                JOIN invoice i ON p.invoice_id = i.id
                WHERE i.searchable_id = {searchable_id}
                AND i.buyer_id = '{buyer_id}'
                AND p.status = 'complete'
            """
            
            execute_sql(cur, payment_query)
            payments = cur.fetchall()
            
            # Check if any payment includes this file
            has_paid_for_file = False
            for payment_status, invoice_metadata in payments:
                if invoice_metadata and 'selections' in invoice_metadata:
                    for selection in invoice_metadata['selections']:
                        if selection.get('id') == file_id and selection.get('type') == 'downloadable':
                            has_paid_for_file = True
                            break
                    if has_paid_for_file:
                        break
            
            cur.close()
            conn.close()
            
            if not has_paid_for_file:
                return {"error": "Payment required to download this file"}, 403
            
            # If payment verified, get the file from the file server
            file_server_url = os.environ.get('FILE_SERVER_URL')
            if not file_server_url:
                return {"error": "File server not configured"}, 500
            
            # Get file metadata from database to get the UUID
            conn = get_db_connection()
            cur = conn.cursor()
            
            file_query = f"""
                SELECT uri, metadata
                FROM files
                WHERE file_id = {file_id}
            """
            
            execute_sql(cur, file_query)
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
                
                response = Response(
                    generate(),
                    content_type=download_response.headers.get('content-type', 'application/octet-stream'),
                    headers={
                        'Content-Disposition': f'attachment; filename="{original_filename}"',
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