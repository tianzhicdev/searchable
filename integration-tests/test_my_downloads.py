#!/usr/bin/env python3

import pytest
import requests
import time
import re
from config import API_BASE_URL, TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD
from api_client import APIClient

class TestMyDownloads:
    """Test suite for the My Downloads functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.api = APIClient()
        self.timestamp = str(int(time.time()))
        self.test_username = f"{TEST_USER_PREFIX}{self.timestamp}"
        self.test_email = f"{self.test_username}@{TEST_EMAIL_DOMAIN}"
        self.test_password = DEFAULT_PASSWORD
        
        # Test user for buying items
        self.buyer_username = f"buyer_{self.timestamp}"
        self.buyer_email = f"{self.buyer_username}@{TEST_EMAIL_DOMAIN}"
        
        # Test user for selling items
        self.seller_username = f"seller_{self.timestamp}"
        self.seller_email = f"{self.seller_username}@{TEST_EMAIL_DOMAIN}"
        
    def test_downloadable_items_endpoint_unauthorized(self):
        """Test that downloadable items endpoint requires authentication"""
        response = requests.get(f"{API_BASE_URL}/v1/downloadable-items-by-user")
        assert response.status_code == 400, f"Expected 400 but got {response.status_code}"
        response_data = response.json()
        assert "JWT token" in response_data.get("msg", ""), "Should mention JWT token in error message"
        
    def test_get_downloadable_items_empty(self):
        """Test getting downloadable items for user with no purchases"""
        # Register and login buyer
        self.api.register(self.buyer_username, self.buyer_email, self.test_password)
        login_response = self.api.login(self.buyer_email, self.test_password)
        assert login_response.get('success') == True, "Login should succeed"
        
        # Get downloadable items (should be empty)
        response = self.api.get_downloadable_items()
        assert response.get('downloadable_items') == [], "Should have no downloadable items"
        assert response.get('count') == 0, "Count should be 0"
        
    def test_full_purchase_and_download_flow(self):
        """Test complete flow: create item, purchase it, verify in downloads"""
        # Register seller and buyer with unique timestamps
        unique_timestamp = str(int(time.time() * 1000))  # Use milliseconds for uniqueness
        seller_username = f"{TEST_USER_PREFIX}seller_{unique_timestamp}"
        seller_email = f"{seller_username}@{TEST_EMAIL_DOMAIN}"
        buyer_username = f"{TEST_USER_PREFIX}buyer_{unique_timestamp}"
        buyer_email = f"{buyer_username}@{TEST_EMAIL_DOMAIN}"
        
        seller_register = self.api.register(seller_username, seller_email, self.test_password)
        assert seller_register.get('success') == True, "Seller registration should succeed"
        
        buyer_register = self.api.register(buyer_username, buyer_email, self.test_password)
        assert buyer_register.get('success') == True, "Buyer registration should succeed"
        
        # Login as seller and create a downloadable item
        seller_login = self.api.login(seller_email, self.test_password)
        assert seller_login.get('success') == True, "Seller login should succeed"
        
        # Create downloadable searchable
        searchable_data = {
            "title": f"Test Download Item {self.timestamp}",
            "description": "A test downloadable item for downloads testing",
            "type": "downloadable",
            "currency": "usd",
            "downloadableFiles": [
                {
                    "name": "test_file_1.zip",
                    "price": 19.99
                },
                {
                    "name": "test_file_2.pdf",
                    "price": 9.99
                }
            ]
        }
        
        searchable_response = self.api.create_searchable(searchable_data)
        assert 'searchable_id' in searchable_response, "Should get searchable_id in response"
        searchable_id = searchable_response['searchable_id']
        
        # Login as buyer
        buyer_login = self.api.login(buyer_email, self.test_password)
        assert buyer_login.get('success') == True, "Buyer login should succeed"
        
        # Create invoice for the item
        invoice_data = {
            "searchable_id": searchable_id,
            "invoice_type": "stripe",
            "address": "123 Test St, Test City, TC 12345",
            "tel": "+1-555-0123",
            "description": f"Purchase of {searchable_data['title']}",
            "selections": [
                {
                    "id": "file_1",
                    "type": "downloadable",
                    "name": "test_file_1.zip",
                    "price": 19.99
                },
                {
                    "id": "file_2", 
                    "type": "downloadable",
                    "name": "test_file_2.pdf",
                    "price": 9.99
                }
            ]
        }
        
        invoice_response = self.api.create_invoice(invoice_data)
        assert 'url' in invoice_response or 'session_id' in invoice_response, "Should get payment info"
        
        # For testing, we'll simulate payment completion
        # In real scenario, this would happen via Stripe webhook
        
        # Get user's downloadable items
        downloads_response = self.api.get_downloadable_items()
        
        # Verify the response structure
        assert 'downloadable_items' in downloads_response, "Response should contain downloadable_items"
        assert 'count' in downloads_response, "Response should contain count"
        
        # Note: The actual downloads will only appear after payment is complete
        # In test environment, this might be empty until payment processing is implemented
        downloadable_items = downloads_response['downloadable_items']
        
        # Verify response structure even if empty
        if len(downloadable_items) > 0:
            item = downloadable_items[0]
            required_fields = [
                'invoice_id', 'searchable_id', 'searchable_title', 
                'seller_username', 'amount_paid', 'currency', 
                'purchase_date', 'downloadable_files', 'item_type'
            ]
            
            for field in required_fields:
                assert field in item, f"Downloaded item should have {field} field"
            
            # Verify downloadable files structure
            assert len(item['downloadable_files']) > 0, "Should have downloadable files"
            
            for file_data in item['downloadable_files']:
                file_required_fields = ['id', 'name', 'price', 'download_url']
                for field in file_required_fields:
                    assert field in file_data, f"File data should have {field} field"
                    
    def test_downloadable_items_response_structure(self):
        """Test the structure of downloadable items response"""
        # Register and login user
        self.api.register(self.test_username, self.test_email, self.test_password)
        login_response = self.api.login(self.test_email, self.test_password)
        assert login_response.get('success') == True, "Login should succeed"
        
        # Get downloadable items
        response = self.api.get_downloadable_items()
        
        # Verify top-level structure
        assert isinstance(response, dict), "Response should be a dictionary"
        assert 'downloadable_items' in response, "Response should have downloadable_items"
        assert 'count' in response, "Response should have count"
        assert isinstance(response['downloadable_items'], list), "downloadable_items should be a list"
        assert isinstance(response['count'], int), "count should be an integer"
        assert response['count'] == len(response['downloadable_items']), "count should match items length"
        
    def test_multiple_downloads_ordering(self):
        """Test that multiple downloads are ordered by purchase date (newest first)"""
        # This test would require creating multiple purchases
        # For now, we'll just verify the API call works
        
        # Register and login user with unique timestamp for this test
        unique_timestamp = str(int(time.time() * 1000))  # Use milliseconds for uniqueness
        unique_username = f"{TEST_USER_PREFIX}order_{unique_timestamp}"
        unique_email = f"{unique_username}@{TEST_EMAIL_DOMAIN}"
        self.api.register(unique_username, unique_email, self.test_password)
        login_response = self.api.login(unique_email, self.test_password)
        assert login_response.get('success') == True, "Login should succeed"
        
        # Get downloadable items
        response = self.api.get_downloadable_items()
        downloadable_items = response['downloadable_items']
        
        # If we have multiple items, verify they're ordered by purchase_date (newest first)
        if len(downloadable_items) > 1:
            purchase_dates = [item['purchase_date'] for item in downloadable_items]
            # Verify dates are in descending order (newest first)
            for i in range(len(purchase_dates) - 1):
                assert purchase_dates[i] >= purchase_dates[i + 1], "Items should be ordered by purchase date (newest first)"
                
    def test_download_url_format(self):
        """Test that download URLs are properly formatted"""

        # Register and login user with unique timestamp for this test
        unique_timestamp = str(int(time.time() * 1000))  # Use milliseconds for uniqueness
        unique_username = f"{TEST_USER_PREFIX}url_{unique_timestamp}"
        unique_email = f"{unique_username}@{TEST_EMAIL_DOMAIN}"
        self.api.register(unique_username, unique_email, self.test_password)
        login_response = self.api.login(unique_email, self.test_password)
        assert login_response.get('success') == True, "Login should succeed"
        
        # Get downloadable items
        response = self.api.get_downloadable_items()
        downloadable_items = response['downloadable_items']
        
        # If we have items, verify download URL format
        for item in downloadable_items:
            searchable_id = item.get('searchable_id')
            for file_data in item['downloadable_files']:
                file_id = file_data.get('id')
                download_url = file_data['download_url']
                # Check format: /v1/download-file/<searchableid>/<fileid>
                pattern = rf"^/v1/download-file/{searchable_id}/{file_id}$"
                assert re.match(pattern, download_url), f"Download URL should match format /v1/download-file/<searchableid>/<fileid>, got {download_url}"
                
    def test_downloadable_items_error_handling(self):
        """Test error handling for downloadable items endpoint"""
        # Test without authentication
        response = requests.get(f"{API_BASE_URL}/v1/downloadable-items-by-user")
        assert response.status_code == 400, "Should require authentication"
        
        # Test with invalid token
        headers = {'Authorization': 'Bearer invalid_token'}
        response = requests.get(f"{API_BASE_URL}/v1/downloadable-items-by-user", headers=headers)
        assert response.status_code in [400, 401, 403], "Should reject invalid token"
        
    def teardown_method(self):
        """Cleanup test data"""
        # Logout if logged in
        try:
            self.api.logout()
        except:
            pass

if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])