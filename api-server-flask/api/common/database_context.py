"""
Database Context Manager for Searchable API

This module provides context managers to eliminate the repetitive database connection
boilerplate code found throughout the codebase. It ensures proper resource cleanup
and consistent error handling.

Before: 149 instances of manual connection management
After: Clean, reusable context managers
"""

import logging
from contextlib import contextmanager
from typing import Generator, Optional, Tuple, List, Any
from .database import get_db_connection, execute_sql
from .logging_config import setup_logger

logger = setup_logger(__name__, 'database_context.log')


@contextmanager
def database_cursor(auto_commit: bool = False) -> Generator[tuple, None, None]:
    """
    Context manager for database operations with automatic resource cleanup.
    
    Args:
        auto_commit: Whether to automatically commit the transaction
        
    Yields:
        tuple: (cursor, connection) for database operations
        
    Example:
        with database_cursor() as (cur, conn):
            execute_sql(cur, "SELECT * FROM users WHERE id = %s", (user_id,))
            result = cur.fetchone()
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        yield cur, conn
        
        if auto_commit:
            conn.commit()
            
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Database operation failed: {str(e)}")
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@contextmanager
def database_transaction() -> Generator[tuple, None, None]:
    """
    Context manager for database transactions with automatic commit/rollback.
    
    Yields:
        tuple: (cursor, connection) for database operations
        
    Example:
        with database_transaction() as (cur, conn):
            execute_sql(cur, "INSERT INTO users ...", params)
            execute_sql(cur, "INSERT INTO user_profile ...", params)
            # Automatically commits if no exception
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        yield cur, conn
        
        conn.commit()
        logger.debug("Transaction committed successfully")
        
    except Exception as e:
        if conn:
            conn.rollback()
            logger.error(f"Transaction rolled back due to error: {str(e)}")
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


class DatabaseOperations:
    """
    High-level database operations wrapper that eliminates boilerplate code.
    
    This class provides common database operation patterns with built-in
    error handling and resource management.
    """
    
    @staticmethod
    def fetch_one(query: str, params: Optional[tuple] = None) -> Optional[tuple]:
        """
        Execute a query and return a single row.
        
        Args:
            query: SQL query string
            params: Query parameters
            
        Returns:
            Single row as tuple or None if not found
        """
        try:
            with database_cursor() as (cur, conn):
                execute_sql(cur, query, params)
                return cur.fetchone()
        except Exception as e:
            logger.error(f"fetch_one failed for query: {query[:100]}... Error: {str(e)}")
            return None
    
    @staticmethod
    def fetch_all(query: str, params: Optional[tuple] = None) -> List[tuple]:
        """
        Execute a query and return all rows.
        
        Args:
            query: SQL query string
            params: Query parameters
            
        Returns:
            List of rows as tuples
        """
        try:
            with database_cursor() as (cur, conn):
                execute_sql(cur, query, params)
                return cur.fetchall()
        except Exception as e:
            logger.error(f"fetch_all failed for query: {query[:100]}... Error: {str(e)}")
            return []
    
    @staticmethod
    def execute_insert(query: str, params: Optional[tuple] = None) -> Optional[tuple]:
        """
        Execute an INSERT query with RETURNING clause.
        
        Args:
            query: SQL INSERT query with RETURNING clause
            params: Query parameters
            
        Returns:
            The returned row from INSERT or None if failed
        """
        try:
            with database_transaction() as (cur, conn):
                execute_sql(cur, query, params)
                return cur.fetchone()
        except Exception as e:
            logger.error(f"execute_insert failed for query: {query[:100]}... Error: {str(e)}")
            return None
    
    @staticmethod
    def execute_update(query: str, params: Optional[tuple] = None) -> bool:
        """
        Execute an UPDATE query.
        
        Args:
            query: SQL UPDATE query
            params: Query parameters
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with database_transaction() as (cur, conn):
                execute_sql(cur, query, params)
                return True
        except Exception as e:
            logger.error(f"execute_update failed for query: {query[:100]}... Error: {str(e)}")
            return False
    
    @staticmethod
    def execute_delete(query: str, params: Optional[tuple] = None) -> bool:
        """
        Execute a DELETE query.
        
        Args:
            query: SQL DELETE query
            params: Query parameters
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with database_transaction() as (cur, conn):
                execute_sql(cur, query, params)
                return True
        except Exception as e:
            logger.error(f"execute_delete failed for query: {query[:100]}... Error: {str(e)}")
            return False


# Backward compatibility aliases
db_cursor = database_cursor
db_transaction = database_transaction
db = DatabaseOperations


# Usage examples for documentation:
"""
BEFORE (repeated 149 times):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        execute_sql(cur, "SELECT * FROM users WHERE id = %s", (user_id,))
        result = cur.fetchone()
    finally:
        cur.close()
        conn.close()

AFTER (clean and consistent):
    result = db.fetch_one("SELECT * FROM users WHERE id = %s", (user_id,))

OR for complex operations:
    with database_cursor() as (cur, conn):
        execute_sql(cur, "SELECT * FROM users WHERE id = %s", (user_id,))
        result = cur.fetchone()

OR for transactions:
    with database_transaction() as (cur, conn):
        execute_sql(cur, "INSERT INTO users ...", user_params)
        execute_sql(cur, "INSERT INTO user_profile ...", profile_params)
"""