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
    get_searchable
)
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
            
            # Get user's searchables/downloadables
            searchable_ids = get_searchableIds_by_user(user_id)
            downloadables = []
            
            for searchable_id in searchable_ids:
                searchable = get_searchable(searchable_id)
                if searchable:
                    public_data = searchable.get('payloads', {}).get('public', {})
                    downloadables.append({
                        'searchable_id': searchable_id,
                        'title': public_data.get('title', 'Untitled'),
                        'description': public_data.get('description', ''),
                        'type': public_data.get('type', 'unknown'),
                        'price': public_data.get('price', 0),
                        'currency': public_data.get('currency', 'USD')
                    })
            
            # Return profile with downloadables
            return {
                "profile": profile,
                "downloadables": downloadables
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
            
            # Get user's searchables/downloadables
            searchable_ids = get_searchableIds_by_user(user_id)
            downloadables = []
            
            for searchable_id in searchable_ids:
                searchable = get_searchable(searchable_id)
                if searchable:
                    public_data = searchable.get('payloads', {}).get('public', {})
                    downloadables.append({
                        'searchable_id': searchable_id,
                        'title': public_data.get('title', 'Untitled'),
                        'description': public_data.get('description', ''),
                        'type': public_data.get('type', 'unknown'),
                        'price': public_data.get('price', 0),
                        'currency': public_data.get('currency', 'USD')
                    })
            
            # Return profile with downloadables
            return {
                "profile": profile,
                "downloadables": downloadables
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
            profile_image_uri = data.get('profile_image_uri')  # New URI support
            metadata = data.get('metadata', {})
            
            # Handle profile image
            profile_image_url = None
            if profile_image_uri:
                # New URI-based approach - store the URI directly
                profile_image_url = profile_image_uri
            elif profile_image_data:
                # Legacy base64 support
                profile_image_url = validate_and_process_profile_image(profile_image_data)
                if not profile_image_url:
                    return {"error": "Invalid profile image or file too large"}, 400
            
            # Check if profile exists
            existing_profile = get_user_profile(user_id)
            
            if existing_profile:
                # Update existing profile
                profile = update_user_profile(
                    user_id=user_id,
                    username=username,
                    profile_image_url=profile_image_url,
                    introduction=introduction,
                    metadata=metadata
                )
            else:
                # Create new profile
                profile = create_user_profile(
                    user_id=user_id,
                    username=username or current_user.username,
                    profile_image_url=profile_image_url,
                    introduction=introduction,
                    metadata=metadata
                )
            
            if not profile:
                return {"error": "Failed to update profile"}, 500
            
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
            
            return {
                "message": "Profile created successfully",
                "profile": profile
            }, 201
            
        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
            return {"error": str(e)}, 500