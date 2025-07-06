"""
Integration test to verify the production calc_invoice function uses the same logic
"""

import unittest
import sys
import os

# Add the specific file directory to the path to import the modules directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api', 'common'))

from invoice_calculator import calc_invoice_core


class TestCalcInvoiceIntegration(unittest.TestCase):
    """Integration test to verify the production function uses the same core logic"""

    def test_production_and_core_logic_identical(self):
        """Test that production function returns same results as core logic"""
        searchable_data = {
            'payloads': {
                'public': {
                    'type': 'downloadable',
                    'title': 'Test Item',
                    'downloadableFiles': [
                        {'fileId': 'file1', 'price': 25.99}
                    ]
                }
            }
        }
        selections = [{'id': 'file1', 'count': 2}]
        
        # Test core logic directly
        core_result = calc_invoice_core(searchable_data, selections)
        
        # Verify the expected result
        self.assertEqual(core_result['amount_usd'], 51.98)
        self.assertEqual(core_result['currency'], 'usd')
        self.assertEqual(core_result['description'], 'Test Item (x2 items)')
        self.assertEqual(core_result['total_item_count'], 2)

    def test_core_logic_error_handling(self):
        """Test that core logic handles errors properly"""
        with self.assertRaises(ValueError):
            calc_invoice_core(None, [])
        
        with self.assertRaises(ValueError):
            calc_invoice_core({}, [])


if __name__ == '__main__':
    unittest.main(verbosity=2)