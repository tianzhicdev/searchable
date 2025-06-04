import os
import re
from flask import request, Response
import time
from flask_restx import Resource
import math
from prometheus_client import Counter, Histogram, Summary, generate_latest, REGISTRY

# Import rest_api and get_db_connection from __init__
from . import rest_api
from .routes import token_required
# Import moved utility functions from helper
from .helper import (
    create_lightning_invoice,
    get_balance_by_currency,
    get_db_connection,
    check_payment, 
    get_terminal, 
    get_searchableIds_by_user, 
    get_data_from_kv, 
    execute_sql,
    Json,
    setup_logger
)

# Set up the logger
logger = setup_logger(__name__, 'searchable_routes.log')

# Define Prometheus metrics
searchable_requests = Counter('searchable_requests_total', 'Total number of searchable API requests', ['endpoint', 'method', 'status'])
searchable_latency = Histogram('searchable_request_latency_seconds', 'Request latency in seconds', ['endpoint'])
search_results_count = Summary('search_results_count', 'Number of search results returned')

BTCPAY_SERVER_GREENFIELD_API_KEY = os.environ.get('BTCPAY_SERVER_GREENFIELD_API_KEY')
logger.info("BTCPAY_SERVER_GREENFIELD_API_KEY: " + BTCPAY_SERVER_GREENFIELD_API_KEY)

BTC_PAY_URL = "https://generous-purpose.metalseed.io"
STORE_ID = os.environ.get('BTCPAY_STORE_ID')
logger.info("BTCPAY_STORE_ID: " + STORE_ID)

@rest_api.route('/api/searchable-item/<int:searchable_id>', methods=['GET'])
class GetSearchableItem(Resource):
    """
    Retrieves a specific searchable item by its ID
    """
    def get(self, searchable_id):
        with searchable_latency.labels('get_searchable_item').time():
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
                    searchable_requests.labels('get_searchable_item', 'GET', 404).inc()
                    return {"error": "Searchable item not found"}, 404
                    
                searchable_id, searchable_data = result
                
                # Combine the data
                item_data = searchable_data
                item_data['searchable_id'] = searchable_id
                
                # Get username for the user_id
                if 'user_id' in item_data:
                    execute_sql(cur, f"""
                        SELECT username FROM users WHERE id = {item_data['user_id']}
                    """)
                    user_result = cur.fetchone()
                    if user_result:
                        item_data['username'] = user_result[0]
                
                cur.close()
                conn.close()
                
                searchable_requests.labels('get_searchable_item', 'GET', 200).inc()
                return item_data, 200
                
            except Exception as e:
                searchable_requests.labels('get_searchable_item', 'GET', 500).inc()
                return {"error": str(e)}, 500

@rest_api.route('/api/searchable', methods=['POST'], strict_slashes=False)
class CreateSearchable(Resource):
    """
       Creates a new searchable by taking JSON input and adds to searchable database
    """
    @token_required
    def post(self, current_user):
        with searchable_latency.labels('create_searchable').time():
            logger.info(f"Creating searchable for user: {current_user}")
            conn = None
            try:
                data = request.get_json()  # Get JSON data from request
                logger.debug(f"Received data: {data}")
                
                if not data:
                    searchable_requests.labels('create_searchable', 'POST', 400).inc()
                    return {"error": "Invalid input"}, 400

                conn = get_db_connection()
                cur = conn.cursor()
                
                # Add terminal info to the searchable data
                data['terminal_id'] = str(current_user.id)
                
                # Extract latitude and longitude from the data for dedicated columns
                latitude = None
                longitude = None
                try:
                    latitude = float(data['payloads']['public']['latitude'])
                    longitude = float(data['payloads']['public']['longitude'])
                except:
                    logger.warning("No latitude or longitude found in the data")
                    pass
                
                # Insert into searchables table with dedicated lat/long columns
                logger.info("Executing database insert...")
                # Use NULL for latitude/longitude if they are None
                lat_value = "NULL" if latitude is None else latitude
                lng_value = "NULL" if longitude is None else longitude
                sql = f"INSERT INTO searchables (searchable_data, latitude, longitude) VALUES ({Json(data)}, {lat_value}, {lng_value}) RETURNING searchable_id;"
                execute_sql(cur, sql)
                searchable_id = cur.fetchone()[0]
                
                logger.info(f"Added searchable {searchable_id}")
                
                conn.commit()
                cur.close()
                conn.close()
                searchable_requests.labels('create_searchable', 'POST', 201).inc()
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
                
                searchable_requests.labels('create_searchable', 'POST', 500).inc()
                return {"error": str(e), "error_details": error_traceback}, 500

@rest_api.route('/api/searchable/search', methods=['GET'])
class SearchSearchables(Resource):
    """
    Search for searchable items based on location and optional query terms
    
    """
    def get(self):
        with searchable_latency.labels('search_searchables').time():
            try:
                # Parse and validate request parameters
                params = self._parse_request_params()
                if 'error' in params:
                    searchable_requests.labels('search_searchables', 'GET', 400).inc()
                    return params, 400
                
                # Query database for results
                results, total_count = self._query_database(
                    params['lat'], 
                    params['lng'], 
                    params['max_distance'],
                    params['query_term'],
                    params['internal_search_term']
                )
                
                # Record search results count
                search_results_count.observe(total_count)
                
                # Apply pagination after filtering by actual distance
                paginated_results = self._apply_pagination(results, params['page_number'], params['page_size'])
                
                # Enrich paginated results with usernames
                self._enrich_results_with_usernames(paginated_results)
                
                # Format and return response
                searchable_requests.labels('search_searchables', 'GET', 200).inc()
                return self._format_response(paginated_results, params['page_number'], params['page_size'], total_count), 200
                
            except Exception as e:
                searchable_requests.labels('search_searchables', 'GET', 500).inc()
                return {"error": str(e)}, 500
    
    
    def _parse_request_params(self):
        """Parse and validate request parameters"""
        # Get parameters from request
        lat = request.args.get('lat')
        lng = request.args.get('long')
        max_distance_str = request.args.get('max_distance')  # Get as string first
        page_number = int(request.args.get('page_number', 1))
        page_size = int(request.args.get('page_size', 10))
        query_term = request.args.get('query_term', '')
        internal_search_term = request.args.get('internal_search_term', '')
        

        # Parse max_distance, setting to None if not provided
        max_distance = None
        if max_distance_str:
            try:
                max_distance = float(max_distance_str)
            except ValueError:
                return {"error": "Invalid distance format"}
        
        # Only validate lat/lng if max_distance is specified
        if max_distance is not None:
            if not lat or not lng:
                return {"error": "Latitude and longitude are required when max_distance is specified"}
            try:
                lat = float(lat)
                lng = float(lng)
            except ValueError:
                return {"error": "Invalid coordinate format"}
        else:
            # No location search, set to None
            lat = None
            lng = None
        
        return {
            'lat': lat,
            'lng': lng,
            'max_distance': max_distance,
            'page_number': page_number,
            'page_size': page_size,
            'query_term': query_term,
            'internal_search_term': internal_search_term
        }
    
    def _parse_internal_search_term(self, internal_search_term):
        """Parse internal search term format: fielda.fieldb.fieldc:value,fieldd.fielde.fieldf:value2"""
        if not internal_search_term:
            return []
        
        field_conditions = []
        
        # Split by comma to get individual field:value pairs
        pairs = internal_search_term.strip(',').split(',')
        
        for pair in pairs:
            if ':' not in pair:
                continue
            
            field_path, value = pair.split(':', 1)
            if not field_path or not value:
                continue
            
            # Split the field path by dots
            field_parts = field_path.split('.')
            field_conditions.append({
                'path': field_parts,
                'value': value
            })
        
        return field_conditions
    
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
                
        return score
    
    def _query_database(self, lat, lng, max_distance, query_term, internal_search_term=None):
        """Query database for results and filter by actual distance and search relevance"""
        # Log query parameters for debugging
        logger.info(f"Search parameters:")
        logger.info(f"  Query term: {query_term}")
        logger.info(f"  Internal search term: {internal_search_term}")
        
        # Using location-based search?
        using_location = lat is not None and lng is not None and max_distance is not None and max_distance != 100000000
        if using_location:
            logger.info(f"  Coordinates: ({lat}, {lng})")
            logger.info(f"  Max distance: {max_distance} meters")
        else:
            logger.info("  Not using location-based filtering")
        
        # Tokenize query term
        query_tokens = self._tokenize_text(query_term)
        
        # Parse internal search term
        field_conditions = self._parse_internal_search_term(internal_search_term)
        logger.info(f"  Field conditions: {field_conditions}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Base query with support for internal field search
        base_conditions = ["(searchable_data->>'is_removed')::boolean IS NOT TRUE"]
        
        # Add field conditions for internal search
        for condition in field_conditions:
            path = condition['path']
            value = condition['value']
            
            # Build the JSON path expression correctly for PostgreSQL
            json_path = 'searchable_data'
            for i, part in enumerate(path):
                if i == len(path) - 1:
                    # For the last part, use ->> to get text
                    json_path += f"->>'{part}'"
                else:
                    # For other parts, use -> to navigate
                    json_path += f"->'{part}'"
            
            # Add the condition with the value directly in the query
            base_conditions.append(f"{json_path} = '{value}'")
        
        # Join all conditions
        where_clause = " AND ".join(base_conditions)
        
        if using_location:
            # Use a more efficient query using a WITH clause to calculate distance first
            query = f"""
                WITH distance_calc AS (
                    SELECT 
                      searchable_id,
                      searchable_data,
                      latitude,
                      longitude,
                      ( 6371000 * acos( cos( radians({lat}) ) * 
                        cos( radians( latitude ) ) * 
                        cos( radians( longitude ) - radians({lng}) ) + 
                        sin( radians({lat}) ) * 
                        sin( radians( latitude ) ) 
                      ) ) AS distance
                    FROM searchables
                    WHERE {where_clause} 
                    AND latitude BETWEEN {lat} - ({max_distance} / 111111) AND {lat} + ({max_distance} / 111111)
                    AND longitude BETWEEN {lng} - ({max_distance} / (111111 * cos(radians({lat})))) AND {lng} + ({max_distance} / (111111 * cos(radians({lat}))))
                )
                SELECT * FROM distance_calc
                WHERE distance <= {max_distance}
                ORDER BY distance
            """
        else:
            # Query without location filtering
            query = f"""
                SELECT 
                  searchable_id,
                  searchable_data,
                  latitude,
                  longitude,
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
            searchable_id, searchable_data, item_lat, item_lng, distance = result
            
            item_data = dict(searchable_data)
            if distance is not None:
                item_data['distance'] = distance
            item_data['searchable_id'] = searchable_id
            
            # Calculate match score for search relevance
            match_score = self._calculate_match_score(query_tokens, item_data)
            item_data['match_score'] = match_score
            
            # Only include results with a match score if we have a query term
            if query_term and match_score == 0:
                continue
                
            filtered_results.append(item_data)
        
        # Sort results - by match score (if query provided), then by distance (if location provided)
        if query_term and using_location:
            filtered_results.sort(key=lambda x: (-x['match_score'], x['distance']))
        elif query_term:
            filtered_results.sort(key=lambda x: -x['match_score'])
        # If using location but no query, already sorted by distance in SQL
        
        cur.close()
        conn.close()
        
        return filtered_results, len(filtered_results)
    
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
            usernames[terminal_id] = username
            
        cur.close()
        conn.close()
        
        # Add username to each result
        for item in results:
            if 'terminal_id' in item and item['terminal_id'] in usernames:
                item['username'] = usernames[item['terminal_id']]

@rest_api.route('/api/remove-searchable-item/<int:searchable_id>', methods=['PUT'])
class RemoveSearchableItem(Resource):
    """
    Soft removes a searchable item by setting is_removed flag to true
    
    Example curl request:
    curl -X PUT "http://localhost:5000/api/searchable/123/remove" -H "Authorization: <token>"
    """
    @token_required
    def put(self, current_user, searchable_id):
        with searchable_latency.labels('remove_searchable_item').time():
            logger.info(f"Soft removing searchable item {searchable_id} by user: {current_user}")
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
                    searchable_requests.labels('remove_searchable_item', 'PUT', 404).inc()
                    cur.close()
                    conn.close()
                    return {"error": "Searchable item not found"}, 404
                    
                searchable_data = row[0]
                if str(searchable_data.get('terminal_id', -1)) != str(current_user.id):
                    searchable_requests.labels('remove_searchable_item', 'PUT', 403).inc()
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
                
                searchable_requests.labels('remove_searchable_item', 'PUT', 200).inc()
                return {"success": True, "message": "Item has been removed"}, 200
                
            except Exception as e:
                searchable_requests.labels('remove_searchable_item', 'PUT', 500).inc()
                logger.error(f"Error removing searchable item: {str(e)}")
                return {"error": str(e)}, 500

@rest_api.route('/api/kv', methods=['GET', 'PUT'])
class KvResource(Resource):
    """
    Key-value store for arbitrary data
    """
    def get(self):
        """
        Retrieve data from key-value store
        """
        try:
            type = request.args.get('type')
            pkey = request.args.get('pkey')
            fkey = request.args.get('fkey')
            
            # Build query dynamically based on provided parameters
            query = "SELECT data, pkey, fkey FROM kv WHERE 1=1"
            
            if type:
                query += f" AND type = '{type}'"
                
            if pkey:
                query += f" AND pkey = '{pkey}'"
                
            if fkey:
                query += f" AND fkey = '{fkey}'"
            
            # Add support for filtering on JSON fields inside data column
            # Get all query parameters that are not handled above
            json_filters = {}
            for key, value in request.args.items():
                if key not in ['type', 'pkey', 'fkey'] and value:
                    json_filters[key] = value
            
            # Add JSON field filters to the query
            for field, value in json_filters.items():
                query += f" AND data->>'{field}' = '{value}'"
            
            # If no parameters provided, return error
            if not (type or pkey or fkey or json_filters):
                return {"error": "At least one parameter (type, pkey, fkey, or data field) is required"}, 400
                
            conn = get_db_connection()
            cur = conn.cursor()
            
            execute_sql(cur, query)
            
            rows = cur.fetchall()
            cur.close()
            conn.close()
            
            if not rows:
                return {"error": "No matching records found"}, 404
                
            # Return all matching records with pkey and fkey
            result = []
            for row in rows:
                data = row[0]
                data['pkey'] = row[1]
                data['fkey'] = row[2]
                result.append(data)
                
            return {"data": result}, 200
            
        except Exception as e:
            logger.error(f"Error retrieving from KV store: {str(e)}")
            return {"error": str(e)}, 500
    

    def put(self):
        """
        Insert or update data in key-value store
        """
        try:
            type = request.args.get('type')
            pkey = request.args.get('pkey')
            fkey = request.args.get('fkey')
            
            if not all([type, pkey, fkey]):
                return {"error": "Missing required parameters (type, pkey, fkey)"}, 400
                
            data = request.get_json()
            if not data:
                return {"error": "No data provided"}, 400
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Check if record exists
            execute_sql(cur, f"""
                SELECT data FROM kv
                WHERE type = '{type}' AND pkey = '{pkey}' AND fkey = '{fkey}'
            """)
            
            existing_row = cur.fetchone()
            if existing_row:
                # Merge the existing data with new data
                existing_data = existing_row[0]
                merged_data = {**existing_data, **data}
                
                # Update with merged data
                execute_sql(cur, f"""
                    UPDATE kv
                    SET data = {Json(merged_data)}
                    WHERE type = '{type}' AND pkey = '{pkey}' AND fkey = '{fkey}'
                """, commit=True, connection=conn)
            else:
                # Insert new record (no existing data to merge)
                execute_sql(cur, f"""
                    INSERT INTO kv (type, pkey, fkey, data)
                    VALUES ('{type}', '{pkey}', '{fkey}', {Json(data)})
                """, commit=True, connection=conn)
            
            cur.close()
            conn.close()
            
            return {"success": True, "message": "Data stored successfully"}, 200
            
        except Exception as e:
            logger.error(f"Error storing in KV store: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/balance', methods=['GET'])
class BalanceResource(Resource):
    """
    Get user's balance by calculating payments and withdrawals
    """
    @token_required
    def get(self, current_user):
        """
        Calculate user balance from payments and withdrawals
        """
        try:
            balance = get_balance_by_currency(current_user.id)
            return balance, 200
            
        except Exception as e:
            logger.error(f"Error calculating balance: {str(e)}")
            return {"error": str(e)}, 500



@rest_api.route('/metrics')
class MetricsResource(Resource):
    """
    Exposes Prometheus metrics for monitoring
    """
    def get(self):
        metrics_data = generate_latest(REGISTRY)
        return Response(metrics_data, mimetype='text/plain; charset=utf-8')


@rest_api.route('/api/create-invoice', methods=['POST'])
class CreateInvoice(Resource):
    """
    Creates a Lightning Network invoice via BTCPay Server
    """
    @token_required
    def post(self, current_user):
        try:
            data = request.get_json()
            
            if not data or 'amount' not in data or 'searchable_id' not in data:
                return {"error": "Amount and searchable_id are required"}, 400
            
            # Get the data from the request
            amount = data['amount']
            searchable_id = data['searchable_id']
            buyer_id = str(current_user.id)
            
            # Get profile data using the reusable function
            profile_data = get_terminal(buyer_id)
            
            # Initialize address and tel variables from profile
            address = ''
            tel = ''
            
            if profile_data:
                address = profile_data.get('address', '')
                tel = profile_data.get('tel', '')
            
            # Use the common function for invoice creation
            return create_lightning_invoice(
                amount=amount,
                searchable_id=searchable_id,
                buyer_id=buyer_id,
                address=address,
                tel=tel,
                redirect_url=data.get('redirect_url', '')
            )
            
        except Exception as e:
            logger.error(f"Error creating invoice: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/create-invoice-visitor', methods=['POST'])
class CreateInvoiceVisitor(Resource):
    """
    Creates a Lightning Network invoice via BTCPay Server for unauthenticated visitors
    """
    def post(self):
        try:
            data = request.get_json()
            
            if not data or 'amount' not in data or 'searchable_id' not in data or 'buyer_id' not in data:
                return {"error": "data fields amount, searchable_id, and buyer_id are required"}, 400
            
            # Get the data from the request
            amount = data['amount']
            searchable_id = data['searchable_id']
            buyer_id = data['buyer_id']
            
            # Use the common function for invoice creation
            return create_lightning_invoice(
                amount=amount,
                searchable_id=searchable_id,
                buyer_id=buyer_id,
                address=data.get('address', ''),
                tel=data.get('tel', ''),
                redirect_url=data.get('redirect_url', '')
            )
            
        except Exception as e:
            logger.error(f"Error creating visitor invoice: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/check-payment/<string:invoice_id>/<string:buyer_id>', methods=['GET'])
class CheckPayment(Resource):
    """
    Checks the status of a payment via BTCPay Server
    """
    def get(self, invoice_id, buyer_id):
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

@rest_api.route('/api/transactions', methods=['GET'])
class TransactionHistory(Resource):
    """
    Retrieves complete transaction history for the current user, including payments and withdrawals
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/transactions" -H "Authorization: <token>"
    """
    @token_required
    def get(self, current_user):
        with searchable_latency.labels('transaction_history').time():
            try:
                # Initialize transactions list
                transactions = []
                
                # Get all searchables published by this user
                searchable_ids = get_searchableIds_by_user(current_user.id)
                
                # Get all payments for all user's searchables in a single query
                if searchable_ids:
                    payment_records = get_data_from_kv(type='payment', fkey=searchable_ids)
                    for payment in payment_records:
                        # Normalize payment data
                        transaction = {
                            'invoice_id': payment.get('pkey', ''),
                            'type': 'payment',
                            'amount': int(payment.get('amount', 0)),
                            'timestamp': payment.get('timestamp', ''),
                            'status': payment.get('status', 'unknown'),
                            'searchable_id': payment.get('fkey', ''),
                            'buyer_id': payment.get('buyer_id', '')
                        }
                        transactions.append(transaction)
                
                # Get all withdrawals for this user
                withdrawal_records = get_data_from_kv(type='withdrawal', fkey=str(current_user.id))
                for withdrawal in withdrawal_records:
                    # Normalize withdrawal data
                    transaction = {
                        'invoice': withdrawal.get('pkey', ''),
                        'type': 'withdrawal',
                        'amount': int(withdrawal.get('amount', "")),
                        'fee_sat': int(withdrawal.get('fee_sat', "")),
                        'value_sat': int(withdrawal.get('value_sat', "")),
                        'timestamp': int(payment.get('timestamp', '')),
                        'status': withdrawal.get('status', []),
                        'invoice': withdrawal.get('invoice', 'missing'),
                    }
                    transactions.append(transaction)
                
                # Monitor metrics
                searchable_requests.labels('transaction_history', 'GET', 200).inc()
                
                return {
                    'transactions': transactions
                }, 200
                
            except Exception as e:
                logger.error(f"Error retrieving transaction history: {str(e)}")
                searchable_requests.labels('transaction_history', 'GET', 500).inc()
                return {"error": str(e)}, 500

@rest_api.route('/api/payments-visitor', methods=['GET'])
class VisitorPaymentsResource(Resource):
    """
    Retrieves payments data for a visitor (non-authenticated user) filtered by buyer_id
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/payments-visitor?buyer_id=visitor_123&searchable_id=456"
    """
    def get(self):
        with searchable_latency.labels('get_payments_visitor').time():
            try:
                # Get buyer_id from query parameters
                buyer_id = request.args.get('buyer_id')
                searchable_id = request.args.get('searchable_id')
                
                if not buyer_id:
                    searchable_requests.labels('get_payments_visitor', 'GET', 400).inc()
                    return {"error": "buyer_id is required"}, 400
                
                # Filter payments by buyer_id and optionally by searchable_id
                if searchable_id:
                    # Get payments for specific buyer and searchable item
                    payment_records = get_data_from_kv(type='payment', fkey=searchable_id)
                    payment_records = [payment for payment in payment_records 
                                      if payment.get('buyer_id') == str(buyer_id)]
                else:
                    # Get all payments for this buyer
                    payment_records = get_data_from_kv(type='payment')
                    payment_records = [payment for payment in payment_records 
                                      if payment.get('buyer_id') == str(buyer_id)]
                
                # Monitor metrics
                searchable_requests.labels('get_payments_visitor', 'GET', 200).inc()
                
                return {
                    'payments': payment_records
                }, 200
                
            except Exception as e:
                logger.error(f"Error retrieving visitor payment history: {str(e)}")
                searchable_requests.labels('get_payments_visitor', 'GET', 500).inc()
                return {"error": str(e)}, 500


@rest_api.route('/api/payments', methods=['GET'])
class PaymentsResource(Resource):
    """
    Retrieves payments data filtered by searchable_id or user's role (buyer/seller)
    """
    @token_required
    def get(self, current_user):
        with searchable_latency.labels('get_payments').time():
            # todo: this is a mess, we should refactor it. the logic should be correct though
            try:
                # Check if filtering by specific searchable_id
                searchable_id = request.args.get('searchable_id')
                logger.info(f"searchable_id: {searchable_id}")

                user_published_searchable_ids = get_searchableIds_by_user(current_user.id)
                # Convert all elements in the list to strings to ensure consistency
                user_published_searchable_ids = [str(id) for id in user_published_searchable_ids]
                logger.info(f"user_published_searchable_ids: {user_published_searchable_ids}")
                
                if searchable_id and (searchable_id in user_published_searchable_ids):
                    logger.info(f"searchable_id is in user_published_searchable_ids")
                    # user is the seller
                    payment_records = get_data_from_kv(type='payment', fkey=searchable_id)
                    # Mark the current user as the seller for these payments
                    for payment in payment_records:
                        payment['seller_id'] = str(current_user.id)

                elif searchable_id:
                    # user is the buyer
                    # todo: to optimize - use db filters
                    payment_records = get_data_from_kv(type='payment')
                    payment_records = [payment for payment in payment_records 
                                     if payment.get('buyer_id') == str(current_user.id)] 
                    
                    # Mark the current user as the seller if they own the searchable item
                    for payment in payment_records:
                        if payment.get('fkey') in user_published_searchable_ids:
                            payment['seller_id'] = str(current_user.id)
                else:
                    # profile page
                    payment_records = []
                    # Get payments where user is seller (payments for their searchable items)
                    if user_published_searchable_ids:
                        seller_payments = get_data_from_kv(type='payment', fkey=user_published_searchable_ids)
                        for payment in seller_payments:
                            payment['seller_id'] = str(current_user.id)
                        payment_records.extend(seller_payments)
                    
                    # Get payments where user is buyer
                    buyer_payments = get_data_from_kv(type='payment')
                    # todo: to optimize - use db filters
                    buyer_payments = [payment for payment in buyer_payments 
                                     if payment.get('buyer_id') == str(current_user.id)]
                    payment_records.extend(buyer_payments)
                    

                # todo: we should only return the latest x payments, but that is a scalability issue
                # Record metrics
                searchable_requests.labels('get_payments', 'GET', 200).inc()
                
                return {
                    'payments': payment_records,
                }, 200
                
            except Exception as e:
                logger.error(f"Error retrieving payments: {str(e)}")
                searchable_requests.labels('get_payments', 'GET', 500).inc()
                return {"error": str(e)}, 500

@rest_api.route('/api/profile', methods=['GET', 'PUT'])
class ProfileResource(Resource):
    """
    Manages user profile data
    """
    @token_required
    def get(self, current_user):
        """
        Retrieves profile data for the authenticated user
        """
        try:
            profile_data = get_terminal(current_user.id)
            
            if not profile_data:
                searchable_requests.labels('get_profile', 'GET', 404).inc()
                return {"error": "Profile not found"}, 404
                
            searchable_requests.labels('get_profile', 'GET', 200).inc()
            return profile_data, 200
            
        except Exception as e:
            logger.error(f"Error retrieving profile: {str(e)}")
            searchable_requests.labels('get_profile', 'GET', 500).inc()
            return {"error": str(e)}, 500
    
    @token_required
    def put(self, current_user):
        """
        Creates or updates profile data for the authenticated user
        """
        try:
            data = request.get_json()
            
            if not data:
                searchable_requests.labels('update_profile', 'PUT', 400).inc()
                return {"error": "No profile data provided"}, 400
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Check if profile exists for this user
            execute_sql(cur, f"""
                SELECT data FROM profile
                WHERE terminal_id = {current_user.id}
            """)
            
            existing_profile = cur.fetchone()
            
            if existing_profile:
                # Update existing profile
                # Note: We're merging existing data with new data
                existing_data = existing_profile[0]
                merged_data = {**existing_data, **data}
                
                execute_sql(cur, f"""
                    UPDATE profile
                    SET data = {Json(merged_data)}
                    WHERE terminal_id = {current_user.id}
                """, commit=True, connection=conn)
            else:
                # Create new profile
                execute_sql(cur, f"""
                    INSERT INTO profile (terminal_id, data)
                    VALUES ({current_user.id}, {Json(data)})
                """, commit=True, connection=conn)
            
            cur.close()
            conn.close()
            
            searchable_requests.labels('update_profile', 'PUT', 200).inc()
            return {"success": True, "message": "Profile updated successfully"}, 200
            
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            searchable_requests.labels('update_profile', 'PUT', 500).inc()
            return {"error": str(e)}, 500
