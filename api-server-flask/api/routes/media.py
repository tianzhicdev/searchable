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
from ..common.metrics import track_metrics
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'media.log')

# Configuration
FILE_SERVER_URL = os.getenv('FILE_SERVER_URL', 'http://file_server:5006')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image_data(image_data):
    """
    Validate image from base64 data or file
    
    Args:
        image_data: Base64 encoded image data (data URL format) or binary data
        
    Returns:
        tuple: (is_valid, file_extension, binary_data)
    """
    try:
        if isinstance(image_data, str):
            # Handle data URL format (data:image/png;base64,...)
            if image_data.startswith('data:'):
                # Extract mime type and base64 data
                header, base64_data = image_data.split(',', 1)
                
                # Validate mime type
                if 'image/' not in header:
                    return False, None, None
                
                # Extract file type
                mime_type = header.split(';')[0].split(':')[1]
                file_extension = mime_type.split('/')[1].lower()
                
                # Validate file extension
                if file_extension not in ALLOWED_EXTENSIONS:
                    return False, None, None
                
                # Decode base64 data
                binary_data = base64.b64decode(base64_data)
            else:
                # Assume it's just base64 data without data URL prefix
                binary_data = base64.b64decode(image_data)
                file_extension = 'png'  # Default to PNG
        else:
            # Already binary data
            binary_data = image_data
            file_extension = 'png'  # Default to PNG
        
        # Check file size
        if len(binary_data) > MAX_FILE_SIZE:
            return False, None, None
        
        return True, file_extension, binary_data
        
    except Exception as e:
        logger.error(f"Error validating image data: {str(e)}")
        return False, None, None

@rest_api.route('/api/v1/media/upload', methods=['POST'])
class MediaUpload(Resource):
    """
    Upload media files to file server
    """
    @token_required
    @track_metrics('media_upload')
    def post(self, current_user, request_origin='unknown'):
        try:
            # Check if request has file part or JSON data
            if 'file' in request.files:
                # Handle multipart file upload
                file = request.files['file']
                if file.filename == '':
                    return {"error": "No file selected"}, 400
                
                if not allowed_file(file.filename):
                    return {"error": "Invalid file type. Allowed: " + ", ".join(ALLOWED_EXTENSIONS)}, 400
                
                # Read file data
                file_data = file.read()
                file_extension = file.filename.rsplit('.', 1)[1].lower()
                
            else:
                # Handle JSON base64 upload
                data = request.get_json()
                if not data or 'image_data' not in data:
                    return {"error": "No image data provided"}, 400
                
                # Validate image data
                is_valid, file_extension, file_data = validate_image_data(data['image_data'])
                if not is_valid:
                    return {"error": "Invalid image data or file too large"}, 400
            
            # Generate unique media ID
            media_id = str(uuid.uuid4())
            filename = f"{media_id}.{file_extension}"
            
            # Upload to file server
            files = {'file': (filename, file_data, f'image/{file_extension}')}
            metadata = {
                'description': f'Media upload by user {current_user.id}',
                'type': 'media',
                'user_id': str(current_user.id),
                'media_id': media_id
            }
            
            upload_data = {'metadata': str(metadata)}
            
            response = requests.post(
                f'{FILE_SERVER_URL}/upload',
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
            
            # Return media info
            media_uri = f"/api/v1/media/{media_id}"
            
            return {
                "success": True,
                "media_id": media_id,
                "media_uri": media_uri,
                "file_id": upload_result.get('file_id'),
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
    @track_metrics('media_retrieve')
    def get(self, media_id, request_origin='unknown'):
        try:
            # Validate media_id format (should be UUID)
            try:
                uuid.UUID(media_id)
            except ValueError:
                return {"error": "Invalid media ID format"}, 400
            
            # Find file in file server by media_id
            # First, try to get file info by searching metadata
            search_response = requests.get(
                f'{FILE_SERVER_URL}/files',
                timeout=10
            )
            
            if search_response.status_code != 200:
                logger.error(f"File server search failed: {search_response.text}")
                return {"error": "File server unavailable"}, 503
            
            files_list = search_response.json().get('files', [])
            target_file = None
            
            # Look for file with matching media_id in metadata
            for file_info in files_list:
                metadata = file_info.get('metadata', {})
                if isinstance(metadata, str):
                    try:
                        import ast
                        metadata = ast.literal_eval(metadata)
                    except:
                        continue
                
                if metadata.get('media_id') == media_id:
                    target_file = file_info
                    break
            
            if not target_file:
                return {"error": "Media not found"}, 404
            
            file_id = target_file.get('file_id')
            if not file_id:
                return {"error": "Invalid file reference"}, 500
            
            # Proxy the file from file server
            file_response = requests.get(
                f'{FILE_SERVER_URL}/download/{file_id}',
                timeout=30
            )
            
            if file_response.status_code != 200:
                logger.error(f"File server download failed: {file_response.text}")
                return {"error": "Failed to retrieve from file server"}, 500
            
            # Determine content type from filename
            filename = target_file.get('filename', f'{media_id}.png')
            if filename.lower().endswith('.png'):
                content_type = 'image/png'
            elif filename.lower().endswith(('.jpg', '.jpeg')):
                content_type = 'image/jpeg'
            elif filename.lower().endswith('.gif'):
                content_type = 'image/gif'
            elif filename.lower().endswith('.webp'):
                content_type = 'image/webp'
            else:
                content_type = 'application/octet-stream'
            
            # Return the file content as a response
            return Response(
                file_response.content,
                mimetype=content_type,
                headers={
                    'Content-Disposition': f'inline; filename="{filename}"',
                    'Cache-Control': 'public, max-age=31536000',  # Cache for 1 year
                    'Content-Length': str(len(file_response.content))
                }
            )
            
        except Exception as e:
            logger.error(f"Error retrieving media {media_id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/media/<media_id>/info', methods=['GET'])
class MediaInfo(Resource):
    """
    Get media file information
    """
    @track_metrics('media_info')
    def get(self, media_id, request_origin='unknown'):
        try:
            # Validate media_id format
            try:
                uuid.UUID(media_id)
            except ValueError:
                return {"error": "Invalid media ID format"}, 400
            
            # Get file info from file server
            search_response = requests.get(
                f'{FILE_SERVER_URL}/files',
                timeout=10
            )
            
            if search_response.status_code != 200:
                return {"error": "File server unavailable"}, 503
            
            files_list = search_response.json().get('files', [])
            target_file = None
            
            # Look for file with matching media_id
            for file_info in files_list:
                metadata = file_info.get('metadata', {})
                if isinstance(metadata, str):
                    try:
                        import ast
                        metadata = ast.literal_eval(metadata)
                    except:
                        continue
                
                if metadata.get('media_id') == media_id:
                    target_file = file_info
                    break
            
            if not target_file:
                return {"error": "Media not found"}, 404
            
            return {
                "media_id": media_id,
                "filename": target_file.get('filename'),
                "size": target_file.get('size'),
                "upload_date": target_file.get('upload_date'),
                "metadata": target_file.get('metadata')
            }, 200
            
        except Exception as e:
            logger.error(f"Error getting media info {media_id}: {str(e)}")
            return {"error": str(e)}, 500