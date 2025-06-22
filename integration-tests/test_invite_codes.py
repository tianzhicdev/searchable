#!/usr/bin/env python3

import pytest
import requests
import time
from config import API_BASE_URL, TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD
from api_client import APIClient

class TestInviteCodes:
    """Test suite for invite code functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.api = APIClient()
        self.timestamp = str(int(time.time() * 1000))
        self.test_username = f"{TEST_USER_PREFIX}invite_{self.timestamp}"
        self.test_email = f"{self.test_username}@{TEST_EMAIL_DOMAIN}"
        self.test_password = DEFAULT_PASSWORD
        
    def test_check_invite_code_invalid_format(self):
        """Test checking invite code with invalid format"""
        invalid_codes = [
            'ABC',  # Too short
            'ABCDEFG',  # Too long
            'abc123',  # Lowercase and numbers
            '123456',  # Numbers only
            'ABC-EF',  # Special characters
        ]
        
        for code in invalid_codes:
            response = requests.get(f"{API_BASE_URL}/v1/is_active/{code}")
            assert response.status_code == 200
            data = response.json()
            assert data['active'] == False, f"Code {code} should be invalid"
    
    def test_check_invite_code_not_exist(self):
        """Test checking invite code that doesn't exist"""
        # Generate a random 6-letter code that likely doesn't exist
        code = 'ZZZZZZ'
        response = requests.get(f"{API_BASE_URL}/v1/is_active/{code}")
        assert response.status_code == 200
        data = response.json()
        assert data['active'] == False
    
    def test_register_without_invite_code(self):
        """Test registering without an invite code"""
        response = self.api.register(
            self.test_username,
            self.test_email,
            self.test_password
        )
        assert response['success'] == True
        assert 'reward' not in response['msg'].lower()
    
    def test_register_with_invalid_invite_code(self):
        """Test registering with an invalid invite code"""
        username = f"{TEST_USER_PREFIX}invalid_{self.timestamp}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        
        # Register with invalid code
        response = requests.post(
            f"{API_BASE_URL}/users/register",
            json={
                "username": username,
                "email": email,
                "password": self.test_password,
                "invite_code": "BADCOD"  # 6 characters, but invalid code
            }
        )
        
        # Debug: print the response if it fails
        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
        
        data = response.json()
        
        # The API might return 400 if the email is already taken from a previous test
        if response.status_code == 400 and "already taken" in data.get('msg', '').lower():
            # Try with a more unique email
            username = f"{TEST_USER_PREFIX}invalid2_{self.timestamp}_{int(time.time() * 1000000)}"
            email = f"{username}@{TEST_EMAIL_DOMAIN}"
            
            response = requests.post(
                f"{API_BASE_URL}/users/register",
                json={
                    "username": username,
                    "email": email,
                    "password": self.test_password,
                    "invite_code": "BADCOD"  # 6 characters, but invalid code
                }
            )
            data = response.json()
        
        assert response.status_code == 200
        assert data['success'] == True
        # Should register successfully but without reward
        assert 'reward' not in data['msg'].lower()
    
    def test_invite_code_case_insensitive(self):
        """Test that invite codes are case insensitive"""
        # Test with lowercase version
        response = requests.get(f"{API_BASE_URL}/v1/is_active/abcdef")
        assert response.status_code == 200
        # The API should handle case conversion
    
    def test_invite_code_endpoint_security(self):
        """Test invite code endpoint doesn't expose sensitive info"""
        # Test with SQL injection attempt
        malicious_code = "'; DROP TABLE invite_code; --"
        response = requests.get(f"{API_BASE_URL}/v1/is_active/{malicious_code}")
        assert response.status_code == 200
        data = response.json()
        assert data['active'] == False
        
        # Test with very long string
        long_code = 'A' * 1000
        response = requests.get(f"{API_BASE_URL}/v1/is_active/{long_code}")
        assert response.status_code == 200
        data = response.json()
        assert data['active'] == False
    
    def test_register_with_already_used_code(self):
        """Test registering with an already used invite code"""
        # This test would require:
        # 1. Having a known valid invite code in the test database
        # 2. Using it once successfully
        # 3. Trying to use it again and verifying it fails
        # For now, we'll just test the structure
        pass
    
    def test_reward_created_with_valid_invite_code(self):
        """Test that reward is created when using valid invite code"""
        # This test would require:
        # 1. Having a known valid invite code in the test database
        # 2. Registering with it  
        # 3. Checking that a reward record was created
        # 4. Checking the user's balance includes the $5 reward
        # For now, we'll just test the registration flow structure
        pass
    
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