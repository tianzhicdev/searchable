"""
Unit tests for balance_utils module - focused on testing the smaller functions
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

# Mock the database dependencies before import
sys.modules['psycopg2'] = Mock()
sys.modules['psycopg2.extras'] = Mock()

# Import the module under test
from common.balance_utils import (
    calculate_user_balance,
    validate_sufficient_balance,
    get_balance_breakdown
)


class TestBalanceUtils(unittest.TestCase):
    """Test cases for balance utility functions"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.user_id = 12345
        self.test_balance = 150.50
        
    @patch('common.balance_utils.db_transaction')
    def test_calculate_user_balance_success(self, mock_db_transaction):
        """Test successful balance calculation"""
        # Mock database context manager
        mock_conn = Mock()
        mock_cur = Mock()
        mock_db_transaction.return_value.__enter__.return_value = (mock_conn, mock_cur)
        
        # Mock database result
        mock_cur.fetchone.return_value = (self.test_balance,)
        
        # Test the function
        result = calculate_user_balance(self.user_id)
        
        # Assertions
        self.assertEqual(result, self.test_balance)
        mock_cur.fetchone.assert_called_once()
        
    @patch('common.balance_utils.db_transaction')
    def test_calculate_user_balance_no_result(self, mock_db_transaction):
        """Test balance calculation with no database result"""
        # Mock database context manager
        mock_conn = Mock()
        mock_cur = Mock()
        mock_db_transaction.return_value.__enter__.return_value = (mock_conn, mock_cur)
        
        # Mock empty database result
        mock_cur.fetchone.return_value = None
        
        # Test the function
        result = calculate_user_balance(self.user_id)
        
        # Assertions
        self.assertEqual(result, 0.0)
        
    @patch('common.balance_utils.db_transaction')
    def test_calculate_user_balance_database_error(self, mock_db_transaction):
        """Test balance calculation with database error"""
        # Mock database context manager to raise exception
        mock_db_transaction.return_value.__enter__.side_effect = Exception("Database error")
        
        # Test the function
        with self.assertRaises(Exception):
            calculate_user_balance(self.user_id)
            
    @patch('common.balance_utils.calculate_user_balance')
    def test_validate_sufficient_balance_sufficient(self, mock_calculate):
        """Test balance validation when user has sufficient balance"""
        mock_calculate.return_value = 200.0
        required_amount = 100.0
        
        has_sufficient, current_balance = validate_sufficient_balance(self.user_id, required_amount)
        
        self.assertTrue(has_sufficient)
        self.assertEqual(current_balance, 200.0)
        
    @patch('common.balance_utils.calculate_user_balance')
    def test_validate_sufficient_balance_insufficient(self, mock_calculate):
        """Test balance validation when user has insufficient balance"""
        mock_calculate.return_value = 50.0
        required_amount = 100.0
        
        has_sufficient, current_balance = validate_sufficient_balance(self.user_id, required_amount)
        
        self.assertFalse(has_sufficient)
        self.assertEqual(current_balance, 50.0)
        
    def test_validate_sufficient_balance_invalid_currency(self):
        """Test balance validation with invalid currency"""
        with self.assertRaises(ValueError) as context:
            validate_sufficient_balance(self.user_id, 100.0, currency='btc')
        
        self.assertIn("Unsupported currency", str(context.exception))
        
    def test_validate_sufficient_balance_negative_amount(self):
        """Test balance validation with negative amount"""
        with self.assertRaises(ValueError) as context:
            validate_sufficient_balance(self.user_id, -10.0)
        
        self.assertIn("Required amount cannot be negative", str(context.exception))
        
    @patch('common.balance_utils.db_transaction')
    def test_get_balance_breakdown_success(self, mock_db_transaction):
        """Test successful balance breakdown retrieval"""
        # Mock database context manager
        mock_conn = Mock()
        mock_cur = Mock()
        mock_db_transaction.return_value.__enter__.return_value = (mock_conn, mock_cur)
        
        # Mock database results
        mock_cur.fetchall.return_value = [
            ('sale', 200.0, 5),
            ('deposit', 100.0, 2),
            ('withdrawal', -50.0, 1)
        ]
        
        # Test the function
        result = get_balance_breakdown(self.user_id)
        
        # Assertions
        self.assertIn('sale', result)
        self.assertEqual(result['sale']['amount'], 200.0)
        self.assertEqual(result['sale']['transaction_count'], 5)
        self.assertEqual(result['total'], 250.0)  # 200 + 100 - 50
        
    @patch('common.balance_utils.db_transaction')
    def test_get_balance_breakdown_empty_result(self, mock_db_transaction):
        """Test balance breakdown with no transactions"""
        # Mock database context manager
        mock_conn = Mock()
        mock_cur = Mock()
        mock_db_transaction.return_value.__enter__.return_value = (mock_conn, mock_cur)
        
        # Mock empty database result
        mock_cur.fetchall.return_value = []
        
        # Test the function
        result = get_balance_breakdown(self.user_id)
        
        # Assertions
        self.assertEqual(result['total'], 0)
        self.assertEqual(len(result), 1)  # Only 'total' key
        
    @patch('common.balance_utils.db_transaction')
    def test_get_balance_breakdown_database_error(self, mock_db_transaction):
        """Test balance breakdown with database error"""
        # Mock database context manager to raise exception
        mock_db_transaction.return_value.__enter__.side_effect = Exception("Database error")
        
        # Test the function
        with self.assertRaises(Exception):
            get_balance_breakdown(self.user_id)


if __name__ == '__main__':
    unittest.main()