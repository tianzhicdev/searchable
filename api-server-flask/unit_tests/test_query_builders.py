"""
Unit tests for query_builders module - testing SQL query construction
"""

import unittest
import sys
import os

# Add the path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

# Mock the database dependencies before import
sys.modules['psycopg2'] = Mock()
sys.modules['psycopg2.extras'] = Mock()

# Mock logging
class MockLogger:
    def __init__(self, *args, **kwargs):
        pass
    def info(self, msg):
        pass
    def error(self, msg):
        pass
    def warning(self, msg):
        pass

sys.modules['logging'] = Mock()

# Import the module under test
from common.query_builders import (
    build_balance_calculation_query,
    build_balance_query_params,
    build_invoice_query_conditions,
    build_invoice_query_with_payment_status
)
from common.models import PaymentStatus


class TestQueryBuilders(unittest.TestCase):
    """Test cases for query builder functions"""
    
    def test_build_balance_calculation_query(self):
        """Test balance calculation query builder"""
        query, param_count = build_balance_calculation_query()
        
        # Check query structure
        self.assertIn("WITH balance_sources AS", query)
        self.assertIn("sale", query)
        self.assertIn("reward", query)
        self.assertIn("deposit", query)
        self.assertIn("withdrawal", query)
        self.assertIn("balance_payment", query)
        self.assertIn("COALESCE(SUM(net_amount), 0)", query)
        
        # Check parameter count
        self.assertEqual(param_count, 8)
        
    def test_build_balance_query_params(self):
        """Test balance query parameters builder"""
        user_id = 12345
        params = build_balance_query_params(user_id)
        
        # Check parameter structure
        self.assertEqual(len(params), 10)  # 10 parameters total
        self.assertEqual(params[0], user_id)  # First parameter is user_id
        self.assertEqual(params[1], PaymentStatus.COMPLETE.value)  # Second is payment status
        self.assertEqual(params[2], user_id)  # Third is user_id again for rewards
        
    def test_build_invoice_query_conditions_single_values(self):
        """Test invoice query conditions with single values"""
        buyer_id = 123
        seller_id = 456
        searchable_id = 789
        external_id = "ext_123"
        
        conditions, params = build_invoice_query_conditions(
            buyer_id=buyer_id,
            seller_id=seller_id,
            searchable_id=searchable_id,
            external_id=external_id
        )
        
        # Check conditions
        self.assertEqual(len(conditions), 4)
        self.assertIn("i.buyer_id = %s", conditions)
        self.assertIn("i.seller_id = %s", conditions)
        self.assertIn("i.searchable_id = %s", conditions)
        self.assertIn("i.external_id = %s", conditions)
        
        # Check parameters
        self.assertEqual(len(params), 4)
        self.assertEqual(params[0], str(buyer_id))
        self.assertEqual(params[1], str(seller_id))
        self.assertEqual(params[2], str(searchable_id))
        self.assertEqual(params[3], external_id)
        
    def test_build_invoice_query_conditions_list_values(self):
        """Test invoice query conditions with list values"""
        buyer_ids = [123, 456]
        seller_ids = [789, 101]
        searchable_ids = [111, 222, 333]
        
        conditions, params = build_invoice_query_conditions(
            buyer_id=buyer_ids,
            seller_id=seller_ids,
            searchable_id=searchable_ids
        )
        
        # Check conditions for lists
        self.assertEqual(len(conditions), 3)
        self.assertIn("i.buyer_id IN (%s,%s)", conditions)
        self.assertIn("i.seller_id IN (%s,%s)", conditions)
        self.assertIn("i.searchable_id IN (%s,%s,%s)", conditions)
        
        # Check parameters
        self.assertEqual(len(params), 7)  # 2 + 2 + 3
        self.assertEqual(params[0], "123")
        self.assertEqual(params[1], "456")
        self.assertEqual(params[2], "789")
        self.assertEqual(params[3], "101")
        
    def test_build_invoice_query_conditions_no_params(self):
        """Test invoice query conditions with no parameters"""
        conditions, params = build_invoice_query_conditions()
        
        # Check empty results
        self.assertEqual(len(conditions), 0)
        self.assertEqual(len(params), 0)
        
    def test_build_invoice_query_with_payment_status(self):
        """Test invoice query with payment status"""
        conditions = ["i.buyer_id = %s", "i.seller_id = %s"]
        params = ["123", "456"]
        status = "complete"
        
        query, updated_params = build_invoice_query_with_payment_status(
            conditions, params, status
        )
        
        # Check query structure
        self.assertIn("FROM invoice i", query)
        self.assertIn("LEFT JOIN payment p ON i.id = p.invoice_id", query)
        self.assertIn("WHERE i.buyer_id = %s AND i.seller_id = %s", query)
        self.assertIn("AND p.status = %s", query)
        self.assertIn("ORDER BY i.created_at DESC", query)
        
        # Check parameters
        self.assertEqual(len(updated_params), 3)
        self.assertEqual(updated_params[2], status)
        
    def test_build_invoice_query_with_payment_status_no_status(self):
        """Test invoice query without payment status filter"""
        conditions = ["i.buyer_id = %s"]
        params = ["123"]
        
        query, updated_params = build_invoice_query_with_payment_status(
            conditions, params
        )
        
        # Check query structure
        self.assertIn("FROM invoice i", query)
        self.assertNotIn("AND p.status = %s", query)
        
        # Check parameters unchanged
        self.assertEqual(len(updated_params), 1)
        self.assertEqual(updated_params[0], "123")
        
    def test_build_invoice_query_with_payment_status_empty_conditions(self):
        """Test invoice query with empty conditions"""
        conditions = []
        params = []
        
        query, updated_params = build_invoice_query_with_payment_status(
            conditions, params
        )
        
        # Check query structure with no conditions
        self.assertIn("WHERE 1=1", query)
        self.assertEqual(len(updated_params), 0)


if __name__ == '__main__':
    unittest.main()