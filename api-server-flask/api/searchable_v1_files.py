import os
import requests
import json
from flask import request, jsonify
from flask_restx import Resource
import uuid
from . import rest_api
from .routes import token_required
from .helper import get_db_connection, execute_sql, Json, setup_logger
import math

# Set up the logger
logger = setup_logger(__name__, 'searchable_v1_files.log')

# File server configuration
FILE_SERVER_URL = os.environ.get('FILE_SERVER_URL')

@rest_api.route('/api/v1/files/upload', methods=['POST'])
class UploadFile(Resource):
    """
    Endpoint for users to upload files
    """
    @token_required
    def post(self, current_user, request_origin='unknown'):
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
            
            # Add user_id to metadata
            metadata['user_id'] = current_user.id
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
            file_uri = f"{FILE_SERVER_URL}/api/file/download?file_id={file_id}"
            
            # Insert into files table
            sql = f"""
                INSERT INTO files (uri, metadata)
                VALUES ('{file_uri}', {Json(metadata)})
                RETURNING file_id;
            """
            
            execute_sql(cur, sql)
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
            execute_sql(cur, f"""
                SELECT file_id, uri, metadata
                FROM files
                WHERE file_id = {file_id}
            """)
            
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
            count_sql = f"""
                SELECT COUNT(*)
                FROM files
                WHERE metadata->>'user_id' = '{current_user.id}'
            """
            execute_sql(cur, count_sql)
            total_count = cur.fetchone()[0]
            
            # Query files with pagination
            files_sql = f"""
                SELECT file_id, uri, metadata
                FROM files
                WHERE metadata->>'user_id' = '{current_user.id}'
                ORDER BY file_id DESC
                LIMIT {per_page} OFFSET {offset}
            """
            execute_sql(cur, files_sql)
            
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
            
            # Calculate total pages
            total_pages = math.ceil(total_count / per_page) if total_count > 0 else 0
            
            return {
                "files": files,
                "pagination": {
                    "total_count": total_count,
                    "total_pages": total_pages,
                    "current_page": page,
                    "per_page": per_page
                }
            }, 200
            
        except Exception as e:
            logger.exception(f"Error listing files: {str(e)}")
            return {"error": f"Failed to list files: {str(e)}"}, 500

@rest_api.route('/api/v1/files/<int:file_id>', methods=['DELETE'])
class DeleteFile(Resource):
    """
    Delete a file by ID
    """
    @token_required
    def delete(self, current_user, file_id, request_origin='unknown'):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # First, get the file details to check permissions and get the UUID
            execute_sql(cur, f"""
                SELECT uri, metadata
                FROM files
                WHERE file_id = {file_id}
            """)
            
            result = cur.fetchone()
            
            if not result:
                return {"error": "File not found"}, 404
                
            uri, metadata = result
            
            # Check if the user has permission to delete this file
            if metadata.get('user_id') != current_user.id:
                return {"error": "Access denied"}, 403
                
            # Extract the file_id (UUID) from the URI
            # URI format: {FILE_SERVER_URL}/api/file/download?file_id={uuid}
            uuid_from_uri = uri.split('file_id=')[-1]
            
            # Delete from the file server
            try:
                # Note: File server should have a delete endpoint. If not, this part can be adjusted.
                # Here we're assuming a RESTful endpoint for file deletion
                delete_url = f"{FILE_SERVER_URL}/api/file/delete?file_id={uuid_from_uri}"
                response = requests.delete(delete_url)
                
                if response.status_code not in [200, 204]:
                    logger.warning(f"File server returned non-success status code: {response.status_code}, body: {response.text}")
                    # Continue with local deletion even if file server deletion fails
            except Exception as e:
                logger.warning(f"Failed to delete file from file server: {str(e)}")
                # Continue with local deletion even if file server deletion fails
                
            # Delete the file record from the database
            execute_sql(cur, f"""
                DELETE FROM files
                WHERE file_id = {file_id}
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {"success": True, "message": "File deleted successfully"}, 200
            
        except Exception as e:
            logger.exception(f"Error deleting file: {str(e)}")
            return {"error": f"Failed to delete file: {str(e)}"}, 500
