#!/usr/bin/env python3
"""Create a test user for download testing"""

import requests
import json
import sys

BASE_URL = "http://localhost:5005"

# Create a test user
signup_data = {
    "username": "testdownload",
    "email": "testdownload@example.com",
    "password": "testpass123"
}

print("Creating test user...")
signup_response = requests.post(f"{BASE_URL}/api/users/register", json=signup_data)
print(f"Status: {signup_response.status_code}")
print(f"Response: {signup_response.text}")

if signup_response.status_code == 200:
    print("User created successfully!")
else:
    print("Failed to create user")
    sys.exit(1)