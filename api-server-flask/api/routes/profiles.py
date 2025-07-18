# Profile routes
import os
import base64
import uuid
from flask import request
from flask_restx import Resource
from werkzeug.utils import secure_filename

# Import from our structure
from .. import rest_api
from .auth import token_required
from ..common.metrics import track_metrics
from ..common.data_helpers import (
    get_user_profile,
    create_user_profile,
    update_user_profile,
    get_searchableIds_by_user,
    get_searchable,
    get_downloadable_items_by_user_id,
    get_rewards,
    get_db_connection,
    execute_sql,
)
from ..common.database_context import db
from ..common.tag_helpers import get_user_tags
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'profiles.log')

# Configuration for file uploads
UPLOAD_FOLDER = os.getenv('PROFILE_UPLOAD_FOLDER', '/tmp/profile_images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_and_process_profile_image(image_data):
    """
    Validate and process profile image from base64 data
    
    Args:
        image_data: Base64 encoded image data (data URL format)
        
    Returns:
        str: Processed base64 image data or None if validation failed
    """
    try:
        # Handle data URL format (data:image/png;base64,...)
        if image_data.startswith('data:'):
            # Extract mime type and base64 data
            header, base64_data = image_data.split(',', 1)
            
            # Validate mime type
            if 'image/' not in header:
                raise ValueError("Invalid image format")
            
            # Extract file type
            mime_type = header.split(';')[0].split(':')[1]
            file_extension = mime_type.split('/')[1].lower()
            
            # Validate file extension
            if file_extension not in ALLOWED_EXTENSIONS:
                raise ValueError(f"Unsupported image format: {file_extension}")
        else:
            # Assume it's just base64 data without data URL prefix
            base64_data = image_data
        
        # Decode and validate size
        image_binary = base64.b64decode(base64_data)
        
        # Check file size
        if len(image_binary) > MAX_FILE_SIZE:
            raise ValueError("Image file too large (max 5MB)")
        
        # Return the complete data URL for database storage
        if image_data.startswith('data:'):
            return image_data
        else:
            # Add data URL prefix if not present (assume PNG)
            return f"data:image/png;base64,{base64_data}"
        
    except Exception as e:
        logger.error(f"Error validating profile image: {str(e)}")
        return None

def get_seller_rating(user_id):
    """
    Get seller rating and total ratings for a user
    
    Args:
        user_id: The user's ID
        
    Returns:
        tuple: (avg_rating, total_ratings)
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        execute_sql(cur, """
            SELECT 
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COALESCE(COUNT(*), 0) as total_ratings
            FROM rating r
            JOIN invoice i ON r.invoice_id = i.id
            WHERE i.seller_id = %s
        """, (user_id,))
        
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        avg_rating, total_ratings = result if result else (0, 0)
        
        return float(avg_rating) if avg_rating else 0.0, total_ratings or 0
        
    except Exception as e:
        logger.error(f"Error getting seller rating for user {user_id}: {str(e)}")
        return 0.0, 0

@rest_api.route('/api/v1/profile/<int:user_id>', methods=['GET'])
class GetUserProfile(Resource):
    """
    Get user profile by user ID
    """
    @track_metrics('get_user_profile')
    def get(self, user_id, request_origin='unknown'):
        try:
            # Get the user profile
            profile = get_user_profile(user_id)
            
            if not profile:
                return {"error": "Profile not found"}, 404
            
            # Get user's tags
            user_tags = get_user_tags(user_id)
            
            # Get seller rating
            avg_rating, total_ratings = get_seller_rating(user_id)
            
            # Add tags and rating to profile
            profile['tags'] = user_tags
            profile['seller_rating'] = avg_rating
            profile['seller_total_ratings'] = total_ratings
            
            # Return profile with tags and rating
            return {
                "profile": profile
            }, 200
            
        except Exception as e:
            logger.error(f"Error getting user profile {user_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/profile', methods=['GET'])
class GetMyProfile(Resource):
    """
    Get current user's profile
    """
    @token_required
    @track_metrics('get_my_profile')
    def get(self, current_user, request_origin='unknown'):
        try:
            user_id = current_user.id
            
            # Get the user profile
            profile = get_user_profile(user_id)
            
            if not profile:
                # Create default profile if none exists
                profile = create_user_profile(
                    user_id=user_id,
                    username=current_user.username
                )
                if not profile:
                    return {"error": "Failed to create profile"}, 500
            
            # Get user's tags
            user_tags = get_user_tags(user_id)
            
            # Get seller rating
            avg_rating, total_ratings = get_seller_rating(user_id)
            
            # Add tags and rating to profile
            profile['tags'] = user_tags
            profile['seller_rating'] = avg_rating
            profile['seller_total_ratings'] = total_ratings
            
            # Return profile with tags and rating
            return {
                "profile": profile
            }, 200
            
        except Exception as e:
            logger.error(f"Error getting my profile: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/profile', methods=['PUT'])
class UpdateMyProfile(Resource):
    """
    Update current user's profile
    """
    @token_required
    @track_metrics('update_my_profile')
    def put(self, current_user, request_origin='unknown'):
        try:
            data = request.get_json()
            
            if not data:
                return {"error": "No data provided"}, 400
            
            user_id = current_user.id
            
            # Extract update fields
            username = data.get('username')
            introduction = data.get('introduction')
            profile_image_data = data.get('profile_image')  # Legacy base64 support
            profile_image_url = data.get('profile_image_url')  # URL/URI support
            metadata = data.get('metadata', {})
            
            # Handle profile image
            final_profile_image_url = None
            if profile_image_url:
                # URL/URI approach - store the URL directly
                final_profile_image_url = profile_image_url
            elif profile_image_data:
                # Legacy base64 support
                final_profile_image_url = validate_and_process_profile_image(profile_image_data)
                if not final_profile_image_url:
                    return {"error": "Invalid profile image or file too large"}, 400
            
            # Check if profile exists
            existing_profile = get_user_profile(user_id)
            
            if existing_profile:
                # Update existing profile
                profile = update_user_profile(
                    user_id=user_id,
                    username=username,
                    profile_image_url=final_profile_image_url,
                    introduction=introduction,
                    metadata=metadata
                )
            else:
                # Create new profile
                profile = create_user_profile(
                    user_id=user_id,
                    username=username or current_user.username,
                    profile_image_url=final_profile_image_url,
                    introduction=introduction,
                    metadata=metadata
                )
            
            if not profile:
                return {"error": "Failed to update profile"}, 500
            
            # Get user's tags
            user_tags = get_user_tags(user_id)
            
            # Add tags to profile
            profile['tags'] = user_tags
            
            return {
                "message": "Profile updated successfully",
                "profile": profile
            }, 200
            
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/profile', methods=['POST'])
class CreateMyProfile(Resource):
    """
    Create current user's profile (alternative to auto-creation)
    """
    @token_required
    @track_metrics('create_my_profile')
    def post(self, current_user, request_origin='unknown'):
        try:
            data = request.get_json()
            
            user_id = current_user.id
            
            # Check if profile already exists
            existing_profile = get_user_profile(user_id)
            if existing_profile:
                return {"error": "Profile already exists"}, 400
            
            # Extract profile data
            username = data.get('username', current_user.username)
            introduction = data.get('introduction')
            profile_image_data = data.get('profile_image')
            
            # Handle profile image upload
            profile_image_url = None
            if profile_image_data:
                profile_image_url = validate_and_process_profile_image(profile_image_data)
                if not profile_image_url:
                    return {"error": "Invalid profile image or file too large"}, 400
            
            # Create new profile
            profile = create_user_profile(
                user_id=user_id,
                username=username,
                profile_image_url=profile_image_url,
                introduction=introduction
            )
            
            if not profile:
                return {"error": "Failed to create profile"}, 500
            
            # Get user's tags (will be empty for new profile)
            user_tags = get_user_tags(user_id)
            
            # Add tags to profile
            profile['tags'] = user_tags
            
            return {
                "message": "Profile created successfully",
                "profile": profile
            }, 201
            
        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/downloadable-items-by-user', methods=['GET'])
class GetDownloadableItemsByUser(Resource):
    """
    Get all downloadable items purchased by the current user
    """
    @token_required
    @track_metrics('get_downloadable_items_by_user')
    def get(self, current_user, request_origin='unknown'):
        try:
            user_id = current_user.id
            
            # Get downloadable items for the user
            downloadable_items = get_downloadable_items_by_user_id(user_id)
            
            return {
                "downloadable_items": downloadable_items,
                "count": len(downloadable_items)
            }, 200
            
        except Exception as e:
            logger.error(f"Error getting downloadable items for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/rewards', methods=['GET'])
class GetUserRewards(Resource):
    """
    Get all rewards for the current user
    """
    @token_required
    @track_metrics('get_user_rewards')
    def get(self, current_user, request_origin='unknown'):
        try:
            user_id = current_user.id
            
            # Get rewards for the user
            rewards = get_rewards(user_id=user_id)
            
            # Calculate total reward amount
            total_rewards = sum(reward['amount'] for reward in rewards)
            
            return {
                "rewards": rewards,
                "total_amount": total_rewards,
                "count": len(rewards)
            }, 200
            
        except Exception as e:
            logger.error(f"Error getting rewards for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500
