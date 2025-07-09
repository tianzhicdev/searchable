# File operations routes
import os
import requests
import json
import uuid
from flask import request
from flask_restx import Resource

# Import from our new structure
from .. import rest_api
from .auth import token_required
from ..common.data_helpers import get_db_connection, execute_sql, Json
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'files.log')

# File server configuration - use local file server for local branding
BRANDING = os.getenv('REACT_APP_BRANDING', 'silkroadonlightning')
if BRANDING == 'local':
    FILE_SERVER_URL = 'http://file_server:5006'
    FILE_SERVER_URL_RETRIEVAL = 'http://localhost:5006'
else:
    FILE_SERVER_URL = os.environ.get('FILE_SERVER_URL')
    FILE_SERVER_URL_RETRIEVAL = FILE_SERVER_URL

@rest_api.route('/api/v1/files/upload', methods=['POST'])
class UploadFile(Resource):
    """
    Endpoint for users to upload files
    """
    def post(self, request_origin='unknown'):
        try:
            # Check if file was provided
            if 'file' not in request.files:
                logger.error("No file part in request")
                return {"error": "No file part"}, 400
                
            file = request.files['file']
            
            # Check if file has a name
            if file.filename == '':
                logger.error("No file selected for uploading")
                return {"error": "No file selected for uploading"}, 400
                
            # Generate a unique file_id using UUID
            file_id = str(uuid.uuid4())
            
            # Collect metadata from the request
            metadata = {}
            if 'metadata' in request.form:
                try:
                    metadata = json.loads(request.form['metadata'])
                except json.JSONDecodeError:
                    logger.error("Invalid metadata JSON format")
                    return {"error": "Invalid metadata format"}, 400
            
            # Add user_id to metadata if available (optional for onboarding)
            # Check if user is authenticated by checking Authorization header
            auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
            if auth_header:
                try:
                    import jwt
                    from ..common.config import BaseConfig
                    from ..common.models import Users
                    
                    token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
                    data = jwt.decode(token, BaseConfig.SECRET_KEY, algorithms=["HS256"])
                    current_user = Users.get_by_email(data["email"])
                    if current_user:
                        metadata['user_id'] = current_user.id
                except Exception as e:
                    # Token invalid or not provided, continue without user_id
                    logger.debug(f"No valid auth token for file upload: {str(e)}")
                    pass
            
            metadata['original_filename'] = file.filename
            
            # Forward the file to the file server
            files = {'file': (file.filename, file.stream, file.content_type)}
            data = {'file_id': file_id}
            
            logger.info(f"Sending file to file server: {FILE_SERVER_URL}/api/file/upload")
            file_server_response = requests.post(
                f"{FILE_SERVER_URL}/api/file/upload",
                files=files,
                data=data
            )
            
            # Check if file was successfully uploaded to file server
            if file_server_response.status_code != 200:
                logger.error(f"File server error: {file_server_response.text}")
                return {"error": f"File server error: {file_server_response.text}"}, 500
                
            # Store file metadata in database
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Construct URI to the file
            file_uri = f"{FILE_SERVER_URL_RETRIEVAL}/api/file/download?file_id={file_id}"
            
            # Insert into files table
            sql = """
                INSERT INTO files (uri, metadata)
                VALUES (%s, %s)
                RETURNING file_id;
            """
            
            execute_sql(cur, sql, params=(file_uri, Json(metadata)))
            db_file_id = cur.fetchone()[0]  # Get the database file_id (different from UUID)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                "success": True,
                "file_id": db_file_id,
                "uuid": file_id,
                "uri": file_uri
            }, 200
            
        except Exception as e:
            logger.exception(f"Error during file upload: {str(e)}")
            return {"error": f"File upload failed: {str(e)}"}, 500

@rest_api.route('/api/v1/files/<int:file_id>', methods=['GET'])
class GetFile(Resource):
    """
    Retrieve file metadata by ID
    """
    @token_required
    def get(self, current_user, file_id, request_origin='unknown'):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Query to get the file metadata
            execute_sql(cur, """
                SELECT file_id, uri, metadata
                FROM files
                WHERE file_id = %s
            """, params=(file_id,))
            
            result = cur.fetchone()
            
            if not result:
                return {"error": "File not found"}, 404
                
            db_file_id, uri, metadata = result
            
            # Check if the user has permission to access this file
            if metadata.get('user_id') != current_user.id:
                return {"error": "Access denied"}, 403
                
            response_data = {
                "file_id": db_file_id,
                "uri": uri,
                "metadata": metadata
            }
            
            cur.close()
            conn.close()
            
            return response_data, 200
            
        except Exception as e:
            logger.exception(f"Error retrieving file: {str(e)}")
            return {"error": f"Failed to retrieve file: {str(e)}"}, 500

@rest_api.route('/api/v1/files', methods=['GET'])
class ListFiles(Resource):
    """
    List all files belonging to the current user
    """
    @token_required
    def get(self, current_user, request_origin='unknown'):
        try:
            # Get query parameters for pagination
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            
            # Validate pagination parameters
            if page < 1:
                page = 1
            if per_page < 1 or per_page > 100:
                per_page = 10
                
            # Calculate offset
            offset = (page - 1) * per_page
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Count total files for pagination
            count_sql = """
                SELECT COUNT(*)
                FROM files
                WHERE metadata->>'user_id' = %s
            """
            execute_sql(cur, count_sql, params=(str(current_user.id),))
            total_count = cur.fetchone()[0]
            
            # Query files with pagination
            files_sql = """
                SELECT file_id, uri, metadata
                FROM files
                WHERE metadata->>'user_id' = %s
                ORDER BY file_id DESC
                LIMIT %s OFFSET %s
            """
            execute_sql(cur, files_sql, params=(str(current_user.id), per_page, offset))
            
            files = []
            for row in cur.fetchall():
                file_id, uri, metadata = row
                files.append({
                    "file_id": file_id,
                    "uri": uri,
                    "metadata": metadata
                })
            
            cur.close()
            conn.close()
            
            # Calculate pagination info
            total_pages = (total_count + per_page - 1) // per_page
            
            return {
                "files": files,
                "pagination": {
                    "current_page": page,
                    "per_page": per_page,
                    "total_count": total_count,
                    "total_pages": total_pages
                }
            }, 200
            
        except Exception as e:
            logger.exception(f"Error listing files: {str(e)}")
            return {"error": f"Failed to list files: {str(e)}"}, 500

@rest_api.route('/api/v1/files/<int:file_id>', methods=['DELETE'])
class DeleteFile(Resource):
    """
    Delete a file (both metadata from database and file from file server)
    """
    @token_required
    def delete(self, current_user, file_id, request_origin='unknown'):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # First, get the file metadata to check ownership and get URI
            execute_sql(cur, """
                SELECT file_id, uri, metadata
                FROM files
                WHERE file_id = %s
            """, params=(file_id,))
            
            result = cur.fetchone()
            
            if not result:
                return {"error": "File not found"}, 404
                
            db_file_id, uri, metadata = result
            
            # Check if the user has permission to delete this file
            if metadata.get('user_id') != current_user.id:
                return {"error": "Access denied"}, 403
            
            # Extract the UUID from the URI to delete from file server
            try:
                # URI format: "http://fileserver/api/file/download?file_id=uuid"
                file_uuid = uri.split('file_id=')[1] if 'file_id=' in uri else None
                
                if file_uuid and FILE_SERVER_URL:
                    # Delete from file server
                    delete_response = requests.delete(
                        f"{FILE_SERVER_URL}/api/file/delete",
                        params={'file_id': file_uuid}
                    )
                    
                    if delete_response.status_code != 200:
                        logger.warning(f"Failed to delete file from file server: {delete_response.text}")
                        # Continue with database deletion even if file server deletion fails
                
            except Exception as e:
                logger.warning(f"Error deleting file from file server: {str(e)}")
                # Continue with database deletion even if file server deletion fails
            
            # Delete metadata from database
            execute_sql(cur, """
                DELETE FROM files
                WHERE file_id = %s
            """, params=(file_id,), commit=True, connection=conn)
            
            cur.close()
            conn.close()
            
            return {"success": True, "message": "File deleted successfully"}, 200
            
        except Exception as e:
            logger.exception(f"Error deleting file: {str(e)}")
            return {"error": f"Failed to delete file: {str(e)}"}, 500 