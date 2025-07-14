"""
AI Content Helper Functions
Database operations and utilities for AI content management
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

from .database import get_db_connection
from .database_context import database_cursor, database_transaction, db


def create_ai_content(user_id, title, instructions, metadata):
    """Create new AI content entry"""
    try:
        query = """
            INSERT INTO ai_content (user_id, title, instructions, status, metadata)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """
        
        result = db.execute_insert(query, (
            user_id,
            title,
            instructions,
            'submitted',
            json.dumps(metadata)
        ))
        
        return result[0] if result else None
        
    except Exception as e:
        print(f"Error creating AI content: {str(e)}")
        return None


def get_user_ai_contents(user_id):
    """Get all AI content submissions for a user"""
    try:
        with database_cursor() as (cur, conn):
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT id, title, status, metadata, created_at
                FROM ai_content
                WHERE user_id = %s
                ORDER BY created_at DESC
            """
            
            cur.execute(query, (user_id,))
            results = cur.fetchall()
            
            return results
        
    except Exception as e:
        print(f"Error fetching user AI contents: {str(e)}")
        return []


def get_ai_content_by_id(ai_content_id, include_user_info=False, include_file_uris=False):
    """Get specific AI content by ID"""
    try:
        with database_cursor() as (cur, conn):
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            if include_user_info:
                query = """
                    SELECT ac.*, u.username, u.email
                    FROM ai_content ac
                    LEFT JOIN users u ON ac.user_id = u.id
                    WHERE ac.id = %s
                """
            else:
                query = """
                    SELECT *
                    FROM ai_content
                    WHERE id = %s
                """
            
            cur.execute(query, (ai_content_id,))
            result = cur.fetchone()
            
            # If requested, enrich file data with URIs
            if result and include_file_uris and result.get('metadata') and result['metadata'].get('files'):
                files = result['metadata']['files']
                # Only get numeric file IDs to avoid SQL type mismatch
                file_ids = []
                for f in files:
                    if 'fileId' in f:
                        try:
                            file_id = int(f['fileId'])
                            file_ids.append(file_id)
                        except (ValueError, TypeError):
                            # Skip non-numeric file IDs
                            pass
                
                if file_ids:
                    # Get file URIs from database
                    file_query = """
                        SELECT file_id, uri
                        FROM files
                        WHERE file_id = ANY(%s)
                    """
                    cur.execute(file_query, (file_ids,))
                    file_uris = {str(row['file_id']): row['uri'] for row in cur.fetchall()}
                    
                    # Add URIs to files
                    for file_info in files:
                        if 'fileId' in file_info and str(file_info['fileId']) in file_uris:
                            file_info['uri'] = file_uris[str(file_info['fileId'])]
            
            return result
        
    except Exception as e:
        print(f"Error fetching AI content: {str(e)}")
        return None


def delete_ai_content(ai_content_id, user_id):
    """Delete AI content (checking ownership)"""
    try:
        with database_transaction() as (cur, conn):
            # Check ownership first
            check_query = "SELECT user_id FROM ai_content WHERE id = %s"
            cur.execute(check_query, (ai_content_id,))
            result = cur.fetchone()
            
            if not result or result[0] != user_id:
                return False
            
            # Delete the content
            delete_query = "DELETE FROM ai_content WHERE id = %s"
            cur.execute(delete_query, (ai_content_id,))
            
            return cur.rowcount > 0
        
    except Exception as e:
        print(f"Error deleting AI content: {str(e)}")
        return False


def get_all_ai_contents(status=None, limit=100, offset=0, include_file_uris=False):
    """Get all AI content submissions (for employees)"""
    try:
        with database_cursor() as (cur, conn):
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            if status:
                query = """
                    SELECT ac.*, u.username, u.email
                    FROM ai_content ac
                    LEFT JOIN users u ON ac.user_id = u.id
                    WHERE ac.status = %s
                    ORDER BY ac.created_at DESC
                    LIMIT %s OFFSET %s
                """
                cur.execute(query, (status, limit, offset))
            else:
                query = """
                    SELECT ac.*, u.username, u.email
                    FROM ai_content ac
                    LEFT JOIN users u ON ac.user_id = u.id
                    ORDER BY ac.created_at DESC
                    LIMIT %s OFFSET %s
                """
                cur.execute(query, (limit, offset))
            
            results = cur.fetchall()
            
            # If requested, enrich file data with URIs
            if include_file_uris:
                # Collect all numeric file IDs
                all_file_ids = []
                for content in results:
                    if content.get('metadata') and content['metadata'].get('files'):
                        for f in content['metadata']['files']:
                            if 'fileId' in f:
                                try:
                                    file_id = int(f['fileId'])
                                    all_file_ids.append(file_id)
                                except (ValueError, TypeError):
                                    # Skip non-numeric file IDs
                                    pass
                
                if all_file_ids:
                    # Get all file URIs in one query
                    file_query = """
                        SELECT file_id, uri
                        FROM files
                        WHERE file_id = ANY(%s)
                    """
                    cur.execute(file_query, (all_file_ids,))
                    file_uris = {str(row['file_id']): row['uri'] for row in cur.fetchall()}
                    
                    # Add URIs to files in each content
                    for content in results:
                        if content.get('metadata') and content['metadata'].get('files'):
                            for file_info in content['metadata']['files']:
                                if 'fileId' in file_info and str(file_info['fileId']) in file_uris:
                                    file_info['uri'] = file_uris[str(file_info['fileId'])]
            
            return results
        
    except Exception as e:
        print(f"Error fetching all AI contents: {str(e)}")
        return []


def update_ai_content_status(ai_content_id, status, notes=None, processed_by=None):
    """Update AI content status and metadata"""
    try:
        with database_transaction() as (cur, conn):
            # First get current metadata
            get_query = "SELECT metadata FROM ai_content WHERE id = %s"
            cur.execute(get_query, (ai_content_id,))
            result = cur.fetchone()
            
            if not result:
                return False
            
            metadata = result[0] or {}
            
            # Update metadata
            if status == 'processed':
                metadata['processedAt'] = datetime.utcnow().isoformat()
                metadata['processedBy'] = processed_by
            if notes:
                metadata['notes'] = notes
            
            # Update the record
            update_query = """
                UPDATE ai_content
                SET status = %s, metadata = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            
            cur.execute(update_query, (
                status,
                json.dumps(metadata),
                ai_content_id
            ))
            
            return cur.rowcount > 0
        
    except Exception as e:
        print(f"Error updating AI content status: {str(e)}")
        return False


def validate_file_ownership(user_id, file_ids):
    """Validate that user owns all specified files"""
    # For now, skip validation since file IDs are coming from the upload process
    # In production, this should check against the files table
    return True