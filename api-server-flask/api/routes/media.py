# Media routes for image/file management
import os
import uuid
import base64
import requests
from flask import request, Response
from flask_restx import Resource
from werkzeug.utils import secure_filename

# Import from our structure
from .. import rest_api
from .auth import token_required
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'media.log')

# Configuration - use local file server for local branding
BRANDING = os.getenv('REACT_APP_BRANDING', 'silkroadonlightning')
if BRANDING == 'local':
    FILE_SERVER_URL = 'http://file_server:5006'
    FILE_SERVER_URL_RETRIEVAL = 'http://localhost'
else:
    FILE_SERVER_URL = os.environ.get('FILE_SERVER_URL')
    FILE_SERVER_URL_RETRIEVAL = FILE_SERVER_URL
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file_data(file_data):
    """
    Validate file from base64 data or file
    
    Args:
        file_data: Base64 encoded data (data:*/*;base64,...) or binary data
        
    Returns:
        tuple: (is_valid, binary_data)
    """
    try:
        if isinstance(file_data, str):
            # Handle data URL format (data:...;base64,...)
            if file_data.startswith('data:'):
                _, base64_data = file_data.split(',', 1)
                binary_data = base64.b64decode(base64_data)
            else:
                binary_data = base64.b64decode(file_data)
        else:
            binary_data = file_data
        if len(binary_data) > MAX_FILE_SIZE:
            return False, None
        return True, binary_data
    except Exception as e:
        logger.error(f"Error validating file data: {str(e)}")
        return False, None

@rest_api.route('/api/v1/media/upload', methods=['POST'])
class MediaUpload(Resource):
    """
    Upload media files to file server
    """
    @token_required
    def post(self, current_user, request_origin='unknown'):
        try:
            if 'file' in request.files:
                file = request.files['file']
                if file.filename == '':
                    return {"error": "No file selected"}, 400
                file_data = file.read()
            else:
                data = request.get_json()
                if not data or 'file_data' not in data:
                    return {"error": "No file data provided"}, 400
                is_valid, file_data = validate_file_data(data['file_data'])
                if not is_valid:
                    return {"error": "Invalid file data or file too large"}, 400

            media_id = str(uuid.uuid4())
            filename = media_id  # No extension

            files = {'file': (filename, file_data, 'application/octet-stream')}
            upload_data = {'file_id': media_id}

            response = requests.post(
                f'{FILE_SERVER_URL}/api/file/upload',
                files=files,
                data=upload_data,
                timeout=30
            )

            if response.status_code != 200:
                logger.error(f"File server upload failed: {response.text}")
                return {"error": "Failed to upload to file server"}, 500

            upload_result = response.json()
            if not upload_result.get('success'):
                return {"error": "File server upload unsuccessful"}, 500

            media_uri = f'{FILE_SERVER_URL_RETRIEVAL}/api/v1/media/{media_id}'

            return {
                "success": True,
                "media_id": media_id,
                "media_uri": media_uri,
                "file_id": media_id,
                "filename": filename,
                "size": len(file_data)
            }, 200

        except Exception as e:
            logger.error(f"Error uploading media: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/media/<media_id>', methods=['GET'])
class MediaRetrieve(Resource):
    """
    Retrieve media files from file server (pass-through)
    """
    def get(self, media_id, request_origin='unknown'):
        try:
            try:
                uuid.UUID(media_id)
            except ValueError:
                return {"error": "Invalid media ID format"}, 400

            file_response = requests.get(
                f'{FILE_SERVER_URL}/api/file/download',
                params={'file_id': media_id},
                timeout=30
            )

            if file_response.status_code == 404:
                return {"error": "Media not found"}, 404
            elif file_response.status_code != 200:
                logger.error(f"File server download failed: {file_response.text}")
                return {"error": "Failed to retrieve from file server"}, 500

            # Use content-type from file server if available, else default to octet-stream
            content_type = file_response.headers.get('content-type', 'application/octet-stream')

            return Response(
                file_response.content,
                mimetype=content_type,
                headers={
                    'Content-Disposition': f'inline; filename="{media_id}"',
                    'Cache-Control': 'public, max-age=31536000',
                    'Content-Length': str(len(file_response.content))
                }
            )

        except Exception as e:
            logger.error(f"Error retrieving media {media_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/media/<media_id>/info', methods=['GET'])
class MediaInfo(Resource):
    """
    Get media file information (simplified - just checks if media exists)
    """
    def get(self, media_id, request_origin='unknown'):
        try:
            try:
                uuid.UUID(media_id)
            except ValueError:
                return {"error": "Invalid media ID format"}, 400

            file_response = requests.get(
                f'{FILE_SERVER_URL}/api/file/download',
                params={'file_id': media_id},
                timeout=10
            )

            if file_response.status_code == 404:
                return {"error": "Media not found"}, 404
            elif file_response.status_code != 200:
                return {"error": "File server unavailable"}, 503

            return {
                "media_id": media_id,
                "filename": media_id,
                "size": len(file_response.content),
                "exists": True
            }, 200

        except Exception as e:
            logger.error(f"Error getting media info {media_id}: {str(e)}")
            return {"error": str(e)}, 500