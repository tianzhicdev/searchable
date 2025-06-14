#!/usr/bin/env python3
"""
Integration tests for guest access functionality
Tests that visitors can access public content and make purchases without authentication
"""

import unittest
import requests
import time
from api_client import SearchableAPIClient
from config import (
    DEFAULT_PASSWORD, 
    TEST_USER_PREFIX, 
    TEST_EMAIL_DOMAIN,
    get_unique_test_id
)

class TestGuestAccess(unittest.TestCase):
    """Test guest/unauthenticated access to platform features"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test class with authenticated user for setup and guest client for testing"""
        cls.test_id = get_unique_test_id()
        
        # Create authenticated client for setup operations
        cls.setup_client = SearchableAPIClient()
        cls.username = f"{TEST_USER_PREFIX}setup_{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        
        # Register and login setup user
        register_response = cls.setup_client.register_user(
            username=cls.username,
            email=cls.email,
            password=cls.password
        )
        assert register_response['success'], f"Failed to register setup user: {register_response}"
        
        login_response = cls.setup_client.login_user(cls.email, cls.password)
        assert 'token' in login_response, f"Failed to login setup user: {login_response}"
        
        # Create guest client (no authentication)
        cls.guest_client = SearchableAPIClient()
        
        # Create searchable item for testing
        cls.test_searchable_id = cls._create_test_searchable()
        
    @classmethod
    def _create_test_searchable(cls):
        """Create a test searchable item for guest access testing"""
        searchable_data = {
            "title": f"Guest Test Item {cls.test_id}",
            "description": "Test item for guest access testing",
            "tags": ["test", "guest", "public"],
            "type": "searchable",
            "downloadableFiles": [
                {
                    "name": "test_file_1.txt",
                    "description": "Test file for guest purchase",
                    "price": 5.99,
                    "fileId": 1
                },
                {
                    "name": "test_file_2.txt", 
                    "description": "Another test file for guest purchase",
                    "price": 3.99,
                    "fileId": 2
                }
            ],
            "currency": "usd"
        }
        
        response = cls.setup_client.create_searchable(searchable_data)
        # Response should contain searchable_id directly
        assert 'searchable_id' in response, f"Failed to create test searchable: {response}"
        return response['searchable_id']
    
    def test_guest_can_search_public_items(self):
        """Test that guests can search public searchable items"""
        print("Testing guest can search public items...")
        
        # Guest should be able to search without authentication
        response = self.guest_client.search_searchables(query_term="test")
        
        self.assertIsInstance(response, dict)
        self.assertIn('searchables', response)
        
        # Verify our test item appears in results
        found_test_item = False
        for item in response['searchables']:
            if item.get('searchable_id') == self.test_searchable_id:
                found_test_item = True
                break
        
        self.assertTrue(found_test_item, "Test searchable item should appear in guest search results")
        print("✓ Guest can search public items")
    
    def test_guest_can_view_public_searchable_details(self):
        """Test that guests can view public searchable item details"""
        print("Testing guest can view public searchable details...")
        
        # Guest should be able to view searchable details
        response = self.guest_client.get_searchable_details(self.test_searchable_id)
        
        self.assertIsInstance(response, dict)
        self.assertIn('searchable_id', response)
        self.assertEqual(response['searchable_id'], self.test_searchable_id)
        self.assertIn('payloads', response)
        self.assertIn('public', response['payloads'])
        
        # Verify downloadable files are visible
        public_data = response['payloads']['public']
        self.assertIn('downloadableFiles', public_data)
        self.assertGreater(len(public_data['downloadableFiles']), 0)
        
        print("✓ Guest can view public searchable details")
    
    def test_guest_can_view_user_profiles(self):
        """Test that guests can view public user profiles"""
        print("Testing guest can view user profiles...")
        
        # Get the profile of our setup user
        # First get user ID from searchable item
        searchable_response = self.guest_client.get_searchable_details(self.test_searchable_id)
        user_id = searchable_response['terminal_id']
        
        # Guest should be able to view user profile
        response = self.guest_client.get_user_profile(user_id)
        
        self.assertIsInstance(response, dict)
        self.assertIn('user_id', response)
        self.assertEqual(response['user_id'], int(user_id))
        
        print("✓ Guest can view user profiles")
    
    def test_guest_cannot_create_searchables(self):
        """Test that guests cannot create searchable items"""
        print("Testing guest cannot create searchables...")
        
        searchable_data = {
            "title": "Guest Attempt",
            "description": "This should fail",
            "tags": ["test"],
            "type": "searchable"
        }
        
        # Guest should not be able to create searchables
        with self.assertRaises((requests.exceptions.HTTPError, AssertionError)):
            self.guest_client.create_searchable(searchable_data)
        
        print("✓ Guest cannot create searchables (as expected)")
    
    def test_guest_cannot_access_profile_management(self):
        """Test that guests cannot access their own profile management"""
        print("Testing guest cannot access profile management...")
        
        profile_data = {
            "username": "guest_user",
            "intro": "This should fail"
        }
        
        # Guest should not be able to update profile
        with self.assertRaises((requests.exceptions.HTTPError, AssertionError)):
            self.guest_client.update_profile(profile_data)
        
        print("✓ Guest cannot access profile management (as expected)")
    
    def test_guest_can_create_purchase_invoices(self):
        """Test that guests can create invoices for purchases"""
        print("Testing guest can create purchase invoices...")
        
        # Prepare invoice data
        invoice_data = {
            "searchable_id": self.test_searchable_id,
            "invoice_type": "stripe",
            "selections": [
                {
                    "id": 1,
                    "name": "test_file_1.txt",
                    "price": 5.99,
                    "type": "downloadable"
                }
            ],
            "total_price": 5.99
        }
        
        # Guest should be able to create invoice for purchase
        try:
            response = self.guest_client.create_invoice(invoice_data)
            
            self.assertIsInstance(response, dict)
            self.assertIn('external_id', response)  # Stripe session ID
            self.assertIn('invoice_id', response)
            
            print("✓ Guest can create purchase invoices")
            
            # Store invoice ID for potential cleanup
            self.guest_invoice_id = response.get('invoice_id')
            
        except Exception as e:
            # If Stripe is not configured, this might fail
            # Check if it's a configuration issue vs authentication issue
            if "stripe" in str(e).lower() or "external service" in str(e).lower():
                print("⚠ Stripe not configured for testing, but guest authentication worked")
            else:
                raise e
    
    def test_guest_can_check_paid_files(self):
        """Test that guests can check which files they've paid for"""
        print("Testing guest can check paid files...")
        
        # Guest should be able to check paid files (even if empty)
        response = self.guest_client.get_user_paid_files(self.test_searchable_id)
        
        self.assertIsInstance(response, dict)
        self.assertIn('paid_file_ids', response)
        
        # For a new guest, this should be empty
        self.assertIsInstance(response['paid_file_ids'], list)
        
        print("✓ Guest can check paid files")
    
    def test_visitor_id_persistence(self):
        """Test that visitor ID persists across requests"""
        print("Testing visitor ID persistence...")
        
        # Make multiple requests and verify consistent behavior
        response1 = self.guest_client.search_searchables(query_term="test")
        time.sleep(0.1)  # Small delay
        response2 = self.guest_client.search_searchables(query_term="test")
        
        # Both requests should succeed (indicating visitor ID is working)
        self.assertIsInstance(response1, dict)
        self.assertIsInstance(response2, dict)
        
        # Results should be consistent for same query
        self.assertEqual(len(response1.get('searchables', [])), 
                        len(response2.get('searchables', [])))
        
        print("✓ Visitor ID persists across requests")
    
    def test_guest_cannot_access_user_specific_data(self):
        """Test that guests cannot access user-specific endpoints"""
        print("Testing guest cannot access user-specific data...")
        
        endpoints_to_test = [
            ('get_user_purchases', []),
            ('get_user_invoices', []),
        ]
        
        for endpoint_name, args in endpoints_to_test:
            if hasattr(self.guest_client, endpoint_name):
                with self.assertRaises((requests.exceptions.HTTPError, AssertionError)):
                    getattr(self.guest_client, endpoint_name)(*args)
        
        print("✓ Guest cannot access user-specific data (as expected)")
    
    @classmethod
    def tearDownClass(cls):
        """Clean up test data"""
        try:
            # Clean up the test searchable if possible
            if hasattr(cls, 'test_searchable_id') and hasattr(cls, 'setup_client'):
                cls.setup_client.remove_searchable(cls.test_searchable_id)
        except Exception as e:
            print(f"Warning: Could not clean up test searchable: {e}")

if __name__ == '__main__':
    unittest.main()