import os
import re
from flask import request, Response
import time
from flask_restx import Resource
from psycopg2.extras import Json
import math
from prometheus_client import Counter, Histogram, Summary, generate_latest, REGISTRY
import datetime

# Import rest_api and get_db_connection from __init__
from . import rest_api
from .routes import get_db_connection, token_required
from .helper import pay_lightning_invoice, decode_lightning_invoice
import json
# Define Prometheus metrics
searchable_requests = Counter('searchable_requests_total', 'Total number of searchable API requests', ['endpoint', 'method', 'status'])
searchable_latency = Histogram('searchable_request_latency_seconds', 'Request latency in seconds', ['endpoint'])
search_results_count = Summary('search_results_count', 'Number of search results returned')
            # Make request to BTCPay Server

BTCPAY_SERVER_GREENFIELD_API_KEY = os.environ.get('BTCPAY_SERVER_GREENFIELD_API_KEY')
print("BTCPAY_SERVER_GREENFIELD_API_KEY: " + BTCPAY_SERVER_GREENFIELD_API_KEY)

BTC_PAY_URL = "https://generous-purpose.metalseed.io"
STORE_ID = os.environ.get('BTCPAY_STORE_ID')
print("BTCPAY_STORE_ID: " + STORE_ID)

def check_balance(user_id):
    """
    Calculate user balance from payments and withdrawals
    
    Args:
        user_id: The user ID to check balance for
        
    Returns:
        float: The user's current balance in sats
    """
    try:
        # Step 1: Get all searchables published by this user using utility function
        searchable_ids = get_searchableIds_by_user(user_id)
        
        # Step 2: Calculate balance from payments and withdrawals
        balance = 0
        
        # If user has searchables, look for payments in a single query
        if searchable_ids:
            payment_records = get_data_from_kv(type='payment', fkey=searchable_ids)
            for record in payment_records:
                amount = record.get('amount')
                # Add payment amount to balance
                if amount is not None:
                    balance += float(amount)
        
        # Get all withdrawals for this user using utility function
        withdrawal_records = get_data_from_kv(type='withdrawal', fkey=str(user_id))
        for record in withdrawal_records:
            amount = record.get('amount')
            # Subtract withdrawal amount from balance
            if amount is not None:
                balance -= float(amount)
        
        return balance
    except Exception as e:
        print(f"Error calculating balance: {str(e)}")
        return 0

def execute_sql(cursor, sql, commit=False, connection=None):
    """
    Execute SQL with logging and return results if applicable
    """
    print(f"Executing SQL: {sql.replace(chr(10), ' ')}")
    cursor.execute(sql)
    if commit and connection:
        connection.commit()
    return cursor


def get_searchableIds_by_user(user_id):
    """
    Retrieves all searchable IDs for a specific user
    
    Args:
        user_id: The user ID to query for
        
    Returns:
        List of searchable IDs belonging to the user
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Query searchables with terminal_id matching the user
        execute_sql(cur, f"""
            SELECT searchable_id
            FROM searchables
            WHERE searchable_data->>'terminal_id' = '{str(user_id)}'
        """)
        
        searchable_ids = [row[0] for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        return searchable_ids
    except Exception as e:
        print(f"Error retrieving searchable IDs for user {user_id}: {str(e)}")
        return []


def get_data_from_kv(type=None, pkey=None, fkey=None):
    """
    Retrieves data from the key-value store based on specified parameters
    
    Args:
        type: The type of data to retrieve (required) - can be a single value or list
        pkey: The primary key to filter by (optional) - can be a single value or list
        fkey: The foreign key to filter by (optional) - can be a single value or list
        
    Returns:
        List of data records matching the criteria, or empty list if none found
    """
    try:
        if not type:
            print("Error: type parameter is required for get_data_from_kv")
            return []
        
        # Build query dynamically based on provided parameters
        query = "SELECT data, pkey, fkey FROM kv WHERE "
        
        # Handle type parameter (single value or list)
        if isinstance(type, list):
            if not type:  # Empty list check
                print("Error: type list cannot be empty")
                return []
            type_values = "', '".join([str(t) for t in type])
            query += f"type IN ('{type_values}')"
        else:
            query += f"type = '{type}'"
        
        # Handle pkey parameter (single value or list)
        if pkey:
            if isinstance(pkey, list):
                if pkey:  # Only if list is not empty
                    pkey_values = "', '".join([str(p) for p in pkey])
                    query += f" AND pkey IN ('{pkey_values}')"
            else:
                query += f" AND pkey = '{pkey}'"
        
        # Handle fkey parameter (single value or list)
        if fkey:
            if isinstance(fkey, list):
                if fkey:  # Only if list is not empty
                    fkey_values = "', '".join([str(f) for f in fkey])
                    query += f" AND fkey IN ('{fkey_values}')"
            else:
                query += f" AND fkey = '{fkey}'"
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Execute the query with string interpolation
        execute_sql(cur, query)
        
        results = []
        for row in cur.fetchall():
            data = row[0].copy() if row[0] else {}  # Make a copy to avoid modifying the original
            data['pkey'] = row[1]
            data['fkey'] = row[2]
            results.append(data)
            
        cur.close()
        conn.close()
        
        return results
    except Exception as e:
        print(f"Error retrieving data from KV store: {str(e)}")
        return []


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
            print(f"Creating searchable for user: {current_user}")
            conn = None
            try:
                data = request.get_json()  # Get JSON data from request
                print(f"Received data: {data}")
                
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
                if 'payloads' in data and 'public' in data['payloads']:
                    public_payload = data['payloads']['public']
                    if 'latitude' in public_payload and 'longitude' in public_payload:
                        latitude = float(public_payload['latitude'])
                        longitude = float(public_payload['longitude'])
                
                # Insert into searchables table with dedicated lat/long columns
                print("Executing database insert...")
                sql = f"INSERT INTO searchables (searchable_data, latitude, longitude) VALUES ({Json(data)}, {latitude}, {longitude}) RETURNING searchable_id;"
                execute_sql(cur, sql)
                searchable_id = cur.fetchone()[0]
                
                print(f"Added searchable {searchable_id}")
                
                conn.commit()
                cur.close()
                conn.close()
                searchable_requests.labels('create_searchable', 'POST', 201).inc()
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
                
                searchable_requests.labels('create_searchable', 'POST', 500).inc()
                return {"error": str(e), "error_details": error_traceback}, 500

# @rest_api.route('/api/searchable/user', methods=['GET'])
# class UserSearchables(Resource):
#     """
#     Returns all searchable items posted by the current user
    
#     Example curl request:
#     curl -X GET "http://localhost:5000/api/searchable/user" -H "Authorization: <token>"
#     """
#     def get(self, current_user):
#         with searchable_latency.labels('user_searchables').time():
#             print(f"Fetching searchable items for user: {current_user}")
#             try:
#                 conn = get_db_connection()
#                 cur = conn.cursor()
                
#                 # Query to get all searchable items created by this user
#                 execute_sql(cur, f"""
#                     SELECT searchable_id, searchable_data
#                     FROM searchables
#                     WHERE (searchable_data->>'terminal_id') = '{str(current_user.id)}'
#                     ORDER BY searchable_id DESC
#                 """)
                
#                 results = []
#                 for row in cur.fetchall():
#                     searchable_id, searchable_data = row
                    
#                     # Combine the data
#                     item = searchable_data.copy() if searchable_data else {}
#                     item['searchable_id'] = searchable_id
                    
#                     # Add username (we already know it's the current user)
#                     item['username'] = current_user.username
                    
#                     results.append(item)
                
#                 cur.close()
#                 conn.close()
                
#                 searchable_requests.labels('user_searchables', 'GET', 200).inc()
#                 return {
#                     "success": True,
#                     "count": len(results),
#                     "results": results
#                 }, 200
                
#             except Exception as e:
#                 print(f"Error fetching user searchables: {str(e)}")
#                 searchable_requests.labels('user_searchables', 'GET', 500).inc()
#                 return {"error": str(e)}, 500


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
        print(f"Search parameters:")
        print(f"  Query term: {query_term}")
        print(f"  Internal search term: {internal_search_term}")
        
        # Using location-based search?
        using_location = lat is not None and lng is not None and max_distance is not None
        if using_location:
            print(f"  Coordinates: ({lat}, {lng})")
            print(f"  Max distance: {max_distance} meters")
        else:
            print("  Not using location-based filtering")
        
        # Tokenize query term
        query_tokens = self._tokenize_text(query_term)
        
        # Parse internal search term
        field_conditions = self._parse_internal_search_term(internal_search_term)
        print(f"  Field conditions: {field_conditions}")
        
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
                print(f"Error removing searchable item: {str(e)}")
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
            print(f"Error retrieving from KV store: {str(e)}")
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
            
            # Upsert operation (insert or update)
            execute_sql(cur, f"""
                INSERT INTO kv (type, pkey, fkey, data)
                VALUES ('{type}', '{pkey}', '{fkey}', {Json(data)})
                ON CONFLICT (pkey, fkey, type) 
                DO UPDATE SET data = {Json(data)}
            """, commit=True, connection=conn)
            
            cur.close()
            conn.close()
            
            return {"success": True, "message": "Data stored successfully"}, 200
            
        except Exception as e:
            print(f"Error storing in KV store: {str(e)}")
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
            balance = check_balance(current_user.id)
            return {"balance": balance}, 200
            
        except Exception as e:
            print(f"Error calculating balance: {str(e)}")
            return {"error": str(e)}, 500



@rest_api.route('/api/withdrawal', methods=['POST'])
class WithdrawFunds(Resource):
    """
    Processes a withdrawal request via Lightning Network
    """
    @token_required
    def post(self, current_user):
        with searchable_latency.labels('withdrawal').time():
            try:
                data = request.get_json()
                
                if not data or 'invoice' not in data:
                    searchable_requests.labels('withdrawal', 'POST', 400).inc()
                    return {"error": "Lightning invoice is required"}, 400
                
                invoice = data['invoice']
                
                # Decode the invoice to get the amount
                try:
                    # Use our decode function to get invoice details without paying
                    decoded_invoice = decode_lightning_invoice(invoice)
                    if 'error' in decoded_invoice:
                        searchable_requests.labels('withdrawal', 'POST', 400).inc()
                        return {"error": f"Failed to decode invoice: {decoded_invoice['error']}"}, 400
                    
                    # Check if num_satoshis exists in the decoded invoice
                    if 'num_satoshis' not in decoded_invoice:
                        searchable_requests.labels('withdrawal', 'POST', 400).inc()
                        return {"error": "Invoice missing amount information"}, 400
                        
                    # Get amount in satoshis from decoded invoice
                    amount_to_withdraw = int(decoded_invoice['num_satoshis'])
                except Exception as e:
                    print(f"Error decoding invoice: {str(e)}")
                    searchable_requests.labels('withdrawal', 'POST', 400).inc()
                    return {"error": "Invalid invoice format or unable to decode"}, 400
                
                # Check if user has enough balance
                current_balance = check_balance(current_user.id)
                print(f"Current balance: {current_balance}")
                
                # todo: add a bit for fees
                if current_balance < amount_to_withdraw:
                    searchable_requests.labels('withdrawal', 'POST', 400).inc()
                    return {
                        "error": "Insufficient funds", 
                        "available_balance": current_balance, 
                        "withdrawal_amount": amount_to_withdraw
                    }, 400
                
                # Record the withdrawal in the database first
                conn = get_db_connection()
                cur = conn.cursor()
                
                # Prepare withdrawal data
                withdrawal_data = {
                    'invoice': invoice,
                    'status': [('pending', int(time.time()))],
                    'user_id': current_user.id
                }
                
                # Store withdrawal record
                execute_sql(cur, f"""
                    INSERT INTO kv (type, fkey, pkey, data)
                    VALUES ('withdrawal', '{current_user.id}', '{invoice}', {Json(withdrawal_data)})
                    RETURNING pkey
                """, commit=True, connection=conn)
                
                # Process payment using the helper function
                # # todo: this should run in a background thread
                # payment_response = pay_lightning_invoice(invoice)
                # fee_sat = payment_response.get('fee_sat', 0)
                # value_sat = payment_response.get('value_sat', 0)
                
                # # Update the withdrawal record with payment response if available
                # if payment_response:
                #     # withdrawal_data['btcpay_response'] = payment_response
                    
                #     execute_sql(cur, f"""
                #         UPDATE kv 
                #         SET data = {Json({
                #             **withdrawal_data,
                #             'fee_sat': fee_sat,
                #             'value_sat': value_sat,
                #             'amount': int(value_sat)+ int(fee_sat),
                #             'status': withdrawal_data['status'] + [(payment_response.get('status', 'unknown'), int(time.time()))]
                #         })}
                #         WHERE type = 'withdrawal' AND pkey = '{invoice}'
                #     """, commit=True, connection=conn)
                
                cur.close()
                conn.close()
                
                searchable_requests.labels('withdrawal', 'POST', 200).inc()
                return {"recorded": True}, 200
                
            except Exception as e:
                print(f"Error processing withdrawal: {str(e)}")
                searchable_requests.labels('withdrawal', 'POST', 500).inc()
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

    def post(self):
        try:
            data = request.get_json()
            
            if not data or 'amount' not in data or 'searchable_id' not in data:
                return {"error": "Amount and searchable_id are required"}, 400
            if 'buyer_id' not in data:
                data['buyer_id'] = "unknown"
            
            # Get the data from the request
            amount = data['amount']
            searchable_id = data['searchable_id']
            item_name = data.get('item_name', f"Item #{searchable_id}")
            buyer_id = data.get('buyer_id', "unknow")
            
            # Prepare payload for BTCPay Server
            payload = {
                "amount": amount,
                "currency": "SATS",
                "metadata": {
                    "orderId": searchable_id,
                    "itemName": item_name,
                    "buyerName": buyer_id,
                },
                "checkout": {
                    "expirationMinutes": 60,
                    "monitoringMinutes": 60,
                    "paymentMethods": ["BTC-LightningNetwork"],
                    "redirectURL": data.get('redirect_url', '')
                }
            }
            
            response = requests.post(
                f"{BTC_PAY_URL}/api/v1/stores/{STORE_ID}/invoices",
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'token {BTCPAY_SERVER_GREENFIELD_API_KEY}'
                }
            )
            
            if response.status_code != 200:
                return {"error": f"Failed to create invoice: {response.text}"}, 500
                
            invoice_data = response.json()
            # Log raw invoice data for debugging purposes
            print(f"Raw invoice data: {json.dumps(invoice_data, indent=2)}")
            
            # Record the invoice in our database
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Store invoice record
            invoice_record = {
                "amount": int(amount),
                "buyer_id": str(data['buyer_id']),
                "timestamp": int(datetime.datetime.now().timestamp()),
                "searchable_id": str(searchable_id),
                "invoice_id": invoice_data['id']
            }
            
            execute_sql(cur, f"""
                INSERT INTO kv (type, pkey, fkey, data)
                VALUES ('invoice', '{invoice_data['id']}', '{searchable_id}', {Json(invoice_record)})
            """, commit=True, connection=conn)
            
            cur.close()
            conn.close()
            
            # Return the invoice data to the client
            return invoice_data, 200
            
        except Exception as e:
            print(f"Error creating invoice: {str(e)}")
            return {"error": str(e)}, 500


# todo: fe shoudl not call it
@rest_api.route('/api/check-payment/<string:invoice_id>/<string:buyer_id>', methods=['GET'])
class CheckPayment(Resource):
    """
    Checks the status of a payment via BTCPay Server
    """
    def get(self, invoice_id, buyer_id):
        try:
            # BTC Pay Server configuration
            # Make request to BTCPay Server to check payment status
            import requests
            response = requests.get(
                f"{BTC_PAY_URL}/api/v1/stores/{STORE_ID}/invoices/{invoice_id}",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'token {BTCPAY_SERVER_GREENFIELD_API_KEY}'
                }
            )
            
            if response.status_code != 200:
                return {"error": f"Failed to check payment status: {response.text}"}, 500
                
            invoice_data = response.json()
            
            # If payment is settled, record it in our database
            if invoice_data['status'] == 'Settled' or invoice_data['status'] == 'Complete':
                # Get the searchable_id from the invoice record using utility function
                invoice_records = get_data_from_kv(type='invoice', pkey=invoice_id)
                
                if invoice_records:
                    invoice_record = invoice_records[0]
                    searchable_id = invoice_record.get('fkey')
                    
                    # Store payment record
                    payment_record = {
                        "amount": int(invoice_data.get('amount', invoice_record.get('amount'))),
                        "status": invoice_data['status'],
                        "buyer_id": str(buyer_id), # todo: this could be visitor
                        "timestamp": int(time.time()),
                        "searchable_id": str(searchable_id)
                    }
                    
                    conn = get_db_connection()
                    cur = conn.cursor()
                    execute_sql(cur, f"""
                        INSERT INTO kv (type, pkey, fkey, data)
                        VALUES ('payment', '{invoice_id}', '{searchable_id}', {Json(payment_record)})
                        ON CONFLICT (type, pkey, fkey) 
                        DO UPDATE SET data = {Json(payment_record)}
                    """, commit=True, connection=conn)
                    cur.close()
                    conn.close()
            
            # Return the payment status to the client
            return invoice_data, 200
            
        except Exception as e:
            print(f"Error checking payment status: {str(e)}")
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
                print(f"Error retrieving transaction history: {str(e)}")
                searchable_requests.labels('transaction_history', 'GET', 500).inc()
                return {"error": str(e)}, 500

