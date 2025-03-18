from flask import request
from flask_restx import Resource
from psycopg2.extras import Json
import geohash2
from .routes import rest_api, get_db_connection

@rest_api.route('/api/searchable', methods=['POST'])
class CreateSearchable(Resource):
    """
       Creates a new searchable by taking JSON input and adds to searchable database
    """

    def post(self):
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