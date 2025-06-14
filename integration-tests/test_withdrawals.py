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
        cls.username = f"{TEST_USER_PREFIX}withdraw_{cls.test_id}"
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
        print(f"Setting up user for withdrawal testing: {self.username}")
        
        # Register and login user
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        assert 'success' in response or 'user' in response or 'id' in response
        
        login_response = self.client.login_user(self.email, self.password)
        assert 'token' in login_response
        assert 'user' in login_response
        self.user_id = login_response['user']['_id']
        
        print(f"✓ User setup complete: {self.username}")
        
        # Check initial balance
        balance_response = self.client.get_balance()
        initial_balance = balance_response.get('balance', {}).get('usd', 0)
        print(f"✓ Initial balance: ${initial_balance} USD")
    
    def test_02_create_earnings_simulation(self):
        """Create a sale to simulate earnings that can be withdrawn"""
        print("Simulating earnings through a completed sale")
        
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
        assert 'searchable_id' in searchable_response
        searchable_id = searchable_response['searchable_id']
        
        # Create a second user to buy from this user
        buyer_client = SearchableAPIClient()
        buyer_username = f"{TEST_USER_PREFIX}buyer_for_withdraw_{self.test_id}"
        buyer_email = f"{buyer_username}@{TEST_EMAIL_DOMAIN}"
        
        # Register buyer
        buyer_response = buyer_client.register_user(
            username=buyer_username,
            email=buyer_email,
            password=self.password
        )
        assert 'success' in buyer_response or 'user' in buyer_response
        
        # Login buyer
        buyer_login = buyer_client.login_user(buyer_email, self.password)
        assert 'token' in buyer_login
        
        # Buyer creates invoice
        invoice_data = {
            'searchable_id': searchable_id,
            'currency': 'usd',
            'selections': [
                {
                    'id': 'test-file-id',
                    'type': 'downloadable',
                    'name': 'Test File',
                    'price': 100.00
                }
            ]
        }
        
        invoice_response = buyer_client.create_invoice(invoice_data)
        assert 'invoice_id' in invoice_response
        
        # Complete payment
        session_id = invoice_response.get('session_id')
        if session_id:
            payment_response = buyer_client.complete_payment_directly(session_id)
        else:
            payment_response = {'success': False, 'message': 'No session_id found'}
        assert payment_response['success']
        
        # Check seller's balance after sale
        time.sleep(2)  # Allow time for payment processing
        balance_response = self.client.get_balance()
        new_balance = balance_response.get('balance', {}).get('usd', 0)
        
        print(f"✓ Balance after sale: ${new_balance} USD")
        assert new_balance > 90  # Should have ~$99.90 after platform fee (0.1%)
        
        self.available_balance = new_balance
        
        # Cleanup buyer client
        buyer_client.logout()
    
    def test_03_attempt_withdrawal_exceeding_balance(self):
        """Test withdrawal attempt that exceeds available balance"""
        print("Testing withdrawal attempt exceeding balance")
        
        # Try to withdraw more than available balance
        excessive_amount = self.available_balance + 50.00
        
        withdrawal_data = {
            'address': '0x742E96Ac4fF1234A3b8DcE9B7B5678901234567F',  # Test USDT address
            'amount': excessive_amount
        }
        
        try:
            response = self.client.create_usdt_withdrawal(withdrawal_data)
            # Should fail
            assert False, "Withdrawal should have failed for excessive amount"
        except Exception as e:
            # Expected to fail
            print(f"✓ Withdrawal correctly failed for excessive amount: {excessive_amount}")
            assert "insufficient" in str(e).lower() or "balance" in str(e).lower()
    
    def test_04_create_valid_usdt_withdrawal(self):
        """Test creating a valid USD withdrawal as USDT"""
        print("Creating valid USDT withdrawal")
        
        withdrawal_amount = 50.00  # Withdraw $50
        
        withdrawal_data = {
            'address': '0x742E96Ac4fF1234A3b8DcE9B7B5678901234567F',
            'amount': withdrawal_amount
        }
        
        response = self.client.create_usdt_withdrawal(withdrawal_data)
        
        # Verify withdrawal was created
        assert 'withdrawal_id' in response or 'id' in response
        assert 'success' in response and response['success']
        
        withdrawal_id = response.get('withdrawal_id') or response.get('id')
        self.created_withdrawals.append(withdrawal_id)
        
        print(f"✓ USDT withdrawal created: ID {withdrawal_id}, Amount: ${withdrawal_amount}")
        
        # Verify balance was deducted
        balance_response = self.client.get_balance()
        updated_balance = balance_response.get('balance', {}).get('usd', 0)
        
        expected_balance = self.available_balance - withdrawal_amount - (withdrawal_amount * 0.001)  # Minus platform fee
        print(f"✓ Balance after withdrawal: ${updated_balance} USD (expected ~${expected_balance:.2f})")
        
        # Allow some tolerance for fee calculations
        assert abs(updated_balance - expected_balance) < 1.0
    
    def test_05_create_small_withdrawal(self):
        """Test creating a smaller withdrawal to verify fee calculation"""
        print("Creating smaller withdrawal to test fee calculation")
        
        withdrawal_amount = 10.00  # Withdraw $10
        
        withdrawal_data = {
            'address': '0x123ABC456DEF789GHI012JKL345MNO678PQR901S',
            'amount': withdrawal_amount
        }
        
        response = self.client.create_usdt_withdrawal(withdrawal_data)
        assert 'withdrawal_id' in response or 'id' in response
        assert 'success' in response and response['success']
        
        withdrawal_id = response.get('withdrawal_id') or response.get('id')
        self.created_withdrawals.append(withdrawal_id)
        
        print(f"✓ Small USDT withdrawal created: ID {withdrawal_id}, Amount: ${withdrawal_amount}")
    
    def test_06_get_withdrawal_history(self):
        """Test retrieving withdrawal history"""
        print("Retrieving withdrawal history")
        
        response = self.client.get_withdrawal_history()
        
        assert 'withdrawals' in response
        withdrawals = response['withdrawals']
        
        # Should have at least the withdrawals we created
        assert len(withdrawals) >= len(self.created_withdrawals)
        
        for withdrawal in withdrawals:
            assert 'id' in withdrawal
            assert 'amount' in withdrawal
            assert 'status' in withdrawal
            assert 'type' in withdrawal
            assert 'created_at' in withdrawal
            assert 'fee' in withdrawal
            
            # Verify fee calculation (0.1% of amount)
            expected_fee = withdrawal['amount'] * 0.001
            assert abs(withdrawal['fee'] - expected_fee) < 0.01
            
            print(f"✓ Withdrawal {withdrawal['id']}: ${withdrawal['amount']} USD, "
                  f"Fee: ${withdrawal['fee']}, Status: {withdrawal['status']}")
        
        print(f"✓ Retrieved {len(withdrawals)} withdrawals in history")
    
    def test_07_check_withdrawal_status(self):
        """Test checking individual withdrawal status"""
        print("Checking withdrawal status for created withdrawals")
        
        for withdrawal_id in self.created_withdrawals:
            response = self.client.get_withdrawal_status(withdrawal_id)
            
            assert 'withdrawal' in response or 'status' in response
            
            if 'withdrawal' in response:
                withdrawal = response['withdrawal']
                assert 'status' in withdrawal
                assert 'amount' in withdrawal
                print(f"✓ Withdrawal {withdrawal_id} status: {withdrawal['status']}")
            else:
                print(f"✓ Withdrawal {withdrawal_id} status: {response['status']}")
    
    def test_08_withdrawal_metadata_verification(self):
        """Verify withdrawal metadata includes proper address and transaction details"""
        print("Verifying withdrawal metadata")
        
        history_response = self.client.get_withdrawal_history()
        withdrawals = history_response['withdrawals']
        
        for withdrawal in withdrawals:
            assert 'metadata' in withdrawal
            metadata = withdrawal['metadata']
            
            # Should have address
            assert 'address' in metadata
            assert len(metadata['address']) > 20  # USDT addresses are longer
            
            print(f"✓ Withdrawal {withdrawal['id']} has address: {metadata['address'][:10]}...")
            
            # If completed, might have transaction hash
            if withdrawal['status'] == 'complete' and 'transaction_hash' in metadata:
                assert len(metadata['transaction_hash']) > 30
                print(f"  ✓ Has transaction hash: {metadata['transaction_hash'][:10]}...")
    
    def test_09_withdrawal_amount_calculations(self):
        """Verify withdrawal amount calculations with fees"""
        print("Verifying withdrawal fee calculations")
        
        history_response = self.client.get_withdrawal_history()
        withdrawals = history_response['withdrawals']
        
        for withdrawal in withdrawals:
            amount = withdrawal['amount']
            fee = withdrawal['fee']
            
            # Platform fee should be 0.1% of amount
            expected_fee = amount * 0.001
            assert abs(fee - expected_fee) < 0.01
            
            # User receives amount - fee
            user_receives = amount - fee
            
            print(f"✓ Withdrawal ${amount} - Fee ${fee:.3f} = User receives ${user_receives:.3f}")
            
            assert user_receives > 0
            assert user_receives < amount


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])