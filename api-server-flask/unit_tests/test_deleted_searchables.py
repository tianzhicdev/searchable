#!/usr/bin/env python3
"""
Unit tests for deleted searchables functionality.

Tests that the data_helpers.get_searchable function correctly:
1. Excludes removed items by default
2. Includes removed items when include_removed=True
3. Returns the removed status in the response
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the function to test
from api.common.data_helpers import get_searchable

class TestDeletedSearchables(unittest.TestCase):
    
    @patch('api.common.data_helpers.get_db_connection')
    @patch('api.common.data_helpers.execute_sql')
    def test_get_searchable_excludes_removed_by_default(self, mock_execute_sql, mock_get_db_connection):
        """Test that get_searchable excludes removed items by default"""
        
        # Mock database connection and cursor
        mock_conn = Mock()
        mock_cur = Mock()
        mock_get_db_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cur
        
        # Mock that no results are returned (removed item filtered out)
        mock_cur.fetchone.return_value = None
        
        # Call the function
        result = get_searchable(123, include_removed=False)
        
        # Verify the query excludes removed items
        call_args = mock_execute_sql.call_args
        query = call_args[0][1]  # Second argument is the query
        
        self.assertIn("AND removed = FALSE", query)
        self.assertIsNone(result)
        
    @patch('api.common.data_helpers.get_db_connection')
    @patch('api.common.data_helpers.execute_sql')
    def test_get_searchable_includes_removed_when_requested(self, mock_execute_sql, mock_get_db_connection):
        """Test that get_searchable includes removed items when include_removed=True"""
        
        # Mock database connection and cursor
        mock_conn = Mock()
        mock_cur = Mock()
        mock_get_db_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cur
        
        # Mock a removed item being returned
        mock_cur.fetchone.return_value = (123, 'direct', {'title': 'Test Item'}, 456, True)
        
        # Call the function with include_removed=True
        result = get_searchable(123, include_removed=True)
        
        # Verify the query does NOT exclude removed items
        call_args = mock_execute_sql.call_args
        query = call_args[0][1]  # Second argument is the query
        
        self.assertNotIn("AND removed = FALSE", query)
        self.assertIsNotNone(result)
        self.assertEqual(result['searchable_id'], 123)
        self.assertEqual(result['removed'], True)
        
    @patch('api.common.data_helpers.get_db_connection')
    @patch('api.common.data_helpers.execute_sql')
    def test_get_searchable_returns_removed_status(self, mock_execute_sql, mock_get_db_connection):
        """Test that get_searchable returns the removed status in the response"""
        
        # Mock database connection and cursor
        mock_conn = Mock()
        mock_cur = Mock()
        mock_get_db_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cur
        
        # Test case 1: Non-removed item
        mock_cur.fetchone.return_value = (123, 'direct', {'title': 'Active Item'}, 456, False)
        result = get_searchable(123, include_removed=True)
        
        self.assertIsNotNone(result)
        self.assertEqual(result['removed'], False)
        self.assertEqual(result['title'], 'Active Item')
        
        # Test case 2: Removed item
        mock_cur.fetchone.return_value = (124, 'downloadable', {'title': 'Deleted Item'}, 456, True)
        result = get_searchable(124, include_removed=True)
        
        self.assertIsNotNone(result)
        self.assertEqual(result['removed'], True)
        self.assertEqual(result['title'], 'Deleted Item')
        
    @patch('api.common.data_helpers.get_db_connection')
    @patch('api.common.data_helpers.execute_sql')
    def test_get_searchable_query_structure(self, mock_execute_sql, mock_get_db_connection):
        """Test that the SQL queries have the correct structure"""
        
        # Mock database connection and cursor
        mock_conn = Mock()
        mock_cur = Mock()
        mock_get_db_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cur
        mock_cur.fetchone.return_value = None
        
        # Test include_removed=False
        get_searchable(123, include_removed=False)
        call_args = mock_execute_sql.call_args
        query = call_args[0][1]
        
        # Should select the removed field and filter it
        self.assertIn("searchable_id, type, searchable_data, user_id, removed", query)
        self.assertIn("WHERE searchable_id = %s", query)
        self.assertIn("AND removed = FALSE", query)
        
        # Reset mock
        mock_execute_sql.reset_mock()
        
        # Test include_removed=True
        get_searchable(123, include_removed=True)
        call_args = mock_execute_sql.call_args
        query = call_args[0][1]
        
        # Should select the removed field but not filter it
        self.assertIn("searchable_id, type, searchable_data, user_id, removed", query)
        self.assertIn("WHERE searchable_id = %s", query)
        self.assertNotIn("AND removed = FALSE", query)

if __name__ == '__main__':
    unittest.main()