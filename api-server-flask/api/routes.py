# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from datetime import datetime, timezone, timedelta

from functools import wraps
import geohash2
from flask import request
from flask_restx import Api, Resource, fields

import jwt

from .models import db, Users, JWTTokenBlocklist
from .config import BaseConfig
import requests
import math

# Import rest_api from __init__.py
# from . import rest_api

# from flask import Flask, request, jsonify, render_template
import psycopg2
from psycopg2.extras import Json
import json
from .searchable_routes import *


# Load database configuration from db_config.json
with open('db_config.json') as config_file:
    db_config = json.load(config_file)

# Database connection parameters
def get_db_connection():
    conn = psycopg2.connect(
        host=db_config['searchable']['db_host'],
        port=db_config['searchable']['db_port'],
        dbname=db_config['searchable']['db_name'],
        user=db_config['searchable']['db_user'],
        password=db_config['searchable']['db_password']
    )

    
    # Log connection details
    with conn.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user, inet_client_addr(), inet_client_port()")
        connection_details = cursor.fetchone()
        print(f"Connected to database: {connection_details[0]}")
        print(f"Connected as user: {connection_details[1]}")
        print(f"Client address: {connection_details[2]}")
        print(f"Client port: {connection_details[3]}")
    return conn

rest_api = Api(version="1.0", title="Users API")


"""
    Flask-Restx models for api request and response data
"""

signup_model = rest_api.model('SignUpModel', {"username": fields.String(required=True, min_length=2, max_length=32),
                                              "email": fields.String(required=True, min_length=4, max_length=64),
                                              "password": fields.String(required=True, min_length=4, max_length=16)
                                              })

login_model = rest_api.model('LoginModel', {"email": fields.String(required=True, min_length=4, max_length=64),
                                            "password": fields.String(required=True, min_length=4, max_length=16)
                                            })

user_edit_model = rest_api.model('UserEditModel', {"userID": fields.String(required=True, min_length=1, max_length=32),
                                                   "username": fields.String(required=True, min_length=2, max_length=32),
                                                   "email": fields.String(required=True, min_length=4, max_length=64)
                                                   })


"""
   Helper function for JWT token required
"""

def token_required(f):

    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        if "authorization" in request.headers:
            token = request.headers["authorization"]

        if not token:
            return {"success": False, "msg": "Valid JWT token is missing"}, 400

        try:
            data = jwt.decode(token, BaseConfig.SECRET_KEY, algorithms=["HS256"])
            current_user = Users.get_by_email(data["email"])

            if not current_user:
                return {"success": False,
                        "msg": "Sorry. Wrong auth token. This user does not exist."}, 400

            token_expired = db.session.query(JWTTokenBlocklist.id).filter_by(jwt_token=token).scalar()

            if token_expired is not None:
                return {"success": False, "msg": "Token revoked."}, 400

            if not current_user.check_jwt_auth_active():
                return {"success": False, "msg": "Token expired."}, 400

        except:
            return {"success": False, "msg": "Token is invalid"}, 400

        return f(current_user, *args, **kwargs)

    return decorator


"""
    Flask-Restx routes
"""



@rest_api.route('/api/searchable/search', methods=['GET'])
class SearchSearchables(Resource):
    """
    Search for searchable items based on location and optional query terms
    """

    def get(self):
        try:
            # Get parameters from request
            lat = request.args.get('lat')
            lng = request.args.get('long')
            max_distance = request.args.get('max_distance', 10000)  # Default to 10km if not specified
            page_number = int(request.args.get('page_number', 1))
            page_size = int(request.args.get('page_size', 10))
            query_term = request.args.get('query_term', '')  # Not used yet as per instructions
            
            # Validate required parameters
            if not lat or not lng:
                return {"error": "Latitude and longitude are required"}, 400
            
            try:
                lat = float(lat)
                lng = float(lng)
                max_distance = float(max_distance)
            except ValueError:
                return {"error": "Invalid coordinate or distance format"}, 400
            
            # Calculate offset for pagination
            offset = (page_number - 1) * page_size
            
            # Determine appropriate geohash precision based on max_distance
            # Approximate precision mapping:
            # 1: ~5000km, 2: ~1250km, 3: ~156km, 4: ~39km, 5: ~5km, 6: ~1.2km, 7: ~153m, 8: ~38m, 9: ~5m
            if max_distance >= 5000000:  # 5000km
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
            
            # Generate geohash for the search point with dynamic precision
            search_geohash_prefix = geohash2.encode(lat, lng, precision=precision)
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # First get items with matching geohash prefix (rough filter)
            query = """
                SELECT si.searchable_id, si.searchable_data, sg.latitude, sg.longitude, sg.geohash
                FROM searchable_items si
                JOIN searchable_geo sg ON si.searchable_id = sg.searchable_id
                WHERE sg.geohash LIKE %s
                LIMIT %s OFFSET %s;
            """
            
            cur.execute(query, (search_geohash_prefix + '%', page_size, offset))
            results = cur.fetchall()
            
            # Post-process results to filter by actual distance
            filtered_results = []
            for result in results:
                searchable_id, searchable_data, item_lat, item_lng, geohash = result
                
                # Calculate actual distance (using Haversine formula)
                # This is a simplified version - in production you might want a more accurate calculation
                earth_radius = 6371000  # meters
                lat1_rad = math.radians(lat)
                lat2_rad = math.radians(item_lat)
                lat_diff = math.radians(item_lat - lat)
                lng_diff = math.radians(item_lng - lng)
                
                a = (math.sin(lat_diff/2) * math.sin(lat_diff/2) +
                     math.cos(lat1_rad) * math.cos(lat2_rad) *
                     math.sin(lng_diff/2) * math.sin(lng_diff/2))
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                distance = earth_radius * c  # in meters
                
                # Only include if within max_distance
                if distance <= max_distance:
                    item_data = dict(searchable_data)
                    item_data['distance'] = distance
                    item_data['searchable_id'] = searchable_id
                    filtered_results.append(item_data)
            
            # Get total count for pagination info
            cur.execute("""
                SELECT COUNT(*) 
                FROM searchable_items si
                JOIN searchable_geo sg ON si.searchable_id = sg.searchable_id
                WHERE sg.geohash LIKE %s;
            """, (search_geohash_prefix + '%',))
            total_count = cur.fetchone()[0]
            
            cur.close()
            conn.close()
            
            return {
                "results": filtered_results,
                "pagination": {
                    "page": page_number,
                    "page_size": page_size,
                    "total_count": total_count,
                    "total_pages": (total_count + page_size - 1) // page_size
                }
            }, 200
            
        except Exception as e:
            return {"error": str(e)}, 500





@rest_api.route('/api/user_event', methods=['POST'])
class UserEvent(Resource):
    """
    Records user events for analytics
    """

    def post(self):
        data = request.get_json()  # Get JSON data from request
        if not data:
            return {"error": "Invalid input"}, 400

        visitor_id = data.get('visitor_id')
        if not visitor_id:
            return {"error": "Missing visitor_id"}, 400

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO user_event (visitor_id, data) VALUES (%s, %s) RETURNING id;",
                (visitor_id, Json(data))
            )
            event_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return {"success": True, "event_id": event_id}, 201
        except Exception as e:
            return {"error": str(e)}, 500



@rest_api.route('/api/users/register')
class Register(Resource):
    """
       Creates a new user by taking 'signup_model' input
    """

    @rest_api.expect(signup_model, validate=True)
    def post(self):

        req_data = request.get_json()

        _username = req_data.get("username")
        _email = req_data.get("email")
        _password = req_data.get("password")

        user_exists = Users.get_by_email(_email)
        if user_exists:
            return {"success": False,
                    "msg": "Email already taken"}, 400

        new_user = Users(username=_username, email=_email)

        new_user.set_password(_password)
        new_user.save()

        return {"success": True,
                "userID": new_user.id,
                "msg": "The user was successfully registered"}, 200


@rest_api.route('/api/users/login')
class Login(Resource):
    """
       Login user by taking 'login_model' input and return JWT token
    """

    @rest_api.expect(login_model, validate=True)
    def post(self):

        req_data = request.get_json()

        _email = req_data.get("email")
        _password = req_data.get("password")

        user_exists = Users.get_by_email(_email)

        if not user_exists:
            return {"success": False,
                    "msg": "This email does not exist."}, 400

        if not user_exists.check_password(_password):
            return {"success": False,
                    "msg": "Wrong credentials."}, 400

        # create access token uwing JWT
        token = jwt.encode({'email': _email, 'exp': datetime.utcnow() + timedelta(minutes=30)}, BaseConfig.SECRET_KEY)

        user_exists.set_jwt_auth_active(True)
        user_exists.save()

        return {"success": True,
                "token": token,
                "user": user_exists.toJSON()}, 200


@rest_api.route('/api/users/edit')
class EditUser(Resource):
    """
       Edits User's username or password or both using 'user_edit_model' input
    """

    @rest_api.expect(user_edit_model)
    @token_required
    def post(self, current_user):

        req_data = request.get_json()

        _new_username = req_data.get("username")
        _new_email = req_data.get("email")

        if _new_username:
            self.update_username(_new_username)

        if _new_email:
            self.update_email(_new_email)

        self.save()

        return {"success": True}, 200


@rest_api.route('/api/users/logout')
class LogoutUser(Resource):
    """
       Logs out User using 'logout_model' input
    """

    @token_required
    def post(self, current_user):

        _jwt_token = request.headers["authorization"]

        jwt_block = JWTTokenBlocklist(jwt_token=_jwt_token, created_at=datetime.now(timezone.utc))
        jwt_block.save()

        self.set_jwt_auth_active(False)
        self.save()

        return {"success": True}, 200


@rest_api.route('/api/sessions/oauth/github/')
class GitHubLogin(Resource):
    def get(self):
        code = request.args.get('code')
        client_id = BaseConfig.GITHUB_CLIENT_ID
        client_secret = BaseConfig.GITHUB_CLIENT_SECRET
        root_url = 'https://github.com/login/oauth/access_token'

        params = { 'client_id': client_id, 'client_secret': client_secret, 'code': code }

        data = requests.post(root_url, params=params, headers={
            'Content-Type': 'application/x-www-form-urlencoded',
        })

        response = data._content.decode('utf-8')
        access_token = response.split('&')[0].split('=')[1]

        user_data = requests.get('https://api.github.com/user', headers={
            "Authorization": "Bearer " + access_token
        }).json()
        
        user_exists = Users.get_by_username(user_data['login'])
        if user_exists:
            user = user_exists
        else:
            try:
                user = Users(username=user_data['login'], email=user_data['email'])
                user.save()
            except:
                user = Users(username=user_data['login'])
                user.save()
        
        user_json = user.toJSON()

        token = jwt.encode({"username": user_json['username'], 'exp': datetime.utcnow() + timedelta(minutes=30)}, BaseConfig.SECRET_KEY)
        user.set_jwt_auth_active(True)
        user.save()

        return {"success": True,
                "user": {
                    "_id": user_json['_id'],
                    "email": user_json['email'],
                    "username": user_json['username'],
                    "token": token,
                }}, 200