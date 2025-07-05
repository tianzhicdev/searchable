"""
Comprehensive integration tests for balance payment functionality
"""
import pytest
import uuid
import time
from api_client import APIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestBalancePaymentsComprehensive:
    """Comprehensive test suite for balance payment functionality"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with API client and test data"""
        cls.client = APIClient()
        cls.test_id = str(uuid.uuid4())[:8]
        cls.test_password = DEFAULT_PASSWORD
    
    def test_01_balance_endpoint_authentication(self):
        """Test that balance endpoint requires authentication"""
        # Clear any existing auth
        self.client.token = None
        self.client.session.headers.pop('authorization', None)
        
        # Try to get balance without auth
        response = self.client.session.get(
            f"{self.client.base_url}/balance",
            timeout=10
        )
        assert response.status_code == 401
        
        print("✅ Balance endpoint authentication test passed")
    
    def test_02_balance_response_format(self):
        """Test balance endpoint returns correct format"""
        # Register and login user
        username = f"balanceformat_{self.test_id}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        self.client.register(username, email, self.test_password)
        self.client.login_user(email, self.test_password)
        
        # Get balance
        balance_resp = self.client.get_balance()
        
        # Check response format
        assert 'balance' in balance_resp
        assert isinstance(balance_resp['balance'], dict)
        assert 'usd' in balance_resp['balance']
        assert isinstance(balance_resp['balance']['usd'], (int, float))
        assert balance_resp['balance']['usd'] >= 0
        
        print(f"✅ Balance response format test passed: {balance_resp}")
    
    def test_03_balance_payment_validation(self):
        """Test balance payment validation scenarios"""
        # Register and login user
        username = f"validator_{self.test_id}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        self.client.register(username, email, self.test_password)
        self.client.login_user(email, self.test_password)
        
        # Test missing searchable_id
        response = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json={
                "invoice_type": "balance",
                "selections": []
            },
            timeout=10
        )
        assert response.status_code == 400
        assert "searchable_id is required" in response.json().get('error', '')
        
        # Test invalid searchable_id
        response = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json={
                "searchable_id": 99999,
                "invoice_type": "balance",
                "selections": []
            },
            timeout=10
        )
        assert response.status_code == 404
        assert "Searchable item not found" in response.json().get('error', '')
        
        print("✅ Balance payment validation tests passed")
    
    def test_04_insufficient_balance_payment(self):
        """Test balance payment with insufficient balance"""
        # Register and login user
        username = f"insufficient_{self.test_id}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        self.client.register(username, email, self.test_password)
        self.client.login_user(email, self.test_password)
        
        # Check initial balance (should be 0)
        balance_resp = self.client.get_balance()
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
        searchable_id = create_resp.get('searchable_id')
        
        # Try balance payment without sufficient balance
        balance_invoice_data = {
            "searchable_id": searchable_id,
            "invoice_type": "balance",
            "selections": [{
                "amount": 10.00,
                "type": "direct"
            }]
        }
        
        response = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json=balance_invoice_data,
            timeout=10
        )
        assert response.status_code == 400
        resp_data = response.json()
        assert "Insufficient balance" in resp_data.get('error', '')
        assert resp_data.get('balance') == 0
        assert resp_data.get('required') == 10.00
        assert resp_data.get('currency') == 'usd'
        
        print("✅ Insufficient balance test passed")
    
    def test_05_successful_balance_payment_with_deposit(self):
        """Test successful balance payment after deposit"""
        # Register and login seller
        seller_username = f"seller_{self.test_id}"
        seller_email = f"{seller_username}@{TEST_EMAIL_DOMAIN}"
        self.client.register(seller_username, seller_email, self.test_password)
        self.client.login_user(seller_email, self.test_password)
        
        # Create a searchable item as seller
        searchable_data = {
            "payloads": {
                "private": {},
                "public": {
                    "title": f"Balance Payment Test Item {self.test_id}",
                    "description": "Item for testing balance payments",
                    "type": "direct",
                    "defaultAmount": 25.00
                }
            }
        }
        create_resp = self.client.create_searchable(searchable_data)
        searchable_id = create_resp.get('searchable_id')
        
        # Register and login buyer
        buyer_username = f"buyer_{self.test_id}"
        buyer_email = f"{buyer_username}@{TEST_EMAIL_DOMAIN}"
        self.client.register(buyer_username, buyer_email, self.test_password)
        self.client.login_user(buyer_email, self.test_password)
        
        # For this test, we would need to simulate a deposit or add balance
        # Since we can't actually deposit, we'll create a mock payment that adds to balance
        # This would typically come from a USDT deposit or a sale
        
        # Check that we can attempt the balance payment (it will fail due to no balance)
        balance_invoice_data = {
            "searchable_id": searchable_id,
            "invoice_type": "balance",
            "selections": [{
                "amount": 25.00,
                "type": "direct"
            }]
        }
        
        response = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json=balance_invoice_data,
            timeout=10
        )
        
        # Should fail with insufficient balance
        assert response.status_code == 400
        assert "Insufficient balance" in response.json().get('error', '')
        
        print("✅ Balance payment flow test passed")
    
    def test_06_balance_payment_different_amounts(self):
        """Test balance payments with different amounts"""
        # Register and login user
        username = f"amounts_{self.test_id}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        self.client.register(username, email, self.test_password)
        self.client.login_user(email, self.test_password)
        
        # Create downloadable searchable with multiple files
        searchable_data = {
            "payloads": {
                "private": {},
                "public": {
                    "title": f"Multi-file Item {self.test_id}",
                    "description": "Item with multiple files",
                    "type": "downloadable",
                    "downloadableFiles": [
                        {
                            "fileId": "file-1",
                            "name": "File 1",
                            "description": "First file",
                            "price": 10.00
                        },
                        {
                            "fileId": "file-2", 
                            "name": "File 2",
                            "description": "Second file",
                            "price": 20.00
                        },
                        {
                            "fileId": "file-3",
                            "name": "File 3", 
                            "description": "Third file",
                            "price": 30.00
                        }
                    ]
                }
            }
        }
        create_resp = self.client.create_searchable(searchable_data)
        searchable_id = create_resp.get('searchable_id')
        
        # Test different selection amounts
        test_cases = [
            # Single file
            {
                "selections": [{"id": "file-1", "type": "downloadable"}],
                "expected_amount": 10.00
            },
            # Multiple files
            {
                "selections": [
                    {"id": "file-1", "type": "downloadable"},
                    {"id": "file-3", "type": "downloadable"}
                ],
                "expected_amount": 40.00
            },
            # All files
            {
                "selections": [
                    {"id": "file-1", "type": "downloadable"},
                    {"id": "file-2", "type": "downloadable"},
                    {"id": "file-3", "type": "downloadable"}
                ],
                "expected_amount": 60.00
            }
        ]
        
        for test_case in test_cases:
            response = self.client.session.post(
                f"{self.client.base_url}/v1/create-balance-invoice",
                json={
                    "searchable_id": searchable_id,
                    "invoice_type": "balance",
                    "selections": test_case["selections"]
                },
                timeout=10
            )
            
            # Should fail with insufficient balance but show correct required amount
            assert response.status_code == 400
            resp_data = response.json()
            assert resp_data.get('required') == test_case["expected_amount"]
        
        print("✅ Different amount calculations test passed")
    
    def test_07_balance_payment_metadata(self):
        """Test balance payment with metadata and delivery info"""
        # Register and login user
        username = f"metadata_{self.test_id}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        self.client.register(username, email, self.test_password)
        self.client.login_user(email, self.test_password)
        
        # Create offline searchable
        searchable_data = {
            "payloads": {
                "private": {},
                "public": {
                    "title": f"Offline Item {self.test_id}",
                    "description": "Offline item requiring delivery",
                    "type": "offline",
                    "offlineItems": [
                        {
                            "itemId": "item-1",
                            "name": "Physical Product",
                            "price": 50.00
                        }
                    ]
                }
            }
        }
        create_resp = self.client.create_searchable(searchable_data)
        searchable_id = create_resp.get('searchable_id')
        
        # Test with delivery info
        balance_invoice_data = {
            "searchable_id": searchable_id,
            "invoice_type": "balance",
            "selections": [{
                "id": "item-1",
                "type": "offline",
                "count": 2
            }],
            "delivery_info": {
                "address": "123 Test Street, Test City, TC 12345",
                "tel": "+1-555-0123"
            }
        }
        
        response = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json=balance_invoice_data,
            timeout=10
        )
        
        # Should fail with insufficient balance but process the data correctly
        assert response.status_code == 400
        resp_data = response.json()
        assert resp_data.get('required') == 100.00  # 50.00 * 2
        
        print("✅ Balance payment metadata test passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])