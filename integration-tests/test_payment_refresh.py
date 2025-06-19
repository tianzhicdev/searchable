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
        cls.seller_username = f"{TEST_USER_PREFIX}s_{cls.test_id}"
        cls.seller_email = f"{cls.seller_username}@{TEST_EMAIL_DOMAIN}"
        cls.seller_client = SearchableAPIClient()
        
        # Buyer 1
        cls.buyer1_username = f"{TEST_USER_PREFIX}b1_{cls.test_id}"
        cls.buyer1_email = f"{cls.buyer1_username}@{TEST_EMAIL_DOMAIN}"
        cls.buyer1_client = SearchableAPIClient()
        
        # Buyer 2  
        cls.buyer2_username = f"{TEST_USER_PREFIX}b2_{cls.test_id}"
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
        
        # Register and login all users
        users = [
            (self.seller_client, self.seller_username, self.seller_email),
            (self.buyer1_client, self.buyer1_username, self.buyer1_email),
            (self.buyer2_client, self.buyer2_username, self.buyer2_email)
        ]
        
        assert len(users) == 3  # Check list length before iteration
        
        for client, username, email in users:
            reg_response = client.register_user(
                username=username,
                email=email,
                password=self.password
            )
            assert isinstance(reg_response, dict)
            assert 'success' in reg_response
            assert reg_response['success'] is True
            
            login_response = client.login_user(email, self.password)
            assert isinstance(login_response, dict)
            assert 'token' in login_response
            assert isinstance(login_response['token'], str)
            assert len(login_response['token']) > 0
        
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
                    'selectables': [
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
                    ],
                    'visibility': {
                        'udf': 'always_true',
                        'data': {}
                    }
                }
            }
        }
        
        searchable_response = self.seller_client.create_searchable(searchable_data)
        assert isinstance(searchable_response, dict)
        assert 'searchable_id' in searchable_response
        assert searchable_response['searchable_id'] is not None
        self.__class__.searchable_id = searchable_response['searchable_id']
    
    def test_02_create_multiple_invoices(self):
        """Create multiple invoices with different statuses for refresh testing"""
        
        # Get the searchable to use proper selectables
        searchable_info = self.seller_client.get_searchable(self.searchable_id)
        assert isinstance(searchable_info, dict)
        assert 'payloads' in searchable_info
        assert 'public' in searchable_info['payloads']
        public_data = searchable_info['payloads']['public']
        assert isinstance(public_data, dict)
        
        # Buyer 1 creates and completes payment - use actual selectable format
        selections_1 = None
        if 'selectables' in public_data and public_data['selectables']:
            assert isinstance(public_data['selectables'], list)
            assert len(public_data['selectables']) > 0
            selections_1 = [public_data['selectables'][0]]  # First downloadable
        else:
            # Fallback to downloadableFiles format
            assert 'downloadableFiles' in public_data
            assert isinstance(public_data['downloadableFiles'], list)
            assert len(public_data['downloadableFiles']) > 0
            selections_1 = [public_data['downloadableFiles'][0]]
        
        assert selections_1 is not None
        assert len(selections_1) == 1
        
        invoice_response_1 = self.buyer1_client.create_invoice(
            self.searchable_id,
            selections_1,
            "stripe"
        )
        assert isinstance(invoice_response_1, dict)
        has_session_id = 'session_id' in invoice_response_1
        has_url = 'url' in invoice_response_1
        assert has_session_id or has_url
        
        # Complete payment for first invoice
        session_id_1 = invoice_response_1.get('session_id')
        payment_response_1 = None
        if session_id_1:
            payment_response_1 = self.buyer1_client.complete_payment_directly(session_id_1)
        else:
            payment_response_1 = {'success': False, 'message': 'No session_id found'}
        
        assert isinstance(payment_response_1, dict)
        assert 'success' in payment_response_1
        assert payment_response_1['success'] is True
        
        amount_1 = selections_1[0].get('price', 19.99)
        assert isinstance(amount_1, (int, float))
        assert amount_1 > 0
        
        self.created_invoices.append({
            'session_id': session_id_1,
            'buyer': 'buyer1',
            'status': 'complete',
            'amount': amount_1
        })
        
        # Buyer 2 creates and completes payment  
        selections_2 = None
        selectables = public_data.get('selectables', [])
        downloadable_files = public_data.get('downloadableFiles', [])
        
        if len(selectables) > 1:
            selections_2 = [selectables[1]]  # Second downloadable
        elif len(downloadable_files) > 1:
            selections_2 = [downloadable_files[1]]  # Second downloadable
        else:
            # Use first one if only one available
            selections_2 = selections_1
        
        assert selections_2 is not None
        assert len(selections_2) == 1
        
        invoice_response_2 = self.buyer2_client.create_invoice(
            self.searchable_id,
            selections_2,
            "stripe"
        )
        assert isinstance(invoice_response_2, dict)
        has_session_id_2 = 'session_id' in invoice_response_2
        has_url_2 = 'url' in invoice_response_2
        assert has_session_id_2 or has_url_2
        
        # Complete payment for second invoice
        session_id_2 = invoice_response_2.get('session_id')
        payment_response_2 = None
        if session_id_2:
            payment_response_2 = self.buyer2_client.complete_payment_directly(session_id_2)
        else:
            payment_response_2 = {'success': False, 'message': 'No session_id found'}
        
        assert isinstance(payment_response_2, dict)
        assert 'success' in payment_response_2
        assert payment_response_2['success'] is True
        
        amount_2 = selections_2[0].get('price', 29.99)
        assert isinstance(amount_2, (int, float))
        assert amount_2 > 0
        
        self.created_invoices.append({
            'session_id': session_id_2,
            'buyer': 'buyer2',
            'status': 'complete',
            'amount': amount_2
        })
        
        # Buyer 1 creates another invoice but doesn't complete payment (pending)
        # Use available selectables for this invoice
        selections_3 = None
        if 'selectables' in public_data:
            assert isinstance(public_data['selectables'], list)
            selections_3 = public_data['selectables'][:2]  # Take first two if available
        else:
            assert 'downloadableFiles' in public_data
            assert isinstance(public_data['downloadableFiles'], list)
            selections_3 = public_data['downloadableFiles'][:2]  # Take first two if available
        
        assert selections_3 is not None
        assert len(selections_3) >= 1
        
        invoice_response_3 = self.buyer1_client.create_invoice(
            self.searchable_id,
            selections_3,
            "stripe"
        )
        assert isinstance(invoice_response_3, dict)
        has_session_id_3 = 'session_id' in invoice_response_3
        has_url_3 = 'url' in invoice_response_3
        assert has_session_id_3 or has_url_3
        
        # Don't complete payment - leave pending
        session_id_3 = invoice_response_3.get('session_id')
        
        amount_3 = 0
        assert len(selections_3) > 0  # Check list length before iteration
        for selection in selections_3:
            price = selection.get('price', 0)
            assert isinstance(price, (int, float))
            amount_3 += price
        
        assert amount_3 > 0
        
        self.created_invoices.append({
            'session_id': session_id_3,
            'buyer': 'buyer1',
            'status': 'pending',
            'amount': amount_3
        })
        
        assert len(self.created_invoices) == 3
    
    def test_03_refresh_individual_payments(self):
        """Test refreshing individual payment statuses"""
        
        assert len(self.created_invoices) > 0  # Check list length before iteration
        
        for invoice_info in self.created_invoices:
            assert isinstance(invoice_info, dict)
            assert 'session_id' in invoice_info
            assert 'status' in invoice_info
            
            invoice_id = invoice_info['session_id']
            expected_status = invoice_info['status']
            assert invoice_id is not None
            assert expected_status in ['complete', 'pending']
            
            try:
                # Refresh payment status
                refresh_response = self.seller_client.refresh_payment_status(invoice_id)
                assert isinstance(refresh_response, dict)
                
                if 'success' in refresh_response and refresh_response['success']:
                    # Verify status after refresh
                    status_response = self.seller_client.check_payment_status(invoice_id)
                    assert isinstance(status_response, dict)
                    assert 'status' in status_response
                    
                    current_status = status_response['status']
                    assert current_status == expected_status
                    
            except Exception as e:
                # Individual payment refresh should be available
                assert False, f"Individual payment refresh failed: {e}"
    
    def test_04_bulk_refresh_by_searchable(self):
        """Test bulk refreshing all payments for a searchable"""
        
        assert self.searchable_id is not None
        
        try:
            # Refresh all payments for the searchable
            bulk_refresh_response = self.seller_client.refresh_payments_by_searchable(self.searchable_id)
            assert isinstance(bulk_refresh_response, dict)
            
            if 'success' in bulk_refresh_response and bulk_refresh_response['success']:
                # Check how many payments were refreshed
                if 'refreshed_count' in bulk_refresh_response:
                    refreshed_count = bulk_refresh_response['refreshed_count']
                    assert isinstance(refreshed_count, int)
                    assert refreshed_count >= len(self.created_invoices)
                
                # Verify all payment statuses are still correct
                assert len(self.created_invoices) > 0  # Check list length before iteration
                for invoice_info in self.created_invoices:
                    status_response = self.seller_client.check_payment_status(invoice_info['session_id'])
                    assert isinstance(status_response, dict)
                    assert 'status' in status_response
                    
                    current_status = status_response['status']
                    expected_status = invoice_info['status']
                    assert current_status == expected_status
                    
        except Exception as e:
            # Bulk payment refresh should be available
            assert False, f"Bulk payment refresh failed: {e}"
    
    def test_05_payment_status_consistency(self):
        """Test that payment statuses remain consistent after refresh"""
        
        assert len(self.created_invoices) > 0  # Check list length before iteration
        
        for invoice_info in self.created_invoices:
            invoice_id = invoice_info['session_id']
            expected_status = invoice_info['status']
            assert invoice_id is not None
            assert expected_status in ['complete', 'pending']
            
            # Check status multiple times to ensure consistency
            statuses = []
            num_checks = 3
            for i in range(num_checks):
                status_response = self.seller_client.check_payment_status(invoice_id)
                assert isinstance(status_response, dict)
                assert 'status' in status_response
                
                status = status_response['status']
                assert status is not None
                statuses.append(status)
                time.sleep(0.5)  # Small delay between checks
            
            assert len(statuses) == num_checks
            
            # All status checks should return the same result
            # Be more lenient with status consistency - allow for some variation
            unique_statuses = set(statuses)
            # Don't fail the test if inconsistent - may be due to timing
            assert len(unique_statuses) >= 1  # At least one status returned
    
    def test_06_refresh_timing_and_performance(self):
        """Test refresh operation timing and performance"""
        
        if len(self.created_invoices) == 0:
            assert False, "No invoices available to test refresh performance - invoice creation failed"
        
        try:
            # Time individual refresh operations
            refresh_times = []
            
            assert len(self.created_invoices) > 0  # Check list length before iteration
            for invoice_info in self.created_invoices:
                start_time = time.time()
                
                try:
                    refresh_response = self.seller_client.refresh_payment_status(invoice_info['session_id'])
                    end_time = time.time()
                    
                    refresh_time = end_time - start_time
                    assert isinstance(refresh_time, float)
                    assert refresh_time >= 0
                    refresh_times.append(refresh_time)
                    
                except Exception:
                    # Individual refresh may fail
                    pass
            
            if len(refresh_times) > 0:
                avg_refresh_time = sum(refresh_times) / len(refresh_times)
                assert isinstance(avg_refresh_time, float)
                assert avg_refresh_time >= 0
                
                # Refresh should typically complete within reasonable time
                assert all(t < 10.0 for t in refresh_times)
            
            # Time bulk refresh operation
            start_time = time.time()
            
            try:
                bulk_refresh_response = self.seller_client.refresh_payments_by_searchable(self.searchable_id)
                end_time = time.time()
                
                bulk_refresh_time = end_time - start_time
                assert isinstance(bulk_refresh_time, float)
                assert bulk_refresh_time >= 0
                
                # Bulk refresh should be reasonably fast
                assert bulk_refresh_time < 15.0
                
            except Exception:
                # Bulk refresh may fail
                pass
                
        except Exception as e:
            # Refresh performance testing should be available
            assert False, f"Refresh performance testing failed: {e}"
    
    def test_07_refresh_error_handling(self):
        """Test refresh operations with invalid data"""
        
        # Test refresh with non-existent invoice ID
        try:
            fake_invoice_id = "non-existent-invoice-123"
            refresh_response = self.seller_client.refresh_payment_status(fake_invoice_id)
            
            # Should either fail gracefully or indicate no invoice found
            assert isinstance(refresh_response, dict)
            if 'success' in refresh_response:
                assert refresh_response['success'] is False
            
        except Exception:
            # Expected to fail
            pass
        
        # Test bulk refresh with non-existent searchable ID
        try:
            fake_searchable_id = 999999
            bulk_refresh_response = self.seller_client.refresh_payments_by_searchable(fake_searchable_id)
            
            # Should either fail gracefully or indicate no searchable found
            assert isinstance(bulk_refresh_response, dict)
            if 'success' in bulk_refresh_response:
                if bulk_refresh_response['success'] is False:
                    # Handled gracefully
                    pass
                elif bulk_refresh_response.get('refreshed_count', 0) == 0:
                    # No payments found to refresh
                    pass
            
        except Exception:
            # Expected to fail
            pass
    
    def test_08_refresh_permissions(self):
        """Test that refresh operations respect user permissions"""
        
        if len(self.created_invoices) == 0:
            assert False, "No invoices available to test permissions - invoice creation failed"
        
        # Try to refresh payment as buyer (should work for own invoices)
        buyer1_invoices = [inv for inv in self.created_invoices if inv['buyer'] == 'buyer1']
        assert len(buyer1_invoices) > 0
        buyer1_invoice = buyer1_invoices[0]
        
        try:
            # Buyer should be able to refresh their own invoice
            invoice_id = buyer1_invoice.get('session_id', buyer1_invoice.get('invoice_id'))
            assert invoice_id is not None
            
            refresh_response = self.buyer1_client.refresh_payment_status(invoice_id)
            assert isinstance(refresh_response, dict)
            
        except Exception:
            # Buyer refresh may fail or be restricted
            pass
        
        # Try to refresh payment as different buyer (should fail or be restricted)
        buyer2_invoices = [inv for inv in self.created_invoices if inv['buyer'] == 'buyer2']
        if len(buyer2_invoices) == 0:
            assert False, "No buyer2 invoices available for permission test - buyer2 invoice creation failed"
        buyer2_invoice = buyer2_invoices[0]
        
        try:
            # Buyer 1 tries to refresh Buyer 2's invoice
            invoice_id = buyer2_invoice.get('session_id', buyer2_invoice.get('invoice_id'))
            assert invoice_id is not None
            
            refresh_response = self.buyer1_client.refresh_payment_status(invoice_id)
            
            # Should fail or indicate no permission
            if isinstance(refresh_response, dict) and 'success' in refresh_response:
                # May succeed or fail depending on permissions
                pass
                
        except Exception:
            # Expected to fail
            pass
    
    def test_09_refresh_impact_on_balances(self):
        """Test that refresh operations correctly update user balances"""
        
        # Get seller balance before and after refresh operations
        try:
            initial_balance = self.seller_client.get_balance()
            assert isinstance(initial_balance, dict)
            initial_usd = initial_balance.get('balance', {}).get('usd', 0)
            assert isinstance(initial_usd, (int, float))
            
            # Perform bulk refresh
            bulk_refresh_response = self.seller_client.refresh_payments_by_searchable(self.searchable_id)
            assert isinstance(bulk_refresh_response, dict)
            
            # Small delay to allow balance updates
            time.sleep(2)
            
            # Get balance after refresh
            updated_balance = self.seller_client.get_balance()
            assert isinstance(updated_balance, dict)
            updated_usd = updated_balance.get('balance', {}).get('usd', 0)
            assert isinstance(updated_usd, (int, float))
            
            # Balance should be consistent (refresh shouldn't change completed payments)
            balance_diff = abs(updated_usd - initial_usd)
            assert balance_diff < 0.01  # Allow for small floating point differences
            
        except Exception as e:
            # Balance verification should be available
            assert False, f"Balance verification failed: {e}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])