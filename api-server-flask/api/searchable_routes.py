# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import re
from flask import request, Response
from flask_restx import Resource
from psycopg2.extras import Json
import math
from prometheus_client import Counter, Histogram, Summary, generate_latest, REGISTRY

# Import rest_api and get_db_connection from __init__
from . import rest_api
from .routes import get_db_connection, token_required

# Define Prometheus metrics
searchable_requests = Counter('searchable_requests_total', 'Total number of searchable API requests', ['endpoint', 'method', 'status'])
searchable_latency = Histogram('searchable_request_latency_seconds', 'Request latency in seconds', ['endpoint'])
search_results_count = Summary('search_results_count', 'Number of search results returned')
search_distance = Histogram('search_distance_meters', 'Search distance in meters', buckets=[100, 500, 1000, 5000, 10000, 50000])


@rest_api.route('/api/searchable-item/<int:searchable_id>', methods=['GET'])
class GetSearchableItem(Resource):
    """
    Retrieves a specific searchable item by its ID
    """
    @token_required
    def get(self, current_user, searchable_id):
        with searchable_latency.labels('get_searchable_item').time():
            try:
                conn = get_db_connection()
                cur = conn.cursor()
                
                # Query to get the searchable item
                cur.execute("""
                    SELECT searchable_id, searchable_data
                    FROM searchables
                    WHERE searchable_id = %s
                """, (searchable_id,))
                
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
                    cur.execute("""
                        SELECT username FROM users WHERE id = %s
                    """, (item_data['user_id'],))
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
                data['terminal_id'] = current_user.id
                
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
                cur.execute(
                    "INSERT INTO searchables (searchable_data, latitude, longitude) VALUES (%s, %s, %s) RETURNING searchable_id;",
                    (Json(data), latitude, longitude)
                )
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

@rest_api.route('/api/searchable/user', methods=['GET'])
class UserSearchables(Resource):
    """
    Returns all searchable items posted by the current user
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/searchable/user" -H "Authorization: <token>"
    """
    @token_required
    def get(self, current_user):
        with searchable_latency.labels('user_searchables').time():
            print(f"Fetching searchable items for user: {current_user}")
            try:
                conn = get_db_connection()
                cur = conn.cursor()
                
                # Query to get all searchable items created by this user
                cur.execute("""
                    SELECT searchable_id, searchable_data
                    FROM searchables
                    WHERE (searchable_data->>'terminal_id') = %s
                    ORDER BY searchable_id DESC
                """, (str(current_user.id),))
                
                results = []
                for row in cur.fetchall():
                    searchable_id, searchable_data = row
                    
                    # Combine the data
                    item = searchable_data.copy() if searchable_data else {}
                    item['searchable_id'] = searchable_id
                    
                    # Add username (we already know it's the current user)
                    item['username'] = current_user.username
                    
                    results.append(item)
                
                cur.close()
                conn.close()
                
                searchable_requests.labels('user_searchables', 'GET', 200).inc()
                return {
                    "success": True,
                    "count": len(results),
                    "results": results
                }, 200
                
            except Exception as e:
                print(f"Error fetching user searchables: {str(e)}")
                searchable_requests.labels('user_searchables', 'GET', 500).inc()
                return {"error": str(e)}, 500


@rest_api.route('/api/searchable/search', methods=['GET'])
class SearchSearchables(Resource):
    """
    Search for searchable items based on location and optional query terms
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/searchable/search?lat=37.7749&long=-122.4194&max_distance=5000&page_number=1&page_size=10&query_term=coffee%20shop"
    """
    @token_required
    def get(self, current_user):
        with searchable_latency.labels('search_searchables').time():
            print(f"Searching for searchable items for user: {current_user}")
            try:
                # Parse and validate request parameters
                params = self._parse_request_params()
                if 'error' in params:
                    searchable_requests.labels('search_searchables', 'GET', 400).inc()
                    return params, 400
                
                # Record search distance metric
                search_distance.observe(params['max_distance'])
                
                # Query database for results
                results, total_count = self._query_database(
                    params['lat'], 
                    params['lng'], 
                    params['max_distance'],
                    params['query_term']
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
        max_distance = request.args.get('max_distance', 10000)  # Default to 10km if not specified
        page_number = int(request.args.get('page_number', 1))
        page_size = int(request.args.get('page_size', 10))
        query_term = request.args.get('query_term', '')
        
        # Validate required parameters
        if not lat or not lng:
            return {"error": "Latitude and longitude are required"}
        
        try:
            lat = float(lat)
            lng = float(lng)
            max_distance = float(max_distance)
        except ValueError:
            return {"error": "Invalid coordinate or distance format"}
        
        return {
            'lat': lat,
            'lng': lng,
            'max_distance': max_distance,
            'page_number': page_number,
            'page_size': page_size,
            'query_term': query_term
        }
    
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
    
    def _query_database(self, lat, lng, max_distance, query_term):
        """Query database for results and filter by actual distance and search relevance"""
        # Log query parameters for debugging
        print(f"Search parameters:")
        print(f"  Coordinates: ({lat}, {lng})")
        print(f"  Max distance: {max_distance} meters")
        print(f"  Query term: {query_term}")
        
        # Tokenize query term
        query_tokens = self._tokenize_text(query_term)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Use a more efficient query using a WITH clause to calculate distance first
        query = """
            WITH distance_calc AS (
                SELECT 
                  searchable_id,
                  searchable_data,
                  latitude,
                  longitude,
                  ( 6371000 * acos( cos( radians(%s) ) * 
                    cos( radians( latitude ) ) * 
                    cos( radians( longitude ) - radians(%s) ) + 
                    sin( radians(%s) ) * 
                    sin( radians( latitude ) ) 
                  ) ) AS distance
                FROM searchables
                WHERE (searchable_data->>'is_removed')::boolean IS NOT TRUE
                -- Pre-filter by bounding box (much faster than calculating exact distances for all rows)
                AND latitude BETWEEN %s - (%s / 111111) AND %s + (%s / 111111)
                AND longitude BETWEEN %s - (%s / (111111 * cos(radians(%s)))) AND %s + (%s / (111111 * cos(radians(%s))))
            )
            SELECT * FROM distance_calc
            WHERE distance <= %s
            ORDER BY distance
        """
        
        # Parameters for the query
        query_params = [
            lat, lng, lat,                              # Distance calculation (first part)
            lat, max_distance, lat, max_distance,       # Latitude bounds
            lng, max_distance, lat, lng, max_distance, lat,  # Longitude bounds
            max_distance                                # Final distance filter
        ]
        
        cur.execute(query, query_params)
        db_results = cur.fetchall()
        
        # Process results and calculate match scores
        filtered_results = []
        for result in db_results:
            searchable_id, searchable_data, item_lat, item_lng, distance = result
            
            item_data = dict(searchable_data)
            item_data['distance'] = distance
            item_data['searchable_id'] = searchable_id
            
            # Calculate match score for search relevance
            match_score = self._calculate_match_score(query_tokens, item_data)
            item_data['match_score'] = match_score
            
            filtered_results.append(item_data)
        
        # Sort results first by match score (descending), then by distance (ascending)
        filtered_results.sort(key=lambda x: (-x['match_score'], x['distance']))
        
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
        
        terminal_ids_list = list(terminal_ids)
        placeholders = ','.join(['%s'] * len(terminal_ids_list))
        cur.execute(f"SELECT id, username FROM users WHERE id IN ({placeholders})", terminal_ids_list)
        
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
                cur.execute("""
                    SELECT searchable_data
                    FROM searchables
                    WHERE searchable_id = %s
                """, (searchable_id,))
                
                row = cur.fetchone()
                if not row:
                    searchable_requests.labels('remove_searchable_item', 'PUT', 404).inc()
                    cur.close()
                    conn.close()
                    return {"error": "Searchable item not found"}, 404
                    
                searchable_data = row[0]
                
                # Check if the item belongs to the current user
                if int(searchable_data.get('user_id', -1)) != current_user.id:
                    searchable_requests.labels('remove_searchable_item', 'PUT', 403).inc()
                    cur.close()
                    conn.close()
                    return {"error": "You don't have permission to remove this item"}, 403
                
                # Update the searchable_data to mark it as removed
                searchable_data['is_removed'] = True
                
                # Update the record in the database
                cur.execute("""
                    UPDATE searchables
                    SET searchable_data = %s
                    WHERE searchable_id = %s
                """, (Json(searchable_data), searchable_id))
                
                conn.commit()
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
    @token_required
    def get(self, current_user):
        """
        Retrieve data from key-value store
        """
        try:
            type = request.args.get('type')
            pkey = request.args.get('pkey')
            fkey = request.args.get('fkey')
            
            # Build query dynamically based on provided parameters
            query = "SELECT data, pkey, fkey FROM kv WHERE 1=1"
            params = []
            
            if type:
                query += " AND type = %s"
                params.append(type)
                
            if pkey:
                query += " AND pkey = %s"
                params.append(pkey)
                
            if fkey:
                query += " AND fkey = %s"
                params.append(fkey)
            
            # If no parameters provided, return error
            if not (type or pkey or fkey):
                return {"error": "At least one parameter (type, pkey, fkey) is required"}, 400
                
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute(query, tuple(params))
            
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
    
    @token_required
    def put(self, current_user):
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
            cur.execute("""
                INSERT INTO kv (type, pkey, fkey, data)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (pkey, fkey) 
                DO UPDATE SET data = %s, type = %s
            """, (type, pkey, fkey, Json(data), Json(data), type))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {"success": True, "message": "Data stored successfully"}, 200
            
        except Exception as e:
            print(f"Error storing in KV store: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/metrics')
class MetricsResource(Resource):
    """
    Exposes Prometheus metrics for monitoring
    """
    def get(self):
        metrics_data = generate_latest(REGISTRY)
        return Response(metrics_data, mimetype='text/plain; charset=utf-8')