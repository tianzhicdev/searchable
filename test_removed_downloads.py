#!/usr/bin/env python3
"""Test script to verify users can download purchased items even after removal"""

import requests
import json
import time

BASE_URL = "http://localhost:5005/api"

# Test credentials
test_user = {
    "email": "test_download_user@example.com",
    "password": "testpass123",
    "username": "test_download_user"
}

seller_user = {
    "email": "test_seller@example.com", 
    "password": "testpass123",
    "username": "test_seller"
}

def register_user(user_data):
    """Register a test user"""
    response = requests.post(f"{BASE_URL}/users/register", json=user_data)
    return response.json()

def login_user(email, password):
    """Login and get token"""
    response = requests.post(f"{BASE_URL}/users/login", json={
        "email": email,
        "password": password
    })
    return response.json().get("token")

def create_downloadable_item(token, title="Test Downloadable"):
    """Create a downloadable searchable item"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # First upload a test file
    file_response = requests.post(
        f"{BASE_URL}/v1/files/upload",
        headers=headers,
        files={"file": ("test.txt", b"Test file content", "text/plain")}
    )
    file_data = file_response.json()
    
    # Create searchable with downloadable file
    searchable_data = {
        "public": {
            "type": "downloadable",
            "title": title,
            "description": "Test downloadable item",
            "downloadableFiles": [{
                "fileId": file_data["file_id"],
                "name": "test.txt",
                "price": 5
            }]
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/v1/searchable-publish",
        headers=headers,
        json=searchable_data
    )
    return response.json()

def purchase_item(buyer_token, searchable_id, file_id):
    """Purchase a downloadable item"""
    headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # Create invoice
    invoice_data = {
        "searchable_id": searchable_id,
        "delivery_info": {},
        "selections": [{
            "id": file_id,
            "type": "downloadable",
            "name": "test.txt",
            "price": 5
        }]
    }
    
    # Use balance payment for testing
    response = requests.post(
        f"{BASE_URL}/v1/create-balance-invoice",
        headers=headers,
        json=invoice_data
    )
    return response.json()

def delete_searchable(token, searchable_id):
    """Delete/remove a searchable item"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(
        f"{BASE_URL}/v1/searchable/{searchable_id}",
        headers=headers
    )
    return response.status_code == 200

def get_downloadable_items(token):
    """Get user's downloadable items"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/v1/downloadable-items-by-user",
        headers=headers
    )
    return response.json()

def download_file(token, searchable_id, file_id):
    """Attempt to download a file"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/v1/download-file/{searchable_id}/{file_id}",
        headers=headers
    )
    return response

def main():
    print("=== Testing Download of Removed Items ===\n")
    
    # Register users
    print("1. Registering users...")
    register_user(test_user)
    register_user(seller_user)
    
    # Login
    print("2. Logging in...")
    buyer_token = login_user(test_user["email"], test_user["password"])
    seller_token = login_user(seller_user["email"], seller_user["password"])
    
    # Create downloadable item as seller
    print("3. Creating downloadable item...")
    item = create_downloadable_item(seller_token, "Item to be Removed")
    searchable_id = item["searchable_id"]
    file_id = item["searchable"]["payloads"]["public"]["downloadableFiles"][0]["fileId"]
    print(f"   Created item ID: {searchable_id}, File ID: {file_id}")
    
    # Add balance to buyer
    print("4. Adding balance to buyer (simulated)...")
    # In real scenario, would use deposit endpoint
    
    # Purchase item as buyer
    print("5. Purchasing item...")
    purchase_result = purchase_item(buyer_token, searchable_id, file_id)
    if purchase_result.get("success"):
        print("   Purchase successful!")
    else:
        print(f"   Purchase failed: {purchase_result}")
        # For testing, we'll continue anyway
    
    # Verify buyer can see item in downloads
    print("6. Checking downloadable items...")
    downloads = get_downloadable_items(buyer_token)
    print(f"   Found {downloads.get('count', 0)} downloadable items")
    
    # Attempt download before removal
    print("7. Testing download BEFORE removal...")
    download_response = download_file(buyer_token, searchable_id, file_id)
    print(f"   Download status: {download_response.status_code}")
    
    # Remove item as seller
    print("8. Removing item as seller...")
    if delete_searchable(seller_token, searchable_id):
        print("   Item removed successfully")
    
    # Check if buyer can still see item
    print("9. Checking downloadable items AFTER removal...")
    downloads_after = get_downloadable_items(buyer_token)
    print(f"   Found {downloads_after.get('count', 0)} downloadable items")
    
    # Attempt download after removal
    print("10. Testing download AFTER removal...")
    download_response_after = download_file(buyer_token, searchable_id, file_id)
    print(f"    Download status: {download_response_after.status_code}")
    
    if download_response_after.status_code == 200:
        print("\n✅ SUCCESS: User can download purchased item even after removal!")
    else:
        print(f"\n❌ FAILED: Download failed with status {download_response_after.status_code}")
        if download_response_after.headers.get('content-type') == 'application/json':
            print(f"    Error: {download_response_after.json()}")

if __name__ == "__main__":
    main()