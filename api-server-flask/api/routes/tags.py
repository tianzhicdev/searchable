"""
Tag management API routes using Flask-RESTX
Handles CRUD operations for tags, user tags, and searchable tags
"""

from flask import request
from flask_restx import Resource, fields

# Import from our structure
from .. import rest_api
from ..common.tag_helpers import (
    get_tags, get_tags_by_ids, get_user_tags, add_user_tags, remove_user_tag, get_user_tag_count,
    get_searchable_tags, add_searchable_tags, remove_searchable_tag, get_searchable_tag_count,
    search_users_by_tags, search_searchables_by_tags
)
from ..common.data_helpers import get_terminal, get_searchable
from ..common.logging_config import setup_logger
from .auth import token_required

# Set up logger
logger = setup_logger(__name__, 'tags.log')

# Flask-RESTX models for request/response data
tag_model = rest_api.model('Tag', {
    'id': fields.Integer(required=True, description='Tag ID'),
    'name': fields.String(required=True, description='Tag name'),
    'tag_type': fields.String(required=True, description='Tag type (user or searchable)'),
    'description': fields.String(description='Tag description'),
    'is_active': fields.Boolean(description='Whether tag is active'),
    'created_at': fields.String(description='Creation timestamp')
})

tag_assignment_model = rest_api.model('TagAssignment', {
    'tag_ids': fields.List(fields.Integer, required=True, description='List of tag IDs to assign')
})

@rest_api.route('/api/v1/tags')
class TagsResource(Resource):
    def get(self):
        """
        Get all available tags, optionally filtered by type
        Query params:
        - type: 'user' or 'searchable' (optional)
        - active: 'true' or 'false' (default: 'true')
        """
        try:
            tag_type = request.args.get('type')
            active_filter = request.args.get('active', 'true').lower() == 'true'
            
            tags = get_tags(tag_type=tag_type, active_only=active_filter)
            
            return {
                'success': True,
                'tags': tags,
                'count': len(tags)
            }, 200
            
        except Exception as e:
            logger.error(f"Error fetching tags: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to fetch tags'
            }, 500


@rest_api.route('/api/v1/users/<int:user_id>/tags')
class UserTagsResource(Resource):
    def get(self, user_id):
        """Get all tags associated with a specific user"""
        try:
            # Verify user exists
            user = get_terminal(user_id)
            if not user:
                return {
                    'success': False,
                    'error': 'User not found'
                }, 404
            
            tags = get_user_tags(user_id)
            
            return {
                'success': True,
                'user_id': user_id,
                'tags': tags,
                'count': len(tags)
            }, 200
            
        except Exception as e:
            logger.error(f"Error fetching user tags for user {user_id}: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to fetch user tags'
            }, 500

    @rest_api.expect(tag_assignment_model)
    @token_required
    def post(self, user_id, current_user=None):
        """
        Add tags to a user
        Request body: {"tag_ids": [1, 2, 3]}
        """
        try:
            current_user_id = current_user.id
            
            # Only allow users to modify their own tags
            if current_user_id != user_id:
                return {
                    'success': False,
                    'error': 'Unauthorized: You can only modify your own tags'
                }, 403
            
            # Verify user exists
            user = get_terminal(user_id)
            if not user:
                return {
                    'success': False,
                    'error': 'User not found'
                }, 404
            
            data = request.get_json()
            if not data or 'tag_ids' not in data:
                return {
                    'success': False,
                    'error': 'tag_ids is required'
                }, 400
            
            tag_ids = data['tag_ids']
            if not isinstance(tag_ids, list):
                return {
                    'success': False,
                    'error': 'tag_ids must be a list'
                }, 400
            
            # Validate that all tag_ids are valid user tags
            tags = get_tags_by_ids(tag_ids)
            user_tag_ids = [tag['id'] for tag in tags if tag['tag_type'] == 'user' and tag['is_active']]
            
            if len(user_tag_ids) != len(tag_ids):
                return {
                    'success': False,
                    'error': 'Some tag IDs are invalid or not user tags'
                }, 400
            
            # Check tag limit (max 10 tags per user)
            current_tag_count = get_user_tag_count(user_id)
            current_tags = get_user_tags(user_id)
            current_tag_ids = [tag['id'] for tag in current_tags]
            
            new_tag_ids = [tid for tid in user_tag_ids if tid not in current_tag_ids]
            total_tags = current_tag_count + len(new_tag_ids)
            
            if total_tags > 10:
                return {
                    'success': False,
                    'error': 'Maximum 10 tags allowed per user'
                }, 400
            
            # Add tags
            success = add_user_tags(user_id, user_tag_ids)
            if not success:
                return {
                    'success': False,
                    'error': 'Failed to add user tags'
                }, 500
            
            # Return updated tag list
            updated_tags = get_user_tags(user_id)
            
            return {
                'success': True,
                'user_id': user_id,
                'tags': updated_tags,
                'count': len(updated_tags)
            }, 200
            
        except Exception as e:
            logger.error(f"Error adding user tags for user {user_id}: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to add user tags'
            }, 500


@rest_api.route('/api/v1/users/<int:user_id>/tags/<int:tag_id>')
class UserTagResource(Resource):
    @token_required
    def delete(self, user_id, tag_id, current_user=None):
        """Remove a specific tag from a user"""
        try:
            current_user_id = current_user.id
            
            # Only allow users to modify their own tags
            if current_user_id != user_id:
                return {
                    'success': False,
                    'error': 'Unauthorized: You can only modify your own tags'
                }, 403
            
            # Verify user exists
            user = get_terminal(user_id)
            if not user:
                return {
                    'success': False,
                    'error': 'User not found'
                }, 404
            
            # Remove tag
            removed = remove_user_tag(user_id, tag_id)
            
            if not removed:
                return {
                    'success': False,
                    'error': 'Tag not found for this user'
                }, 404
            
            # Return updated tag list
            updated_tags = get_user_tags(user_id)
            
            return {
                'success': True,
                'user_id': user_id,
                'tags': updated_tags,
                'count': len(updated_tags)
            }, 200
            
        except Exception as e:
            logger.error(f"Error removing user tag {tag_id} for user {user_id}: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to remove user tag'
            }, 500


@rest_api.route('/api/v1/searchables/<int:searchable_id>/tags')
class SearchableTagsResource(Resource):
    def get(self, searchable_id):
        """Get all tags associated with a specific searchable"""
        try:
            # Verify searchable exists
            searchable = get_searchable(searchable_id)
            if not searchable:
                return {
                    'success': False,
                    'error': 'Searchable not found'
                }, 404
            
            tags = get_searchable_tags(searchable_id)
            
            return {
                'success': True,
                'searchable_id': searchable_id,
                'tags': tags,
                'count': len(tags)
            }, 200
            
        except Exception as e:
            logger.error(f"Error fetching searchable tags for searchable {searchable_id}: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to fetch searchable tags'
            }, 500

    @rest_api.expect(tag_assignment_model)
    @token_required
    def post(self, searchable_id, current_user=None):
        """
        Add tags to a searchable
        Request body: {"tag_ids": [1, 2, 3]}
        """
        try:
            current_user_id = current_user.id
            
            # Verify searchable exists and user owns it
            searchable = get_searchable(searchable_id)
            if not searchable:
                return {
                    'success': False,
                    'error': 'Searchable not found'
                }, 404
            
            # Check ownership (terminal_id is stored as string in JSON)
            if int(searchable.get('terminal_id', 0)) != current_user_id:
                return {
                    'success': False,
                    'error': 'Unauthorized: You can only modify your own searchables'
                }, 403
            
            data = request.get_json()
            if not data or 'tag_ids' not in data:
                return {
                    'success': False,
                    'error': 'tag_ids is required'
                }, 400
            
            tag_ids = data['tag_ids']
            if not isinstance(tag_ids, list):
                return {
                    'success': False,
                    'error': 'tag_ids must be a list'
                }, 400
            
            # Validate that all tag_ids are valid searchable tags
            tags = get_tags_by_ids(tag_ids)
            searchable_tag_ids = [tag['id'] for tag in tags if tag['tag_type'] == 'searchable' and tag['is_active']]
            
            if len(searchable_tag_ids) != len(tag_ids):
                return {
                    'success': False,
                    'error': 'Some tag IDs are invalid or not searchable tags'
                }, 400
            
            # Check tag limit (max 15 tags per searchable)
            current_tag_count = get_searchable_tag_count(searchable_id)
            current_tags = get_searchable_tags(searchable_id)
            current_tag_ids = [tag['id'] for tag in current_tags]
            
            new_tag_ids = [tid for tid in searchable_tag_ids if tid not in current_tag_ids]
            total_tags = current_tag_count + len(new_tag_ids)
            
            if total_tags > 15:
                return {
                    'success': False,
                    'error': 'Maximum 15 tags allowed per searchable'
                }, 400
            
            # Add tags
            success = add_searchable_tags(searchable_id, searchable_tag_ids)
            if not success:
                return {
                    'success': False,
                    'error': 'Failed to add searchable tags'
                }, 500
            
            # Return updated tag list
            updated_tags = get_searchable_tags(searchable_id)
            
            return {
                'success': True,
                'searchable_id': searchable_id,
                'tags': updated_tags,
                'count': len(updated_tags)
            }, 200
            
        except Exception as e:
            logger.error(f"Error adding searchable tags for searchable {searchable_id}: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to add searchable tags'
            }, 500


@rest_api.route('/api/v1/searchables/<int:searchable_id>/tags/<int:tag_id>')
class SearchableTagResource(Resource):
    @token_required
    def delete(self, searchable_id, tag_id, current_user=None):
        """Remove a specific tag from a searchable"""
        try:
            current_user_id = current_user.id
            
            # Verify searchable exists and user owns it
            searchable = get_searchable(searchable_id)
            if not searchable:
                return {
                    'success': False,
                    'error': 'Searchable not found'
                }, 404
            
            # Check ownership (terminal_id is stored as string in JSON)
            if int(searchable.get('terminal_id', 0)) != current_user_id:
                return {
                    'success': False,
                    'error': 'Unauthorized: You can only modify your own searchables'
                }, 403
            
            # Remove tag
            removed = remove_searchable_tag(searchable_id, tag_id)
            
            if not removed:
                return {
                    'success': False,
                    'error': 'Tag not found for this searchable'
                }, 404
            
            # Return updated tag list
            updated_tags = get_searchable_tags(searchable_id)
            
            return {
                'success': True,
                'searchable_id': searchable_id,
                'tags': updated_tags,
                'count': len(updated_tags)
            }, 200
            
        except Exception as e:
            logger.error(f"Error removing searchable tag {tag_id} for searchable {searchable_id}: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to remove searchable tag'
            }, 500


@rest_api.route('/api/v1/search/users')
class SearchUsersResource(Resource):
    def get(self):
        """
        Search users by tags
        Query params:
        - tags[]: array of tag names (e.g., ?tags[]=artist&tags[]=store)
        - page: page number (default: 1)
        - limit: items per page (default: 20, max: 50)
        """
        try:
            # Get query parameters
            tag_names = request.args.getlist('tags[]')
            page = int(request.args.get('page', 1))
            limit = min(int(request.args.get('limit', 20)), 50)  # Max 50 items per page
            
            if not tag_names:
                return {
                    'success': False,
                    'error': 'At least one tag is required'
                }, 400
            
            result = search_users_by_tags(tag_names, page, limit)
            
            return {
                'success': True,
                'users': result['users'],
                'pagination': {
                    'page': result['page'],
                    'limit': result['limit'],
                    'total': result['total'],
                    'pages': result['pages']
                }
            }, 200
            
        except Exception as e:
            logger.error(f"Error searching users by tags: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to search users'
            }, 500


@rest_api.route('/api/v1/search/searchables')
class SearchSearchablesResource(Resource):
    def get(self):
        """
        Search searchables by tags
        Query params:
        - tags[]: array of tag names
        - page: page number (default: 1)
        - limit: items per page (default: 20, max: 50)
        """
        try:
            # Get query parameters
            tag_names = request.args.getlist('tags[]')
            page = int(request.args.get('page', 1))
            limit = min(int(request.args.get('limit', 20)), 50)
            
            if not tag_names:
                return {
                    'success': False,
                    'error': 'At least one tag is required'
                }, 400
            
            result = search_searchables_by_tags(tag_names, page, limit)
            
            return {
                'success': True,
                'searchables': result['searchables'],
                'pagination': {
                    'page': result['page'],
                    'limit': result['limit'],
                    'total': result['total'],
                    'pages': result['pages']
                }
            }, 200
            
        except Exception as e:
            logger.error(f"Error searching searchables by tags: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to search searchables'
            }, 500