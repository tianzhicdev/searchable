"""
AI Content Manager API Routes
Handles creation, retrieval, and management of AI content submissions
"""

from flask import request
from flask_restx import Resource, fields
from datetime import datetime
import json

from .. import rest_api
from .auth import token_required
from ..common.ai_helpers import (
    create_ai_content,
    get_user_ai_contents,
    get_ai_content_by_id,
    delete_ai_content,
    get_all_ai_contents,
    update_ai_content_status,
    validate_file_ownership
)

# User endpoints (authenticated)

@rest_api.route('/v1/ai-content', methods=['POST'])
class CreateAIContent(Resource):
    @token_required
    def post(self, current_user):
        """Create new AI content submission"""
        try:
            user_id = current_user.id
            data = request.get_json()
            
            # Validate required fields
            if not data.get('title'):
                return {"success": False, "msg": "Title is required"}, 400
            
            if not data.get('instructions'):
                return {"success": False, "msg": "Instructions are required"}, 400
                
            if len(data.get('title', '')) > 255:
                return {"success": False, "msg": "Title must be 255 characters or less"}, 400
                
            # Validate files
            files = data.get('files', [])
            if not files:
                return {"success": False, "msg": "At least one file is required"}, 400
                
            if len(files) > 10:
                return {"success": False, "msg": "Maximum 10 files allowed"}, 400
                
            # Validate file ownership and structure
            file_ids = [f.get('fileId') for f in files if f.get('fileId')]
            if len(file_ids) != len(files):
                return {"success": False, "msg": "Invalid file data structure"}, 400
                
            # Verify user owns all files
            if not validate_file_ownership(user_id, file_ids):
                return {"success": False, "msg": "Invalid file ownership"}, 403
            
            # Create metadata
            metadata = {
                "files": files,
                "processedAt": None,
                "processedBy": None,
                "notes": None
            }
            
            # Create AI content
            ai_content_id = create_ai_content(
                user_id=user_id,
                title=data['title'],
                instructions=data['instructions'],
                metadata=metadata
            )
            
            if ai_content_id:
                return {
                    "success": True,
                    "id": ai_content_id,
                    "message": "AI content created successfully"
                }, 200
            else:
                return {"success": False, "msg": "Failed to create AI content"}, 500
                
        except Exception as e:
            print(f"Error creating AI content: {str(e)}")
            return {"success": False, "msg": "Internal server error"}, 500


@rest_api.route('/v1/ai-content', methods=['GET'])
class GetUserAIContents(Resource):
    @token_required
    def get(self, current_user):
        """Get user's AI content submissions"""
        try:
            user_id = current_user.id
            
            ai_contents = get_user_ai_contents(user_id)
            
            # Format response
            formatted_contents = []
            for content in ai_contents:
                metadata = content.get('metadata', {})
                formatted_contents.append({
                    "id": content['id'],
                    "title": content['title'],
                    "status": content['status'],
                    "created_at": content['created_at'].isoformat() if content['created_at'] else None,
                    "file_count": len(metadata.get('files', []))
                })
            
            return {
                "success": True,
                "ai_contents": formatted_contents,
                "total": len(formatted_contents)
            }, 200
            
        except Exception as e:
            print(f"Error fetching AI contents: {str(e)}")
            return {"success": False, "msg": "Internal server error"}, 500


@rest_api.route('/v1/ai-content/<int:ai_content_id>', methods=['GET'])
class GetAIContentDetail(Resource):
    @token_required
    def get(self, ai_content_id, current_user):
        """Get specific AI content (owner only)"""
        try:
            user_id = current_user.id
            
            ai_content = get_ai_content_by_id(ai_content_id)
            
            if not ai_content:
                return {"success": False, "msg": "AI content not found"}, 404
                
            # Check ownership
            if ai_content['user_id'] != user_id:
                return {"success": False, "msg": "Access denied"}, 403
            
            # Format response
            formatted_content = {
                "id": ai_content['id'],
                "title": ai_content['title'],
                "instructions": ai_content['instructions'],
                "status": ai_content['status'],
                "metadata": ai_content['metadata'],
                "created_at": ai_content['created_at'].isoformat() if ai_content['created_at'] else None,
                "updated_at": ai_content['updated_at'].isoformat() if ai_content['updated_at'] else None
            }
            
            return {"success": True, **formatted_content}, 200
            
        except Exception as e:
            print(f"Error fetching AI content: {str(e)}")
            return {"success": False, "msg": "Internal server error"}, 500


@rest_api.route('/v1/ai-content/<int:ai_content_id>', methods=['DELETE'])
class DeleteAIContent(Resource):
    @token_required
    def delete(self, ai_content_id, current_user):
        """Delete AI content (owner only, immutable after creation)"""
        try:
            user_id = current_user.id
            
            ai_content = get_ai_content_by_id(ai_content_id)
            
            if not ai_content:
                return {"success": False, "msg": "AI content not found"}, 404
                
            # Check ownership
            if ai_content['user_id'] != user_id:
                return {"success": False, "msg": "Access denied"}, 403
                
            # As per requirements, AI content is immutable once created
            return {"success": False, "msg": "AI content cannot be deleted after creation"}, 400
            
        except Exception as e:
            print(f"Error deleting AI content: {str(e)}")
            return {"success": False, "msg": "Internal server error"}, 500


# Employee endpoints (no auth for now)

@rest_api.route('/v1/employee/ai-content', methods=['GET'])
class EmployeeGetAllAIContents(Resource):
    def get(self):
        """Get all AI content submissions (employee endpoint)"""
        try:
            # Get query parameters
            status = request.args.get('status')
            limit = request.args.get('limit', 100, type=int)
            offset = request.args.get('offset', 0, type=int)
            
            ai_contents = get_all_ai_contents(status=status, limit=limit, offset=offset)
            
            # Format response with user info
            formatted_contents = []
            for content in ai_contents:
                metadata = content.get('metadata', {})
                formatted_contents.append({
                    "id": content['id'],
                    "user_id": content['user_id'],
                    "username": content.get('username', 'Unknown'),
                    "title": content['title'],
                    "instructions": content['instructions'],
                    "status": content['status'],
                    "metadata": metadata,
                    "created_at": content['created_at'].isoformat() if content['created_at'] else None,
                    "updated_at": content['updated_at'].isoformat() if content['updated_at'] else None,
                    "file_count": len(metadata.get('files', []))
                })
            
            return {
                "success": True,
                "ai_contents": formatted_contents,
                "total": len(formatted_contents),
                "limit": limit,
                "offset": offset
            }, 200
            
        except Exception as e:
            print(f"Error fetching all AI contents: {str(e)}")
            return {"success": False, "msg": "Internal server error"}, 500


@rest_api.route('/v1/employee/ai-content/<int:ai_content_id>', methods=['GET'])
class EmployeeGetAIContentDetail(Resource):
    def get(self, ai_content_id):
        """Get specific AI content with full details (employee endpoint)"""
        try:
            ai_content = get_ai_content_by_id(ai_content_id, include_user_info=True, include_file_uris=True)
            
            if not ai_content:
                return {"success": False, "msg": "AI content not found"}, 404
            
            # Format response with all details
            formatted_content = {
                "id": ai_content['id'],
                "user_id": ai_content['user_id'],
                "username": ai_content.get('username', 'Unknown'),
                "user_email": ai_content.get('email', 'Unknown'),
                "title": ai_content['title'],
                "instructions": ai_content['instructions'],
                "status": ai_content['status'],
                "metadata": ai_content['metadata'],
                "created_at": ai_content['created_at'].isoformat() if ai_content['created_at'] else None,
                "updated_at": ai_content['updated_at'].isoformat() if ai_content['updated_at'] else None
            }
            
            return {"success": True, **formatted_content}, 200
            
        except Exception as e:
            print(f"Error fetching AI content: {str(e)}")
            return {"success": False, "msg": "Internal server error"}, 500


@rest_api.route('/v1/employee/ai-content/<int:ai_content_id>', methods=['PUT'])
class EmployeeUpdateAIContentStatus(Resource):
    def put(self, ai_content_id):
        """Update AI content status (employee endpoint)"""
        try:
            data = request.get_json()
            
            if not data.get('status'):
                return {"success": False, "msg": "Status is required"}, 400
                
            if data['status'] not in ['submitted', 'processed']:
                return {"success": False, "msg": "Invalid status. Must be 'submitted' or 'processed'"}, 400
            
            # Optional notes for metadata
            notes = data.get('notes')
            processed_by = data.get('processed_by', 'employee')
            
            success = update_ai_content_status(
                ai_content_id=ai_content_id,
                status=data['status'],
                notes=notes,
                processed_by=processed_by
            )
            
            if success:
                return {
                    "success": True,
                    "message": "Status updated successfully",
                    "id": ai_content_id,
                    "status": data['status']
                }, 200
            else:
                return {"success": False, "msg": "Failed to update status"}, 500
                
        except Exception as e:
            print(f"Error updating AI content status: {str(e)}")
            return {"success": False, "msg": "Internal server error"}, 500


@rest_api.route('/v1/employee/ai-content/export', methods=['GET'])
class EmployeeExportAIContents(Resource):
    def get(self):
        """Bulk export endpoint for companion script"""
        try:
            # Get query parameters
            status = request.args.get('status', 'submitted')  # Default to submitted
            include_files = request.args.get('include_files', 'true').lower() == 'true'
            
            ai_contents = get_all_ai_contents(status=status, limit=1000, include_file_uris=True)
            
            # Format for export
            export_data = []
            for content in ai_contents:
                export_item = {
                    "id": content['id'],
                    "user_id": content['user_id'],
                    "username": content.get('username', 'Unknown'),
                    "user_email": content.get('email', 'Unknown'),
                    "title": content['title'],
                    "instructions": content['instructions'],
                    "status": content['status'],
                    "created_at": content['created_at'].isoformat() if content['created_at'] else None,
                    "files": content.get('metadata', {}).get('files', []) if include_files else []
                }
                export_data.append(export_item)
            
            return {
                "success": True,
                "ai_contents": export_data,
                "total": len(export_data),
                "exported_at": datetime.utcnow().isoformat()
            }, 200
            
        except Exception as e:
            print(f"Error exporting AI contents: {str(e)}")
            return {"success": False, "msg": "Internal server error"}, 500