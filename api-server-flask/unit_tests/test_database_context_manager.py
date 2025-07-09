"""
Unit tests for database module - testing the new context manager
"""

import unittest
from unittest.mock import Mock, patch
import sys
import os

# Add the path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

# Mock the database dependencies before import
sys.modules['psycopg2'] = Mock()
sys.modules['psycopg2.extras'] = Mock()

from common.database import db_transaction


class TestDatabaseContextManager(unittest.TestCase):
    """Test cases for database context manager"""
    
    @patch('common.database.get_db_connection')
    def test_db_transaction_success_with_commit(self, mock_get_connection):
        """Test successful database transaction with commit"""
        # Mock connection and cursor
        mock_conn = Mock()
        mock_cur = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cur
        
        # Use the context manager
        with db_transaction() as (conn, cur):
            self.assertEqual(conn, mock_conn)
            self.assertEqual(cur, mock_cur)
            # Simulate some database work
            cur.execute("SELECT 1")
        
        # Verify commit was called
        mock_conn.commit.assert_called_once()
        mock_cur.close.assert_called_once()
        mock_conn.close.assert_called_once()
        
    @patch('common.database.get_db_connection')
    def test_db_transaction_success_without_commit(self, mock_get_connection):
        """Test successful database transaction without commit"""
        # Mock connection and cursor
        mock_conn = Mock()
        mock_cur = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cur
        
        # Use the context manager with commit=False
        with db_transaction(commit=False) as (conn, cur):
            self.assertEqual(conn, mock_conn)
            self.assertEqual(cur, mock_cur)
        
        # Verify commit was NOT called
        mock_conn.commit.assert_not_called()
        mock_cur.close.assert_called_once()
        mock_conn.close.assert_called_once()
        
    @patch('common.database.get_db_connection')
    def test_db_transaction_with_exception(self, mock_get_connection):
        """Test database transaction with exception"""
        # Mock connection and cursor
        mock_conn = Mock()
        mock_cur = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cur
        
        # Use the context manager with an exception
        with self.assertRaises(ValueError):
            with db_transaction() as (conn, cur):
                raise ValueError("Test exception")
        
        # Verify rollback was called
        mock_conn.rollback.assert_called_once()
        mock_conn.commit.assert_not_called()
        mock_cur.close.assert_called_once()
        mock_conn.close.assert_called_once()
        
    @patch('common.database.get_db_connection')
    def test_db_transaction_connection_error(self, mock_get_connection):
        """Test database transaction with connection error"""
        # Mock connection failure
        mock_get_connection.side_effect = Exception("Connection failed")
        
        # Use the context manager
        with self.assertRaises(Exception):
            with db_transaction() as (conn, cur):
                pass
        
        # Verify connection was attempted
        mock_get_connection.assert_called_once()
        
    @patch('common.database.get_db_connection')
    def test_db_transaction_cursor_error(self, mock_get_connection):
        """Test database transaction with cursor creation error"""
        # Mock connection success but cursor failure
        mock_conn = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.side_effect = Exception("Cursor failed")
        
        # Use the context manager
        with self.assertRaises(Exception):
            with db_transaction() as (conn, cur):
                pass
        
        # Verify connection cleanup was attempted
        mock_conn.close.assert_called_once()
        
    @patch('common.database.get_db_connection')
    def test_db_transaction_cleanup_on_cursor_close_error(self, mock_get_connection):
        """Test database transaction cleanup when cursor close fails"""
        # Mock connection and cursor
        mock_conn = Mock()
        mock_cur = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cur
        
        # Mock cursor close to raise exception
        mock_cur.close.side_effect = Exception("Cursor close failed")
        
        # Use the context manager
        with db_transaction() as (conn, cur):
            pass
        
        # Verify connection was still closed despite cursor error
        mock_conn.close.assert_called_once()
        
    @patch('common.database.get_db_connection')
    def test_db_transaction_cleanup_on_connection_close_error(self, mock_get_connection):
        """Test database transaction cleanup when connection close fails"""
        # Mock connection and cursor
        mock_conn = Mock()
        mock_cur = Mock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cur
        
        # Mock connection close to raise exception
        mock_conn.close.side_effect = Exception("Connection close failed")
        
        # Use the context manager - should not raise exception
        with db_transaction() as (conn, cur):
            pass
        
        # Verify both close methods were called
        mock_cur.close.assert_called_once()
        mock_conn.close.assert_called_once()


if __name__ == '__main__':
    unittest.main()