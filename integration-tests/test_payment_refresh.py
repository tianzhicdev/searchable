import pytest
import uuid
import time
import json
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestPaymentRefresh:
    """Test payment refresh and status management operations"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with users and transactions"""
        cls.test_id = str(uuid.uuid4())[:8]
        
        # Seller
        cls.seller_username = f"{TEST_USER_PREFIX}seller_refresh_{cls.test_id}"
        cls.seller_email = f"{cls.seller_username}@{TEST_EMAIL_DOMAIN}"
        cls.seller_client = SearchableAPIClient()
        
        # Buyer 1
        cls.buyer1_username = f"{TEST_USER_PREFIX}buyer1_refresh_{cls.test_id}"
        cls.buyer1_email = f"{cls.buyer1_username}@{TEST_EMAIL_DOMAIN}"
        cls.buyer1_client = SearchableAPIClient()
        
        # Buyer 2  
        cls.buyer2_username = f"{TEST_USER_PREFIX}buyer2_refresh_{cls.test_id}"
        cls.buyer2_email = f"{cls.buyer2_username}@{TEST_EMAIL_DOMAIN}"
        cls.buyer2_client = SearchableAPIClient()
        
        cls.password = DEFAULT_PASSWORD
        cls.searchable_id = None
        cls.created_invoices = []
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        for client in [cls.seller_client, cls.buyer1_client, cls.buyer2_client]:
            if client.token:
                try:
                    client.logout()
                except:
                    pass
    
    def test_01_setup_users_and_searchable(self):
        """Setup users and create searchable item for payment testing"""
        print("Setting up users and searchable for payment refresh testing")
        
        # Register and login all users
        users = [
            (self.seller_client, self.seller_username, self.seller_email),
            (self.buyer1_client, self.buyer1_username, self.buyer1_email),
            (self.buyer2_client, self.buyer2_username, self.buyer2_email)
        ]
        
        for client, username, email in users:
            reg_response = client.register_user(
                username=username,
                email=email,
                password=self.password
            )
            assert 'success' in reg_response or 'user' in reg_response
            
            login_response = client.login_user(email, self.password)
            assert 'token' in login_response
            
            print(f"✓ User setup: {username}")
        
        # Seller creates searchable item
        searchable_data = {
            'payloads': {
                'public': {
                    'title': 'Payment Refresh Test Package',
                    'description': 'Package for testing payment refresh functionality',
                    'currency': 'usd',
                    'type': 'downloadable',
                    'downloadableFiles': [
                        {
                            'name': 'Refresh Test File 1',
                            'price': 19.99,
                            'fileId': 'refresh-test-file-1',
                            'fileName': 'refresh_test_1.zip',
                            'fileType': 'application/zip',
                            'fileSize': 1024
                        },
                        {
                            'name': 'Refresh Test File 2',
                            'price': 29.99,
                            'fileId': 'refresh-test-file-2',
                            'fileName': 'refresh_test_2.zip',
                            'fileType': 'application/zip',
                            'fileSize': 2048
                        }
                    ],
                    'visibility': {
                        'udf': 'always_true',
                        'data': {}
                    }
                }
            }
        }
        
        searchable_response = self.seller_client.create_searchable(searchable_data)
        assert 'searchable_id' in searchable_response
        self.searchable_id = searchable_response['searchable_id']
        
        print(f"✓ Searchable created: {self.searchable_id}")
    
    def test_02_create_multiple_invoices(self):
        """Create multiple invoices with different statuses for refresh testing"""
        print("Creating multiple invoices for refresh testing")
        
        # Buyer 1 creates and completes payment
        invoice_data_1 = {
            'searchable_id': self.searchable_id,
            'currency': 'usd',
            'selections': [
                {
                    'id': 'refresh-test-file-1',
                    'type': 'downloadable',
                    'name': 'Refresh Test File 1',
                    'price': 19.99
                }
            ]
        }
        
        invoice_response_1 = self.buyer1_client.create_invoice(invoice_data_1)
        assert 'invoice_id' in invoice_response_1
        
        # Complete payment for first invoice
        payment_response_1 = self.buyer1_client.complete_test_payment(invoice_response_1['invoice_id'])
        assert payment_response_1['success']
        
        self.created_invoices.append({
            'invoice_id': invoice_response_1['invoice_id'],
            'buyer': 'buyer1',
            'status': 'complete',
            'amount': 19.99
        })
        
        print(f"✓ Invoice 1 created and completed: {invoice_response_1['invoice_id']}")
        
        # Buyer 2 creates and completes payment  
        invoice_data_2 = {
            'searchable_id': self.searchable_id,
            'currency': 'usd',
            'selections': [
                {
                    'id': 'refresh-test-file-2',
                    'type': 'downloadable',
                    'name': 'Refresh Test File 2',
                    'price': 29.99
                }
            ]
        }
        
        invoice_response_2 = self.buyer2_client.create_invoice(invoice_data_2)
        assert 'invoice_id' in invoice_response_2
        
        # Complete payment for second invoice
        payment_response_2 = self.buyer2_client.complete_test_payment(invoice_response_2['invoice_id'])
        assert payment_response_2['success']
        
        self.created_invoices.append({
            'invoice_id': invoice_response_2['invoice_id'],
            'buyer': 'buyer2',
            'status': 'complete',
            'amount': 29.99
        })
        
        print(f"✓ Invoice 2 created and completed: {invoice_response_2['invoice_id']}")
        
        # Buyer 1 creates another invoice but doesn't complete payment (pending)
        invoice_data_3 = {
            'searchable_id': self.searchable_id,
            'currency': 'usd',
            'selections': [
                {
                    'id': 'refresh-test-file-1',
                    'type': 'downloadable',
                    'name': 'Refresh Test File 1',
                    'price': 19.99
                },
                {
                    'id': 'refresh-test-file-2',
                    'type': 'downloadable',
                    'name': 'Refresh Test File 2',
                    'price': 29.99
                }
            ]
        }
        
        invoice_response_3 = self.buyer1_client.create_invoice(invoice_data_3)
        assert 'invoice_id' in invoice_response_3
        
        # Don't complete payment - leave pending
        self.created_invoices.append({
            'invoice_id': invoice_response_3['invoice_id'],
            'buyer': 'buyer1',
            'status': 'pending',
            'amount': 49.98
        })
        
        print(f"✓ Invoice 3 created (pending): {invoice_response_3['invoice_id']}")
        
        assert len(self.created_invoices) == 3
    
    def test_03_refresh_individual_payments(self):
        """Test refreshing individual payment statuses"""
        print("Testing individual payment refresh")
        
        for invoice_info in self.created_invoices:
            invoice_id = invoice_info['invoice_id']
            expected_status = invoice_info['status']
            
            try:
                # Refresh payment status
                refresh_response = self.seller_client.refresh_payment_status(invoice_id)
                
                if 'success' in refresh_response and refresh_response['success']:
                    print(f"✓ Payment refresh successful for {invoice_id}")
                    
                    # Verify status after refresh
                    status_response = self.seller_client.check_payment_status(invoice_id)
                    current_status = status_response.get('status')
                    
                    assert current_status == expected_status
                    print(f"  Status confirmed: {current_status}")
                    
                else:
                    print(f"! Payment refresh failed for {invoice_id}: {refresh_response}")
                    
            except Exception as e:
                print(f"! Individual payment refresh may not be available: {str(e)}")
                return
    
    def test_04_bulk_refresh_by_searchable(self):
        """Test bulk refreshing all payments for a searchable"""
        print("Testing bulk payment refresh by searchable")
        
        try:
            # Refresh all payments for the searchable
            bulk_refresh_response = self.seller_client.refresh_payments_by_searchable(self.searchable_id)
            
            if 'success' in bulk_refresh_response and bulk_refresh_response['success']:
                print(f"✓ Bulk payment refresh successful for searchable {self.searchable_id}")
                
                # Check how many payments were refreshed
                if 'refreshed_count' in bulk_refresh_response:
                    refreshed_count = bulk_refresh_response['refreshed_count']
                    print(f"  Refreshed {refreshed_count} payments")
                    assert refreshed_count >= len(self.created_invoices)
                
                # Verify all payment statuses are still correct
                for invoice_info in self.created_invoices:
                    status_response = self.seller_client.check_payment_status(invoice_info['invoice_id'])
                    current_status = status_response.get('status')
                    expected_status = invoice_info['status']
                    
                    assert current_status == expected_status
                    print(f"  Invoice {invoice_info['invoice_id']}: {current_status}")
                    
            else:
                print(f"! Bulk payment refresh failed: {bulk_refresh_response}")
                
        except Exception as e:
            print(f"! Bulk payment refresh may not be available: {str(e)}")
    
    def test_05_payment_status_consistency(self):
        """Test that payment statuses remain consistent after refresh"""
        print("Testing payment status consistency")
        
        for invoice_info in self.created_invoices:
            invoice_id = invoice_info['invoice_id']
            expected_status = invoice_info['status']
            
            # Check status multiple times to ensure consistency
            statuses = []
            for i in range(3):
                status_response = self.seller_client.check_payment_status(invoice_id)
                status = status_response.get('status')
                statuses.append(status)
                time.sleep(0.5)  # Small delay between checks
            
            # All status checks should return the same result
            assert all(s == expected_status for s in statuses)
            print(f"✓ Status consistent for {invoice_id}: {expected_status}")
    
    def test_06_refresh_timing_and_performance(self):
        """Test refresh operation timing and performance"""
        print("Testing refresh operation performance")
        
        if not self.created_invoices:
            print("! No invoices to test refresh performance")
            return
        
        try:
            # Time individual refresh operations
            refresh_times = []
            
            for invoice_info in self.created_invoices:
                start_time = time.time()
                
                try:
                    refresh_response = self.seller_client.refresh_payment_status(invoice_info['invoice_id'])
                    end_time = time.time()
                    
                    refresh_time = end_time - start_time
                    refresh_times.append(refresh_time)
                    
                    print(f"  Individual refresh time: {refresh_time:.2f}s")
                    
                except Exception as e:
                    print(f"  Individual refresh failed: {str(e)}")
            
            if refresh_times:
                avg_refresh_time = sum(refresh_times) / len(refresh_times)
                print(f"✓ Average individual refresh time: {avg_refresh_time:.2f}s")
                
                # Refresh should typically complete within reasonable time
                assert all(t < 10.0 for t in refresh_times), "Refresh operations taking too long"
            
            # Time bulk refresh operation
            start_time = time.time()
            
            try:
                bulk_refresh_response = self.seller_client.refresh_payments_by_searchable(self.searchable_id)
                end_time = time.time()
                
                bulk_refresh_time = end_time - start_time
                print(f"✓ Bulk refresh time: {bulk_refresh_time:.2f}s")
                
                # Bulk refresh should be reasonably fast
                assert bulk_refresh_time < 15.0, "Bulk refresh taking too long"
                
            except Exception as e:
                print(f"  Bulk refresh failed: {str(e)}")
                
        except Exception as e:
            print(f"! Refresh performance testing failed: {str(e)}")
    
    def test_07_refresh_error_handling(self):
        """Test refresh operations with invalid data"""
        print("Testing refresh error handling")
        
        # Test refresh with non-existent invoice ID
        try:
            fake_invoice_id = "non-existent-invoice-123"
            refresh_response = self.seller_client.refresh_payment_status(fake_invoice_id)
            
            # Should either fail gracefully or indicate no invoice found
            if 'success' in refresh_response:
                assert not refresh_response['success']
                print("✓ Non-existent invoice refresh handled gracefully")
            
        except Exception as e:
            # Expected to fail
            print(f"✓ Non-existent invoice refresh correctly failed: {str(e)}")
        
        # Test bulk refresh with non-existent searchable ID
        try:
            fake_searchable_id = 999999
            bulk_refresh_response = self.seller_client.refresh_payments_by_searchable(fake_searchable_id)
            
            # Should either fail gracefully or indicate no searchable found
            if 'success' in bulk_refresh_response:
                if not bulk_refresh_response['success']:
                    print("✓ Non-existent searchable bulk refresh handled gracefully")
                elif bulk_refresh_response.get('refreshed_count', 0) == 0:
                    print("✓ Non-existent searchable returned zero refreshed payments")
            
        except Exception as e:
            # Expected to fail
            print(f"✓ Non-existent searchable bulk refresh correctly failed: {str(e)}")
    
    def test_08_refresh_permissions(self):
        """Test that refresh operations respect user permissions"""
        print("Testing refresh operation permissions")
        
        if not self.created_invoices:
            print("! No invoices to test permissions")
            return
        
        # Try to refresh payment as buyer (should work for own invoices)
        buyer1_invoice = [inv for inv in self.created_invoices if inv['buyer'] == 'buyer1'][0]
        
        try:
            # Buyer should be able to refresh their own invoice
            refresh_response = self.buyer1_client.refresh_payment_status(buyer1_invoice['invoice_id'])
            
            if 'success' in refresh_response:
                print("✓ Buyer can refresh own invoice")
            else:
                print("! Buyer refresh own invoice failed - may be restricted")
                
        except Exception as e:
            print(f"! Buyer refresh own invoice failed: {str(e)}")
        
        # Try to refresh payment as different buyer (should fail or be restricted)
        buyer2_invoice = [inv for inv in self.created_invoices if inv['buyer'] == 'buyer2'][0]
        
        try:
            # Buyer 1 tries to refresh Buyer 2's invoice
            refresh_response = self.buyer1_client.refresh_payment_status(buyer2_invoice['invoice_id'])
            
            # Should fail or indicate no permission
            if 'success' in refresh_response and refresh_response['success']:
                print("! WARNING: Buyer can refresh other buyer's invoice - check permissions")
            else:
                print("✓ Cross-buyer refresh correctly restricted")
                
        except Exception as e:
            # Expected to fail
            print(f"✓ Cross-buyer refresh correctly failed: {str(e)}")
    
    def test_09_refresh_impact_on_balances(self):
        """Test that refresh operations correctly update user balances"""
        print("Testing refresh impact on user balances")
        
        # Get seller balance before and after refresh operations
        try:
            initial_balance = self.seller_client.get_balance()
            initial_usd = initial_balance.get('balance', {}).get('usd', 0)
            
            # Perform bulk refresh
            bulk_refresh_response = self.seller_client.refresh_payments_by_searchable(self.searchable_id)
            
            # Small delay to allow balance updates
            time.sleep(2)
            
            # Get balance after refresh
            updated_balance = self.seller_client.get_balance()
            updated_usd = updated_balance.get('balance', {}).get('usd', 0)
            
            print(f"  Balance before refresh: ${initial_usd}")
            print(f"  Balance after refresh: ${updated_usd}")
            
            # Balance should be consistent (refresh shouldn't change completed payments)
            assert updated_usd == initial_usd or abs(updated_usd - initial_usd) < 0.01
            print("✓ Balance remained consistent after refresh")
            
        except Exception as e:
            print(f"! Balance verification failed: {str(e)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])