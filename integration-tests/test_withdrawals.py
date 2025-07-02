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
        cls.address_1 = "0x2a9f6e28Ee3501C32c65937170B44a72A71baB62"
        cls.address_2 = "0xB1Eb9593ed5C832e6f618c60CDc6017b0eE28563"
        cls.address_3 = "0xa2Aa1cb3DF3913aa0DC3D2C7278446d2B055F9E4"
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        if cls.client.token:
            cls.client.logout()
    
    def wait_for_withdrawal_completion(self, withdrawal_id, max_wait_seconds=300):
        """
        Wait for a withdrawal to complete (status changes from pending to complete or failed)
        Returns the final withdrawal status
        """
        import time
        
        start_time = time.time()
        while time.time() - start_time < max_wait_seconds:
            try:
                response = self.client.get_withdrawal_status(withdrawal_id)
                print(f"[RESPONSE] Withdrawal status check: {response}")
                if 'withdrawal' in response:
                    withdrawal = response['withdrawal']
                    status = withdrawal.get('status', 'unknown')
                    
                    print(f"[DEBUG] Withdrawal {withdrawal_id} status: {status}")
                    
                    if status == 'complete':
                        return withdrawal
                    elif status == 'failed':
                        # Return the failed withdrawal for analysis
                        print(f"[DEBUG] Withdrawal {withdrawal_id} failed: {withdrawal.get('metadata', {}).get('error', 'Unknown error')}")
                        return withdrawal
                    elif status == 'pending':
                        # Still pending, wait a bit more
                        time.sleep(2)
                        continue
                    else:
                        pytest.fail(f"Unknown withdrawal status: {status}")
                else:
                    pytest.fail(f"Invalid response from withdrawal status API: {response}")
                    
            except Exception as e:
                print(f"[DEBUG] Error checking withdrawal status: {e}")
                time.sleep(2)
                continue
        
        # If we get here, we timed out
        pytest.fail(f"Withdrawal {withdrawal_id} did not complete within {max_wait_seconds} seconds")
    
    def test_01_setup_user_with_balance(self):
        """Register user and simulate having balance through sales"""
        
        # Register and login user
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        print(f"[RESPONSE] Register user: {response}")
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        
        login_response = self.client.login_user(self.email, self.password)
        print(f"[RESPONSE] Login user: {login_response}")
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
        print(f"[RESPONSE] Initial balance: {balance_response}")
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        assert isinstance(balance_response['balance'], dict)
        initial_balance = balance_response.get('balance').get('usd', 0)
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
        print(f"[RESPONSE] Create searchable: {searchable_response}")
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
        print(f"[RESPONSE] Register buyer: {buyer_response}")
        assert isinstance(buyer_response, dict)
        assert 'success' in buyer_response
        assert buyer_response['success'] is True
        
        # Login buyer
        buyer_login = buyer_client.login_user(buyer_email, self.password)
        print(f"[RESPONSE] Login buyer: {buyer_login}")
        assert isinstance(buyer_login, dict)
        assert 'token' in buyer_login
        assert isinstance(buyer_login['token'], str)
        assert len(buyer_login['token']) > 0
        
        # Buyer creates invoice - use proper API format
        searchable_info = self.client.get_searchable(searchable_id)
        print(f"[RESPONSE] Get searchable: {searchable_info}")
        assert isinstance(searchable_info, dict)
        assert 'payloads' in searchable_info
        assert 'public' in searchable_info['payloads']
        
        public_data = searchable_info['payloads']['public']
        assert isinstance(public_data, dict)
        
        selections = [{'id': 'test-file-id', 'type': 'downloadable', 'name': 'Test File', 'price': 100.00}]

        invoice_response = buyer_client.create_invoice(
            searchable_id,
            selections,
            "stripe"
        )
        print(f"[RESPONSE] Create invoice: {invoice_response}")
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
        
        print(f"[RESPONSE] Complete payment: {payment_response}")
        assert isinstance(payment_response, dict)
        assert 'success' in payment_response
        assert payment_response['success'] is True
        
        # Check seller's balance after sale
        time.sleep(2)  # Allow time for payment processing
        balance_response = self.client.get_balance()
        print(f"[RESPONSE] Balance after sale: {balance_response}")
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        assert isinstance(balance_response['balance'], dict)
        
        new_balance = balance_response.get('balance').get('usd')
        assert new_balance == 99.9  # Should have ~$99.90 after platform fee (0.1%)
        
        self.available_balance = new_balance
        
        # Cleanup buyer client
        buyer_client.logout()
    
    def test_03_attempt_withdrawal_exceeding_balance(self):
        """Test withdrawal attempt that exceeds available balance"""
        
        # Try to withdraw more than available balance
        # Get current balance first
        balance_response = self.client.get_balance()
        print(f"[RESPONSE] Current balance check: {balance_response}")
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        assert isinstance(balance_response['balance'], dict)
        
        current_balance = balance_response.get('balance').get('usd')
        excessive_amount = current_balance + 50.00
        print(f"[DEBUG] Current balance: {current_balance}, Excessive amount: {excessive_amount}")
        assert excessive_amount > current_balance
        
        withdrawal_data = {
            'address': self.address_1,  # Test USDT address
            'amount': excessive_amount
        }
        
        assert isinstance(withdrawal_data, dict)
        assert 'address' in withdrawal_data
        assert 'amount' in withdrawal_data
        assert len(withdrawal_data['address']) > 20
        
        # This should return a 400 error for insufficient funds
        try:
            response = self.client.create_usdt_withdrawal(withdrawal_data)
            print(f"[RESPONSE] Excessive withdrawal attempt: {response}")
            # If we get a response, it should be an error
            if isinstance(response, dict) and 'error' in response:
                # This is expected - insufficient funds error
                print(f"[DEBUG] Expected error response: {response}")
            else:
                pytest.fail(f"Expected error response for excessive withdrawal, got: {response}")
        except Exception as e:
            # Check if it's a 400 HTTP error as expected
            error_msg = str(e).lower()
            if '400' in error_msg or 'insufficient' in error_msg or 'balance' in error_msg:
                print(f"[DEBUG] Expected 400 error for excessive withdrawal: {e}")
            else:
                pytest.fail(f"Expected 400 error for excessive withdrawal, got: {e}")
    
    def test_04_create_valid_usdt_withdrawal(self):
        """Test creating a valid USD withdrawal as USDT"""
        
        withdrawal_amount = 50.00  # Withdraw $50
        assert isinstance(withdrawal_amount, (int, float))
        assert withdrawal_amount > 0
        
        withdrawal_data = {
            'address': self.address_1,
            'amount': withdrawal_amount
        }
        
        assert isinstance(withdrawal_data, dict)
        assert 'address' in withdrawal_data
        assert 'amount' in withdrawal_data
        assert len(withdrawal_data['address']) > 20
        
        try:
            response = self.client.create_usdt_withdrawal(withdrawal_data)
            print(f"[RESPONSE] Create valid withdrawal: {response}")
            assert isinstance(response, dict)
            assert response['success'] is True
            assert response['msg'] == 'Withdrawal request submitted successfully'
            assert 'withdrawal_id' in response
            assert isinstance(response['withdrawal_id'], int)
            assert response['withdrawal_id'] > 0
            assert response['amount'] == 50.0
            assert response['fee'] == 0.05
            assert response['amount_after_fee'] == 49.95
            
            withdrawal_id = response['withdrawal_id']
                
        except Exception as e:
            pytest.fail(f"Withdrawal API failed: {e}")
        
        # Verify balance was deducted
        balance_response = self.client.get_balance()
        print(f"[RESPONSE] Balance after withdrawal: {balance_response}")
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        assert isinstance(balance_response['balance'], dict)
        assert 'usd' in balance_response['balance']
        
        new_balance = balance_response['balance']['usd']
        # 99.9 - 50 = 49.9 (allowing for floating point precision)
        assert abs(new_balance - 49.9) < 0.000001 
    
    def test_05_create_small_withdrawal(self):
        """Test creating a smaller withdrawal to verify fee calculation"""
        
        withdrawal_amount = 10.00  # Withdraw $10

        withdrawal_data = {
            'address': self.address_2,  # Another USDT address
            'amount': withdrawal_amount
        }
        
        try:
            response = self.client.create_usdt_withdrawal(withdrawal_data)
            print(f"[RESPONSE] Small withdrawal response: {response}")
            assert isinstance(response, dict)
            
            assert 'withdrawal_id' in response, "Response should contain withdrawal_id"

            withdrawal_id = response.get('withdrawal_id')
            assert withdrawal_id is not None
            assert response.get('amount') == 10
            assert response.get('fee') == 0.01
            assert response.get('amount_after_fee') == 9.99
            self.created_withdrawals.append(withdrawal_id)
            
            balance_response = self.client.get_balance()
            print(f"[RESPONSE] Balance after small withdrawal: {balance_response}")
            new_balance = balance_response.get('balance').get('usd')
            # Use approximate comparison for floating point
            assert abs(new_balance - 39.9) < 0.01, f"Expected balance ~39.9, got {new_balance}" 
                
        except Exception as e:
            pytest.fail(f"Small withdrawal API failed: {e}")
    
    def test_06_get_withdrawal_history(self):
        """Test retrieving withdrawal history"""
        
        try:
            response = self.client.get_withdrawal_history()
            print(f"[RESPONSE] Withdrawal history: {response}")
            assert isinstance(response, dict)
            assert 'withdrawals' in response
            
            withdrawals = response['withdrawals']
            assert isinstance(withdrawals, list)
            
            # Should have at least the withdrawals we created
            assert len(withdrawals) >= len(self.created_withdrawals)
            
            assert len(withdrawals) > 0  # Check list length before iteration
            
            # Find withdrawals by address
            withdrawal_by_address = {w['metadata']['address']: w for w in withdrawals if 'metadata' in w and 'address' in w['metadata']}
            
            # Check withdrawal for address_1 ($50)
            w1 = withdrawal_by_address.get(self.address_1)
            assert w1 is not None, f"No withdrawal found for address_1: {self.address_1}"
            assert w1['amount'] == 50.0
            assert w1['fee'] == 0.05
            assert w1['currency'] == 'usd'
            assert w1['type'] == 'bank_transfer'
            assert w1['status'] == 'pending'
            assert w1['user_id'] == w1['user_id']  # Verify it's a valid user_id (integer)
            assert isinstance(w1['user_id'], int)
            assert w1['external_id'].startswith(f'usd-{w1["user_id"]}-')
            assert w1['metadata']['original_amount'] == 50.0
            assert w1['metadata']['fee_percentage'] == 0.1
            assert w1['metadata']['amount_after_fee'] == 49.95
            assert w1['metadata']['address'] == self.address_1
            # Verify timestamp is recent (within last hour)
            import time
            current_time = int(time.time())
            assert abs(current_time - w1['metadata']['timestamp']) < 3600

            # Check withdrawal for address_2 ($10)
            w2 = withdrawal_by_address.get(self.address_2)
            assert w2 is not None, f"No withdrawal found for address_2: {self.address_2}"
            assert w2['amount'] == 10.0
            assert w2['fee'] == 0.01
            assert w2['currency'] == 'usd'
            assert w2['type'] == 'bank_transfer'
            assert w2['status'] == 'pending'
            assert w2['user_id'] == w1['user_id']  # Should be same user as w1
            assert isinstance(w2['user_id'], int)
            assert w2['external_id'].startswith(f'usd-{w2["user_id"]}-')
            assert w2['metadata']['original_amount'] == 10.0
            assert w2['metadata']['fee_percentage'] == 0.1
            assert w2['metadata']['amount_after_fee'] == 9.99
            assert w2['metadata']['address'] == self.address_2
            # Verify timestamp is recent (within last hour)
            assert abs(current_time - w2['metadata']['timestamp']) < 3600
                
        except Exception as e:
            pytest.fail(f"Withdrawal history API failed: {e}")
    
    def test_07_check_withdrawal_status(self):
        """Test checking individual withdrawal status and wait for completion"""
        
        if len(self.created_withdrawals) == 0:
            pytest.fail("No withdrawals created to check status - withdrawal creation failed")
        
        assert len(self.created_withdrawals) > 0  # Check list length before iteration
        
        for withdrawal_id in self.created_withdrawals:
            assert withdrawal_id is not None
            
            try:
                # Wait for withdrawal to complete or fail (max 30 seconds)
                final_withdrawal = self.wait_for_withdrawal_completion(withdrawal_id, max_wait_seconds=300)
                
                # Verify the final withdrawal has expected structure and values
                assert isinstance(final_withdrawal, dict)
                assert final_withdrawal['currency'] == 'usd'
                assert final_withdrawal['type'] == 'bank_transfer' 
                assert final_withdrawal['status'] == 'complete'
                
                # Based on the response, we know it should be withdrawal_id 85 (the small $10 withdrawal)
                # Assert specific values from the actual response
                if final_withdrawal['amount'] == 10.0:
                    assert final_withdrawal['fee'] == 0.01
                    assert final_withdrawal['metadata']['original_amount'] == 10.0
                    assert final_withdrawal['metadata']['amount_after_fee'] == 9.99
                    assert final_withdrawal['metadata']['address'] == '0xB1Eb9593ed5C832e6f618c60CDc6017b0eE28563'
                
                assert final_withdrawal['metadata']['fee_percentage'] == 0.1
                
                # Validate transaction hash exists and has correct format
                assert 'tx_hash' in final_withdrawal['metadata']
                assert len(final_withdrawal['metadata']['tx_hash']) == 66
                assert final_withdrawal['metadata']['tx_hash'].startswith('0x')
                
                # Validate timestamps are present
                assert 'timestamp' in final_withdrawal['metadata']
                
                if final_withdrawal['status'] == 'complete':
                    print(f"[DEBUG] Withdrawal {withdrawal_id} completed successfully")
                else:
                    print(f"[DEBUG] Withdrawal {withdrawal_id} failed as expected (likely invalid address)")
                    
            except Exception as e:
                pytest.fail(f"Withdrawal status check failed for {withdrawal_id}: {e}")
    
    def test_08_withdrawal_metadata_verification(self):
        """Verify withdrawal metadata includes proper address and transaction details after completion"""
        
        try:
            # Wait for all withdrawals to complete or fail first
            final_withdrawals = []
            for withdrawal_id in self.created_withdrawals:
                final_withdrawal = self.wait_for_withdrawal_completion(withdrawal_id, max_wait_seconds=300)
                final_withdrawals.append(final_withdrawal)
            
            # Now get fresh withdrawal history to verify metadata
            history_response = self.client.get_withdrawal_history()
            print(f"[RESPONSE] Fresh withdrawal history: {history_response}")
            assert isinstance(history_response, dict)
            assert 'withdrawals' in history_response
            
            withdrawals = history_response['withdrawals']
            assert isinstance(withdrawals, list)
            
            if len(withdrawals) == 0:
                pytest.fail("No withdrawals available for metadata verification - withdrawal creation failed")
            
            assert len(withdrawals) > 0  # Check list length before iteration
            
            # Find our withdrawals in the history
            our_withdrawal_ids = set(self.created_withdrawals)
            
            for withdrawal in withdrawals:
                # Only check withdrawals we created
                if withdrawal['id'] not in our_withdrawal_ids:
                    continue
                    
                # Assert exact values from the response structure we see
                assert withdrawal['currency'] == 'usd'
                assert withdrawal['type'] == 'bank_transfer'
                
                # Check specific withdrawal amounts and fees from the responses
                if withdrawal['amount'] == 10.0:
                    # This is the small withdrawal to address_2
                    assert withdrawal['fee'] == 0.01
                    assert withdrawal['metadata']['original_amount'] == 10.0
                    assert withdrawal['metadata']['amount_after_fee'] == 9.99
                    assert withdrawal['metadata']['address'] == '0xB1Eb9593ed5C832e6f618c60CDc6017b0eE28563'
                elif withdrawal['amount'] == 50.0:
                    # This is the large withdrawal to address_1  
                    assert withdrawal['fee'] == 0.05
                    assert withdrawal['metadata']['original_amount'] == 50.0
                    assert withdrawal['metadata']['amount_after_fee'] == 49.95
                    assert withdrawal['metadata']['address'] == '0x2a9f6e28Ee3501C32c65937170B44a72A71baB62'
                
                # Common metadata validations
                assert withdrawal['metadata']['fee_percentage'] == 0.1
                
                # For completed withdrawals, validate transaction details
                if withdrawal['status'] == 'complete':
                    assert 'tx_hash' in withdrawal['metadata']
                    assert len(withdrawal['metadata']['tx_hash']) == 66
                    assert withdrawal['metadata']['tx_hash'].startswith('0x')
                    print(f"[DEBUG] Withdrawal {withdrawal['id']} has tx_hash: {withdrawal['metadata']['tx_hash']}")
                elif withdrawal['status'] == 'failed':
                    assert 'error' in withdrawal['metadata']
                    print(f"[DEBUG] Withdrawal {withdrawal['id']} failed with error: {withdrawal['metadata'].get('error', 'Unknown')}")
                    
        except Exception as e:
            pytest.fail(f"Withdrawal metadata verification failed: {e}")
    
    def test_09_withdrawal_amount_calculations(self):
        """Verify withdrawal amount calculations with fees"""
        
        try:
            history_response = self.client.get_withdrawal_history()
            print(f"[RESPONSE] Withdrawal history for calculations: {history_response}")
            assert isinstance(history_response, dict)
            assert 'withdrawals' in history_response
            
            withdrawals = history_response['withdrawals']
            assert isinstance(withdrawals, list)
            
            if len(withdrawals) == 0:
                pytest.fail("No withdrawals available for amount calculation verification - withdrawal creation failed")
            
            assert len(withdrawals) > 0  # Check list length before iteration
            
            for withdrawal in withdrawals:
                # Assert specific values based on the actual response data
                assert withdrawal['currency'] == 'usd'
                assert withdrawal['type'] == 'bank_transfer'
                
                # Assert exact amounts and fees from responses
                if withdrawal['amount'] == 10.0:
                    # Small withdrawal response: amount=10.0, fee=0.01, amount_after_fee=9.99
                    assert withdrawal['fee'] == 0.01
                    assert withdrawal['metadata']['original_amount'] == 10.0
                    assert withdrawal['metadata']['amount_after_fee'] == 9.99
                    assert withdrawal['metadata']['address'] == '0xB1Eb9593ed5C832e6f618c60CDc6017b0eE28563'
                elif withdrawal['amount'] == 50.0:
                    # Large withdrawal response: amount=50.0, fee=0.05, amount_after_fee=49.95
                    assert withdrawal['fee'] == 0.05
                    assert withdrawal['metadata']['original_amount'] == 50.0
                    assert withdrawal['metadata']['amount_after_fee'] == 49.95
                    assert withdrawal['metadata']['address'] == '0x2a9f6e28Ee3501C32c65937170B44a72A71baB62'
                
                # Common metadata assertions
                assert withdrawal['metadata']['fee_percentage'] == 0.1
                
                # For completed withdrawals, validate transaction hash format
                if withdrawal['status'] == 'complete':
                    assert len(withdrawal['metadata']['tx_hash']) == 66
                    assert withdrawal['metadata']['tx_hash'].startswith('0x')
                
        except Exception as e:
            pytest.fail(f"Withdrawal amount calculation verification failed: {e}")
    
    def test_10_pending_withdrawal_balance_deduction(self):
        """Test that pending withdrawals are deducted from available balance to prevent double-spending"""
        
        # Get current balance
        balance_response = self.client.get_balance()
        print(f"[RESPONSE] Initial balance for pending test: {balance_response}")
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        initial_balance = balance_response['balance'].get('usd', 0)
        assert isinstance(initial_balance, (int, float))
        
        # Skip test if balance is too low
        if initial_balance < 20:
            pytest.skip(f"Insufficient balance ({initial_balance}) for pending withdrawal test")
        
        # Create a withdrawal that should succeed
        withdrawal_amount = min(10.0, initial_balance - 5)  # Leave some buffer
        withdrawal_data = {
            'address': self.address_3,
            'amount': withdrawal_amount
        }
        
        try:
            # Create first withdrawal
            response1 = self.client.create_usdt_withdrawal(withdrawal_data)
            print(f"[RESPONSE] First pending withdrawal: {response1}")
            assert isinstance(response1, dict)
            assert 'withdrawal_id' in response1 or 'id' in response1
            
            withdrawal_id = response1.get('withdrawal_id') or response1.get('id')
            self.created_withdrawals.append(withdrawal_id)
            
            # Get balance after first withdrawal - it should be reduced
            balance_response_after = self.client.get_balance()
            print(f"[RESPONSE] Balance after pending withdrawal: {balance_response_after}")
            balance_after_first = balance_response_after['balance'].get('usd', 0)
            expected_balance = initial_balance - withdrawal_amount
            
            # Allow for small floating point differences
            assert abs(balance_after_first - expected_balance) < 0.01, \
                f"Balance should be reduced by withdrawal amount. Expected ~{expected_balance}, got {balance_after_first}"
            
            # Try to create another withdrawal for the remaining balance + $1
            # This should fail due to insufficient funds
            excessive_amount = balance_after_first + 1.0
            withdrawal_data_excessive = {
                'address': self.address_3,
                'amount': excessive_amount
            }
            
            # This withdrawal should fail
            try:
                response2 = self.client.create_usdt_withdrawal(withdrawal_data_excessive)
                print(f"[RESPONSE] Excessive withdrawal after pending: {response2}")
                # If we get here, the withdrawal shouldn't have succeeded
                if 'error' not in response2 and 'withdrawal_id' in response2:
                    pytest.fail(f"Excessive withdrawal should have failed but succeeded: {response2}")
            except Exception as e:
                # This is expected - withdrawal should fail due to insufficient funds
                error_msg = str(e).lower()
                assert 'insufficient' in error_msg or 'balance' in error_msg or '400' in error_msg, \
                    f"Expected insufficient funds error, got: {e}"
                
        except Exception as e:
            pytest.fail(f"Pending withdrawal balance test failed: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])