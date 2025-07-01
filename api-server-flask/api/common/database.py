import os
import psycopg2
from psycopg2.extras import Json
from psycopg2 import pool, OperationalError
import time
import threading
from contextlib import contextmanager
from .logging_config import setup_logger

# Create a logger for this file
logger = setup_logger(__name__, 'database.log')

# Connection pool (initialized on first use)
_connection_pool = None
_pool_lock = threading.Lock()

def _initialize_pool():
    """Initialize the connection pool (called once)"""
    global _connection_pool
    if _connection_pool is None:
        with _pool_lock:
            if _connection_pool is None:
                try:
                    _connection_pool = psycopg2.pool.ThreadedConnectionPool(
                        minconn=2,
                        maxconn=50,  # Increased for better concurrency
                        host=os.getenv('DB_HOST', ''),
                        port=os.getenv('DB_PORT', ''),
                        dbname=os.getenv('DB_NAME', ''),
                        user=os.getenv('DB_USERNAME', ''),
                        password=os.getenv('DB_PASS', '')
                    )
                    logger.info("Database connection pool initialized")
                except Exception as e:
                    logger.error(f"Failed to initialize connection pool: {str(e)}")
                    raise

class PooledConnection:
    """Wrapper for database connection that returns to pool on close"""
    def __init__(self, conn, pool):
        self._conn = conn
        self._pool = pool
        self._closed = False
    
    def __getattr__(self, name):
        # Delegate all other attributes to the actual connection
        return getattr(self._conn, name)
    
    def close(self):
        """Return connection to pool instead of closing it"""
        if not self._closed:
            self._closed = True
            try:
                # Reset the connection state before returning to pool
                self._conn.rollback()
                self._pool.putconn(self._conn)
                logger.debug("Connection returned to pool")
            except Exception as e:
                logger.error(f"Error returning connection to pool: {str(e)}")
                try:
                    self._conn.close()
                except:
                    pass
    
    def __del__(self):
        """Ensure connection is returned to pool when object is garbage collected"""
        if not self._closed:
            self.close()

def get_db_connection():
    """Get database connection from pool (backward compatibility)"""
    _initialize_pool()
    try:
        conn = _connection_pool.getconn()
        # Set autocommit to False for backward compatibility
        conn.autocommit = False
        # Wrap connection to intercept close() calls
        return PooledConnection(conn, _connection_pool)
    except Exception as e:
        logger.error(f"Failed to get connection from pool: {str(e)}")
        raise

@contextmanager
def get_db_cursor(autocommit=True):
    """Context manager for database operations with automatic connection handling"""
    _initialize_pool()
    conn = None
    cursor = None
    try:
        conn = _connection_pool.getconn()
        conn.autocommit = autocommit
        cursor = conn.cursor()
        yield cursor
        if not autocommit:
            conn.commit()
    except Exception as e:
        if conn and not autocommit:
            try:
                conn.rollback()
                logger.info("Transaction rolled back due to error")
            except:
                pass
        logger.error(f"Database operation error: {str(e)}", exc_info=True)
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            _connection_pool.putconn(conn)

def execute_sql(cursor, sql, params=None, commit=False, connection=None):
    """Execute SQL with logging and return results if applicable"""
    # Clean SQL for logging (replace newlines)
    clean_sql = sql.replace('\n', ' ').strip()
    
    try:
        if params:
            logger.debug(f"Executing SQL: {clean_sql} with params: {params}")
            cursor.execute(sql, params)
        else:
            logger.debug(f"Executing SQL: {clean_sql}")
            cursor.execute(sql)
        
        if commit and connection:
            connection.commit()
            logger.debug("Transaction committed")
        
        return cursor
    except Exception as e:
        logger.error(f"SQL execution error: {str(e)}\nSQL: {clean_sql}\nParams: {params}")
        raise

def execute_query(sql, params=None, fetchone=False, fetchall=False, autocommit=True, retry=3):
    """
    Execute a SQL query with automatic connection management.
    
    Args:
        sql: SQL query to execute
        params: Query parameters (tuple or dict)
        fetchone: Return single row
        fetchall: Return all rows
        autocommit: Whether to commit automatically (default True)
        retry: Number of retries on connection failure
    
    Returns:
        Query results or None for non-SELECT queries
    """
    last_error = None
    
    for attempt in range(retry):
        try:
            with get_db_cursor(autocommit=autocommit) as cursor:
                execute_sql(cursor, sql, params)
                
                if fetchone:
                    return cursor.fetchone()
                elif fetchall:
                    return cursor.fetchall()
                else:
                    # For INSERT/UPDATE/DELETE, return rowcount
                    return cursor.rowcount if cursor.rowcount >= 0 else None
                    
        except OperationalError as e:
            last_error = e
            if attempt < retry - 1:
                wait_time = (attempt + 1) * 2  # Exponential backoff
                logger.warning(f"Database connection error, retrying in {wait_time}s: {str(e)}")
                time.sleep(wait_time)
                # Reset connection pool on operational errors
                try:
                    _connection_pool.closeall()
                    logger.info("Connection pool reset due to operational error")
                except:
                    pass
            else:
                logger.error(f"Failed after {retry} attempts: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Query execution error: {str(e)}")
            raise
    
    if last_error:
        raise last_error

def close_connection_pool():
    """Close all connections in the pool (for cleanup)"""
    global _connection_pool
    if _connection_pool:
        try:
            _connection_pool.closeall()
            logger.info("Connection pool closed")
        except Exception as e:
            logger.error(f"Error closing connection pool: {str(e)}")
        finally:
            _connection_pool = None

# Re-export Json for convenience
__all__ = ['get_db_connection', 'get_db_cursor', 'execute_sql', 'execute_query', 'close_connection_pool', 'Json'] 