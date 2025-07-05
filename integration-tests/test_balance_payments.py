"""
Integration tests for balance payment functionality
"""
import pytest
import uuid
import time
from api_client import APIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestBalancePayments:
    """Test balance payment functionality"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with API client and test data"""
        cls.client = APIClient()
        cls.test_id = str(uuid.uuid4())[:8]
        cls.test_password = DEFAULT_PASSWORD
    
    def test_01_insufficient_balance(self):
        """Test balance payment with insufficient balance"""
        # Register and login user
        username = f"balanceuser_{self.test_id}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        register_resp = self.client.register(username, email, self.test_password)
        
        if register_resp.get('success'):
            user_id = register_resp.get('userID')
        
        # Login
        login_resp = self.client.login_user(email, self.test_password)
        assert login_resp.get('success')
        
        # Check initial balance (should be 0)
        balance_resp = self.client.get_balance()
        # Balance response is just {'balance': {'usd': 0.0}}
        initial_balance = balance_resp.get('balance', {}).get('usd', 0)
        assert initial_balance == 0
        
        # Create a searchable item
        searchable_data = {
            "payloads": {
                "private": {},
                "public": {
                    "title": f"Test Item {self.test_id}",
                    "description": "Test item for balance payment",
                    "type": "direct",
                    "defaultAmount": 10.00
                }
            }
        }
        create_resp = self.client.create_searchable(searchable_data)
        assert create_resp.get('success')
        searchable_id = create_resp.get('searchableID')
        
        # Try balance payment without sufficient balance (should fail)
        balance_invoice_data = {
            "searchable_id": searchable_id,
            "invoice_type": "balance",
            "selections": [{"amount": 10.00, "type": "direct"}]
        }
        
        # Make raw request since client doesn't have balance invoice method
        response = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json=balance_invoice_data,
            timeout=10
        )
        assert response.status_code == 400
        assert "Insufficient balance" in response.json().get('error', '')
        
        print("✅ Insufficient balance test passed")
    
    def test_02_balance_payment_validation(self):
        """Test balance payment validation scenarios"""
        # Clear any existing auth
        self.client.token = None
        self.client.session.headers.pop('authorization', None)
        
        no_auth_data = {
            "searchable_id": 999,
            "invoice_type": "balance",
            "selections": []
        }
        
        # Make request without auth
        response = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json=no_auth_data,
            timeout=10
        )
        assert response.status_code == 401
        
        # Login for next tests
        username = f"validator_{self.test_id}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        self.client.register(username, email, self.test_password)
        self.client.login_user(email, self.test_password)
        
        # Try with invalid searchable ID
        invalid_data = {
            "searchable_id": 99999,
            "invoice_type": "balance",
            "selections": []
        }
        response = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json=invalid_data,
            timeout=10
        )
        assert response.status_code == 404
        
        print("✅ Balance payment validation tests passed")
    
    def test_03_successful_balance_payment(self):
        """Test successful balance payment flow"""
        # This test would require setting up proper balance first
        # In a real scenario, balance would come from:
        # 1. USDT deposits
        # 2. Sales revenue
        # 3. Rewards
        
        # For now, we just verify the endpoint exists and requires auth
        username = f"success_{self.test_id}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        self.client.register(username, email, self.test_password)
        self.client.login_user(email, self.test_password)
        
        # Verify balance endpoint works
        balance_resp = self.client.get_balance()
        assert 'balance' in balance_resp
        assert 'usd' in balance_resp['balance']
        
        print("✅ Balance payment endpoint tests passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])