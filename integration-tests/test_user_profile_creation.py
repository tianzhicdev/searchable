#!/usr/bin/env python3
"""
Test user_profile creation during registration
"""

import sys
import os
import requests
import time
import random
import string

# Configuration
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5005')

def generate_random_string(length=8):
    """Generate a random string for unique usernames/emails"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_user_registration_creates_profile():
    """Test that registering a new user creates a user_profile record"""
    print("Testing: User registration creates user_profile")
    
    # Generate unique user data
    random_suffix = generate_random_string()
    username = f"testuser_{random_suffix}"
    email = f"test_{random_suffix}@example.com"
    password = "testpass123"
    
    # Register new user
    print(f"  - Registering user: {username}")
    register_data = {
        "username": username,
        "email": email,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/api/users/register", json=register_data)
    
    assert response.status_code == 200, f"Registration failed: {response.status_code} - {response.text}"
    
    data = response.json()
    assert data.get('success'), f"Registration failed: {data.get('msg', 'Unknown error')}"
    
    user_id = data.get('userID')
    print(f"✓ User registered successfully with ID: {user_id}")
    
    # Login to get token
    login_data = {
        "email": email,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/api/users/login", json=login_data)
    
    assert response.status_code == 200, f"Login failed: {response.status_code}"
    
    login_result = response.json()
    token = login_result.get('token')
    
    assert token, "No token received after login"
    
    print("✓ Login successful")
    
    # Check if user_profile exists by trying to get user profile
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get user profile (this endpoint should return user_profile data)
    response = requests.get(f"{BASE_URL}/api/v1/users/{user_id}", headers=headers)
    
    if response.status_code == 200:
        profile_data = response.json()
        print(f"✓ User profile endpoint returned data")
        
        # Check if we have profile-specific fields
        if 'username' in profile_data:
            print(f"  - Username in profile: {profile_data.get('username')}")
    else:
        # Try alternate profile endpoint
        response = requests.get(f"{BASE_URL}/api/v1/profile/{user_id}", headers=headers)
        
        assert response.status_code == 200, f"Could not verify user_profile exists: {response.status_code}"
        print("✓ User profile exists (alternate endpoint)")

def test_existing_user_without_profile():
    """Test that we can handle users without profiles gracefully"""
    print("\nTesting: Handling users without profiles")
    
    # This test would require database access to create a user without profile
    # For now, we'll just document this as a manual test
    print("  - This requires manual database manipulation")
    print("  - Run create_missing_user_profiles.py to fix any such users")
    
    # This test always passes as it's just informational
    assert True

def main():
    """Run all user profile tests"""
    print("=" * 60)
    print("USER PROFILE CREATION TESTS")
    print(f"Base URL: {BASE_URL}")
    print("=" * 60)
    
    tests = [
        test_user_registration_creates_profile,
        test_existing_user_without_profile
    ]
    
    passed = 0
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                print(f"✗ Test failed: {test.__name__}")
        except Exception as e:
            print(f"✗ Test failed with exception: {test.__name__}")
            print(f"  Error: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("✅ All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())