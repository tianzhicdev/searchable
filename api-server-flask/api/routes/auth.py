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
from ..common.database_context import database_cursor, database_transaction, db as db_ops
from ..common.logging_config import setup_logger
from ..common.metrics_collector import track_user_signup, track_user_login, track_error

# Set up the logger
logger = setup_logger(__name__, 'auth.log')

# Test backdoor for development
DEV_TOKEN = os.environ.get('DEV_BYPASS_TOKEN')

"""
    Flask-Restx models for api request and response data
"""

signup_model = rest_api.model('SignUpModel', {"username": fields.String(required=True, min_length=2, max_length=32),
                                              "email": fields.String(required=True, min_length=4, max_length=64),
                                              "password": fields.String(required=True, min_length=4, max_length=16),
                                              "invite_code": fields.String(required=False, min_length=0, max_length=6)
                                              })

login_model = rest_api.model('LoginModel', {"email": fields.String(required=True, min_length=4, max_length=64),
                                            "password": fields.String(required=True, min_length=4, max_length=16)
                                            })

user_edit_model = rest_api.model('UserEditModel', {"userID": fields.String(required=True, min_length=1, max_length=32),
                                                   "username": fields.String(required=True, min_length=2, max_length=32),
                                                   "email": fields.String(required=True, min_length=4, max_length=64)
                                                   })

change_password_model = rest_api.model('ChangePasswordModel', {"current_password": fields.String(required=True, min_length=4, max_length=16),
                                                              "new_password": fields.String(required=True, min_length=4, max_length=16)
                                                              })

edit_account_model = rest_api.model('EditAccountModel', {"username": fields.String(required=True, min_length=2, max_length=32),
                                                         "email": fields.String(required=True, min_length=4, max_length=64),
                                                         "current_password": fields.String(required=True, min_length=4, max_length=16),
                                                         "new_password": fields.String(required=False, min_length=8, max_length=16)
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
            
        if token == DEV_TOKEN:
            logger.info("Using test admin account for development")
            # Create a mock admin user for testing
            admin_user = Users(id=12, username="admin", email="admin@bit-bid.com")
            return f(self, *args, current_user=admin_user, **kwargs)

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
            row = db_ops.execute_insert(
                "INSERT INTO user_event (visitor_id, data) VALUES (%s, %s) RETURNING id;",
                (visitor_id, Json(data))
            )
            
            if not row:
                return {"error": "Failed to create user event"}, 500
                
            event_id = row[0]
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
        _invite_code = req_data.get("invite_code", "").strip().upper()

        user_exists = Users.get_by_email(_email)
        if user_exists:
            return {"success": False,
                    "msg": "Email already taken"}, 400

        # Check if this is a guest registration request
        is_guest_request = _email == 'GUEST_REGISTRATION_REQUEST'
        
        if is_guest_request:
            # Create a temporary user to get an ID
            temp_user = Users(username='temp_guest', email='temp@guest.com')
            temp_user.set_password('temp_password')
            temp_user.save()
            
            # Now update with the actual guest credentials
            guest_id = temp_user.id
            temp_user.username = f'guest_{guest_id}'
            temp_user.email = f'guest_{guest_id}@ec.com'
            temp_user.set_password(f'guest_{guest_id}')
            temp_user.save()
            
            new_user = temp_user
            is_guest = True
            logger.info(f"Created guest user {guest_id} with email {new_user.email}")
        else:
            new_user = Users(username=_username, email=_email)
            new_user.set_password(_password)
            new_user.save()
            is_guest = False
        
        # Create user_profile record
        try:
            success = db_ops.execute_update(
                """INSERT INTO user_profile (user_id, username, metadata) 
                   VALUES (%s, %s, %s)""",
                (
                    new_user.id,
                    new_user.username,
                    Json({
                        "created_via": "guest_registration" if is_guest else "registration",
                        "registration_date": datetime.utcnow().isoformat(),
                        "is_guest": is_guest
                    })
                )
            )
            
            if success:
                logger.info(f"Created user_profile for user {new_user.id}")
            else:
                logger.warning(f"Failed to create user_profile for user {new_user.id}")
            
        except Exception as e:
            logger.error(f"Failed to create user_profile for user {new_user.id}: {e}")
            # Don't fail registration if profile creation fails
        
        # Track user signup metric
        try:
            track_user_signup(
                user_id=new_user.id,
                ip_address=request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
            )
        except Exception as e:
            logger.warning(f"Failed to track signup metric: {e}")

        # Handle invite code if provided
        invite_code_used = False
        if _invite_code and len(_invite_code) == 6 and _invite_code.isalpha():
            try:
                with database_transaction() as (cur, conn):
                    # Check if code exists and is active
                    execute_sql(cur,
                        "SELECT id, active FROM invite_code WHERE code = %s",
                        (_invite_code,)
                    )
                    
                    result = cur.fetchone()
                    if result and result[1]:  # result[1] is the active boolean
                        invite_code_id = result[0]
                        
                        # Mark the invite code as used
                        execute_sql(cur,
                            "UPDATE invite_code SET active = false, used_by_user_id = %s, used_at = NOW() WHERE id = %s",
                            (new_user.id, invite_code_id)
                        )
                        
                        # Create a reward record
                        execute_sql(cur,
                            """INSERT INTO rewards (amount, currency, user_id, metadata) 
                               VALUES (%s, %s, %s, %s)""",
                            (
                                5.0,  # $5 USD reward
                                'usd',
                                new_user.id,  # User receiving the reward
                                Json({
                                    "type": "invite_code_reward", 
                                    "invite_code": _invite_code,
                                    "invite_code_id": invite_code_id
                                })
                            )
                        )
                        
                        invite_code_used = True
                        logger.info(f"Invite code {_invite_code} used by user {new_user.id}, $5 reward credited")
                    
            except Exception as e:
                logger.error(f"Error processing invite code: {e}")
                # Don't fail registration if invite code processing fails

        # Get the newly created user profile
        from ..common.data_helpers import get_user_profile
        profile = get_user_profile(new_user.id)
        
        # Prepare user data with profile
        user_data = new_user.toJSON()
        if profile:
            user_data['profile'] = profile
            
        return {"success": True,
                "userID": new_user.id,
                "user": user_data,
                "msg": "The user was successfully registered" + (" with invite code reward!" if invite_code_used else "")}, 200


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
                    "msg": "This email does not exist.",
                    "errorType": "invalid_email"}, 400

        if not user_exists.check_password(_password):
            return {"success": False,
                    "msg": "Wrong password.",
                    "errorType": "invalid_password"}, 400

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

        # Get user profile data
        from ..common.data_helpers import get_user_profile
        profile = get_user_profile(user_exists.id)
        
        # Enhance user object with profile data
        user_data = user_exists.toJSON()
        if profile:
            user_data['profile'] = profile

        return {"success": True,
                "token": token,
                "user": user_data}, 200


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


@rest_api.route('/api/users/change-password')
class ChangePassword(Resource):
    """
       Changes user's password by taking 'change_password_model' input
    """

    @rest_api.expect(change_password_model, validate=True)
    @token_required
    def post(self, current_user):
        req_data = request.get_json()

        _current_password = req_data.get("current_password")
        _new_password = req_data.get("new_password")

        # Verify current password
        if not current_user.check_password(_current_password):
            return {"success": False,
                    "msg": "Current password is incorrect"}, 400

        # Set new password
        current_user.set_password(_new_password)
        current_user.save()

        logger.info(f"Password changed successfully for user {current_user.username}")

        return {"success": True,
                "msg": "Password changed successfully"}, 200


@rest_api.route('/api/users/edit-account')
class EditAccount(Resource):
    """
       Edit user account (username, email, and optionally password)
    """

    @rest_api.expect(edit_account_model, validate=True)
    @token_required
    def post(self, current_user):
        req_data = request.get_json()

        _new_username = req_data.get("username")
        _new_email = req_data.get("email")
        _current_password = req_data.get("current_password")
        _new_password = req_data.get("new_password")

        # Verify current password
        if not current_user.check_password(_current_password):
            return {"success": False,
                    "msg": "Current password is incorrect"}, 400

        # Check if new username is already taken (if different from current)
        if _new_username != current_user.username:
            existing_user = Users.get_by_username(_new_username)
            if existing_user:
                return {"success": False,
                        "msg": "Username already taken"}, 400

        # Check if new email is already taken (if different from current)
        if _new_email != current_user.email:
            existing_user = Users.get_by_email(_new_email)
            if existing_user:
                return {"success": False,
                        "msg": "Email already in use"}, 400

        # Check if this is a guest user upgrading their account
        from ..common.data_helpers import get_user_profile
        profile = get_user_profile(current_user.id)
        was_guest = profile and profile.get('is_guest', False)
        
        # Update username and email
        current_user.update_username(_new_username)
        current_user.update_email(_new_email)

        # Update password if provided
        if _new_password:
            current_user.set_password(_new_password)

        current_user.save()
        
        # If this was a guest user upgrading, update their profile
        if was_guest:
            try:
                success = db_ops.execute_update(
                    """UPDATE user_profile 
                       SET username = %s,
                           metadata = jsonb_set(
                               jsonb_set(
                                   COALESCE(metadata, '{}'::jsonb),
                                   '{upgraded_from_guest}',
                                   'true'::jsonb
                               ),
                               '{is_guest}',
                               'false'::jsonb
                           )
                       WHERE user_id = %s""",
                    (_new_username, current_user.id)
                )
                if success:
                    logger.info(f"Guest user {current_user.id} successfully upgraded to regular account")
            except Exception as e:
                logger.error(f"Failed to update guest status for user {current_user.id}: {e}")
        
        # Generate new JWT token with updated user information
        token = jwt.encode({'email': _new_email, 'exp': datetime.utcnow() + timedelta(days=30)}, BaseConfig.SECRET_KEY)
        
        # Get updated profile data
        updated_profile = get_user_profile(current_user.id)
        
        # Prepare user data with updated profile
        user_data = current_user.toJSON()
        if updated_profile:
            user_data['profile'] = updated_profile

        logger.info(f"Account updated successfully for user {current_user.username}")

        return {"success": True,
                "msg": "Account updated successfully",
                "token": token,
                "user": user_data}, 200


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


@rest_api.route('/api/v1/is_active/<string:invite_code>')
class CheckInviteCode(Resource):
    """
    Check if an invite code is active
    """
    def get(self, invite_code):
        # Validate format: 6 uppercase letters
        if not invite_code or len(invite_code) != 6 or not invite_code.isupper() or not invite_code.isalpha():
            return {"active": False}, 200
        
        try:
            # Check if code exists and is active
            result = db_ops.fetch_one(
                "SELECT active FROM invite_code WHERE code = %s",
                (invite_code,)
            )
            
            if result and result[0]:  # result[0] is the active boolean
                return {"active": True}, 200
            else:
                return {"active": False}, 200
                
        except Exception as e:
            logger.error(f"Error checking invite code: {e}")
            return {"active": False}, 200


@rest_api.route('/api/v1/get-active-invite-code')
@rest_api.route('/invite')
class GetActiveInviteCode(Resource):
    """
    Get an active invite code
    """
    def get(self):
        try:
            # Get optional promoter parameter
            promoter = request.args.get('promoter')
            
            # Build query based on whether promoter is specified
            if promoter:
                # Get invite codes with specific promoter in metadata
                result = db_ops.fetch_one(
                    """SELECT code, metadata FROM invite_code 
                       WHERE active = TRUE 
                       AND metadata->>'promoter' = %s 
                       ORDER BY RANDOM() LIMIT 1""",
                    (promoter,)
                )
            else:
                # Get any random active invite code
                result = db_ops.fetch_one(
                    "SELECT code, metadata FROM invite_code WHERE active = TRUE ORDER BY RANDOM() LIMIT 1"
                )
            
            if result:
                code = result[0]
                metadata = result[1] if result[1] else {}
                description = metadata.get('description', 'Join our platform with this invite code')
                
                response_data = {
                    "success": True,
                    "invite_code": code,
                    "description": description
                }
                
                # Include promoter in response if present
                if metadata.get('promoter'):
                    response_data['promoter'] = metadata['promoter']
                
                return response_data, 200
            else:
                if promoter:
                    return {
                        "success": False,
                        "message": f"No active invite codes available for promoter '{promoter}'"
                    }, 200
                else:
                    return {
                        "success": False,
                        "message": "No active invite codes available"
                    }, 200
                
        except Exception as e:
            logger.error(f"Error getting active invite code: {e}")
            return {
                "success": False,
                "message": "Error retrieving invite code"
            }, 500


# Export decorators for use in other route modules
__all__ = ['token_required']