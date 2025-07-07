"""
AI Content Helper Functions
Database operations and utilities for AI content management
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

from .database import get_db_connection


def create_ai_content(user_id, title, instructions, metadata):
    """Create new AI content entry"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO ai_content (user_id, title, instructions, metadata)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """
        
        cursor.execute(query, (
            user_id,
            title,
            instructions,
            json.dumps(metadata)
        ))
        
        ai_content_id = cursor.fetchone()[0]
        conn.commit()
        
        return ai_content_id
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error creating AI content: {str(e)}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_user_ai_contents(user_id):
    """Get all AI content submissions for a user"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT id, title, status, metadata, created_at
            FROM ai_content
            WHERE user_id = %s
            ORDER BY created_at DESC
        """
        
        cursor.execute(query, (user_id,))
        results = cursor.fetchall()
        
        return results
        
    except Exception as e:
        print(f"Error fetching user AI contents: {str(e)}")
        return []
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_ai_content_by_id(ai_content_id, include_user_info=False, include_file_uris=False):
    """Get specific AI content by ID"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
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
        
        cursor.execute(query, (ai_content_id,))
        result = cursor.fetchone()
        
        # If requested, enrich file data with URIs
        if result and include_file_uris and result.get('metadata') and result['metadata'].get('files'):
            files = result['metadata']['files']
            file_ids = [f['fileId'] for f in files if 'fileId' in f]
            
            if file_ids:
                # Get file URIs from database
                file_query = """
                    SELECT file_id, uri
                    FROM files
                    WHERE file_id = ANY(%s)
                """
                cursor.execute(file_query, (file_ids,))
                file_uris = {row['file_id']: row['uri'] for row in cursor.fetchall()}
                
                # Add URIs to files
                for file_info in files:
                    if 'fileId' in file_info and file_info['fileId'] in file_uris:
                        file_info['uri'] = file_uris[file_info['fileId']]
        
        return result
        
    except Exception as e:
        print(f"Error fetching AI content: {str(e)}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def delete_ai_content(ai_content_id, user_id):
    """Delete AI content (checking ownership)"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check ownership first
        check_query = "SELECT user_id FROM ai_content WHERE id = %s"
        cursor.execute(check_query, (ai_content_id,))
        result = cursor.fetchone()
        
        if not result or result[0] != user_id:
            return False
        
        # Delete the content
        delete_query = "DELETE FROM ai_content WHERE id = %s"
        cursor.execute(delete_query, (ai_content_id,))
        
        conn.commit()
        return cursor.rowcount > 0
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error deleting AI content: {str(e)}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_all_ai_contents(status=None, limit=100, offset=0, include_file_uris=False):
    """Get all AI content submissions (for employees)"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if status:
            query = """
                SELECT ac.*, u.username, u.email
                FROM ai_content ac
                LEFT JOIN users u ON ac.user_id = u.id
                WHERE ac.status = %s
                ORDER BY ac.created_at DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (status, limit, offset))
        else:
            query = """
                SELECT ac.*, u.username, u.email
                FROM ai_content ac
                LEFT JOIN users u ON ac.user_id = u.id
                ORDER BY ac.created_at DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))
        
        results = cursor.fetchall()
        
        # If requested, enrich file data with URIs
        if include_file_uris:
            # Collect all file IDs
            all_file_ids = []
            for content in results:
                if content.get('metadata') and content['metadata'].get('files'):
                    for f in content['metadata']['files']:
                        if 'fileId' in f:
                            all_file_ids.append(f['fileId'])
            
            if all_file_ids:
                # Get all file URIs in one query
                file_query = """
                    SELECT file_id, uri
                    FROM files
                    WHERE file_id = ANY(%s)
                """
                cursor.execute(file_query, (all_file_ids,))
                file_uris = {row['file_id']: row['uri'] for row in cursor.fetchall()}
                
                # Add URIs to files in each content
                for content in results:
                    if content.get('metadata') and content['metadata'].get('files'):
                        for file_info in content['metadata']['files']:
                            if 'fileId' in file_info and file_info['fileId'] in file_uris:
                                file_info['uri'] = file_uris[file_info['fileId']]
        
        return results
        
    except Exception as e:
        print(f"Error fetching all AI contents: {str(e)}")
        return []
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def update_ai_content_status(ai_content_id, status, notes=None, processed_by=None):
    """Update AI content status and metadata"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First get current metadata
        get_query = "SELECT metadata FROM ai_content WHERE id = %s"
        cursor.execute(get_query, (ai_content_id,))
        result = cursor.fetchone()
        
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
        
        cursor.execute(update_query, (
            status,
            json.dumps(metadata),
            ai_content_id
        ))
        
        conn.commit()
        return cursor.rowcount > 0
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating AI content status: {str(e)}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def validate_file_ownership(user_id, file_ids):
    """Validate that user owns all specified files"""
    # For now, skip validation since file IDs are coming from the upload process
    # In production, this should check against the files table
    return True