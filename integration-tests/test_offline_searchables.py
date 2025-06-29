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
        
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        
        # Verify registration response
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
    
    def test_02_login_user(self):
        """Test user login and token retrieval"""
        
        response = self.client.login_user(
            email=self.email,
            password=self.password
        )
        
        # Verify login response contains token
        assert isinstance(response, dict)
        assert 'token' in response
        assert isinstance(response['token'], str)
        assert len(response['token']) > 0
        
        # Store token for later tests
        self.__class__.user_token = response['token']
    
    def test_03_create_offline_searchable(self):
        """Test creating an offline searchable with menu items"""
        
        assert self.client.token is not None
        assert len(self.client.token) > 0
        
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
        assert isinstance(response, dict)
        assert 'searchable_id' in response
        assert response['searchable_id'] is not None
        assert isinstance(response['searchable_id'], int)
        assert response['searchable_id'] > 0
        
        # Store for retrieval test
        self.__class__.created_searchable_id = response['searchable_id']
    
    def test_04_retrieve_offline_searchable(self):
        """Test retrieving information about the created offline searchable"""
        
        assert self.created_searchable_id is not None
        assert isinstance(self.created_searchable_id, int)
        assert self.client.token is not None
        
        response = self.client.get_searchable(self.created_searchable_id)
        
        # Verify response structure
        assert isinstance(response, dict)
        assert 'searchable_id' in response
        assert response['searchable_id'] == self.created_searchable_id
        
        # Verify our test data is present
        assert 'payloads' in response
        assert 'public' in response['payloads']
        
        public_data = response['payloads']['public']
        assert isinstance(public_data, dict)
        assert 'title' in public_data
        assert public_data['title'] == f"Test Coffee Shop {self.test_id}"
        assert 'type' in public_data
        assert public_data['type'] == "offline"
        
        # Verify offline items are present
        assert 'offlineItems' in public_data
        assert isinstance(public_data['offlineItems'], list)
        assert len(public_data['offlineItems']) == 5
        
        # Verify specific items
        assert len(public_data['offlineItems']) > 0  # Check list length before iteration
        item_names = []
        for item in public_data['offlineItems']:
            assert 'name' in item
            item_names.append(item['name'])
        
        expected_items = ['Espresso', 'Cappuccino', 'Latte', 'Croissant', 'Muffin']
        assert len(expected_items) == 5
        
        for expected_item in expected_items:
            assert expected_item in item_names
    
    def test_05_create_invoice_with_offline_items(self):
        """Test creating an invoice with offline items including quantities"""
        
        assert self.created_searchable_id is not None
        assert self.client.token is not None
        
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
        assert isinstance(response, dict)
        has_session_id = 'session_id' in response
        has_url = 'url' in response  
        has_invoice_id = 'invoice_id' in response
        assert has_session_id or has_url or has_invoice_id
        
        # Store invoice for later tests
        self.__class__.created_invoice = response
        
        # If we have a mock response with redirect URL, follow it for payment simulation
        if 'url' in response and 'payment=success' in response['url']:
            # Extract session_id for payment refresh
            session_id = response.get('session_id', 'mock-session-123')
            assert session_id is not None
            
            # Simulate payment refresh  
            refresh_response = self.client.refresh_payment_status(session_id)
            assert isinstance(refresh_response, dict)
    
    def test_06_search_for_offline_item(self):
        """Test searching for the created offline searchable item"""
        
        assert self.client.token is not None
        
        # Search with a term that should match our item
        search_term = f"Test Coffee Shop {self.test_id}"
        
        response = self.client.search_searchables_by_term(search_term)
        
        # Verify search response
        assert isinstance(response, dict)
        assert 'results' in response
        assert isinstance(response['results'], list)
        
        # Find our created item in results
        found_item = None
        assert len(response['results']) > 0  # Check list length before iteration
        for item in response['results']:
            assert isinstance(item, dict)
            if item.get('searchable_id') == self.created_searchable_id:
                found_item = item
                break
        
        assert found_item is not None
        assert 'payloads' in found_item
        assert 'public' in found_item['payloads']
        assert 'type' in found_item['payloads']['public']
        assert found_item['payloads']['public']['type'] == 'offline'
    
    def test_07_calc_invoice_with_quantities(self):
        """Test invoice calculation with offline items and quantities"""
        
        assert self.created_searchable_id is not None
        assert self.client.token is not None
        
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
        assert 'payloads' in searchable_response
        assert 'public' in searchable_response['payloads']
        assert 'offlineItems' in searchable_response['payloads']['public']
        
        offline_items = searchable_response['payloads']['public']['offlineItems']
        assert isinstance(offline_items, list)
        assert len(offline_items) > 0  # Check list length before iteration
        
        id_to_price = {}
        for item in offline_items:
            assert 'itemId' in item
            assert 'price' in item
            id_to_price[item['itemId']] = item['price']
        
        assert len(selections) > 0  # Check list length before iteration
        for selection in selections:
            assert 'id' in selection
            assert 'count' in selection
            item_id = selection['id']
            count = selection['count']
            assert item_id in id_to_price
            price = id_to_price[item_id]
            assert isinstance(price, (int, float))
            assert isinstance(count, int)
            assert count > 0
            total_amount += price * count
            total_item_count += count
        
        # Verify calculations
        assert total_amount == expected_total
        assert total_item_count == 7
        assert len(selections) == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])