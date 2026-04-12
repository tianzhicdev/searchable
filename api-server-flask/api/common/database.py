import os
import psycopg2
from psycopg2.extras import Json
from .logging_config import setup_logger

# Create a logger for this file
logger = setup_logger(__name__, 'database.log')

def get_db_connection():
    """Get database connection"""
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', ''),
        port=os.getenv('DB_PORT', ''),
        dbname=os.getenv('DB_NAME', ''),
        user=os.getenv('DB_USERNAME', ''),
        password=os.getenv('DB_PASS', '')
    )
    
    # Log connection details
    with conn.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user, inet_client_addr(), inet_client_port()")
        connection_details = cursor.fetchone()
        logger.debug(f"Connected to database: {connection_details[0]}")
        logger.debug(f"Connected as user: {connection_details[1]}")
        logger.debug(f"Client address: {connection_details[2]}")
        logger.debug(f"Client port: {connection_details[3]}")
    return conn

def execute_sql(cursor, sql, params=None, commit=False, connection=None):
    """Execute SQL with logging and return results if applicable"""
    if params:
        logger.debug(f"Executing SQL: {sql.replace(chr(10), ' ')} with params: {params}")
        cursor.execute(sql, params)
    else:
        logger.debug(f"Executing SQL: {sql.replace(chr(10), ' ')}")
        cursor.execute(sql)
    if commit and connection:
        connection.commit()
    return cursor

# Re-export Json for convenience
__all__ = ['get_db_connection', 'execute_sql', 'Json'] 