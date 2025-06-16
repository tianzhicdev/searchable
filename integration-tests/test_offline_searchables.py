import pytest
import uuid
import time
import json
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestOfflineSearchables:
    """Integration tests for offline searchable items"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with API client and test data"""
        cls.client = SearchableAPIClient()
        cls.test_id = str(uuid.uuid4())[:8]  # Short unique ID for this test run
        cls.username = f"{TEST_USER_PREFIX}off_{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        cls.user_token = None
        cls.created_searchable_id = None
        cls.created_invoice = None
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        if cls.client.token:
            cls.client.logout()
    
    def test_01_register_user(self):
        """Test user registration for offline searchable testing"""
        print(f"Testing user registration for offline tests: {self.username}")
        
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        
        # Verify registration response
        assert 'success' in response or 'user' in response or 'id' in response
        print(f"✓ User registration successful: {response}")
    
    def test_02_login_user(self):
        """Test user login and token retrieval"""
        print(f"Testing user login for offline tests: {self.username}")
        
        response = self.client.login_user(
            email=self.email,
            password=self.password
        )
        
        # Verify login response contains token
        assert 'token' in response, f"No token in login response: {response}"
        assert response['token'], "Token is empty"
        
        # Store token for later tests
        self.__class__.user_token = response['token']
        print(f"✓ User login successful, token received")
    
    def test_03_create_offline_searchable(self):
        """Test creating an offline searchable with menu items"""
        print("Testing offline searchable creation...")
        
        assert self.client.token, "No authentication token available"
        
        # Create offline searchable data structure
        searchable_data = {
            "payloads": {
                "public": {
                    "type": "offline",
                    "title": f"Test Coffee Shop {self.test_id}",
                    "description": f"Test coffee shop created during integration testing. ID: {self.test_id}. Offers coffee, pastries, and light meals.",
                    "category": "food_beverage",
                    "currency": "usd",
                    "offlineItems": [
                        {
                            "itemId": f"coffee_1_{self.test_id}",
                            "name": "Espresso",
                            "price": 3.50
                        },
                        {
                            "itemId": f"coffee_2_{self.test_id}",
                            "name": "Cappuccino", 
                            "price": 4.50
                        },
                        {
                            "itemId": f"coffee_3_{self.test_id}",
                            "name": "Latte",
                            "price": 5.00
                        },
                        {
                            "itemId": f"pastry_1_{self.test_id}",
                            "name": "Croissant",
                            "price": 2.50
                        },
                        {
                            "itemId": f"pastry_2_{self.test_id}",
                            "name": "Muffin",
                            "price": 3.00
                        }
                    ]
                },
                "private": {
                    "notes": f"Private notes for test offline item {self.test_id}",
                    "location": "123 Test Street, Integration City"
                }
            }
        }
        
        response = self.client.create_searchable(searchable_data)
        
        # Verify creation response
        assert 'searchable_id' in response, f"No searchable_id in response: {response}"
        assert response['searchable_id'], "Searchable ID is empty"
        
        # Store for retrieval test
        self.__class__.created_searchable_id = response['searchable_id']
        print(f"✓ Offline searchable creation successful, ID: {response['searchable_id']}")
    
    def test_04_retrieve_offline_searchable(self):
        """Test retrieving information about the created offline searchable"""
        print(f"Testing offline searchable retrieval for ID: {self.created_searchable_id}")
        
        assert self.created_searchable_id, "No searchable ID available"
        assert self.client.token, "No authentication token available"
        
        response = self.client.get_searchable(self.created_searchable_id)
        
        # Verify response structure
        assert 'searchable_id' in response, f"No searchable_id in response: {response}"
        assert response['searchable_id'] == self.created_searchable_id
        
        # Verify our test data is present
        assert 'payloads' in response, "No payloads in response"
        assert 'public' in response['payloads'], "No public payload in response"
        
        public_data = response['payloads']['public']
        assert public_data['title'] == f"Test Coffee Shop {self.test_id}"
        assert public_data['type'] == "offline"
        
        # Verify offline items are present
        assert 'offlineItems' in public_data, "No offlineItems in response"
        assert len(public_data['offlineItems']) == 5, "Expected 5 offline items"
        
        # Verify specific items
        item_names = [item['name'] for item in public_data['offlineItems']]
        expected_items = ['Espresso', 'Cappuccino', 'Latte', 'Croissant', 'Muffin']
        for expected_item in expected_items:
            assert expected_item in item_names, f"Expected item '{expected_item}' not found"
        
        print(f"✓ Offline searchable retrieval successful")
        print(f"  Title: {public_data['title']}")
        print(f"  Type: {public_data['type']}")
        print(f"  Items: {len(public_data['offlineItems'])}")
    
    def test_05_create_invoice_with_offline_items(self):
        """Test creating an invoice with offline items including quantities"""
        print("Testing invoice creation with offline items and quantities...")
        
        assert self.created_searchable_id, "No searchable ID available"
        assert self.client.token, "No authentication token available"
        
        # Create invoice with multiple items and quantities
        invoice_data = {
            "searchable_id": self.created_searchable_id,
            "invoice_type": "stripe",
            "selections": [
                {
                    "id": f"coffee_1_{self.test_id}",  # Espresso
                    "count": 2
                },
                {
                    "id": f"coffee_2_{self.test_id}",  # Cappuccino
                    "count": 1
                },
                {
                    "id": f"pastry_1_{self.test_id}",  # Croissant
                    "count": 3
                }
            ]
        }
        
        response = self.client.create_invoice(invoice_data)
        
        # Verify invoice creation response
        assert 'session_id' in response or 'url' in response or 'invoice_id' in response, f"Invalid invoice response: {response}"
        
        # Store invoice for later tests
        self.__class__.created_invoice = response
        print(f"✓ Invoice creation successful with offline items")
        
        # If we have a mock response with redirect URL, follow it for payment simulation
        if 'url' in response and 'payment=success' in response['url']:
            print("✓ Mock payment simulation detected")
            
            # Extract session_id for payment refresh
            session_id = response.get('session_id', 'mock-session-123')
            
            # Simulate payment refresh  
            refresh_response = self.client.refresh_payment_status(session_id)
            print(f"✓ Payment refresh response: {refresh_response}")
    
    def test_06_search_for_offline_item(self):
        """Test searching for the created offline searchable item"""
        print("Testing search for offline searchable...")
        
        assert self.client.token, "No authentication token available"
        
        # Search with a term that should match our item
        search_term = f"Test Coffee Shop {self.test_id}"
        
        response = self.client.search_searchables(query_term=search_term)
        
        # Verify search response
        assert 'results' in response, f"No results in search response: {response}"
        
        # Find our created item in results
        found_item = None
        for item in response['results']:
            if item.get('searchable_id') == self.created_searchable_id:
                found_item = item
                break
        
        assert found_item is not None, f"Created offline item not found in search results"
        assert found_item['payloads']['public']['type'] == 'offline'
        
        print(f"✓ Offline searchable found in search results")
        print(f"  Found item: {found_item['payloads']['public']['title']}")
    
    def test_07_calc_invoice_with_quantities(self):
        """Test invoice calculation with offline items and quantities"""
        print("Testing invoice calculation with quantities...")
        
        assert self.created_searchable_id, "No searchable ID available"
        assert self.client.token, "No authentication token available"
        
        # Get the searchable first to have the correct data structure
        searchable_response = self.client.get_searchable(self.created_searchable_id)
        
        # Test selections with different quantities
        selections = [
            {
                "id": f"coffee_1_{self.test_id}",  # Espresso - $3.50
                "count": 2  # Total: $7.00
            },
            {
                "id": f"coffee_3_{self.test_id}",  # Latte - $5.00
                "count": 1  # Total: $5.00
            },
            {
                "id": f"pastry_2_{self.test_id}",  # Muffin - $3.00
                "count": 4  # Total: $12.00
            }
        ]
        
        # Expected total: $7.00 + $5.00 + $12.00 = $24.00
        expected_total = 24.00
        
        # We'll simulate the calc_invoice function behavior
        # In a real API, this would be a separate endpoint
        total_amount = 0.0
        total_item_count = 0
        
        # Map item IDs to prices from the searchable data
        offline_items = searchable_response['payloads']['public']['offlineItems']
        id_to_price = {item['itemId']: item['price'] for item in offline_items}
        
        for selection in selections:
            item_id = selection['id']
            count = selection['count']
            price = id_to_price.get(item_id, 0)
            total_amount += price * count
            total_item_count += count
        
        # Verify calculations
        assert total_amount == expected_total, f"Expected total ${expected_total}, got ${total_amount}"
        assert total_item_count == 7, f"Expected 7 total items, got {total_item_count}"
        
        print(f"✓ Invoice calculation successful")
        print(f"  Total amount: ${total_amount}")
        print(f"  Total items: {total_item_count}")
        print(f"  Selections: {len(selections)} different items")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])