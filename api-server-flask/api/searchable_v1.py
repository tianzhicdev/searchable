import os
import re
from functools import wraps

import requests
from flask import request, Response
import json
from flask_restx import Resource
import math
from prometheus_client import Counter, Histogram, Summary, generate_latest, REGISTRY
import geohash2
from . import rest_api
from .routes import token_required, token_optional
from .helper import (
    create_lightning_invoice,
    get_btc_price,
    get_db_connection,
    get_receipts,
    get_searchable,
    check_payment, 
    check_stripe_payment,
    get_terminal, 
    get_searchableIds_by_user, 
    get_data_from_kv, 
    execute_sql,
    Json,
    get_withdrawal_timestamp,
    get_withdrawal_status,
    calc_invoice
)
import time
import stripe

from .track_metrics import track_metrics
stripe.api_key = os.getenv('STRIPE_API_KEY')

def validate_payment_request(data):
    # Validate required fields
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

@rest_api.route('/api/v1/searchable/<int:searchable_id>', methods=['GET'])
class GetSearchableItem(Resource):
    """
    Retrieves a specific searchable item by its ID
    """
    @token_optional
    @track_metrics('get_searchable_item_v2')
    def get(self, searchable_id, current_user=None, visitor_id=None, request_origin='unknown'):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Query to get the searchable item
            execute_sql(cur, f"""
                SELECT searchable_id, searchable_data
                FROM searchables
                WHERE searchable_id = {searchable_id}
            """)
            
            result = cur.fetchone()
            
            if not result:
                return {"error": "Searchable item not found"}, 404
                
            searchable_id, searchable_data = result
            
            # Combine the data
            item_data = searchable_data
            item_data['searchable_id'] = searchable_id
            
            cur.close()
            conn.close()
            
            return item_data, 200
            
        except Exception as e:
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/searchable/create', methods=['POST'])
class CreateSearchable(Resource):
    """
    Creates a new searchable item
    """
    @token_required
    @track_metrics('create_searchable_v2')
    def post(self, current_user, request_origin='unknown'):
        print(f"Creating searchable for user: {current_user.id} {current_user.username}")
        conn = None
        try:
            data = request.get_json()  # Get JSON data from request
            if not data:
                return {"error": "Invalid input"}, 400

            conn = get_db_connection()
            cur = conn.cursor()
            
            # Add terminal info to the searchable data
            data['terminal_id'] = str(current_user.id)
            
            # Extract latitude and longitude from the data for dedicated columns
            latitude = None
            longitude = None
            
            # Check if location data should be used
            use_location = data.get('payloads', {}).get('public', {}).get('use_location', False)
            
            if use_location:
                try:
                    latitude = float(data['payloads']['public']['latitude'])
                    longitude = float(data['payloads']['public']['longitude'])
                except:
                    return {"error": "Location data is required when use_location is true"}, 400
            else:
                print("Location usage disabled for this searchable")
            
            # Insert into searchables table
            print("Executing database insert...")
            sql = f"INSERT INTO searchables (terminal_id, searchable_data) VALUES ('{current_user.id}', {Json(data)}) RETURNING searchable_id;"
            execute_sql(cur, sql)
            searchable_id = cur.fetchone()[0]
            
            # If location data is provided, insert into searchable_geo table
            if use_location and (latitude is not None) and (longitude is not None):
                # Calculate geohash for the coordinates
                geohash = geohash2.encode(latitude, longitude, precision=9)
                
                # Insert into searchable_geo table
                geo_sql = f"""
                    INSERT INTO searchable_geo (searchable_id, latitude, longitude, geohash)
                    VALUES ({searchable_id}, {latitude}, {longitude}, '{geohash}')
                """
                execute_sql(cur, geo_sql)
            
            print(f"Added searchable {searchable_id}")
            
            conn.commit()
            cur.close()
            conn.close()
            return {"searchable_id": searchable_id}, 201
        except Exception as e:
            # Enhanced error logging
            import traceback
            error_traceback = traceback.format_exc()
            print(f"Error creating searchable: {str(e)}")
            print(f"Traceback: {error_traceback}")
            
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
    Search for searchable items based on location and optional query terms
    """
    @token_optional
    @track_metrics('search_searchables_v2')
    def get(self, current_user=None, visitor_id=None, request_origin='unknown'):
        try:
            # Parse and validate request parameters
            params = self._parse_request_params()
            if 'error' in params:
                return params, 400
            
            # Query database for results
            results, total_count = self._query_database(
                params['lat'], 
                params['lng'], 
                params['max_distance'],
                params['query_term'],
                params['use_location'],
                params['filters']
            )
            
            # Apply pagination after filtering by actual distance
            paginated_results = self._apply_pagination(results, params['page_number'], params['page_size'])
            
            # Format and return response
            return self._format_response(paginated_results, params['page_number'], params['page_size'], total_count), 200
            
        except Exception as e:
            return {"error": str(e)}, 500
    
    def _parse_request_params(self):
        """Parse and validate request parameters"""
        # Get parameters from request
        lat = request.args.get('lat')
        lng = request.args.get('lng')
        query_term = request.args.get('query_term', '')
        max_distance = request.args.get('max_distance', None)  # Get as string first
        page_number = int(request.args.get('page_number', 1))
        page_size = int(request.args.get('page_size', 10))
        # Get filters as JSON, defaulting to empty dict if not provided or invalid
        try:
            filters = json.loads(request.args.get('filters', '{}'))
        except json.JSONDecodeError:
            # Log the error for debugging
            print(f"Error parsing filters JSON: {request.args.get('filters', '{}')}")
            filters = {}
        use_location_param = request.args.get('use_location', 'false')
        use_location = use_location_param.lower() == 'true'
        
        
        # Only validate lat/lng if max_distance is specified and use_location is true
        if use_location:
            if not lat or not lng or not max_distance:
                return {"error": "Latitude, longitude and max_distance are required when use_location is true"}
            try:
                lat = float(lat)
                lng = float(lng)
                max_distance = float(max_distance)
            except ValueError:
                return {"error": "Invalid coordinate or distance format"}
        else:
            # No location search, set to None
            lat = None
            lng = None
            max_distance = None
        return {
            'lat': lat,
            'lng': lng,
            'max_distance': max_distance,
            'query_term': query_term,
            'page_number': page_number,
            'page_size': page_size,
            'filters': filters,
            'use_location': use_location
        }
    
    def _parse_filters(self, filters):

        return 
    
    def _calculate_distance(self, lat1, lng1, lat2, lng2):
        """Calculate distance between two points using Haversine formula"""
        earth_radius = 6371000  # meters
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        lat_diff = math.radians(lat2 - lat1)
        lng_diff = math.radians(lng2 - lng1)
        
        a = (math.sin(lat_diff/2) * math.sin(lat_diff/2) +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(lng_diff/2) * math.sin(lng_diff/2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return earth_radius * c  # in meters
    
    def _tokenize_text(self, text):
        """Tokenize text into individual words, removing punctuation and converting to lowercase"""
        if not text:
            return []
        # Remove punctuation and convert to lowercase
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        # Split by whitespace and filter out empty strings
        return [word for word in text.split() if word]
    
    def _calculate_match_score(self, query_tokens, item_data):
        """Calculate match score between query tokens and item data"""
        if not query_tokens:
            return 0
            
        score = 0
        # Extract data from the new structure
        public_data = item_data.get('payloads', {}).get('public', {})
        title = public_data.get('title', '')
        description = public_data.get('description', '')
        
        title_tokens = self._tokenize_text(title)
        description_tokens = self._tokenize_text(description)
        
        # Check for matches in title (weight: 3)
        for query_token in query_tokens:
            if query_token in title_tokens:
                score += 3
                
        # Check for matches in description (weight: 1)
        for query_token in query_tokens:
            if query_token in description_tokens:
                score += 1
        # Check for exact match on item ID (weight: 100)
        searchable_id = str(item_data.get('searchable_id', ''))
        for query_token in query_tokens:
            if query_token == searchable_id:
                score += 100
                break
                
        return score
    
    def _query_database(self, lat, lng, max_distance, query_term, use_location, filters={}):
        """Query database for results and filter by actual distance and search relevance"""
        # Log query parameters for debugging
        print(f"Search parameters:")
        print(f"  Query term: {query_term}")
        print(f"  Filters: {filters}")
        print(f"  Filter type: {type(filters)}")
        print(f"  Use location: {use_location}")
        
        if use_location:
            print(f"  Coordinates: ({lat}, {lng})")
            print(f"  Max distance: {max_distance} meters")
        else:
            print("  Not using location-based filtering")
        
        # Tokenize query term
        query_tokens = self._tokenize_text(query_term)
        
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Base query with support for filter search
        base_conditions = ["(searchable_data->>'is_removed')::boolean IS NOT TRUE"]
        
        # Add filter conditions
        for key, value in filters.items():
            json_path = f"searchable_data->>'{key}'"
            base_conditions.append(f"{json_path} = '{value}'")
            # todo: now it only supports string value
        
        # Join all conditions
        where_clause = " AND ".join(base_conditions)
        
        if use_location:
            # Use the new function to query searchable_geo table
            db_results = self._query_searchable_geo(cur, lat, lng, max_distance, where_clause)
        else:
            # Query without location filtering
            query = f"""
                SELECT 
                  searchable_id,
                  searchable_data,
                  NULL as distance
                FROM searchables
                WHERE {where_clause}
                ORDER BY searchable_id DESC
            """
            
            # Execute the query
            execute_sql(cur, query)
            db_results = cur.fetchall()
        
        # Process results and calculate match scores
        filtered_results = []
        for result in db_results:
            searchable_id, searchable_data, distance = result
            
            item_data = dict(searchable_data)
            if distance is not None:
                item_data['distance'] = distance
            item_data['searchable_id'] = searchable_id
            
            # Calculate match score for search relevance
            match_score = self._calculate_match_score(query_tokens, item_data)
            item_data['match_score'] = match_score
            
            # Only include results with a match score if we have a query term
            if query_term and match_score == 0:
                print(f"No match score for {searchable_id}")
                continue
                
            filtered_results.append(item_data)
        
        # Sort results - by match score (if query provided), then by distance (if location provided)
        if query_term and use_location:
            print(f"Sorting by match score and distance, {len(filtered_results)} results")
            filtered_results.sort(key=lambda x: (-x['match_score'], x['distance']))
        elif query_term and len(query_term) > 0:
            print(f"Sorting by match score only, {len(filtered_results)} results")
            filtered_results.sort(key=lambda x: -x['match_score'])
        else:
            print(f"Sorting by description length, {len(filtered_results)} results")
            # Sort by length of description, longest first
            filtered_results.sort(key=lambda x: -len(x.get('payloads', {}).get('public', {}).get('description', '')))

        cur.close()
        conn.close()
        
        return filtered_results, len(filtered_results)
    
    def _query_searchable_geo(self, cur, lat, lng, max_distance, where_clause):
        """Query searchable_geo table using lat/long coordinates"""
        query = f"""
                WITH distance_calc AS (
                    SELECT 
                        s.searchable_id,
                        s.searchable_data,
                        6371000 * ACOS(
                            GREATEST(LEAST(
                                COS(RADIANS({lat})) * 
                                COS(RADIANS(sg.latitude)) * 
                                COS(RADIANS(sg.longitude) - RADIANS({lng})) + 
                                SIN(RADIANS({lat})) * 
                                SIN(RADIANS(sg.latitude))
                            , 1), -1) 
                        ) AS distance
                    FROM searchables s
                    JOIN searchable_geo sg ON s.searchable_id = sg.searchable_id
                    WHERE {where_clause}
                    AND sg.latitude BETWEEN {lat} - ({max_distance} / 111045) 
                        AND {lat} + ({max_distance} / 111045)
                    AND sg.longitude BETWEEN {lng} - ({max_distance} / (111045 * COALESCE(ABS(COS(RADIANS({lat}))), 0.00001))) 
                        AND {lng} + ({max_distance} / (111045 * COALESCE(ABS(COS(RADIANS({lat}))), 0.00001)))
                )
                SELECT * FROM distance_calc
                WHERE distance <= {max_distance}
                ORDER BY distance;
                """
        
        # Execute the query
        execute_sql(cur, query)
        return cur.fetchall()
    
    def _apply_pagination(self, results, page_number, page_size):
        """Apply pagination to the filtered results"""
        start_idx = (page_number - 1) * page_size
        end_idx = start_idx + page_size
        return results[start_idx:end_idx]
    
    def _format_response(self, results, page_number, page_size, total_count):
        """Format the response with results and pagination info"""
        return {
            "results": results,
            "pagination": {
                "page": page_number,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": (total_count + page_size - 1) // page_size
            }
        }
    
    def _enrich_results_with_usernames(self, results):
        """Enrich the paginated results with usernames"""
        if not results:
            return
            
        # Get all unique terminal_ids from the paginated results
        terminal_ids = set()
        for item in results:
            if 'terminal_id' in item:
                terminal_ids.add(item['terminal_id'])
                
        if not terminal_ids:
            return
            
        # Fetch usernames for these terminal_ids
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Convert terminal_ids set to a comma-separated string for SQL IN clause
        terminal_ids_str = ','.join([f"'{tid}'" for tid in terminal_ids])
        execute_sql(cur, f"SELECT id, username FROM users WHERE id IN ({terminal_ids_str})")
        
        # Create a mapping of terminal_id to username
        usernames = {}
        for terminal_id, username in cur.fetchall():
            usernames[str(terminal_id)] = username
            
        cur.close()
        conn.close()
        
        # Add username to each result
        for item in results:
            if 'terminal_id' in item and item['terminal_id'] in usernames:
                item['username'] = usernames[item['terminal_id']]

@rest_api.route('/api/v1/searchable/remove/<int:searchable_id>', methods=['PUT'])
class RemoveSearchableItem(Resource):
    """
    Soft removes a searchable item by setting is_removed flag to true
    
    Example curl request:
    curl -X PUT "http://localhost:5000/api/searchable/123/remove" -H "Authorization: <token>"
    """
    @token_required
    @track_metrics('remove_searchable_item')
    def put(self, current_user, searchable_id, request_origin='unknown'):
        print(f"Soft removing searchable item {searchable_id} by user: {current_user}")
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # First check if the item exists and belongs to the current user
            execute_sql(cur, f"""
                SELECT searchable_data
                FROM searchables
                WHERE searchable_id = {searchable_id}
            """)
            
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return {"error": "Searchable item not found"}, 404
                
            searchable_data = row[0]
            if str(searchable_data.get('terminal_id', -1)) != str(current_user.id):
                cur.close()
                conn.close()
                return {"error": "You don't have permission to remove this item"}, 403
            
            # Update the searchable_data to mark it as removed
            searchable_data['is_removed'] = True
            
            # Update the record in the database
            execute_sql(cur, f"""
                UPDATE searchables
                SET searchable_data = {Json(searchable_data)}
                WHERE searchable_id = {searchable_id}
            """, commit=True, connection=conn)
            
            cur.close()
            conn.close()
            
            return {"success": True, "message": "Item has been removed"}, 200
            
        except Exception as e:
            print(f"Error removing searchable item: {str(e)}")
            return {"error": str(e)}, 500


@rest_api.route('/api/v1/refresh-payments-by-searchable/<searchable_id>', methods=['GET'])
class RefreshPaymentsBySearchable(Resource):
    """
    Refreshes the payment status for all invoices associated with a searchable item
    """
    @track_metrics('refresh_payments_by_searchable')
    def get(self, searchable_id, request_origin='unknown'):
        try:
            # Get all invoices for this searchable_id
            conn = get_db_connection()
            cur = conn.cursor()
            
            execute_sql(cur, f"""
                SELECT pkey, data FROM kv
                WHERE type = 'invoice' AND fkey = '{searchable_id}'
            """)
            
            invoices = cur.fetchall()
            cur.close()
            conn.close()
            
            if not invoices:
                return {"message": "No invoices found for this searchable item"}, 200
            
            results = []
            
            # Process each invoice
            for invoice in invoices:
                invoice_id = invoice[0]
                invoice_data = invoice[1]
                
                # Determine invoice type and check payment status
                if invoice_data.get('invoice_type') == 'lightning':
                    payment_status = check_payment(invoice_id)
                    results.append({
                        "invoice_id": invoice_id,
                        "type": "lightning",
                        "status": payment_status.get('status', 'unknown'),
                        "data": payment_status
                    })
                elif invoice_data.get('invoice_type') == 'stripe':
                    payment_status = check_stripe_payment(invoice_id)
                    results.append({
                        "invoice_id": invoice_id,
                        "type": "stripe",
                        "status": payment_status.get('status', 'unknown'),
                        "data": payment_status
                    })
            
            return {"searchable_id": searchable_id, "payments": results}, 200
            
        except Exception as e:
            print(f"Error refreshing payments for searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500


class GetUserTerminal(Resource):
    """
    Retrieves terminal data for the authenticated user
    """
    @token_required
    @track_metrics('get_terminal')
    def get(self, current_user, request_origin='unknown'):
        try:
            # Get profile data using the helper function
            terminal_data = get_terminal(current_user.id)
            
            if not terminal_data:
                return {"error": "Terminal not found"}, 404
            
            return terminal_data, 200
            
        except Exception as e:
            return {"error": str(e)}, 500


@rest_api.route('/api/v1/terminal', methods=['GET', 'PUT'])
class UserTerminal(Resource):
    """
    Retrieves, creates or updates terminal data for the authenticated user
    """
    @token_required
    @track_metrics('get_terminal_v1')
    def get(self, current_user, request_origin='unknown'):
        try:
            # Get profile data using the helper function
            terminal_data = get_terminal(current_user.id)
            
            if not terminal_data:
                return {"error": "Terminal not found"}, 404
            
            return terminal_data, 200
            
        except Exception as e:
            return {"error": str(e)}, 500
    
    @token_required
    @track_metrics('update_terminal')
    def put(self, current_user, request_origin='unknown'):
        try:
            # Get the request data
            data = request.get_json()
            
            if not data:
                return {"error": "No data provided"}, 400
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Check if terminal data already exists for this user
            execute_sql(cur, f"""
                SELECT terminal_id FROM terminal
                WHERE terminal_id = '{current_user.id}'
            """)
            
            result = cur.fetchone()
            
            if result:
                # Update existing terminal data
                execute_sql(cur, f"""
                    UPDATE terminal
                    SET terminal_data = {Json(data)}
                    WHERE terminal_id = '{current_user.id}'
                """, commit=True, connection=conn)
            else:
                # Create new terminal data
                execute_sql(cur, f"""
                    INSERT INTO terminal (terminal_id, terminal_data)
                    VALUES ('{current_user.id}', {Json(data)})
                """, commit=True, connection=conn)
            
            cur.close()
            conn.close()
            
            return {"message": "Terminal data updated successfully"}, 200
            
        except Exception as e:
            return {"error": str(e)}, 500



@rest_api.route('/api/v1/payments-by-terminal', methods=['GET'])
class PaymentsByTerminal(Resource):
    """
    Retrieves payments data filtered by terminal_id
    
    This endpoint returns payments where the authenticated user is either:
    - the seller (owner of the searchable items that received payments)
    - the buyer (user who made payments for searchable items)
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/v1/payments-by-terminal" -H "Authorization: <token>"
    """
    @token_required
    @track_metrics('payments_by_terminal')
    def get(self, current_user, request_origin='unknown'):
        try:
            receipts = get_receipts(user_id=current_user.id)
            return {
                'receipts': receipts,
                'count': len(receipts)
            }, 200
            
        except Exception as e:
            print(f"Error retrieving receitps by terminal: {str(e)}")
            return {"error": str(e)}, 500


@rest_api.route('/api/v1/withdrawals-by-terminal', methods=['GET'])
class WithdrawalsByTerminal(Resource):
    """
    Retrieves withdrawal data for the authenticated user
    
    This endpoint returns all withdrawals made by the authenticated user.
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/v1/withdrawals-by-terminal" -H "Authorization: <token>"
    """
    @token_required
    @track_metrics('withdrawals_by_terminal')
    def get(self, current_user, request_origin='unknown'):
        try:
            # Initialize transactions list
            withdrawals = []
            
            # Get withdrawal records for the authenticated user
            withdrawal_records = get_data_from_kv(type='withdrawal', fkey=str(current_user.id))
            for withdrawal in withdrawal_records:
                # Normalize withdrawal data
                currency = withdrawal.get('currency', 'sats')
                if currency == 'sats':
                
                    withdrawal_public = {
                        'id': withdrawal.get('pkey', ''),
                        'type': 'withdrawal',
                        'amount': int(withdrawal.get('amount', 0)),
                        'fee_sat': int(withdrawal.get('fee_sat', 0)),
                        'value_sat': int(withdrawal.get('value_sat', 0)),
                        'timestamp': get_withdrawal_timestamp(withdrawal.get('status', [])),
                        'status': get_withdrawal_status(withdrawal.get('status', [])),
                        'currency': currency,
                    }
                elif currency == 'usdt':
                    withdrawal_public = {
                        'id': withdrawal.get('pkey', ''),
                        'type': 'withdrawal',
                        'amount': int(withdrawal.get('amount', 0)),
                        'timestamp': get_withdrawal_timestamp(withdrawal.get('status', [])),
                        'status': get_withdrawal_status(withdrawal.get('status', [])),
                        'currency': currency,
                    }
                withdrawal_record = {
                    "public": withdrawal_public,
                }
                
                withdrawals.append(withdrawal_record)
            
            return {
                'withdrawals': withdrawals,
                'count': len(withdrawals)
            }, 200
            
        except Exception as e:
            print(f"Error retrieving withdrawals by terminal: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/payments-by-searchable/<string:searchable_id>', methods=['GET'])
class PaymentsBySearchable(Resource):
    """
    Retrieves payments data filtered by searchable_id
    
    This endpoint returns payments for a specific searchable item.
    Optional terminal_id parameter can filter by seller or buyer.
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/v1/payments-by-searchable/123?terminal_id=456"
    """
    @token_optional
    @track_metrics('payments_by_searchable')
    def get(self, searchable_id, current_user=None, visitor_id=None, request_origin='unknown'):
        try:
            receipts = get_receipts(user_id=current_user.id, searchable_id=searchable_id)
            return {
                'receipts': receipts,
                'count': len(receipts)
            }, 200
            
        except Exception as e:
            print(f"Error retrieving payments by searchable: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rating/searchable/<int:searchable_id>', methods=['GET'])
class SearchableRating(Resource):
    """
    Retrieves rating data for a specific searchable item
    
    This endpoint returns the average rating and count of ratings for a searchable item.
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/v1/rating/searchable/123"
    """
    @token_optional
    @track_metrics('searchable_rating')
    def get(self, searchable_id, current_user=None, visitor_id=None, request_origin='unknown'):
        try:
            # Get payments for this searchable item with ratings
            payments = get_data_from_kv(type='payment', fkey=str(searchable_id))
            
            # Extract ratings from payments
            ratings = []
            for payment in payments:
                rating = payment.get('rating')
                if rating is not None:  # Only include if rating exists
                    try:
                        rating_value = float(rating)
                        if 0 <= rating_value <= 5:  # Validate rating range
                            ratings.append(rating_value)
                    except (ValueError, TypeError):
                        # Skip invalid ratings
                        continue
            
            # Calculate average rating
            if ratings:
                average_rating = sum(ratings) / len(ratings)
            else:
                average_rating = 0
            
            return {
                'average_rating': round(average_rating, 1),
                'rating_count': len(ratings),
            }, 200
            
        except Exception as e:
            print(f"Error retrieving ratings for searchable {searchable_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rating/terminal/<int:terminal_id>', methods=['GET'])
class TerminalRating(Resource):
    """
    Retrieves aggregated rating data for all searchables by a terminal
    
    This endpoint returns the average rating and count across all searchables
    published by the specified terminal.
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/v1/rating/terminal/456"
    """
    @token_optional
    @track_metrics('terminal_rating')
    def get(self, terminal_id, current_user=None, visitor_id=None, request_origin='unknown'):
        try:
            # Get all searchables published by this terminal
            terminal_searchable_ids = get_searchableIds_by_user(terminal_id)
            
            if not terminal_searchable_ids:
                # No searchables found for this terminal
                return {
                    'terminal_id': terminal_id,
                    'average_rating': 0,
                    'rating_count': 0,
                    'searchable_count': 0
                }, 200
            
            # Convert all elements in the list to strings to ensure consistency
            terminal_searchable_ids = [str(id) for id in terminal_searchable_ids]
            
            # Initialize variables to calculate aggregate rating
            all_ratings = []
            rated_searchables = set()
            
            # Get payments for all searchables published by this terminal
            payments = get_data_from_kv(type='payment', fkey=terminal_searchable_ids)
            
            for payment in payments:
                rating = payment.get('rating')
                searchable_id = payment.get('searchable_id')
                if rating is not None and searchable_id is not None:  # Only include if rating exists
                    try:
                        rating_value = float(rating)
                        if 0 <= rating_value <= 5:  # Validate rating range
                            all_ratings.append(rating_value)
                            rated_searchables.add(searchable_id)
                    except (ValueError, TypeError):
                        # Skip invalid ratings
                        continue
            
            # Calculate average rating
            if all_ratings:
                average_rating = sum(all_ratings) / len(all_ratings)
            else:
                average_rating = 0
            
            return {
                'average_rating': round(average_rating, 1),
                'rating_count': len(all_ratings),
            }, 200
            
        except Exception as e:
            print(f"Error retrieving ratings for terminal {terminal_id}: {str(e)}")
            return {"error": str(e)}, 500


def get_delivery_info(require_address, current_user):
    if str(require_address).lower() == 'true':
        if current_user:
            return get_terminal(current_user.id) # todo: to test, perhaps need to use string
        else:
            raise ValueError("User is not authenticated")
    else:
        return {}


def insert_invoice_record(invoice_id, searchable_id, invoice_record):
    """
    Insert an invoice record into the database
    
    Args:
        invoice_id (str): The ID of the invoice
        searchable_id (str): The ID of the searchable item
        invoice_record (dict): The invoice data to store
        
    Returns:
        bool: True if successful, False otherwise
        
    Raises:
        Exception: If there's an error during database operation
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        execute_sql(cur, f"""
            INSERT INTO kv (type, pkey, fkey, data)
            VALUES ('invoice', '{invoice_id}', '{searchable_id}', {Json(invoice_record)})
        """, commit=True, connection=conn)
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error inserting invoice record: {str(e)}")
        if 'conn' in locals() and conn:
            try:
                conn.rollback()
                conn.close()
            except:
                pass
        raise

@rest_api.route('/api/v1/create-invoice', methods=['POST'])
class CreateInvoiceV1(Resource):
    """
    Creates a payment invoice - either Lightning Network or Stripe
    
    Supports both authenticated users and visitors
    
    Parameters:
        - searchable_id: id of the searchable item
        - address: optional address for shipping
        - tel: optional phone number
        - redirect_url: optional URL to redirect after payment
        - invoice_type: "lightning" or "stripe" to determine payment method
        - success_url: URL to redirect after successful payment (for Stripe)
        - cancel_url: URL to redirect after cancelled payment (for Stripe)
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
            print(f"require_address: {require_address}")
            print(f"searchable_data: {searchable_data}")
            delivery_info = get_delivery_info(require_address, current_user)
            
            
            # Calculate invoice details using our new function
            invoice_details = calc_invoice(searchable_data, selections)
            
            amount_sats = invoice_details["amount_sats"]
            amount_usd_cents = invoice_details["amount_usd_cents"]
            description = invoice_details["description"]

            # ======= end of get searchable data =======
            
            if invoice_type == 'lightning':
                response = create_lightning_invoice(
                        amount=amount_sats
                    )

                # Check if invoice ID exists
                if 'id' not in response:
                    return {"error": "failed to create invoice, please try again later"}, 500
                
                # Store invoice record
                invoice_record = {
                    "amount": int(amount_sats),
                    "buyer_id": str(buyer_id),
                    "timestamp": int(time.time()),
                    "searchable_id": str(searchable_id),
                    "invoice_id": response['id'],
                    "address": delivery_info.get('address', ''),
                    "tel": delivery_info.get('tel', ''),
                    "invoice_type": "lightning",
                    "description": description,  # Add description to the stored record
                    "selections": selections,
                    "buyer_paid_amount": int(amount_sats),
                    "buyer_paid_currency": 'sats',
                }
                
                # Use the helper function to insert the record
                insert_invoice_record(response['id'], searchable_id, invoice_record)
                
                return response, 200
                
            elif invoice_type == 'stripe':
                # Process Stripe checkout
                success_url = data.get('success_url')
                cancel_url = data.get('cancel_url')
                # Get item name
                item_name = searchable_data.get('payloads', {}).get('public', {}).get('title', f'Item #{searchable_id}')
                # Create Stripe checkout session
                amount_usd_cents_with_fee =  int(amount_usd_cents * 1.035)
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
                
                invoice_record = {
                    "amount": round(amount_usd_cents_with_fee/100, 2),
                    "buyer_id": str(buyer_id),
                    "timestamp": int(time.time()),
                    "searchable_id": str(searchable_id),
                    "invoice_id": session.id,
                    "address": delivery_info.get('address', ''),
                    "tel": delivery_info.get('tel', ''),
                    "invoice_type": "stripe",
                    "description": description,
                    "selections": selections,
                    "buyer_paid_amount": round(amount_usd_cents_with_fee/100, 2),
                    "buyer_paid_currency": 'usdt',
                }
                

                insert_invoice_record(session.id, searchable_id, invoice_record)
                
                return {
                    'url': session.url,
                    'session_id': session.id
                }, 200
            else:
                return {"error": "Invalid invoice type. Must be 'lightning' or 'stripe'"}, 400
            
        except Exception as e:
            print(f"Error creating invoice: {str(e)}")
            return {"error": str(e)}, 500

