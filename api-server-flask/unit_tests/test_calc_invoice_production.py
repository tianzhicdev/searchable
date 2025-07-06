"""
Unit tests for payment calculation logic using the production calc_invoice function
Tests the core invoice calculation logic that powers the production calc_invoice function.
"""

import unittest
import sys
import os

# Add the specific file directory to the path to import the module directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api', 'common'))

# Import the pure calculation logic directly (no package dependencies)
from invoice_calculator import calc_invoice_core as calc_invoice


class TestCalcInvoice(unittest.TestCase):
    """Test the production calc_invoice function"""

    def test_calc_invoice_downloadable_single_item(self):
        """Test invoice calculation for a single downloadable file"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Test Document',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 9.99}
                    ]
                }
            }
        }
        selections = [{'id': 'file1', 'count': 1}]
        
        result = calc_invoice(searchable_data, selections)
        
        self.assertEqual(result['amount_usd'], 9.99)
        self.assertEqual(result['total_amount_usd'], 9.99)
        self.assertEqual(result['description'], 'Test Document')
        self.assertEqual(result['currency'], 'usd')
        self.assertEqual(result['total_item_count'], 1)

    def test_calc_invoice_downloadable_multiple_items(self):
        """Test invoice calculation for multiple downloadable files"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Test Bundle',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 9.99},
                        {'fileId': 'file2', 'price': 15.50}
                    ]
                }
            }
        }
        selections = [
            {'id': 'file1', 'count': 2},
            {'id': 'file2', 'count': 1}
        ]
        
        result = calc_invoice(searchable_data, selections)
        
        expected_total = round((9.99 * 2) + (15.50 * 1), 2)
        self.assertEqual(result['amount_usd'], expected_total)
        self.assertEqual(result['total_amount_usd'], expected_total)
        self.assertEqual(result['description'], 'Test Bundle (x3 items)')
        self.assertEqual(result['currency'], 'usd')
        self.assertEqual(result['total_item_count'], 3)

    def test_calc_invoice_offline_items(self):
        """Test invoice calculation for offline items"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'offline',
                    'title': 'Offline Service',
                    'offlineItems': [
                        {'itemId': 'item1', 'price': 25.00},
                        {'itemId': 'item2', 'price': 50.00}
                    ]
                }
            }
        }
        selections = [
            {'id': 'item1', 'count': 1},
            {'id': 'item2', 'count': 2}
        ]
        
        result = calc_invoice(searchable_data, selections)
        
        expected_total = round((25.00 * 1) + (50.00 * 2), 2)
        self.assertEqual(result['amount_usd'], expected_total)
        self.assertEqual(result['total_amount_usd'], expected_total)
        self.assertEqual(result['description'], 'Offline Service (x3 items)')
        self.assertEqual(result['currency'], 'usd')
        self.assertEqual(result['total_item_count'], 3)

    def test_calc_invoice_direct_payment_single(self):
        """Test invoice calculation for direct payment type"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'direct',
                    'title': 'Direct Payment Item'
                }
            }
        }
        selections = [
            {'type': 'direct', 'amount': 100.50, 'count': 1}
        ]
        
        result = calc_invoice(searchable_data, selections)
        
        self.assertEqual(result['amount_usd'], 100.50)
        self.assertEqual(result['total_amount_usd'], 100.50)
        self.assertEqual(result['description'], 'Direct Payment Item - Direct Payment')
        self.assertEqual(result['currency'], 'usd')
        self.assertEqual(result['total_item_count'], 1)

    def test_calc_invoice_direct_payment_multiple(self):
        """Test invoice calculation for multiple direct payments"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'direct',
                    'title': 'Direct Service'
                }
            }
        }
        selections = [
            {'type': 'direct', 'amount': 50.25, 'count': 2},
            {'type': 'direct', 'amount': 75.00, 'count': 1}
        ]
        
        result = calc_invoice(searchable_data, selections)
        
        expected_total = round((50.25 * 2) + (75.00 * 1), 2)
        self.assertEqual(result['amount_usd'], expected_total)
        self.assertEqual(result['total_amount_usd'], expected_total)
        self.assertEqual(result['description'], 'Direct Service - Direct Payment')
        self.assertEqual(result['currency'], 'usd')
        self.assertEqual(result['total_item_count'], 3)

    def test_calc_invoice_mixed_downloadable_offline(self):
        """Test invoice calculation with both downloadable and offline items"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Mixed Package',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 10.00}
                    ],
                    'offlineItems': [
                        {'itemId': 'item1', 'price': 20.00}
                    ]
                }
            }
        }
        selections = [
            {'id': 'file1', 'count': 1},
            {'id': 'item1', 'count': 1}
        ]
        
        result = calc_invoice(searchable_data, selections)
        
        expected_total = 10.00 + 20.00
        self.assertEqual(result['amount_usd'], expected_total)
        self.assertEqual(result['total_amount_usd'], expected_total)
        self.assertEqual(result['description'], 'Mixed Package (x2 items)')
        self.assertEqual(result['currency'], 'usd')
        self.assertEqual(result['total_item_count'], 2)

    def test_calc_invoice_no_selections(self):
        """Test invoice calculation with no selections"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Empty Selection',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 10.00}
                    ]
                }
            }
        }
        selections = []
        
        result = calc_invoice(searchable_data, selections)
        
        self.assertEqual(result['amount_usd'], 0.00)
        self.assertEqual(result['total_amount_usd'], 0.00)
        self.assertEqual(result['description'], 'Empty Selection')
        self.assertEqual(result['currency'], 'usd')
        self.assertEqual(result['total_item_count'], 0)

    def test_calc_invoice_rounding_precision(self):
        """Test that amounts are properly rounded to 2 decimal places"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Precision Test',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 1.999}  # Should round
                    ]
                }
            }
        }
        selections = [{'id': 'file1', 'count': 3}]
        
        result = calc_invoice(searchable_data, selections)
        
        # 1.999 * 3 = 5.997, should round to 6.00
        self.assertEqual(result['amount_usd'], 6.00)
        self.assertEqual(result['total_amount_usd'], 6.00)

    def test_calc_invoice_invalid_selections(self):
        """Test invoice calculation with invalid selection IDs"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Test Item',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 10.00}
                    ]
                }
            }
        }
        selections = [
            {'id': 'file1', 'count': 1},
            {'id': 'nonexistent', 'count': 1}  # Invalid file ID
        ]
        
        result = calc_invoice(searchable_data, selections)
        
        # Should only count valid selections
        self.assertEqual(result['amount_usd'], 10.00)
        self.assertEqual(result['total_amount_usd'], 10.00)
        self.assertEqual(result['total_item_count'], 1)

    def test_calc_invoice_missing_data_error(self):
        """Test that calc_invoice raises ValueError for invalid data"""
        with self.assertRaises(ValueError):
            calc_invoice(None, [])
        
        with self.assertRaises(ValueError):
            calc_invoice({}, [])

    def test_calc_invoice_default_count(self):
        """Test that missing count defaults to 1"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Default Count Test',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 15.00}
                    ]
                }
            }
        }
        selections = [{'id': 'file1'}]  # No count specified
        
        result = calc_invoice(searchable_data, selections)
        
        self.assertEqual(result['amount_usd'], 15.00)
        self.assertEqual(result['total_item_count'], 1)

    def test_calc_invoice_edge_case_zero_price(self):
        """Test invoice calculation with zero price items"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Free Item',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 0.00}
                    ]
                }
            }
        }
        selections = [{'id': 'file1', 'count': 5}]
        
        result = calc_invoice(searchable_data, selections)
        
        self.assertEqual(result['amount_usd'], 0.00)
        self.assertEqual(result['total_amount_usd'], 0.00)
        self.assertEqual(result['total_item_count'], 5)

    def test_calc_invoice_large_quantities(self):
        """Test invoice calculation with large quantities"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Bulk Item',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 0.01}
                    ]
                }
            }
        }
        selections = [{'id': 'file1', 'count': 1000}]
        
        result = calc_invoice(searchable_data, selections)
        
        self.assertEqual(result['amount_usd'], 10.00)  # 0.01 * 1000
        self.assertEqual(result['total_item_count'], 1000)


if __name__ == '__main__':
    unittest.main(verbosity=2)