"""
Standalone unit tests for balance calculation logic
This file contains mock versions to test balance calculation without database dependencies
"""

import unittest


def calculate_balance_from_transactions(transactions):
    """
    Standalone version of balance calculation logic
    
    Args:
        transactions: List of tuples (source_type, amount, currency)
        
    Returns:
        dict: Balance by currency
    """
    balance = {'usd': 0.0, 'usdt': 0.0}
    
    for source_type, amount, currency in transactions:
        currency_key = currency.lower()
        if currency_key in balance:
            balance[currency_key] += float(amount)
    
    return balance


def filter_user_paid_files(invoice_metadata_list):
    """
    Standalone version of filtering paid files from invoice metadata
    
    Args:
        invoice_metadata_list: List of invoice metadata dictionaries
        
    Returns:
        set: Set of file IDs that were paid for
    """
    paid_file_ids = set()
    
    for metadata in invoice_metadata_list:
        if metadata and 'selections' in metadata:
            selections = metadata['selections']
            for selection in selections:
                if selection.get('type') == 'downloadable':
                    paid_file_ids.add(str(selection.get('id')))
    
    return paid_file_ids


class TestBalanceCalculation(unittest.TestCase):
    """Test balance calculation logic"""

    def test_balance_calculation_simple(self):
        """Test basic balance calculation"""
        transactions = [
            ('sale', 50.00, 'USD'),
            ('deposit', 100.00, 'USDT'),
            ('reward', 25.00, 'USD')
        ]
        
        result = calculate_balance_from_transactions(transactions)
        
        expected = {'usd': 75.00, 'usdt': 100.00}
        self.assertEqual(result, expected)

    def test_balance_calculation_with_withdrawals(self):
        """Test balance calculation with negative amounts (withdrawals)"""
        transactions = [
            ('sale', 100.00, 'USD'),
            ('deposit', 200.00, 'USDT'),
            ('withdrawal', -50.00, 'USD'),
            ('withdrawal', -75.00, 'USDT')
        ]
        
        result = calculate_balance_from_transactions(transactions)
        
        expected = {'usd': 50.00, 'usdt': 125.00}
        self.assertEqual(result, expected)

    def test_balance_calculation_case_insensitive(self):
        """Test that currency is case insensitive"""
        transactions = [
            ('sale', 25.00, 'usd'),
            ('deposit', 50.00, 'USD'),
            ('reward', 10.00, 'usdt'),
            ('deposit', 30.00, 'USDT')
        ]
        
        result = calculate_balance_from_transactions(transactions)
        
        expected = {'usd': 75.00, 'usdt': 40.00}
        self.assertEqual(result, expected)

    def test_balance_calculation_empty_transactions(self):
        """Test balance calculation with no transactions"""
        transactions = []
        
        result = calculate_balance_from_transactions(transactions)
        
        expected = {'usd': 0.0, 'usdt': 0.0}
        self.assertEqual(result, expected)

    def test_balance_calculation_unsupported_currency(self):
        """Test that unsupported currencies are ignored"""
        transactions = [
            ('sale', 50.00, 'USD'),
            ('deposit', 100.00, 'BTC'),  # Unsupported currency
            ('reward', 25.00, 'EUR')     # Unsupported currency
        ]
        
        result = calculate_balance_from_transactions(transactions)
        
        # Only USD should be counted
        expected = {'usd': 50.00, 'usdt': 0.0}
        self.assertEqual(result, expected)


class TestUserPaidFiles(unittest.TestCase):
    """Test user paid files filtering logic"""

    def test_filter_paid_files_simple(self):
        """Test basic paid files filtering"""
        metadata_list = [
            {'selections': [
                {'type': 'downloadable', 'id': 'file1'},
                {'type': 'downloadable', 'id': 'file2'}
            ]},
            {'selections': [
                {'type': 'downloadable', 'id': 'file3'}
            ]}
        ]
        
        result = filter_user_paid_files(metadata_list)
        
        expected = {'file1', 'file2', 'file3'}
        self.assertEqual(result, expected)

    def test_filter_paid_files_mixed_types(self):
        """Test that only downloadable files are included"""
        metadata_list = [
            {'selections': [
                {'type': 'downloadable', 'id': 'file1'},
                {'type': 'offline', 'id': 'item1'},      # Should be ignored
                {'type': 'downloadable', 'id': 'file2'},
                {'type': 'direct', 'id': 'payment1'}     # Should be ignored
            ]}
        ]
        
        result = filter_user_paid_files(metadata_list)
        
        expected = {'file1', 'file2'}
        self.assertEqual(result, expected)

    def test_filter_paid_files_no_metadata(self):
        """Test handling of empty or invalid metadata"""
        metadata_list = [
            None,
            {},
            {'other_data': 'value'},
            {'selections': []}
        ]
        
        result = filter_user_paid_files(metadata_list)
        
        expected = set()
        self.assertEqual(result, expected)

    def test_filter_paid_files_string_conversion(self):
        """Test that file IDs are converted to strings"""
        metadata_list = [
            {'selections': [
                {'type': 'downloadable', 'id': 123},      # Integer
                {'type': 'downloadable', 'id': 'file2'},  # String
                {'type': 'downloadable', 'id': 456.0}     # Float
            ]}
        ]
        
        result = filter_user_paid_files(metadata_list)
        
        expected = {'123', 'file2', '456.0'}
        self.assertEqual(result, expected)

    def test_filter_paid_files_duplicates(self):
        """Test that duplicate file IDs are handled correctly"""
        metadata_list = [
            {'selections': [
                {'type': 'downloadable', 'id': 'file1'},
                {'type': 'downloadable', 'id': 'file2'}
            ]},
            {'selections': [
                {'type': 'downloadable', 'id': 'file1'},  # Duplicate
                {'type': 'downloadable', 'id': 'file3'}
            ]}
        ]
        
        result = filter_user_paid_files(metadata_list)
        
        # Should contain unique file IDs only
        expected = {'file1', 'file2', 'file3'}
        self.assertEqual(result, expected)

    def test_filter_paid_files_missing_id(self):
        """Test handling of selections with missing ID"""
        metadata_list = [
            {'selections': [
                {'type': 'downloadable', 'id': 'file1'},
                {'type': 'downloadable'},  # Missing ID
                {'type': 'downloadable', 'id': 'file2'}
            ]}
        ]
        
        result = filter_user_paid_files(metadata_list)
        
        # Should include valid IDs and handle missing ones gracefully
        expected = {'file1', 'file2', 'None'}  # None gets converted to string
        self.assertEqual(result, expected)


if __name__ == '__main__':
    unittest.main(verbosity=2)