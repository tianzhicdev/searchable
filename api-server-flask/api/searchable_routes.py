# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import re
from flask import request
from flask_restx import Resource
from psycopg2.extras import Json
import geohash2
import math

# Import rest_api and get_db_connection from __init__
from . import rest_api
from .routes import get_db_connection, token_required


@rest_api.route('/api/searchable-item/<int:searchable_id>', methods=['GET'])
class GetSearchableItem(Resource):
    """
    Retrieves a specific searchable item by its ID
    """
    @token_required
    def get(self, current_user, searchable_id):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Query to get the searchable item and its geo data
            cur.execute("""
                SELECT si.searchable_id, si.searchable_data, sg.latitude, sg.longitude
                FROM searchable_items si
                LEFT JOIN searchable_geo sg ON si.searchable_id = sg.searchable_id
                WHERE si.searchable_id = %s
            """, (searchable_id,))
            
            result = cur.fetchone()
            
            if not result:
                return {"error": "Searchable item not found"}, 404
                
            searchable_id, searchable_data, latitude, longitude = result
            
            # Combine the data
            item_data = searchable_data
            item_data['searchable_id'] = searchable_id
            
            # Add geo data if available
            if latitude is not None and longitude is not None:
                item_data['latitude'] = latitude
                item_data['longitude'] = longitude
            
            cur.close()
            conn.close()
            
            return item_data, 200
            
        except Exception as e:
            return {"error": str(e)}, 500


@rest_api.route('/api/searchable', methods=['POST'])
class CreateSearchable(Resource):
    """
       Creates a new searchable by taking JSON input and adds to searchable database
    """
    @token_required
    def post(self, current_user):
        print(f"Creating searchable for user: {current_user}")
        data = request.get_json()  # Get JSON data from request
        if not data:
            return {"error": "Invalid input"}, 400

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Ensure user_id is part of the searchable data
            data['user_id'] = current_user.id
            
            # First insert into searchable_items table
            cur.execute(
                "INSERT INTO searchable_items (searchable_data) VALUES (%s) RETURNING searchable_id;",
                (Json(data),)
            )
            searchable_id = cur.fetchone()[0]
            
            # Then insert geo data if available
            if 'latitude' in data and 'longitude' in data:
                latitude = float(data['latitude'])
                longitude = float(data['longitude'])
                
                geo_hash = geohash2.encode(latitude, longitude, precision=9)
                
                # Insert into searchable_geo table
                cur.execute(
                    "INSERT INTO searchable_geo (searchable_id, latitude, longitude, geohash) VALUES (%s, %s, %s, %s);",
                    (searchable_id, latitude, longitude, geo_hash)
                )
                print(f"Added searchable {searchable_id} with coordinates ({latitude}, {longitude})")
            else:
                return {"error": "Latitude and longitude are required"}, 400
            
            conn.commit()
            cur.close()
            conn.close()
            return {"searchable_id": searchable_id}, 201
        except Exception as e:
            return {"error": str(e)}, 500

@rest_api.route('/api/searchable/user', methods=['GET'])
class UserSearchables(Resource):
    """
    Returns all searchable items posted by the current user
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/searchable/user" -H "Authorization: <token>"
    """
    @token_required
    def get(self, current_user):
        print(f"Fetching searchable items for user: {current_user}")
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Query to get all searchable items created by this user
            cur.execute("""
                SELECT si.searchable_id, si.searchable_data, sg.latitude, sg.longitude
                FROM searchable_items si
                LEFT JOIN searchable_geo sg ON si.searchable_id = sg.searchable_id
                WHERE si.searchable_data->>'user_id' = %s
                ORDER BY si.searchable_id DESC
            """, (str(current_user.id),))
            
            results = []
            for row in cur.fetchall():
                searchable_id, searchable_data, latitude, longitude = row
                
                # Combine the data
                item = searchable_data.copy() if searchable_data else {}
                item['searchable_id'] = searchable_id
                
                # Add geo data if available
                if latitude is not None and longitude is not None:
                    item['latitude'] = latitude
                    item['longitude'] = longitude
                
                results.append(item)
            
            cur.close()
            conn.close()
            
            return {
                "success": True,
                "count": len(results),
                "results": results
            }, 200
            
        except Exception as e:
            print(f"Error fetching user searchables: {str(e)}")
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
        print(f"Searching for searchable items for user: {current_user}")
        try:
            # Parse and validate request parameters
            params = self._parse_request_params()
            if 'error' in params:
                return params, 400
            
            # Determine geohash precision based on max_distance
            precision = self._determine_geohash_precision(params['max_distance'])
            
            # Generate geohash for the search point with dynamic precision
            # Handle case where precision can be 0
            if precision > 0:
                search_geohash_prefix = geohash2.encode(params['lat'], params['lng'], precision=precision)
            else:
                search_geohash_prefix = ""
            
            # Query database for results
            results, total_count = self._query_database(
                search_geohash_prefix, 
                params['lat'], 
                params['lng'], 
                params['max_distance'],
                params['query_term']
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
    
    def _determine_geohash_precision(self, max_distance):
        """Determine appropriate geohash precision based on max_distance"""
        # Approximate precision mapping:
        # 0: ~20000km, 1: ~5000km, 2: ~1250km, 3: ~156km, 4: ~39km, 5: ~5km, 6: ~1.2km, 7: ~153m, 8: ~38m, 9: ~5m
        if max_distance >= 20000000:  # 20000km (global scale)
            precision = 0
        elif max_distance >= 5000000:  # 5000km
            precision = 1
        elif max_distance >= 1250000:  # 1250km
            precision = 2
        elif max_distance >= 156000:  # 156km
            precision = 3
        elif max_distance >= 39000:  # 39km
            precision = 4
        elif max_distance >= 5000:  # 5km
            precision = 5
        elif max_distance >= 1200:  # 1.2km
            precision = 6
        elif max_distance >= 153:  # 153m
            precision = 7
        elif max_distance >= 38:  # 38m
            precision = 8
        else:  # < 38m
            precision = 9
        return precision
    
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
        title = item_data.get('title', '')
        description = item_data.get('description', '')
        
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
    
    def _query_database(self, search_geohash_prefix, lat, lng, max_distance, query_term):
        """Query database for results and filter by actual distance and search relevance"""
        # Log query parameters for debugging
        print(f"Search parameters:")
        print(f"  Geohash prefix: {search_geohash_prefix}")
        print(f"  Coordinates: ({lat}, {lng})")
        print(f"  Max distance: {max_distance} meters")
        print(f"  Query term: {query_term}")
        
        # Tokenize query term
        query_tokens = self._tokenize_text(query_term)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get all items with matching geohash prefix (rough filter)
        query = """
            SELECT si.searchable_id, si.searchable_data, sg.latitude, sg.longitude, sg.geohash
            FROM searchable_items si
            JOIN searchable_geo sg ON si.searchable_id = sg.searchable_id
            WHERE sg.geohash LIKE %s
            AND (si.searchable_data->>'is_removed')::boolean IS NOT TRUE;
        """
        
        cur.execute(query, (search_geohash_prefix + '%',))
        db_results = cur.fetchall()
        
        # Post-process results to filter by actual distance and calculate match scores
        filtered_results = []
        for result in db_results:
            searchable_id, searchable_data, item_lat, item_lng, geohash = result
            
            # Calculate actual distance
            distance = self._calculate_distance(lat, lng, item_lat, item_lng)
            
            # Only include if within max_distance
            if distance <= max_distance:
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

# @rest_api.route('/api/searchable/<int:searchable_id>', methods=['GET'])
# class GetSearchableItem(Resource):
#     """
#     Retrieves a single searchable item by ID
    
#     Example curl request:
#     curl -X GET "http://localhost:5000/api/searchable/123" -H "Authorization: <token>"
#     """
#     @token_required
#     def get(self, current_user, searchable_id):
#         print(f"Fetching searchable item {searchable_id} for user: {current_user}")
#         try:
#             conn = get_db_connection()
#             cur = conn.cursor()
            
#             # Query to get the searchable item by ID
#             cur.execute("""
#                 SELECT si.searchable_id, si.searchable_data, sg.latitude, sg.longitude
#                 FROM searchable_items si
#                 LEFT JOIN searchable_geo sg ON si.searchable_id = sg.searchable_id
#                 WHERE si.searchable_id = %s
#             """, (searchable_id,))
            
#             row = cur.fetchone()
#             if not row:
#                 cur.close()
#                 conn.close()
#                 return {"error": "Searchable item not found"}, 404
                
#             searchable_id, searchable_data, latitude, longitude = row
            
#             # Combine the data
#             item = searchable_data.copy() if searchable_data else {}
#             item['searchable_id'] = searchable_id
            
#             # Add geo data if available
#             if latitude is not None and longitude is not None:
#                 item['latitude'] = latitude
#                 item['longitude'] = longitude
            
#             # Calculate distance if user's location is in searchable data
#             if current_user.id == int(item.get('user_id', -1)):
#                 # It's the user's own item, so no need to calculate distance
#                 pass
#             elif 'latitude' in item and 'longitude' in item:
#                 # For other users viewing this item, we could calculate distance
#                 # but we'd need their current location
#                 pass
                
#             cur.close()
#             conn.close()
            
#             return item, 200
            
#         except Exception as e:
#             print(f"Error fetching searchable item: {str(e)}")
#             return {"error": str(e)}, 500

@rest_api.route('/api/remove-searchable-item/<int:searchable_id>', methods=['PUT'])
class RemoveSearchableItem(Resource):
    """
    Soft removes a searchable item by setting is_removed flag to true
    
    Example curl request:
    curl -X PUT "http://localhost:5000/api/searchable/123/remove" -H "Authorization: <token>"
    """
    @token_required
    def put(self, current_user, searchable_id):
        print(f"Soft removing searchable item {searchable_id} by user: {current_user}")
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # First check if the item exists and belongs to the current user
            cur.execute("""
                SELECT searchable_data
                FROM searchable_items
                WHERE searchable_id = %s
            """, (searchable_id,))
            
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return {"error": "Searchable item not found"}, 404
                
            searchable_data = row[0]
            
            # Check if the item belongs to the current user
            if int(searchable_data.get('user_id', -1)) != current_user.id:
                cur.close()
                conn.close()
                return {"error": "You don't have permission to remove this item"}, 403
            
            # Update the searchable_data to mark it as removed
            searchable_data['is_removed'] = True
            
            # Update the record in the database
            cur.execute("""
                UPDATE searchable_items
                SET searchable_data = %s
                WHERE searchable_id = %s
            """, (Json(searchable_data), searchable_id))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {"success": True, "message": "Item has been removed"}, 200
            
        except Exception as e:
            print(f"Error removing searchable item: {str(e)}")
            return {"error": str(e)}, 500