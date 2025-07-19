#!/usr/bin/env python3
"""Test download functionality with numeric file IDs"""

import requests
import json

BASE_URL = "http://localhost:5005"

# Login to get token
login_data = {
    "email": "testdownload@example.com",
    "password": "testpass123"
}

print("1. Logging in...")
login_response = requests.post(f"{BASE_URL}/api/users/login", json=login_data)
if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

login_json = login_response.json()
print(f"Login response: {json.dumps(login_json, indent=2)}")
token = login_json.get("access_token") or login_json.get("token")
headers = {"authorization": token}  # No "Bearer " prefix needed
print(f"Got token: {token[:20]}...")

# Get downloadable items
print("\n2. Fetching downloadable items...")
downloads_response = requests.get(f"{BASE_URL}/api/v1/downloadable-items-by-user", headers=headers)
print(f"Status: {downloads_response.status_code}")
if downloads_response.status_code == 200:
    print(f"Response: {json.dumps(downloads_response.json(), indent=2)}")
else:
    print(f"Error: {downloads_response.text}")

# Test download URLs
if downloads_response.status_code == 200:
    items = downloads_response.json().get("downloadable_items", [])
    if items:
        for item in items[:1]:  # Test first item
            for file in item.get("downloadable_files", []):
                download_url = file.get("download_url")
                print(f"\n3. Testing download URL: {download_url}")
                
                # Make the download request
                download_response = requests.get(f"{BASE_URL}/api{download_url}", headers=headers, allow_redirects=False)
                print(f"Status: {download_response.status_code}")
                if download_response.status_code == 302:
                    print(f"Redirect to: {download_response.headers.get('Location')}")
                else:
                    print(f"Response: {download_response.text[:200]}")