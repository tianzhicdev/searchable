# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from flask import request
from flask_restx import Resource
from psycopg2.extras import Json
import geohash2
import math

# Import rest_api and get_db_connection from __init__
from . import rest_api
from .routes import get_db_connection, token_required

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

@rest_api.route('/api/searchable/search', methods=['GET'])
class SearchSearchables(Resource):
    """
    Search for searchable items based on location and optional query terms
    
    Example curl request:
    curl -X GET "http://localhost:5000/api/searchable/search?lat=37.7749&long=-122.4194&max_distance=5000&page_number=1&page_size=10"
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
                params['max_distance']
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
        query_term = request.args.get('query_term', '')  # todo: Not used yet as per instructions
        
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
    
    def _query_database(self, search_geohash_prefix, lat, lng, max_distance):
        """Query database for results and filter by actual distance"""
        # Log query parameters for debugging
        print(f"Search parameters:")
        print(f"  Geohash prefix: {search_geohash_prefix}")
        print(f"  Coordinates: ({lat}, {lng})")
        print(f"  Max distance: {max_distance} meters")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get all items with matching geohash prefix (rough filter)
        query = """
            SELECT si.searchable_id, si.searchable_data, sg.latitude, sg.longitude, sg.geohash
            FROM searchable_items si
            JOIN searchable_geo sg ON si.searchable_id = sg.searchable_id
            WHERE sg.geohash LIKE %s;
        """
        
        cur.execute(query, (search_geohash_prefix + '%',))
        db_results = cur.fetchall()
        
        # Post-process results to filter by actual distance
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
                filtered_results.append(item_data)
        
        # Sort results by distance
        filtered_results.sort(key=lambda x: x['distance'])
        
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