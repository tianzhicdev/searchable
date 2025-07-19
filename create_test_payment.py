#!/usr/bin/env python3
"""Create a test payment for download testing"""

import requests
import json
import time

BASE_URL = "http://localhost:5005"

# Login as test user
login_data = {
    "email": "testdownload@example.com",
    "password": "testpass123"
}

print("1. Logging in...")
login_response = requests.post(f"{BASE_URL}/api/users/login", json=login_data)
if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

token = login_response.json()["token"]
headers = {"authorization": token}  # No "Bearer " prefix needed

# Create an invoice for searchable ID 8 (which has allinone type files)
print("\n2. Creating test invoice...")
invoice_data = {
    "searchable_id": 8,
    "invoice_type": "stripe",
    "selections": [
        {
            "component": "downloadable",
            "id": "ec4ee457-3edb-4067-b50d-ee2d32417ae9",  # Correct UUID for came.mp4
            "count": 1
        }
    ],
    "success_url": "http://localhost:3000/success",
    "cancel_url": "http://localhost:3000/cancel"
}

invoice_response = requests.post(f"{BASE_URL}/api/v1/create-invoice", json=invoice_data, headers=headers)
print(f"Invoice response: {json.dumps(invoice_response.json(), indent=2)}")

if invoice_response.status_code == 200:
    session_id = invoice_response.json()["session_id"]
    
    # Simulate payment completion
    print("\n3. Completing payment...")
    complete_data = {
        "session_id": session_id,
        "test_uuid": "test-" + str(int(time.time()))
    }
    
    complete_response = requests.post(f"{BASE_URL}/api/v1/test/complete-payment", json=complete_data)
    print(f"Complete payment response: {json.dumps(complete_response.json(), indent=2)}")