import os
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps

import requests
from flask import request
from flask_restx import Resource, fields

# Import from our new structure
from .. import rest_api
from ..common.config import BaseConfig
from ..common.models import db, Users, JWTTokenBlocklist
from ..common.database import get_db_connection, execute_sql, Json
from ..common.logging_config import setup_logger
from ..common.metrics_collector import track_user_signup, track_user_login, track_error

# Set up the logger
logger = setup_logger(__name__, 'auth.log')

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
    def decorator(self, *args, **kwargs):
        token = None
        if "authorization" in request.headers:
            token = request.headers["authorization"]
            logger.debug(f"Token: {token}")

        if not token:
            return {"success": False, "msg": "Valid JWT token is missing"}, 400

        try:
            data = jwt.decode(token, BaseConfig.SECRET_KEY, algorithms=["HS256"])
            logger.debug(f"Decoded JWT data: {data}")

            decoded_token = jwt.decode(token, BaseConfig.SECRET_KEY, algorithms=["HS256"])
            logger.debug(f"Decoded JWT: {decoded_token}")
            
            current_user = Users.get_by_email(data["email"])
            logger.info(f"User {current_user.username} with email {current_user.email} is making a request.")

            if not current_user:
                return {"success": False,
                        "msg": "Sorry. Wrong auth token. This user does not exist."}, 400

            token_expired = db.session.query(JWTTokenBlocklist.id).filter_by(jwt_token=token).scalar()

            if token_expired is not None:
                return {"success": False, "msg": "Token revoked."}, 400

            if not current_user.check_jwt_auth_active():
                return {"success": False, "msg": "Token expired."}, 400

        except Exception as e:
            logger.error(f"Exception occurred: {e}")
            return {"success": False, "msg": "Token is invalid"}, 400

        return f(self, *args, current_user=current_user, **kwargs)

    return decorator




"""
    Authentication Routes
"""

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
            execute_sql(cur,
                "INSERT INTO user_event (visitor_id, data) VALUES (%s, %s) RETURNING id;",
                params=(visitor_id, Json(data))
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
        
        # Track user signup metric
        try:
            track_user_signup(
                user_id=new_user.id,
                ip_address=request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
            )
        except Exception as e:
            logger.warning(f"Failed to track signup metric: {e}")

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
        token = jwt.encode({'email': _email, 'exp': datetime.utcnow() + timedelta(days=30)}, BaseConfig.SECRET_KEY)

        user_exists.set_jwt_auth_active(True)
        user_exists.save()
        
        # Track user login metric
        try:
            track_user_login(
                user_id=user_exists.id,
                ip_address=request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
            )
        except Exception as e:
            logger.warning(f"Failed to track login metric: {e}")

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

        current_user.set_jwt_auth_active(False)
        current_user.save()

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

# Export decorators for use in other route modules
__all__ = ['token_required']