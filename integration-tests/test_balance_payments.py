"""
Integration tests for balance payment functionality
"""
import pytest
import uuid
import time
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, DEFAULT_PASSWORD


class TestBalancePayments:
    """Test balance payment functionality"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with API client and test data"""
        cls.client = SearchableAPIClient()
        cls.test_id = str(uuid.uuid4())[:8]
        cls.test_password = DEFAULT_PASSWORD
    
    def test_01_insufficient_balance(self):
        """Test balance payment with insufficient balance"""
        # Register and login user
        username = f"balanceuser_{self.test_id}"
        self.client.register(username, self.test_password)
        login_resp = self.client.login(username, self.test_password)
        assert login_resp.status_code == 200
        
        # Check initial balance (should be 0)
        balance_resp = self.client.api_request("GET", "/api/balance")
        assert balance_resp.status_code == 200
        initial_balance = balance_resp.json()['usd']
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
        create_resp = self.client.api_request("POST", "/api/v1/publish-searchable", json=searchable_data)
        assert create_resp.status_code == 200
        searchable_id = create_resp.json()['id']
        
        # Try balance payment without sufficient balance (should fail)
        balance_invoice_data = {
            "searchable_id": searchable_id,
            "invoice_type": "balance",
            "selections": [{"amount": 10.00, "type": "direct"}]
        }
        balance_resp = self.client.api_request("POST", "/api/v1/create-balance-invoice", json=balance_invoice_data)
        assert balance_resp.status_code == 400
        assert "Insufficient balance" in balance_resp.json()['error']
        
        print("✅ Insufficient balance test passed")
    
    def test_02_balance_payment_validation(self):
        """Test balance payment validation scenarios"""
        # Try to make balance payment without authentication
        self.client.logout()  # Clear any existing auth
        
        no_auth_data = {
            "searchable_id": 999,
            "invoice_type": "balance",
            "selections": []
        }
        no_auth_resp = self.client.api_request("POST", "/api/v1/create-balance-invoice", json=no_auth_data)
        assert no_auth_resp.status_code == 401
        
        # Login for next tests
        username = f"validator_{self.test_id}"
        self.client.register(username, self.test_password)
        self.client.login(username, self.test_password)
        
        # Try with invalid searchable ID
        invalid_data = {
            "searchable_id": 99999,
            "invoice_type": "balance",
            "selections": []
        }
        invalid_resp = self.client.api_request("POST", "/api/v1/create-balance-invoice", json=invalid_data)
        assert invalid_resp.status_code == 404
        
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
        self.client.register(username, self.test_password)
        self.client.login(username, self.test_password)
        
        # Verify balance endpoint works
        balance_resp = self.client.api_request("GET", "/api/balance")
        assert balance_resp.status_code == 200
        assert 'usd' in balance_resp.json()
        
        print("✅ Balance payment endpoint tests passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])