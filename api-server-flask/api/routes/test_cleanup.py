import os
import jwt
from flask import request, jsonify
from flask_restx import Resource, fields
from psycopg2.extras import Json

# Import from our new structure
from .. import rest_api
from ..common.config import BaseConfig
from ..common.models import db, Users, JWTTokenBlocklist
from ..common.database import get_db_connection, execute_sql
from ..common.logging_config import setup_logger
from ..routes.auth import token_required

# Set up the logger
logger = setup_logger(__name__, 'test_cleanup.log')

# Test cleanup namespace
test_cleanup_ns = rest_api.namespace('test', description='Test utilities and cleanup endpoints')

# Models for API documentation
cleanup_response_model = rest_api.model('CleanupResponse', {
    'success': fields.Boolean(required=True, description='Whether cleanup was successful'),
    'message': fields.String(required=True, description='Cleanup result message'),
    'deleted_counts': fields.Raw(description='Count of deleted records by table')
})

user_cleanup_model = rest_api.model('UserCleanupModel', {
    'user_email': fields.String(required=True, description='Email of user to clean up'),
    'cleanup_associated_data': fields.Boolean(default=True, description='Whether to clean up associated data')
})

# Test environment check
def is_test_environment():
    """Check if we're in a test environment"""
    env = os.environ.get('FLASK_ENV', '').lower()
    test_mode = os.environ.get('TEST_MODE', '').lower() 
    app_env = os.environ.get('APP_ENV', '').lower()
    
    return (env in ['test', 'testing'] or 
            test_mode in ['true', '1', 'yes'] or 
            app_env in ['test', 'testing'])

def require_test_environment(f):
    """Decorator to ensure endpoint is only accessible in test environment"""
    def decorator(*args, **kwargs):
        if not is_test_environment():
            return {
                'success': False,
                'message': 'Cleanup endpoints are only available in test environments'
            }, 403
        return f(*args, **kwargs)
    return decorator

@test_cleanup_ns.route('/cleanup/user')
class UserCleanup(Resource):
    @test_cleanup_ns.expect(user_cleanup_model)
    @test_cleanup_ns.marshal_with(cleanup_response_model)
    @require_test_environment
    def delete(self):
        """Clean up test user and all associated data"""
        try:
            data = request.get_json()
            user_email = data.get('user_email')
            cleanup_associated = data.get('cleanup_associated_data', True)
            
            if not user_email:
                return {
                    'success': False,
                    'message': 'user_email is required'
                }, 400
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get user ID first
            execute_sql(cur, "SELECT id FROM users WHERE email = %s", (user_email,))
            user_result = cur.fetchone()
            
            if not user_result:
                cur.close()
                conn.close()
                return {
                    'success': True,
                    'message': f'User {user_email} not found (may already be cleaned up)',
                    'deleted_counts': {}
                }
            
            user_id = user_result[0]
            deleted_counts = {}
            
            if cleanup_associated:
                # Clean up data in dependency order (child tables first)
                
                # 1. Clean up ratings
                execute_sql(cur, "DELETE FROM rating WHERE user_id = %s", (user_id,))
                deleted_counts['ratings'] = cur.rowcount
                
                # 2. Clean up invoice notes
                execute_sql(cur, "DELETE FROM invoice_note WHERE user_id = %s", (user_id,))
                deleted_counts['invoice_notes'] = cur.rowcount
                
                # 3. Clean up payments (via invoices where user is buyer or seller)
                execute_sql(cur, """
                    DELETE FROM payment 
                    WHERE invoice_id IN (
                        SELECT id FROM invoice 
                        WHERE buyer_id = %s OR seller_id = %s
                    )
                """, (user_id, user_id))
                deleted_counts['payments'] = cur.rowcount
                
                # 4. Clean up invoices
                execute_sql(cur, "DELETE FROM invoice WHERE buyer_id = %s OR seller_id = %s", (user_id, user_id))
                deleted_counts['invoices'] = cur.rowcount
                
                # 5. Clean up withdrawals
                execute_sql(cur, "DELETE FROM withdrawal WHERE user_id = %s", (user_id,))
                deleted_counts['withdrawals'] = cur.rowcount
                
                # 6. Clean up purchases
                execute_sql(cur, "DELETE FROM purchases WHERE user_id = %s", (user_id,))
                deleted_counts['purchases'] = cur.rowcount
                
                # 7. Clean up user profile
                execute_sql(cur, "DELETE FROM user_profile WHERE user_id = %s", (user_id,))
                deleted_counts['user_profiles'] = cur.rowcount
                
                # 8. Clean up searchables
                execute_sql(cur, "DELETE FROM searchables WHERE terminal_id = %s", (user_id,))
                deleted_counts['searchables'] = cur.rowcount
                
                # 9. Clean up terminal data
                execute_sql(cur, "DELETE FROM terminal WHERE terminal_id = %s", (user_id,))
                deleted_counts['terminals'] = cur.rowcount
                
                # 10. Clean up kv store entries
                execute_sql(cur, "DELETE FROM kv WHERE pkey = %s OR fkey = %s", (str(user_id), str(user_id)))
                deleted_counts['kv_entries'] = cur.rowcount
            
            # 11. Clean up JWT tokens
            execute_sql(cur, """
                DELETE FROM jwt_token_blocklist 
                WHERE jwt_token IN (
                    SELECT jwt_token FROM jwt_token_blocklist 
                    WHERE jwt_token LIKE %s
                )
            """, (f'%{user_id}%',))
            deleted_counts['jwt_tokens'] = cur.rowcount
            
            # 12. Finally, delete the user
            execute_sql(cur, "DELETE FROM users WHERE id = %s", (user_id,))
            deleted_counts['users'] = cur.rowcount
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info(f"Successfully cleaned up user {user_email} and associated data: {deleted_counts}")
            
            return {
                'success': True,
                'message': f'Successfully cleaned up user {user_email} and associated data',
                'deleted_counts': deleted_counts
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up user {user_email}: {str(e)}")
            return {
                'success': False,
                'message': f'Error cleaning up user: {str(e)}'
            }, 500

@test_cleanup_ns.route('/cleanup/searchable/<int:searchable_id>')
class SearchableCleanup(Resource):
    @test_cleanup_ns.marshal_with(cleanup_response_model)
    @require_test_environment
    def delete(self, searchable_id):
        """Clean up specific searchable and all associated data"""
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            deleted_counts = {}
            
            # Clean up data in dependency order
            
            # 1. Clean up ratings (via invoices)
            execute_sql(cur, """
                DELETE FROM rating 
                WHERE invoice_id IN (
                    SELECT id FROM invoice WHERE searchable_id = %s
                )
            """, (searchable_id,))
            deleted_counts['ratings'] = cur.rowcount
            
            # 2. Clean up invoice notes (via invoices)
            execute_sql(cur, """
                DELETE FROM invoice_note 
                WHERE invoice_id IN (
                    SELECT id FROM invoice WHERE searchable_id = %s
                )
            """, (searchable_id,))
            deleted_counts['invoice_notes'] = cur.rowcount
            
            # 3. Clean up payments (via invoices)
            execute_sql(cur, """
                DELETE FROM payment 
                WHERE invoice_id IN (
                    SELECT id FROM invoice WHERE searchable_id = %s
                )
            """, (searchable_id,))
            deleted_counts['payments'] = cur.rowcount
            
            # 4. Clean up invoices
            execute_sql(cur, "DELETE FROM invoice WHERE searchable_id = %s", (searchable_id,))
            deleted_counts['invoices'] = cur.rowcount
            
            # 5. Clean up the searchable itself
            execute_sql(cur, "DELETE FROM searchables WHERE searchable_id = %s", (searchable_id,))
            deleted_counts['searchables'] = cur.rowcount
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info(f"Successfully cleaned up searchable {searchable_id}: {deleted_counts}")
            
            return {
                'success': True,
                'message': f'Successfully cleaned up searchable {searchable_id}',
                'deleted_counts': deleted_counts
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up searchable {searchable_id}: {str(e)}")
            return {
                'success': False,
                'message': f'Error cleaning up searchable: {str(e)}'
            }, 500

@test_cleanup_ns.route('/cleanup/invoice/<invoice_id>')
class InvoiceCleanup(Resource):
    @test_cleanup_ns.marshal_with(cleanup_response_model)
    @require_test_environment
    def delete(self, invoice_id):
        """Clean up specific invoice and all associated data"""
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            deleted_counts = {}
            
            # Clean up data in dependency order
            
            # 1. Clean up ratings
            execute_sql(cur, "DELETE FROM rating WHERE invoice_id = %s", (invoice_id,))
            deleted_counts['ratings'] = cur.rowcount
            
            # 2. Clean up invoice notes
            execute_sql(cur, "DELETE FROM invoice_note WHERE invoice_id = %s", (invoice_id,))
            deleted_counts['invoice_notes'] = cur.rowcount
            
            # 3. Clean up payments
            execute_sql(cur, "DELETE FROM payment WHERE invoice_id = %s", (invoice_id,))
            deleted_counts['payments'] = cur.rowcount
            
            # 4. Clean up the invoice
            execute_sql(cur, "DELETE FROM invoice WHERE id = %s", (invoice_id,))
            deleted_counts['invoices'] = cur.rowcount
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info(f"Successfully cleaned up invoice {invoice_id}: {deleted_counts}")
            
            return {
                'success': True,
                'message': f'Successfully cleaned up invoice {invoice_id}',
                'deleted_counts': deleted_counts
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up invoice {invoice_id}: {str(e)}")
            return {
                'success': False,
                'message': f'Error cleaning up invoice: {str(e)}'
            }, 500

@test_cleanup_ns.route('/cleanup/all')
class AllCleanup(Resource):
    @test_cleanup_ns.marshal_with(cleanup_response_model)
    @require_test_environment
    def delete(self):
        """Clean up ALL test data (dangerous - use with caution)"""
        try:
            # Additional safety check
            if not os.environ.get('ALLOW_FULL_CLEANUP'):
                return {
                    'success': False,
                    'message': 'Full cleanup requires ALLOW_FULL_CLEANUP environment variable'
                }, 403
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            deleted_counts = {}
            
            # Clean up all data in dependency order
            execute_sql(cur, "DELETE FROM rating")
            deleted_counts['ratings'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM invoice_note")
            deleted_counts['invoice_notes'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM payment")
            deleted_counts['payments'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM invoice")
            deleted_counts['invoices'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM withdrawal")
            deleted_counts['withdrawals'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM purchases")
            deleted_counts['purchases'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM files")
            deleted_counts['files'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM user_profile")
            deleted_counts['user_profiles'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM searchables")
            deleted_counts['searchables'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM terminal")
            deleted_counts['terminals'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM kv")
            deleted_counts['kv_entries'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM jwt_token_blocklist")
            deleted_counts['jwt_tokens'] = cur.rowcount
            
            execute_sql(cur, "DELETE FROM users")
            deleted_counts['users'] = cur.rowcount
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.warning(f"Full cleanup performed - all data deleted: {deleted_counts}")
            
            return {
                'success': True,
                'message': 'Successfully cleaned up all test data',
                'deleted_counts': deleted_counts
            }
            
        except Exception as e:
            logger.error(f"Error performing full cleanup: {str(e)}")
            return {
                'success': False,
                'message': f'Error performing full cleanup: {str(e)}'
            }, 500

@test_cleanup_ns.route('/cleanup/status')
class CleanupStatus(Resource):
    @require_test_environment
    def get(self):
        """Get cleanup system status and data counts"""
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            counts = {}
            
            # Get count of records in each table
            tables = ['users', 'searchables', 'invoice', 'payment', 'withdrawal', 
                     'rating', 'invoice_note', 'user_profile', 'terminal', 'kv', 
                     'files', 'purchases', 'jwt_token_blocklist']
            
            for table in tables:
                try:
                    execute_sql(cur, f"SELECT COUNT(*) FROM {table}")
                    count = cur.fetchone()[0]
                    counts[table] = count
                except Exception as e:
                    counts[table] = f"Error: {str(e)}"
            
            cur.close()
            conn.close()
            
            return {
                'success': True,
                'test_environment': is_test_environment(),
                'full_cleanup_allowed': bool(os.environ.get('ALLOW_FULL_CLEANUP')),
                'table_counts': counts
            }
            
        except Exception as e:
            logger.error(f"Error getting cleanup status: {str(e)}")
            return {
                'success': False,
                'message': f'Error getting status: {str(e)}'
            }, 500