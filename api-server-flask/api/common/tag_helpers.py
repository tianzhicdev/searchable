"""
Tag system helper functions using direct SQL queries
Handles tag operations for users and searchables without SQLAlchemy models
"""

from .database import get_db_connection, execute_sql
from .logging_config import setup_logger

# Set up logger
logger = setup_logger(__name__, 'tag_helpers.log')

def get_tags(tag_type=None, active_only=True):
    """
    Get all tags, optionally filtered by type and active status
    
    Args:
        tag_type (str): 'user' or 'searchable' (optional)
        active_only (bool): Filter by is_active=true (default: True)
    
    Returns:
        list: List of tag dictionaries
    """
    try:
        query = "SELECT id, name, tag_type, description, is_active, created_at FROM tags WHERE 1=1"
        params = []
        
        if tag_type and tag_type in ['user', 'searchable']:
            query += " AND tag_type = %s"
            params.append(tag_type)
        
        if active_only:
            query += " AND is_active = true"
        
        query += " ORDER BY name"
        
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, query, params)
        result = cur.fetchall()
        cur.close()
        conn.close()
        
        return [
            {
                'id': row[0],
                'name': row[1],
                'tag_type': row[2],
                'description': row[3],
                'is_active': row[4],
                'created_at': row[5].isoformat() if row[5] else None
            }
            for row in result
        ] if result else []
        
    except Exception as e:
        logger.error(f"Error getting tags: {str(e)}")
        return []

def get_tags_by_ids(tag_ids):
    """
    Get tags by a list of IDs
    
    Args:
        tag_ids (list): List of tag IDs
    
    Returns:
        list: List of tag dictionaries
    """
    try:
        if not tag_ids:
            return []
        
        placeholders = ','.join(['%s'] * len(tag_ids))
        query = f"SELECT id, name, tag_type, description, is_active, created_at FROM tags WHERE id IN ({placeholders})"
        
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, query, tag_ids)
        result = cur.fetchall()
        cur.close()
        conn.close()
        
        return [
            {
                'id': row[0],
                'name': row[1],
                'tag_type': row[2],
                'description': row[3],
                'is_active': row[4],
                'created_at': row[5].isoformat() if row[5] else None
            }
            for row in result
        ] if result else []
        
    except Exception as e:
        logger.error(f"Error getting tags by IDs: {str(e)}")
        return []

def get_user_tags(user_id):
    """
    Get all tags for a specific user
    
    Args:
        user_id (int): User ID
    
    Returns:
        list: List of tag dictionaries
    """
    try:
        query = """
            SELECT t.id, t.name, t.tag_type, t.description, t.is_active, t.created_at
            FROM tags t
            JOIN user_tags ut ON t.id = ut.tag_id
            WHERE ut.user_id = %s AND t.is_active = true
            ORDER BY t.name
        """
        
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, query, [user_id])
        result = cur.fetchall()
        cur.close()
        conn.close()
        
        return [
            {
                'id': row[0],
                'name': row[1],
                'tag_type': row[2],
                'description': row[3],
                'is_active': row[4],
                'created_at': row[5].isoformat() if row[5] else None
            }
            for row in result
        ] if result else []
        
    except Exception as e:
        logger.error(f"Error getting user tags for user {user_id}: {str(e)}")
        return []

def add_user_tags(user_id, tag_ids):
    """
    Add multiple tags to a user
    
    Args:
        user_id (int): User ID
        tag_ids (list): List of tag IDs to add
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        for tag_id in tag_ids:
            # Check if association already exists
            check_query = "SELECT 1 FROM user_tags WHERE user_id = %s AND tag_id = %s"
            execute_sql(cur, check_query, [user_id, tag_id])
            existing = cur.fetchone()
            
            if not existing:
                # Insert new association
                insert_query = "INSERT INTO user_tags (user_id, tag_id) VALUES (%s, %s)"
                execute_sql(cur, insert_query, [user_id, tag_id], commit=True, connection=conn)
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"Error adding user tags for user {user_id}: {str(e)}")
        return False

def remove_user_tag(user_id, tag_id):
    """
    Remove a specific tag from a user
    
    Args:
        user_id (int): User ID
        tag_id (int): Tag ID to remove
    
    Returns:
        bool: True if tag was removed, False if not found or error
    """
    try:
        query = "DELETE FROM user_tags WHERE user_id = %s AND tag_id = %s"
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, query, [user_id, tag_id], commit=True, connection=conn)
        
        # Check if any rows were affected
        rows_affected = cur.rowcount > 0
        cur.close()
        conn.close()
        return rows_affected
        
    except Exception as e:
        logger.error(f"Error removing user tag {tag_id} for user {user_id}: {str(e)}")
        return False

def get_user_tag_count(user_id):
    """
    Get the number of tags assigned to a user
    
    Args:
        user_id (int): User ID
    
    Returns:
        int: Number of tags assigned to the user
    """
    try:
        query = "SELECT COUNT(*) FROM user_tags WHERE user_id = %s"
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, query, [user_id])
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        return result[0] if result else 0
        
    except Exception as e:
        logger.error(f"Error getting user tag count for user {user_id}: {str(e)}")
        return 0

def get_searchable_tags(searchable_id):
    """
    Get all tags for a specific searchable
    
    Args:
        searchable_id (int): Searchable ID
    
    Returns:
        list: List of tag dictionaries
    """
    try:
        query = """
            SELECT t.id, t.name, t.tag_type, t.description, t.is_active, t.created_at
            FROM tags t
            JOIN searchable_tags st ON t.id = st.tag_id
            WHERE st.searchable_id = %s AND t.is_active = true
            ORDER BY t.name
        """
        
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, query, [searchable_id])
        result = cur.fetchall()
        cur.close()
        conn.close()
        
        return [
            {
                'id': row[0],
                'name': row[1],
                'tag_type': row[2],
                'description': row[3],
                'is_active': row[4],
                'created_at': row[5].isoformat() if row[5] else None
            }
            for row in result
        ] if result else []
        
    except Exception as e:
        logger.error(f"Error getting searchable tags for searchable {searchable_id}: {str(e)}")
        return []

def add_searchable_tags(searchable_id, tag_ids):
    """
    Add multiple tags to a searchable
    
    Args:
        searchable_id (int): Searchable ID
        tag_ids (list): List of tag IDs to add
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        for tag_id in tag_ids:
            # Check if association already exists
            check_query = "SELECT 1 FROM searchable_tags WHERE searchable_id = %s AND tag_id = %s"
            execute_sql(cur, check_query, [searchable_id, tag_id])
            existing = cur.fetchone()
            
            if not existing:
                # Insert new association
                insert_query = "INSERT INTO searchable_tags (searchable_id, tag_id) VALUES (%s, %s)"
                execute_sql(cur, insert_query, [searchable_id, tag_id], commit=True, connection=conn)
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"Error adding searchable tags for searchable {searchable_id}: {str(e)}")
        return False

def remove_searchable_tag(searchable_id, tag_id):
    """
    Remove a specific tag from a searchable
    
    Args:
        searchable_id (int): Searchable ID
        tag_id (int): Tag ID to remove
    
    Returns:
        bool: True if tag was removed, False if not found or error
    """
    try:
        query = "DELETE FROM searchable_tags WHERE searchable_id = %s AND tag_id = %s"
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, query, [searchable_id, tag_id], commit=True, connection=conn)
        
        # Check if any rows were affected
        rows_affected = cur.rowcount > 0
        cur.close()
        conn.close()
        return rows_affected
        
    except Exception as e:
        logger.error(f"Error removing searchable tag {tag_id} for searchable {searchable_id}: {str(e)}")
        return False

def get_searchable_tag_count(searchable_id):
    """
    Get the number of tags assigned to a searchable
    
    Args:
        searchable_id (int): Searchable ID
    
    Returns:
        int: Number of tags assigned to the searchable
    """
    try:
        query = "SELECT COUNT(*) FROM searchable_tags WHERE searchable_id = %s"
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, query, [searchable_id])
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        return result[0] if result else 0
        
    except Exception as e:
        logger.error(f"Error getting searchable tag count for searchable {searchable_id}: {str(e)}")
        return 0

def search_users_by_tags(tag_names, page=1, limit=20):
    """
    Search users by tags (AND logic - users must have ALL specified tags)
    
    Args:
        tag_names (list): List of tag names to search for
        page (int): Page number (1-based)
        limit (int): Number of results per page
    
    Returns:
        dict: {'users': [], 'total': int, 'page': int, 'limit': int, 'pages': int}
    """
    try:
        if not tag_names:
            return {'users': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}
        
        # Get tag IDs from names
        placeholders = ','.join(['%s'] * len(tag_names))
        tag_query = f"""
            SELECT id FROM tags 
            WHERE name IN ({placeholders}) AND tag_type = 'user' AND is_active = true
        """
        
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, tag_query, tag_names)
        tag_result = cur.fetchall()
        
        if not tag_result or len(tag_result) != len(tag_names):
            # Not all tags found
            cur.close()
            conn.close()
            return {'users': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}
        
        tag_ids = [row[0] for row in tag_result]
        
        # Find users with ALL specified tags
        tag_placeholders = ','.join(['%s'] * len(tag_ids))
        user_query = f"""
            SELECT user_id
            FROM user_tags
            WHERE tag_id IN ({tag_placeholders})
            GROUP BY user_id
            HAVING COUNT(DISTINCT tag_id) = %s
            ORDER BY user_id
        """
        
        # Get total count
        count_query = f"""
            SELECT COUNT(*) FROM (
                SELECT user_id
                FROM user_tags
                WHERE tag_id IN ({tag_placeholders})
                GROUP BY user_id
                HAVING COUNT(DISTINCT tag_id) = %s
            ) AS user_count
        """
        
        count_params = tag_ids + [len(tag_ids)]
        execute_sql(cur, count_query, count_params)
        count_result = cur.fetchone()
        total = count_result[0] if count_result else 0
        
        # Get paginated results
        offset = (page - 1) * limit
        paginated_query = user_query + f" LIMIT %s OFFSET %s"
        user_params = tag_ids + [len(tag_ids), limit, offset]
        
        execute_sql(cur, paginated_query, user_params)
        user_result = cur.fetchall()
        user_ids = [row[0] for row in user_result] if user_result else []
        
        # Get user details (simplified - you'd join with terminal table for real data)
        users = []
        for user_id in user_ids:
            user_tags = get_user_tags(user_id)
            users.append({
                'id': user_id,
                'username': f'user_{user_id}',  # This would come from terminal table
                'tags': user_tags
            })
        
        # Calculate pagination
        total_pages = (total + limit - 1) // limit
        
        cur.close()
        conn.close()
        
        return {
            'users': users,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': total_pages
        }
        
    except Exception as e:
        logger.error(f"Error searching users by tags: {str(e)}")
        return {'users': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}

def search_searchables_by_tags(tag_names, page=1, limit=20):
    """
    Search searchables by tags (AND logic - searchables must have ALL specified tags)
    
    Args:
        tag_names (list): List of tag names to search for
        page (int): Page number (1-based)
        limit (int): Number of results per page
    
    Returns:
        dict: {'searchables': [], 'total': int, 'page': int, 'limit': int, 'pages': int}
    """
    try:
        if not tag_names:
            return {'searchables': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}
        
        # Get tag IDs from names
        placeholders = ','.join(['%s'] * len(tag_names))
        tag_query = f"""
            SELECT id FROM tags 
            WHERE name IN ({placeholders}) AND tag_type = 'searchable' AND is_active = true
        """
        
        conn = get_db_connection()
        cur = conn.cursor()
        execute_sql(cur, tag_query, tag_names)
        tag_result = cur.fetchall()
        
        if not tag_result or len(tag_result) != len(tag_names):
            # Not all tags found
            cur.close()
            conn.close()
            return {'searchables': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}
        
        tag_ids = [row[0] for row in tag_result]
        
        # Find searchables with ALL specified tags
        tag_placeholders = ','.join(['%s'] * len(tag_ids))
        searchable_query = f"""
            SELECT searchable_id
            FROM searchable_tags
            WHERE tag_id IN ({tag_placeholders})
            GROUP BY searchable_id
            HAVING COUNT(DISTINCT tag_id) = %s
            ORDER BY searchable_id
        """
        
        # Get total count
        count_query = f"""
            SELECT COUNT(*) FROM (
                SELECT searchable_id
                FROM searchable_tags
                WHERE tag_id IN ({tag_placeholders})
                GROUP BY searchable_id
                HAVING COUNT(DISTINCT tag_id) = %s
            ) AS searchable_count
        """
        
        count_params = tag_ids + [len(tag_ids)]
        execute_sql(cur, count_query, count_params)
        count_result = cur.fetchone()
        total = count_result[0] if count_result else 0
        
        # Get paginated results
        offset = (page - 1) * limit
        paginated_query = searchable_query + f" LIMIT %s OFFSET %s"
        searchable_params = tag_ids + [len(tag_ids), limit, offset]
        
        execute_sql(cur, paginated_query, searchable_params)
        searchable_result = cur.fetchall()
        searchable_ids = [row[0] for row in searchable_result] if searchable_result else []
        
        # Get searchable details (simplified - you'd get real data from searchables table)
        searchables = []
        for searchable_id in searchable_ids:
            searchable_tags = get_searchable_tags(searchable_id)
            searchables.append({
                'id': searchable_id,
                'title': f'Searchable {searchable_id}',  # This would come from searchables table
                'tags': searchable_tags
            })
        
        # Calculate pagination
        total_pages = (total + limit - 1) // limit
        
        cur.close()
        conn.close()
        
        return {
            'searchables': searchables,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': total_pages
        }
        
    except Exception as e:
        logger.error(f"Error searching searchables by tags: {str(e)}")
        return {'searchables': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}