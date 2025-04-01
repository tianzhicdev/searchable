import re
from flask import request, Response
import json
from flask_restx import Resource
import math
from prometheus_client import Counter, Histogram, Summary, generate_latest, REGISTRY
import geohash2
from . import rest_api
from .routes import token_required
from .helper import (
    get_db_connection,
    pay_lightning_invoice, 
    decode_lightning_invoice, 
    check_payment, 
    get_terminal, 
    get_searchableIds_by_user, 
    get_data_from_kv, 
    check_balance,
    execute_sql,
    Json
)

# Define Prometheus metrics
searchable_requests = Counter('searchable_v2_requests_total', 'Total number of searchable API v2 requests', ['endpoint', 'method', 'status'])
searchable_latency = Histogram('searchable_v2_request_latency_seconds', 'Request latency in seconds for v2 API', ['endpoint'])
search_results_count = Summary('searchable_v2_search_results_count', 'Number of search results returned in v2 API')

@rest_api.route('/api/v1/searchable/<int:searchable_id>', methods=['GET'])
class GetSearchableItem(Resource):
    """
    Retrieves a specific searchable item by its ID
    """
    def get(self, searchable_id):
        with searchable_latency.labels('get_searchable_item_v2').time():
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
                    searchable_requests.labels('get_searchable_item_v2', 'GET', 404).inc()
                    return {"error": "Searchable item not found"}, 404
                    
                searchable_id, searchable_data = result
                
                # Combine the data
                item_data = searchable_data
                item_data['searchable_id'] = searchable_id
                
                cur.close()
                conn.close()
                
                searchable_requests.labels('get_searchable_item_v2', 'GET', 200).inc()
                return item_data, 200
                
            except Exception as e:
                searchable_requests.labels('get_searchable_item_v2', 'GET', 500).inc()
                return {"error": str(e)}, 500

@rest_api.route('/api/v1/searchable/create', methods=['POST'])
class CreateSearchable(Resource):
    """
    Creates a new searchable item
    """
    @token_required
    def post(self, current_user):
        with searchable_latency.labels('create_searchable_v2').time():
            print(f"Creating searchable for user: {current_user.id} {current_user.username}")
            conn = None
            try:
                data = request.get_json()  # Get JSON data from request
                if not data:
                    searchable_requests.labels('create_searchable_v2', 'POST', 400).inc()
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
                        searchable_requests.labels('create_searchable_v2', 'POST', 400).inc()
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
                searchable_requests.labels('create_searchable_v2', 'POST', 201).inc()
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
                
                searchable_requests.labels('create_searchable_v2', 'POST', 500).inc()
                return {"error": str(e), "error_details": error_traceback}, 500

@rest_api.route('/api/v1/searchable/search', methods=['GET'])
class SearchSearchables(Resource):
    """
    Search for searchable items based on location and optional query terms
    """
    def get(self):
        with searchable_latency.labels('search_searchables_v2').time():
            try:
                # Parse and validate request parameters
                params = self._parse_request_params()
                if 'error' in params:
                    searchable_requests.labels('search_searchables_v2', 'GET', 400).inc()
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
                
                # Record search results count
                search_results_count.observe(total_count)
                
                # Apply pagination after filtering by actual distance
                paginated_results = self._apply_pagination(results, params['page_number'], params['page_size'])
                
                # # Enrich paginated results with usernames
                # self._enrich_results_with_usernames(paginated_results)
                
                # Format and return response
                searchable_requests.labels('search_searchables_v2', 'GET', 200).inc()
                return self._format_response(paginated_results, params['page_number'], params['page_size'], total_count), 200
                
            except Exception as e:
                searchable_requests.labels('search_searchables_v2', 'GET', 500).inc()
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
            filtered_results.sort(key=lambda x: (-x['match_score'], x['distance']))
        elif query_term:
            filtered_results.sort(key=lambda x: -x['match_score'])
        # If using location but no query, already sorted by distance in SQL
        
        cur.close()
        conn.close()
        
        return filtered_results, len(filtered_results)
    
    def _query_searchable_geo(self, cur, lat, lng, max_distance, where_clause):
        """Query searchable_geo table using lat/long coordinates"""
        # Use a more efficient query using a WITH clause to calculate distance first
        # query = f"""
        #     WITH distance_calc AS (
        #         SELECT 
        #           s.searchable_id,
        #           s.searchable_data,
        #           ( 6371000 * acos( cos( radians({lat}) ) * 
        #             cos( radians( sg.latitude ) ) * 
        #             cos( radians( sg.longitude ) - radians({lng}) ) + 
        #             sin( radians({lat}) ) * 
        #             sin( radians( sg.latitude ) ) 
        #           ) ) AS distance
        #         FROM searchables s
        #         JOIN searchable_geo sg ON s.searchable_id = sg.searchable_id
        #         WHERE {where_clause} 
        #         AND sg.latitude BETWEEN {lat} - ({max_distance} / 111111) AND {lat} + ({max_distance} / 111111)
        #         AND sg.longitude BETWEEN {lng} - ({max_distance} / (111111 * cos(radians({lat})))) AND {lng} + ({max_distance} / (111111 * cos(radians({lat}))))
        #     )
        #     SELECT * FROM distance_calc
        #     WHERE distance <= {max_distance}
        #     ORDER BY distance
        # """
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

@rest_api.route('/api/v1/searchable/<int:searchable_id>', methods=['GET'])
class GetSearchableItem(Resource):
    """
    Retrieves a specific searchable item by its ID
    """
    def get(self, searchable_id):
        with searchable_latency.labels('get_searchable_item_v2').time():
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
                    searchable_requests.labels('get_searchable_item_v2', 'GET', 404).inc()
                    return {"error": "Searchable item not found"}, 404
                    
                searchable_id, searchable_data = result
                
                # Combine the data
                item_data = searchable_data
                item_data['searchable_id'] = searchable_id
                
                cur.close()
                conn.close()
                
                searchable_requests.labels('get_searchable_item_v2', 'GET', 200).inc()
                return item_data, 200
                
            except Exception as e:
                searchable_requests.labels('get_searchable_item_v2', 'GET', 500).inc()
                return {"error": str(e)}, 500


# POST /api/v1/searchable/create
# Class: CreateSearchable
# Purpose: Creates a new searchable item
# Authentication: Required

# GET /api/v1/searchable/search
# Class: SearchSearchables
# Purpose: Search for searchable items based on location and optional query terms
# Authentication: not required
# Parameters:
    #   - lat: latitude of the user's location
    #   - lng: longitude of the user's location
    #   - max_distance: maximum distance in meters from the user's location
    #   - query_term: optional query term for searching
    #   - filters: optional filters for searching
    #   - page_number: optional page number for pagination
    #   - page_size: optional page size for pagination
    #   - use_location: optional boolean to use location-based search


# PUT /api/v1/searchable/remove/{searchable_id}
# Class: RemoveSearchableItem
# Purpose: Soft removes a searchable item by setting is_removed flag to true
# Authentication: Required


# GET /api/v1/balance
# Class: BalanceResource
# Purpose: Get user's balance by calculating payments and withdrawals
# Authentication: Required


# POST /api/v1/withdrawal
# Class: WithdrawFunds
# Purpose: Processes a withdrawal request via Lightning Network
# Authentication: Required


# GET /metrics
# Class: MetricsResource
# Purpose: Exposes Prometheus metrics for monitoring

# POST /api/v1/create-invoice
# Class: CreateInvoice
# Purpose: Creates a Lightning Network invoice via BTCPay Server
# Authentication: Optional
# parameters:
    #   - amount: amount to be paid
    #   - searchable_id: id of the searchable item
    #   - buyer_id: id of the buyer/visitor get visitor id from header

    # get from profile:
        #   - address: optional address for the invoice
        #   - tel: optional phone number for the invoice


# GET /api/v1/check-payment/{invoice_id}
# Purpose: Checks the status of a payment via BTCPay Server
# Authentication: Not required


# GET /api/v1/payments-by-user
# Purpose: Retrieves payments data filtered by searchable_id or user's role
# Authentication: Required

# GET /api/v1/payments-by-searchable/{searchable_id}
# Authentication: Not required
# parameters:
    #   - terminal_id: terminal_id could be seller or buyer


@rest_api.route('/api/v1/terminal', methods=['GET'])
class GetUserTerminal(Resource):
    """
    Retrieves terminal data for the authenticated user
    """
    @token_required
    def get(self, current_user):
        with searchable_latency.labels('get_terminal').time():
            try:
                # Get profile data using the helper function
                terminal_data = get_terminal(current_user.id)
                
                if not terminal_data:
                    searchable_requests.labels('get_terminal', 'GET', 404).inc()
                    return {"error": "Terminal not found"}, 404
                
                searchable_requests.labels('get_terminal', 'GET', 200).inc()
                return terminal_data, 200
                
            except Exception as e:
                searchable_requests.labels('get_terminal', 'GET', 500).inc()
                return {"error": str(e)}, 500


@rest_api.route('/api/v1/terminal', methods=['PUT'])
class UpdateUserTerminal(Resource):
    """
    Creates or updates terminal data for the authenticated user
    """
    @token_required
    def put(self, current_user):
        with searchable_latency.labels('update_terminal').time():
            try:
                # Get the request data
                data = request.get_json()
                
                if not data:
                    searchable_requests.labels('update_terminal', 'PUT', 400).inc()
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
                
                searchable_requests.labels('update_terminal', 'PUT', 200).inc()
                return {"message": "Terminal data updated successfully"}, 200
                
            except Exception as e:
                searchable_requests.labels('update_terminal', 'PUT', 500).inc()
                return {"error": str(e)}, 500