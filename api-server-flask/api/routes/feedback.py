from flask import request
from flask_restx import Resource
from datetime import datetime, timedelta
import logging

from .. import rest_api
from .auth import token_required
from ..common.data_helpers import create_feedback
from ..common.logging_config import setup_logger

logger = setup_logger(__name__, 'feedback.log')

# Rate limiting: track feedback submissions per user
feedback_rate_limit = {}

def check_rate_limit(user_id, max_per_day=10):
    """Check if user has exceeded daily feedback limit"""
    now = datetime.now()
    
    # Clean up old entries
    feedback_rate_limit[user_id] = [
        timestamp for timestamp in feedback_rate_limit.get(user_id, [])
        if now - timestamp < timedelta(days=1)
    ]
    
    # Check limit
    if len(feedback_rate_limit.get(user_id, [])) >= max_per_day:
        return False
    
    return True

def record_submission(user_id):
    """Record a feedback submission for rate limiting"""
    if user_id not in feedback_rate_limit:
        feedback_rate_limit[user_id] = []
    feedback_rate_limit[user_id].append(datetime.now())


@rest_api.route('/api/v1/feedback')
class FeedbackResource(Resource):
    @token_required
    def post(self, current_user):
        """
        Submit user feedback
        
        Expected JSON body:
        {
            "feedback": "string (required, max 5000 chars)"
        }
        """
        try:
            user_id = current_user.id
            data = request.get_json()
            
            # Validate input
            if not data:
                return {'error': 'No data provided'}, 400
            
            feedback_text = data.get('feedback', '').strip()
            
            if not feedback_text:
                return {'error': 'Feedback text is required'}, 400
            
            if len(feedback_text) > 5000:
                return {'error': 'Feedback too long (max 5000 characters)'}, 400
            
            # Check rate limit
            if not check_rate_limit(user_id):
                return {
                    'error': 'Too many feedback submissions. Please try again tomorrow.'
                }, 429
            
            # Collect metadata
            metadata = {
                'currentPage': request.headers.get('Referer', ''),
                'userAgent': request.headers.get('User-Agent', ''),
                'viewport': data.get('viewport', ''),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Save feedback
            feedback_id = create_feedback(user_id, feedback_text, metadata)
            
            if feedback_id:
                # Record submission for rate limiting
                record_submission(user_id)
                
                logger.info(f"Feedback {feedback_id} submitted by user {user_id}")
                
                return {
                    'success': True,
                    'message': 'Thank you for your feedback!'
                }, 201
            else:
                logger.error(f"Failed to save feedback for user {user_id}")
                return {'error': 'Failed to save feedback'}, 500
                
        except Exception as e:
            logger.error(f"Error in submit_feedback: {str(e)}")
            return {'error': 'An error occurred while processing your feedback'}, 500