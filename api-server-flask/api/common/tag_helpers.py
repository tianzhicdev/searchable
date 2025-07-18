"""
Tag system helper functions using direct SQL queries
Handles tag operations for users and searchables without SQLAlchemy models
"""

from .database import get_db_connection, execute_sql
from .database_context import database_cursor, database_transaction, db
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
        
        result = db.fetch_all(query, tuple(params))
        
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
        
        result = db.fetch_all(query, tuple(tag_ids))
        
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
        
        result = db.fetch_all(query, (user_id,))
        
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
        with database_transaction() as (cur, conn):
            for tag_id in tag_ids:
                # Check if association already exists
                check_query = "SELECT 1 FROM user_tags WHERE user_id = %s AND tag_id = %s"
                execute_sql(cur, check_query, [user_id, tag_id])
                existing = cur.fetchone()
                
                if not existing:
                    # Insert new association
                    insert_query = "INSERT INTO user_tags (user_id, tag_id) VALUES (%s, %s)"
                    execute_sql(cur, insert_query, [user_id, tag_id])
        
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
        with database_transaction() as (cur, conn):
            query = "DELETE FROM user_tags WHERE user_id = %s AND tag_id = %s"
            execute_sql(cur, query, [user_id, tag_id])
            
            # Check if any rows were affected
            rows_affected = cur.rowcount > 0
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
        result = db.fetch_one(query, (user_id,))
        
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
        
        result = db.fetch_all(query, (searchable_id,))
        
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
        with database_transaction() as (cur, conn):
            for tag_id in tag_ids:
                # Check if association already exists
                check_query = "SELECT 1 FROM searchable_tags WHERE searchable_id = %s AND tag_id = %s"
                execute_sql(cur, check_query, [searchable_id, tag_id])
                existing = cur.fetchone()
                
                if not existing:
                    # Insert new association
                    insert_query = "INSERT INTO searchable_tags (searchable_id, tag_id) VALUES (%s, %s)"
                    execute_sql(cur, insert_query, [searchable_id, tag_id])
        
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
        with database_transaction() as (cur, conn):
            query = "DELETE FROM searchable_tags WHERE searchable_id = %s AND tag_id = %s"
            execute_sql(cur, query, [searchable_id, tag_id])
            
            # Check if any rows were affected
            rows_affected = cur.rowcount > 0
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
        result = db.fetch_one(query, (searchable_id,))
        
        return result[0] if result else 0
        
    except Exception as e:
        logger.error(f"Error getting searchable tag count for searchable {searchable_id}: {str(e)}")
        return 0

def search_users_by_tags(tag_names, page=1, limit=20):
    """
    Search users by tags (OR logic - users with ANY of the specified tags)
    If no tags specified, returns all users who have published items
    Only returns users who have at least one published (non-removed) searchable item
    
    Args:
        tag_names (list): List of tag names to search for (optional)
        page (int): Page number (1-based)
        limit (int): Number of results per page
    
    Returns:
        dict: {'users': [], 'total': int, 'page': int, 'limit': int, 'pages': int}
    """
    try:
        with database_cursor() as (cur, conn):
            # Always require users to have at least one published searchable
            published_searchable_condition = """
                EXISTS (
                    SELECT 1 FROM searchables s 
                    WHERE s.user_id = u.id 
                    AND s.removed = FALSE
                )
            """
            
            # If no tags specified, return all users with published items
            if not tag_names:
                # Get total count of all users with published items
                count_query = f"SELECT COUNT(*) FROM users u WHERE {published_searchable_condition}"
                execute_sql(cur, count_query)
                count_result = cur.fetchone()
                total = count_result[0] if count_result else 0
                
                # Get paginated users with published items
                offset = (page - 1) * limit
                user_query = f"""
                    SELECT u.id, u.username 
                    FROM users u
                    WHERE {published_searchable_condition}
                    ORDER BY u.id
                    LIMIT %s OFFSET %s
                """
                execute_sql(cur, user_query, [limit, offset])
                user_result = cur.fetchall()
                
                users = []
                for user_id, username in user_result:
                    user_tags = get_user_tags(user_id)
                    users.append({
                        'id': user_id,
                        'username': username,
                        'tags': user_tags
                    })
                    
            else:
                # Get tag IDs from names (don't require all tags to exist)
                placeholders = ','.join(['%s'] * len(tag_names))
                tag_query = f"""
                    SELECT id FROM tags 
                    WHERE name IN ({placeholders}) AND tag_type = 'user' AND is_active = true
                """
                
                execute_sql(cur, tag_query, tag_names)
                tag_result = cur.fetchall()
                
                if not tag_result:
                    # No valid tags found
                    return {'users': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}
                
                tag_ids = [row[0] for row in tag_result]
                
                # Find users with ANY of the specified tags AND published items
                tag_placeholders = ','.join(['%s'] * len(tag_ids))
                
                # Get total count
                count_query = f"""
                    SELECT COUNT(DISTINCT ut.user_id)
                    FROM user_tags ut
                    JOIN users u ON ut.user_id = u.id
                    WHERE ut.tag_id IN ({tag_placeholders})
                    AND {published_searchable_condition}
                """
                
                execute_sql(cur, count_query, tag_ids)
                count_result = cur.fetchone()
                total = count_result[0] if count_result else 0
                
                # Get paginated results with user details
                offset = (page - 1) * limit
                user_query = f"""
                    SELECT DISTINCT u.id, u.username
                    FROM users u
                    JOIN user_tags ut ON u.id = ut.user_id
                    WHERE ut.tag_id IN ({tag_placeholders})
                    AND {published_searchable_condition}
                    ORDER BY u.id
                    LIMIT %s OFFSET %s
                """
                
                user_params = tag_ids + [limit, offset]
                execute_sql(cur, user_query, user_params)
                user_result = cur.fetchall()
                
                users = []
                for user_id, username in user_result:
                    user_tags = get_user_tags(user_id)
                    users.append({
                        'id': user_id,
                        'username': username,
                        'tags': user_tags
                    })
            
            # Calculate pagination
            total_pages = (total + limit - 1) // limit if limit > 0 else 0
            
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

def search_searchables_by_tag_ids(tag_ids=None, page=1, limit=20):
    """
    Search searchables by tag IDs (OR logic - searchables with ANY of the specified tags)
    If no tags specified, returns all searchables
    
    Args:
        tag_ids (list): List of tag IDs to search for (optional)
        page (int): Page number (1-based)
        limit (int): Number of results per page
    
    Returns:
        dict: {'searchables': [], 'total': int, 'page': int, 'limit': int, 'pages': int}
    """
    try:
        with database_cursor() as (cur, conn):
            # If no tags specified, return all searchables
            if not tag_ids:
                # Get total count of all active searchables
                count_query = """
                    SELECT COUNT(*) 
                    FROM searchables s
                    WHERE s.searchable_data->>'removed' IS NULL 
                    OR s.searchable_data->>'removed' != 'true'
                """
                execute_sql(cur, count_query)
                count_result = cur.fetchone()
                total = count_result[0] if count_result else 0
                
                # Get paginated searchables
                offset = (page - 1) * limit
                searchable_query = """
                    SELECT s.searchable_id, s.type, s.searchable_data
                    FROM searchables s
                    WHERE s.searchable_data->>'removed' IS NULL 
                    OR s.searchable_data->>'removed' != 'true'
                    ORDER BY s.searchable_id DESC
                    LIMIT %s OFFSET %s
                """
                execute_sql(cur, searchable_query, [limit, offset])
                searchable_result = cur.fetchall()
                
                searchables = []
                for searchable_id, searchable_type, searchable_data in searchable_result:
                    # Get tags for this searchable
                    searchable_tags = get_searchable_tags(searchable_id)
                    searchable_data['id'] = searchable_id
                    searchable_data['searchable_id'] = searchable_id
                    searchable_data['type'] = searchable_type
                    searchable_data['tags'] = searchable_tags
                    searchables.append(searchable_data)
                    
            else:
                # Verify tag IDs exist
                placeholders = ','.join(['%s'] * len(tag_ids))
                tag_query = f"""
                    SELECT id FROM tags 
                    WHERE id IN ({placeholders}) AND tag_type = 'searchable' AND is_active = true
                """
                
                execute_sql(cur, tag_query, tag_ids)
                tag_result = cur.fetchall()
                
                if not tag_result:
                    # No valid tags found
                    return {'searchables': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}
                
                valid_tag_ids = [row[0] for row in tag_result]
                
                # Find searchables with ANY of the specified tags
                tag_placeholders = ','.join(['%s'] * len(valid_tag_ids))
                
                # Get total count
                count_query = f"""
                    SELECT COUNT(DISTINCT st.searchable_id)
                    FROM searchable_tags st
                    JOIN searchables s ON st.searchable_id = s.searchable_id
                    WHERE st.tag_id IN ({tag_placeholders})
                    AND (s.searchable_data->>'removed' IS NULL OR s.searchable_data->>'removed' != 'true')
                """
                
                execute_sql(cur, count_query, valid_tag_ids)
                count_result = cur.fetchone()
                total = count_result[0] if count_result else 0
                
                # Get paginated results
                offset = (page - 1) * limit
                searchable_query = f"""
                    SELECT DISTINCT s.searchable_id, s.type, s.searchable_data
                    FROM searchables s
                    JOIN searchable_tags st ON s.searchable_id = st.searchable_id
                    WHERE st.tag_id IN ({tag_placeholders})
                    AND (s.searchable_data->>'removed' IS NULL OR s.searchable_data->>'removed' != 'true')
                    ORDER BY s.searchable_id DESC
                    LIMIT %s OFFSET %s
                """
                
                searchable_params = valid_tag_ids + [limit, offset]
                execute_sql(cur, searchable_query, searchable_params)
                searchable_result = cur.fetchall()
                
                searchables = []
                for searchable_id, searchable_type, searchable_data in searchable_result:
                    # Get tags for this searchable
                    searchable_tags = get_searchable_tags(searchable_id)
                    searchable_data['id'] = searchable_id
                    searchable_data['searchable_id'] = searchable_id
                    searchable_data['type'] = searchable_type
                    searchable_data['tags'] = searchable_tags
                    searchables.append(searchable_data)
            
            # Calculate pagination
            total_pages = (total + limit - 1) // limit if limit > 0 else 0
            
            return {
                'searchables': searchables,
                'total': total,
                'page': page,
                'limit': limit,
                'pages': total_pages
            }
        
    except Exception as e:
        logger.error(f"Error searching searchables by tag IDs: {str(e)}")
        return {'searchables': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}

def search_searchables_by_tags(tag_names, page=1, limit=20):
    """
    Search searchables by tags (OR logic - searchables with ANY of the specified tags)
    If no tags specified, returns all searchables
    
    Args:
        tag_names (list): List of tag names to search for (optional)
        page (int): Page number (1-based)
        limit (int): Number of results per page
    
    Returns:
        dict: {'searchables': [], 'total': int, 'page': int, 'limit': int, 'pages': int}
    """
    try:
        with database_cursor() as (cur, conn):
            # If no tags specified, return all searchables
            if not tag_names:
                # Get total count of all active searchables
                count_query = """
                    SELECT COUNT(*) 
                    FROM searchables s
                    WHERE s.searchable_data->>'removed' IS NULL 
                    OR s.searchable_data->>'removed' != 'true'
                """
                execute_sql(cur, count_query)
                count_result = cur.fetchone()
                total = count_result[0] if count_result else 0
                
                # Get paginated searchables
                offset = (page - 1) * limit
                searchable_query = """
                    SELECT s.searchable_id, s.type, s.searchable_data
                    FROM searchables s
                    WHERE s.searchable_data->>'removed' IS NULL 
                    OR s.searchable_data->>'removed' != 'true'
                    ORDER BY s.searchable_id DESC
                    LIMIT %s OFFSET %s
                """
                execute_sql(cur, searchable_query, [limit, offset])
                searchable_result = cur.fetchall()
                
                searchables = []
                for searchable_id, searchable_type, searchable_data in searchable_result:
                    # Get tags for this searchable
                    searchable_tags = get_searchable_tags(searchable_id)
                    searchable_data['id'] = searchable_id
                    searchable_data['searchable_id'] = searchable_id
                    searchable_data['type'] = searchable_type
                    searchable_data['tags'] = searchable_tags
                    searchables.append(searchable_data)
                    
            else:
                # Get tag IDs from names (don't require all tags to exist)
                placeholders = ','.join(['%s'] * len(tag_names))
                tag_query = f"""
                    SELECT id FROM tags 
                    WHERE name IN ({placeholders}) AND tag_type = 'searchable' AND is_active = true
                """
                
                execute_sql(cur, tag_query, tag_names)
                tag_result = cur.fetchall()
                
                if not tag_result:
                    # No valid tags found
                    return {'searchables': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}
                
                tag_ids = [row[0] for row in tag_result]
                
                # Find searchables with ANY of the specified tags
                tag_placeholders = ','.join(['%s'] * len(tag_ids))
                
                # Get total count
                count_query = f"""
                    SELECT COUNT(DISTINCT st.searchable_id)
                    FROM searchable_tags st
                    JOIN searchables s ON st.searchable_id = s.searchable_id
                    WHERE st.tag_id IN ({tag_placeholders})
                    AND (s.searchable_data->>'removed' IS NULL OR s.searchable_data->>'removed' != 'true')
                """
                
                execute_sql(cur, count_query, tag_ids)
                count_result = cur.fetchone()
                total = count_result[0] if count_result else 0
                
                # Get paginated results
                offset = (page - 1) * limit
                searchable_query = f"""
                    SELECT DISTINCT s.searchable_id, s.type, s.searchable_data
                    FROM searchables s
                    JOIN searchable_tags st ON s.searchable_id = st.searchable_id
                    WHERE st.tag_id IN ({tag_placeholders})
                    AND (s.searchable_data->>'removed' IS NULL OR s.searchable_data->>'removed' != 'true')
                    ORDER BY s.searchable_id DESC
                    LIMIT %s OFFSET %s
                """
                
                searchable_params = tag_ids + [limit, offset]
                execute_sql(cur, searchable_query, searchable_params)
                searchable_result = cur.fetchall()
                
                searchables = []
                for searchable_id, searchable_type, searchable_data in searchable_result:
                    # Get tags for this searchable
                    searchable_tags = get_searchable_tags(searchable_id)
                    searchable_data['id'] = searchable_id
                    searchable_data['searchable_id'] = searchable_id
                    searchable_data['type'] = searchable_type
                    searchable_data['tags'] = searchable_tags
                    searchables.append(searchable_data)
            
            # Calculate pagination
            total_pages = (total + limit - 1) // limit if limit > 0 else 0
            
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

def search_users_by_tag_ids(tag_ids=None, username_search='', page=1, limit=20): # @dev_intructions: this can use some refactoring, most of the query is the same
    """
    Search users by tag IDs and/or username (OR logic for tags, substring match for username)
    Only returns users who have at least one published (non-removed) searchable item
    
    Args:
        tag_ids (list): List of tag IDs to search for (optional)
        username_search (str): Username substring to search for (optional)
        page (int): Page number (1-based)
        limit (int): Number of results per page
    
    Returns:
        dict: {'users': [], 'total': int, 'page': int, 'limit': int, 'pages': int}
    """
    try:
        with database_cursor() as (cur, conn):
            # Build query conditions
            where_conditions = []
            params = []
            
            # Username filter
            if username_search:
                where_conditions.append("LOWER(u.username) LIKE LOWER(%s)")
                params.append(f"%{username_search}%")
            
            # Always require users to have at least one published searchable
            published_searchable_condition = """
                EXISTS (
                    SELECT 1 FROM searchables s 
                    WHERE s.user_id = u.id 
                    AND s.removed = FALSE
                )
            """
            where_conditions.append(published_searchable_condition)
            
            # Tag filter
            if tag_ids:
                # If tags specified, only return users with those tags
                tag_placeholders = ','.join(['%s'] * len(tag_ids))
                tag_condition = f"ut.tag_id IN ({tag_placeholders})"
                
                # Build the complete where clause
                all_conditions = [tag_condition] + where_conditions
                where_clause = " WHERE " + " AND ".join(all_conditions)
                
                # Get count with filters
                count_query = f"""
                    SELECT COUNT(DISTINCT u.id)
                    FROM users u
                    JOIN user_tags ut ON u.id = ut.user_id
                    {where_clause}
                """
                
                count_params = tag_ids + params
                execute_sql(cur, count_query, count_params)
                total = cur.fetchone()[0]
                
                # Get users with filters
                offset = (page - 1) * limit
                user_query = f"""
                    SELECT DISTINCT u.id, u.username, 
                           up.metadata->>'display_name' as display_name,
                           up.profile_image_url, 
                           up.introduction,
                           COALESCE((SELECT AVG(r.rating) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.seller_id = u.id), 0) as rating,
                           COALESCE((SELECT COUNT(*) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.seller_id = u.id), 0) as total_ratings,
                           COALESCE((SELECT COUNT(*) FROM searchables s WHERE s.user_id = u.id AND s.removed = FALSE), 0) as searchable_count
                    FROM users u
                    LEFT JOIN user_profile up ON u.id = up.user_id
                    JOIN user_tags ut ON u.id = ut.user_id
                    {where_clause}
                    ORDER BY u.id
                    LIMIT %s OFFSET %s
                """
                
                query_params = tag_ids + params + [limit, offset]
                execute_sql(cur, user_query, query_params)
            else:
                # No tags specified - search all users with published items
                # Get count with username filter and published items filter
                count_query = """
                    SELECT COUNT(*) FROM users u
                    WHERE 1=1
                """
                if where_conditions:
                    count_query += ' AND ' + ' AND '.join(where_conditions)
                
                execute_sql(cur, count_query, params)
                total = cur.fetchone()[0]
                
                # Get users with username filter and published items filter
                offset = (page - 1) * limit
                user_query = """
                    SELECT u.id, u.username, 
                           up.metadata->>'display_name' as display_name,
                           up.profile_image_url, 
                           up.introduction,
                           COALESCE((SELECT AVG(r.rating) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.seller_id = u.id), 0) as rating,
                           COALESCE((SELECT COUNT(*) FROM rating r JOIN invoice i ON r.invoice_id = i.id WHERE i.seller_id = u.id), 0) as total_ratings,
                           COALESCE((SELECT COUNT(*) FROM searchables s WHERE s.user_id = u.id AND s.removed = FALSE), 0) as searchable_count
                    FROM users u
                    LEFT JOIN user_profile up ON u.id = up.user_id
                    WHERE 1=1
                """
                if where_conditions:
                    user_query += ' AND ' + ' AND '.join(where_conditions)
                user_query += " ORDER BY u.id LIMIT %s OFFSET %s"
                
                query_params = params + [limit, offset]
                execute_sql(cur, user_query, query_params)
            
            user_result = cur.fetchall()
            
            # Get tags for each user
            users = []
            for row in user_result:
                user_id, username, display_name, profile_image_url, introduction, rating, total_ratings, searchable_count = row
                user_tags = get_user_tags(user_id)
                users.append({
                    'id': user_id,
                    'username': username,
                    'displayName': display_name,
                    'profile_image_url': profile_image_url,
                    'introduction': introduction,
                    'rating': float(rating) if rating else 0.0,
                    'totalRatings': total_ratings or 0,
                    'searchableCount': searchable_count or 0,
                    'tags': user_tags
                })
            
            # Calculate pagination
            total_pages = (total + limit - 1) // limit if limit > 0 else 0
            
            return {
                'users': users,
                'total': total,
                'page': page,
                'limit': limit,
                'pages': total_pages
            }
        
    except Exception as e:
        logger.error(f"Error searching users by tag IDs: {str(e)}")
        return {'users': [], 'total': 0, 'page': page, 'limit': limit, 'pages': 0}