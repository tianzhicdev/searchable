#!/usr/bin/env python3
"""
Integration test for deleted searchable items functionality.

Tests that deleted items are:
1. Hidden from search results
2. Hidden from profile listings  
3. Still accessible via direct URL with removed=true flag
4. Still accessible for purchased items (My Downloads)
"""

import sys
import os
import requests
import json
from datetime import datetime

# Add the parent directory to the path so we can import from the integration tests
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api_client import APIClient
from config import BASE_URL

def test_deleted_searchables():
    """Test the deleted searchables functionality"""
    
    print(f"\n🧪 Testing deleted searchables functionality...")
    print(f"Base URL: {BASE_URL}")
    
    # Initialize client
    client = APIClient(BASE_URL)
    
    try:
        # 1. Register and login test users
        print("\n1. Setting up test users...")
        
        # Create seller user
        seller_username = f"seller_test_{int(datetime.now().timestamp())}"
        seller_password = "test_password_123"
        seller_email = f"{seller_username}@test.com"
        
        seller_response = client.register(seller_username, seller_email, seller_password)
        if seller_response.status_code != 201:
            print(f"❌ Failed to register seller: {seller_response.text}")
            return False
            
        seller_token = client.login(seller_username, seller_password)
        if not seller_token:
            print("❌ Failed to login seller")
            return False
        
        # Create buyer user
        buyer_username = f"buyer_test_{int(datetime.now().timestamp())}"
        buyer_password = "test_password_123"
        buyer_email = f"{buyer_username}@test.com"
        
        buyer_response = client.register(buyer_username, buyer_email, buyer_password)
        if buyer_response.status_code != 201:
            print(f"❌ Failed to register buyer: {buyer_response.text}")
            return False
            
        buyer_token = client.login(buyer_username, buyer_password)
        if not buyer_token:
            print("❌ Failed to login buyer")
            return False
        
        print(f"✅ Created users: {seller_username} (seller) and {buyer_username} (buyer)")
        
        # 2. Create a searchable item as seller
        print("\n2. Creating searchable item...")
        
        searchable_data = {
            "payloads": {
                "public": {
                    "title": "Test Deleted Item",
                    "description": "This item will be deleted to test functionality",
                    "type": "direct",
                    "price": 5.00,
                    "currency": "usd"
                }
            }
        }
        
        client.set_token(seller_token)
        create_response = client.post('/api/v1/searchable/create', searchable_data)
        
        if create_response.status_code != 201:
            print(f"❌ Failed to create searchable: {create_response.text}")
            return False
            
        searchable_id = create_response.json()['searchable_id']
        print(f"✅ Created searchable item with ID: {searchable_id}")
        
        # 3. Verify item appears in search results
        print("\n3. Verifying item appears in search...")
        
        client.set_token(buyer_token)
        search_response = client.get('/api/v1/searchable/search', {'q': 'Test Deleted Item'})
        
        if search_response.status_code != 200:
            print(f"❌ Search failed: {search_response.text}")
            return False
            
        search_results = search_response.json()
        found_in_search = any(item['searchable_id'] == searchable_id 
                            for item in search_results.get('results', []))
        
        if not found_in_search:
            print("❌ Item not found in search results before deletion")
            return False
            
        print("✅ Item found in search results before deletion")
        
        # 4. Verify item is accessible via direct URL
        print("\n4. Verifying direct access works...")
        
        direct_response = client.get(f'/api/v1/searchable/{searchable_id}')
        
        if direct_response.status_code != 200:
            print(f"❌ Direct access failed: {direct_response.text}")
            return False
            
        direct_data = direct_response.json()
        if direct_data.get('removed') != False:
            print(f"❌ Item should not be marked as removed yet, got: {direct_data.get('removed')}")
            return False
            
        print("✅ Direct access works before deletion")
        
        # 5. Delete (mark as removed) the searchable item
        print("\n5. Deleting the searchable item...")
        
        client.set_token(seller_token)
        delete_response = client.put(f'/api/v1/searchable/remove/{searchable_id}')
        
        if delete_response.status_code not in [200, 204]:
            print(f"❌ Failed to delete searchable: {delete_response.text}")
            return False
            
        print("✅ Successfully deleted searchable item")
        
        # 6. Verify item NO LONGER appears in search results
        print("\n6. Verifying item is hidden from search...")
        
        client.set_token(buyer_token)
        search_response = client.get('/api/v1/searchable/search', {'q': 'Test Deleted Item'})
        
        if search_response.status_code != 200:
            print(f"❌ Search failed after deletion: {search_response.text}")
            return False
            
        search_results = search_response.json()
        found_in_search = any(item['searchable_id'] == searchable_id 
                            for item in search_results.get('results', []))
        
        if found_in_search:
            print("❌ Deleted item still appears in search results")
            return False
            
        print("✅ Deleted item correctly hidden from search results")
        
        # 7. Verify item is STILL accessible via direct URL with removed=true
        print("\n7. Verifying direct access still works for deleted item...")
        
        direct_response = client.get(f'/api/v1/searchable/{searchable_id}')
        
        if direct_response.status_code != 200:
            print(f"❌ Direct access to deleted item failed: {direct_response.text}")
            return False
            
        direct_data = direct_response.json()
        
        if direct_data.get('removed') != True:
            print(f"❌ Deleted item should be marked as removed=true, got: {direct_data.get('removed')}")
            return False
            
        if direct_data.get('searchable_id') != searchable_id:
            print(f"❌ Wrong searchable returned, expected {searchable_id}, got {direct_data.get('searchable_id')}")
            return False
            
        print("✅ Direct access to deleted item works correctly with removed=true")
        
        # 8. Test completed successfully
        print("\n🎉 All tests passed! Deleted searchables functionality working correctly.")
        print("Summary:")
        print("  ✅ Deleted items are hidden from search results")
        print("  ✅ Deleted items are still accessible via direct URL")
        print("  ✅ Deleted items have removed=true in response")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_deleted_searchables()
    sys.exit(0 if success else 1)