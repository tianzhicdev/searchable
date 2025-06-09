#!/usr/bin/env python3
"""
Quick debug script to test individual API endpoints
Run this to debug specific issues with the API
"""

import requests
import json
from config import API_BASE_URL

def test_endpoint(method, endpoint, data=None, headers=None, params=None):
    """Test a single API endpoint"""
    url = f"{API_BASE_URL}{endpoint}"
    print(f"\n{method.upper()} {url}")
    
    if params:
        print(f"Params: {params}")
    if data:
        print(f"Data: {json.dumps(data, indent=2)}")
    if headers:
        print(f"Headers: {headers}")
    
    try:
        if method.lower() == 'get':
            response = requests.get(url, params=params, headers=headers)
        elif method.lower() == 'post':
            response = requests.post(url, json=data, headers=headers)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        return response
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    print("=== API Debug Tool ===")
    print(f"Base URL: {API_BASE_URL}")
    
    # Test 1: Search without auth (might work)
    print("\n1. Testing search endpoint without auth...")
    test_endpoint('GET', '/v1/searchable/search', params={'q': 'test', 'page': 1})
    
    # Test 2: Registration
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    print(f"\n2. Testing user registration with unique ID: {unique_id}...")
    test_data = {
        "username": f"debug_user_{unique_id}",
        "email": f"debug_user_{unique_id}@test.com",
        "password": "TestPassword123!"
    }
    response = test_endpoint('POST', '/users/register', data=test_data)
    
    if response and response.status_code == 200:
        # Test 3: Login
        print("\n3. Testing user login...")
        login_data = {
            "email": f"debug_user_{unique_id}@test.com",
            "password": "TestPassword123!"
        }
        login_response = test_endpoint('POST', '/users/login', data=login_data)
        
        if login_response and login_response.status_code == 200:
            try:
                login_result = login_response.json()
                token = login_result.get('token')
                
                if token:
                    print(f"\n✓ Got token: {token[:20]}...")
                    
                    # Test 4: Profile with auth
                    print("\n4. Testing profile endpoint with auth...")
                    headers = {'authorization': token}
                    test_endpoint('GET', '/v1/terminal', headers=headers)
                    
                    # Test 5: Search with auth
                    print("\n5. Testing search with auth...")
                    test_endpoint('GET', '/v1/searchable/search', 
                                params={'q': 'test', 'page': 1}, headers=headers)
                    
            except Exception as e:
                print(f"Error parsing login response: {e}")

if __name__ == "__main__":
    main()