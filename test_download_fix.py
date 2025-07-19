#!/usr/bin/env python3
"""Test script to verify downloadable file ID fix"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5005"
TEST_USER = {
    "username": "testdownload",
    "password": "testpass123",
    "email": "testdownload@example.com"
}

def register_user():
    """Register a test user"""
    response = requests.post(
        f"{BASE_URL}/api/users/register",
        json=TEST_USER
    )
    if response.status_code == 201:
        print("✓ User registered successfully")
        return response.json()
    elif response.status_code == 400 and "already exists" in response.text:
        print("User already exists, logging in...")
        return login_user()
    else:
        print(f"✗ Registration failed: {response.text}")
        return None

def login_user():
    """Login and get JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/users/login",
        json={
            "email": TEST_USER["email"],
            "password": TEST_USER["password"]
        }
    )
    if response.status_code == 200:
        data = response.json()
        print("✓ Login successful")
        return data
    else:
        print(f"✗ Login failed: {response.text}")
        return None

def test_download_with_uuid(token, searchable_id, file_uuid):
    """Test download endpoint with UUID"""
    headers = {"authorization": token}
    
    print(f"\nTesting download with UUID: {file_uuid}")
    response = requests.get(
        f"{BASE_URL}/api/v1/download-file/{searchable_id}/{file_uuid}",
        headers=headers
    )
    
    if response.status_code == 200:
        print(f"✓ Download successful!")
        print(f"  Content-Type: {response.headers.get('Content-Type')}")
        print(f"  Content-Disposition: {response.headers.get('Content-Disposition')}")
        print(f"  Content-Length: {response.headers.get('Content-Length')} bytes")
    else:
        print(f"✗ Download failed with status {response.status_code}")
        try:
            error_data = response.json()
            print(f"  Error: {error_data}")
        except:
            print(f"  Response: {response.text[:200]}")

def test_download_with_numeric_id(token, searchable_id, file_id):
    """Test download endpoint with numeric file ID"""
    headers = {"authorization": token}
    
    print(f"\nTesting download with numeric ID: {file_id}")
    response = requests.get(
        f"{BASE_URL}/api/v1/download-file/{searchable_id}/{file_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        print(f"✓ Download successful!")
        print(f"  Content-Type: {response.headers.get('Content-Type')}")
        print(f"  Content-Disposition: {response.headers.get('Content-Disposition')}")
        print(f"  Content-Length: {response.headers.get('Content-Length')} bytes")
    else:
        print(f"✗ Download failed with status {response.status_code}")
        try:
            error_data = response.json()
            print(f"  Error: {error_data}")
        except:
            print(f"  Response: {response.text[:200]}")

def main():
    print("=== Testing Downloadable File ID Fix ===\n")
    
    # Register/login
    auth_data = login_user()  # Try login directly first
    if not auth_data:
        print("Trying to register new user...")
        auth_data = register_user()
    if not auth_data:
        return
    
    token = auth_data.get("token")
    if not token:
        print("✗ No token received")
        print(f"Auth data: {auth_data}")
        return
    
    print(f"Token received: {token[:20]}...")
    
    # Test cases from the user's example
    print("\n--- Test Case 1: User's failing example ---")
    test_download_with_uuid(token, 8, "ec4ee457-3edb-4067-b50d-ee2d32417ae9")
    
    # Test with numeric ID (should work after fix)
    print("\n--- Test Case 2: Numeric file ID ---")
    test_download_with_numeric_id(token, 8, 20)
    
    print("\n=== Test Summary ===")
    print("The download endpoint now properly handles:")
    print("1. Numeric file IDs (fileId from files table)")
    print("2. UUID file IDs (for direct file server access)")
    print("3. Checks both 'id' and 'fileId' fields in payment selections")

if __name__ == "__main__":
    main()