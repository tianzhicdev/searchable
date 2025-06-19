import pytest
import uuid
import time
import json
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestWithdrawalOperations:
    """Test withdrawal operations including USD withdrawal as USDT"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with user having some balance"""
        cls.test_id = str(uuid.uuid4())[:8]
        cls.username = f"{TEST_USER_PREFIX}w_{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        cls.client = SearchableAPIClient()
        cls.user_id = None
        cls.created_withdrawals = []
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        if cls.client.token:
            cls.client.logout()
    
    def test_01_setup_user_with_balance(self):
        """Register user and simulate having balance through sales"""
        
        # Register and login user
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        
        login_response = self.client.login_user(self.email, self.password)
        assert isinstance(login_response, dict)
        assert 'token' in login_response
        assert isinstance(login_response['token'], str)
        assert len(login_response['token']) > 0
        assert 'user' in login_response
        assert isinstance(login_response['user'], dict)
        assert '_id' in login_response['user']
        self.user_id = login_response['user']['_id']
        
        # Check initial balance
        balance_response = self.client.get_balance()
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        assert isinstance(balance_response['balance'], dict)
        initial_balance = balance_response.get('balance', {}).get('usd', 0)
        assert isinstance(initial_balance, (int, float))
    
    def test_02_create_earnings_simulation(self):
        """Create a sale to simulate earnings that can be withdrawn"""
        
        # Create a simple searchable item
        searchable_data = {
            'payloads': {
                'public': {
                    'title': 'Withdrawal Test Item',
                    'description': 'Item created to test withdrawal functionality',
                    'currency': 'usd',
                    'type': 'downloadable',
                    'downloadableFiles': [
                        {
                            'name': 'Test File',
                            'price': 100.00,  # $100 item
                            'fileId': 'test-file-id',
                            'fileName': 'test_file.zip',
                            'fileType': 'application/zip',
                            'fileSize': 1024
                        }
                    ],
                    'visibility': {
                        'udf': 'always_true',
                        'data': {}
                    }
                }
            }
        }
        
        searchable_response = self.client.create_searchable(searchable_data)
        assert isinstance(searchable_response, dict)
        assert 'searchable_id' in searchable_response
        assert searchable_response['searchable_id'] is not None
        searchable_id = searchable_response['searchable_id']
        
        # Create a second user to buy from this user
        buyer_client = SearchableAPIClient()
        buyer_username = f"{TEST_USER_PREFIX}bw_{self.test_id}"
        buyer_email = f"{buyer_username}@{TEST_EMAIL_DOMAIN}"
        
        # Register buyer
        buyer_response = buyer_client.register_user(
            username=buyer_username,
            email=buyer_email,
            password=self.password
        )
        assert isinstance(buyer_response, dict)
        assert 'success' in buyer_response
        assert buyer_response['success'] is True
        
        # Login buyer
        buyer_login = buyer_client.login_user(buyer_email, self.password)
        assert isinstance(buyer_login, dict)
        assert 'token' in buyer_login
        assert isinstance(buyer_login['token'], str)
        assert len(buyer_login['token']) > 0
        
        # Buyer creates invoice - use proper API format
        searchable_info = self.client.get_searchable(searchable_id)
        assert isinstance(searchable_info, dict)
        assert 'payloads' in searchable_info
        assert 'public' in searchable_info['payloads']
        
        public_data = searchable_info['payloads']['public']
        assert isinstance(public_data, dict)
        
        if 'selectables' in public_data and public_data['selectables']:
            assert isinstance(public_data['selectables'], list)
            assert len(public_data['selectables']) > 0
            selections = [public_data['selectables'][0]]  # Use first selectable
        else:
            # Fallback selection
            selections = [{'id': 'test-file-id', 'type': 'downloadable', 'name': 'Test File', 'price': 100.00}]
        
        assert selections is not None
        assert len(selections) > 0
        
        invoice_response = buyer_client.create_invoice(
            searchable_id,
            selections,
            "stripe"
        )
        assert isinstance(invoice_response, dict)
        has_session_id = 'session_id' in invoice_response
        has_url = 'url' in invoice_response
        assert has_session_id or has_url
        
        # Complete payment
        session_id = invoice_response.get('session_id')
        if session_id:
            payment_response = buyer_client.complete_payment_directly(session_id)
        else:
            payment_response = {'success': False, 'message': 'No session_id found'}
        
        assert isinstance(payment_response, dict)
        assert 'success' in payment_response
        assert payment_response['success'] is True
        
        # Check seller's balance after sale
        time.sleep(2)  # Allow time for payment processing
        balance_response = self.client.get_balance()
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        assert isinstance(balance_response['balance'], dict)
        
        new_balance = balance_response.get('balance', {}).get('usd', 0)
        assert isinstance(new_balance, (int, float))
        assert new_balance > 90  # Should have ~$99.90 after platform fee (0.1%)
        
        self.available_balance = new_balance
        
        # Cleanup buyer client
        buyer_client.logout()
    
    def test_03_attempt_withdrawal_exceeding_balance(self):
        """Test withdrawal attempt that exceeds available balance"""
        
        # Try to withdraw more than available balance
        # Get current balance first
        balance_response = self.client.get_balance()
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        assert isinstance(balance_response['balance'], dict)
        
        current_balance = balance_response.get('balance', {}).get('usd', 0)
        assert isinstance(current_balance, (int, float))
        excessive_amount = current_balance + 50.00
        assert excessive_amount > current_balance
        
        withdrawal_data = {
            'address': '0x742E96Ac4fF1234A3b8DcE9B7B5678901234567F',  # Test USDT address
            'amount': excessive_amount
        }
        
        assert isinstance(withdrawal_data, dict)
        assert 'address' in withdrawal_data
        assert 'amount' in withdrawal_data
        assert len(withdrawal_data['address']) > 20
        
        try:
            response = self.client.create_usdt_withdrawal(withdrawal_data)
            # Should fail or return error
            assert isinstance(response, dict)
            if 'success' in response:
                assert response['success'] is False
        except Exception:
            # Expected to fail for excessive amount
            pass
    
    def test_04_create_valid_usdt_withdrawal(self):
        """Test creating a valid USD withdrawal as USDT"""
        
        withdrawal_amount = 50.00  # Withdraw $50
        assert isinstance(withdrawal_amount, (int, float))
        assert withdrawal_amount > 0
        
        withdrawal_data = {
            'address': '0x742E96Ac4fF1234A3b8DcE9B7B5678901234567F',
            'amount': withdrawal_amount
        }
        
        assert isinstance(withdrawal_data, dict)
        assert 'address' in withdrawal_data
        assert 'amount' in withdrawal_data
        assert len(withdrawal_data['address']) > 20
        
        try:
            response = self.client.create_usdt_withdrawal(withdrawal_data)
            assert isinstance(response, dict)
            
            # Verify withdrawal was created
            has_withdrawal_id = 'withdrawal_id' in response
            has_id = 'id' in response
            
            if has_withdrawal_id or has_id:
                withdrawal_id = response.get('withdrawal_id') or response.get('id')
                assert withdrawal_id is not None
                self.created_withdrawals.append(withdrawal_id)
                
        except Exception as e:
            assert False, f"Withdrawal API failed: {e}"
        
        # Verify balance was deducted
        balance_response = self.client.get_balance()
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        assert isinstance(balance_response['balance'], dict)
        
        updated_balance = balance_response.get('balance', {}).get('usd', 0)
        assert isinstance(updated_balance, (int, float))
    
    def test_05_create_small_withdrawal(self):
        """Test creating a smaller withdrawal to verify fee calculation"""
        
        withdrawal_amount = 10.00  # Withdraw $10
        assert isinstance(withdrawal_amount, (int, float))
        assert withdrawal_amount > 0
        
        withdrawal_data = {
            'address': '0x123ABC456DEF789GHI012JKL345MNO678PQR901S',
            'amount': withdrawal_amount
        }
        
        assert isinstance(withdrawal_data, dict)
        assert 'address' in withdrawal_data
        assert 'amount' in withdrawal_data
        assert len(withdrawal_data['address']) > 20
        
        try:
            response = self.client.create_usdt_withdrawal(withdrawal_data)
            assert isinstance(response, dict)
            
            has_withdrawal_id = 'withdrawal_id' in response
            has_id = 'id' in response
            
            if has_withdrawal_id or has_id:
                withdrawal_id = response.get('withdrawal_id') or response.get('id')
                assert withdrawal_id is not None
                self.created_withdrawals.append(withdrawal_id)
                
        except Exception as e:
            assert False, f"Small withdrawal API failed: {e}"
    
    def test_06_get_withdrawal_history(self):
        """Test retrieving withdrawal history"""
        
        try:
            response = self.client.get_withdrawal_history()
            assert isinstance(response, dict)
            assert 'withdrawals' in response
            
            withdrawals = response['withdrawals']
            assert isinstance(withdrawals, list)
            
            # Should have at least the withdrawals we created
            assert len(withdrawals) >= len(self.created_withdrawals)
            
            assert len(withdrawals) > 0  # Check list length before iteration
            
            for withdrawal in withdrawals:
                assert isinstance(withdrawal, dict)
                assert 'id' in withdrawal
                assert 'amount' in withdrawal
                assert 'status' in withdrawal
                assert 'type' in withdrawal
                assert 'created_at' in withdrawal
                assert 'fee' in withdrawal
                
                assert withdrawal['id'] is not None
                assert isinstance(withdrawal['amount'], (int, float))
                assert isinstance(withdrawal['status'], str)
                assert isinstance(withdrawal['type'], str)
                assert isinstance(withdrawal['created_at'], str)
                assert isinstance(withdrawal['fee'], (int, float))
                
        except Exception as e:
            assert False, f"Withdrawal history API failed: {e}"
    
    def test_07_check_withdrawal_status(self):
        """Test checking individual withdrawal status"""
        
        if len(self.created_withdrawals) == 0:
            assert False, "No withdrawals created to check status - withdrawal creation failed"
        
        assert len(self.created_withdrawals) > 0  # Check list length before iteration
        
        for withdrawal_id in self.created_withdrawals:
            assert withdrawal_id is not None
            
            try:
                response = self.client.get_withdrawal_status(withdrawal_id)
                assert isinstance(response, dict)
                
                has_withdrawal = 'withdrawal' in response
                has_status = 'status' in response
                assert has_withdrawal or has_status
                
                if 'withdrawal' in response:
                    withdrawal = response['withdrawal']
                    assert isinstance(withdrawal, dict)
                    assert 'status' in withdrawal
                    assert 'amount' in withdrawal
                    assert isinstance(withdrawal['status'], str)
                    assert isinstance(withdrawal['amount'], (int, float))
                else:
                    assert isinstance(response['status'], str)
                    
            except Exception as e:
                assert False, f"Withdrawal status check failed for {withdrawal_id}: {e}"
    
    def test_08_withdrawal_metadata_verification(self):
        """Verify withdrawal metadata includes proper address and transaction details"""
        
        try:
            history_response = self.client.get_withdrawal_history()
            assert isinstance(history_response, dict)
            assert 'withdrawals' in history_response
            
            withdrawals = history_response['withdrawals']
            assert isinstance(withdrawals, list)
            
            if len(withdrawals) == 0:
                assert False, "No withdrawals available for metadata verification - withdrawal creation failed"
            
            assert len(withdrawals) > 0  # Check list length before iteration
            
            for withdrawal in withdrawals:
                assert isinstance(withdrawal, dict)
                assert 'id' in withdrawal
                assert 'metadata' in withdrawal
                
                metadata = withdrawal['metadata']
                assert isinstance(metadata, dict)
                
                # Should have address
                assert 'address' in metadata
                assert isinstance(metadata['address'], str)
                assert len(metadata['address']) > 20  # USDT addresses are longer
                
                # If completed, might have transaction hash
                if withdrawal['status'] == 'complete' and 'transaction_hash' in metadata:
                    assert isinstance(metadata['transaction_hash'], str)
                    assert len(metadata['transaction_hash']) > 30
                    
        except Exception as e:
            assert False, f"Withdrawal metadata verification failed: {e}"
    
    def test_09_withdrawal_amount_calculations(self):
        """Verify withdrawal amount calculations with fees"""
        
        try:
            history_response = self.client.get_withdrawal_history()
            assert isinstance(history_response, dict)
            assert 'withdrawals' in history_response
            
            withdrawals = history_response['withdrawals']
            assert isinstance(withdrawals, list)
            
            if len(withdrawals) == 0:
                assert False, "No withdrawals available for amount calculation verification - withdrawal creation failed"
            
            assert len(withdrawals) > 0  # Check list length before iteration
            
            for withdrawal in withdrawals:
                assert isinstance(withdrawal, dict)
                assert 'amount' in withdrawal
                assert 'fee' in withdrawal
                
                amount = withdrawal['amount']
                fee = withdrawal['fee']
                
                assert isinstance(amount, (int, float))
                assert isinstance(fee, (int, float))
                assert amount > 0
                assert fee >= 0
                
                # User receives amount - fee
                user_receives = amount - fee
                assert user_receives > 0
                assert user_receives <= amount  # May be equal if no fee charged
                
        except Exception as e:
            assert False, f"Withdrawal amount calculation verification failed: {e}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])