#!/usr/bin/env python3

import pytest
import requests
import time
from config import API_BASE_URL, TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD
from api_client import APIClient
from db_helpers import insert_invite_code, check_reward_exists, check_invite_code_used

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
        # Generate a unique invite code for this test (6 uppercase letters only)
        import string
        # Convert timestamp to letters by using modulo on alphabet
        ts_suffix = ''.join([string.ascii_uppercase[int(d) % 26] for d in str(self.timestamp)[-3:]])
        test_code = f'TST{ts_suffix}'[:6].ljust(6, 'A')
        
        # Insert the invite code into the database
        if not insert_invite_code(test_code, active=True, description="test code"):
            pytest.fail(f"Failed to insert test invite code: {test_code}")
        
        # Register first user with the invite code
        username1 = f"{TEST_USER_PREFIX}used1_{self.timestamp}"
        email1 = f"{username1}@{TEST_EMAIL_DOMAIN}"
        
        response1 = requests.post(
            f"{API_BASE_URL}/users/register",
            json={
                "username": username1,
                "email": email1,
                "password": self.test_password,
                "invite_code": test_code
            }
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1['success'] == True
        assert 'reward' in data1['msg'].lower()
        
        # Try to register second user with the same (now used) invite code
        username2 = f"{TEST_USER_PREFIX}used2_{self.timestamp}"
        email2 = f"{username2}@{TEST_EMAIL_DOMAIN}"
        
        response2 = requests.post(
            f"{API_BASE_URL}/users/register",
            json={
                "username": username2,
                "email": email2,
                "password": self.test_password,
                "invite_code": test_code
            }
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2['success'] == True
        # Second user should NOT get reward since code is already used
        assert 'reward' not in data2['msg'].lower()
    
    def test_reward_created_with_valid_invite_code(self):
        """Test that reward is created when using valid invite code"""
        
        # Generate a unique invite code for this test (use timestamp to avoid conflicts)
        import string
        # Convert timestamp to letters by using modulo on alphabet
        ts_suffix = ''.join([string.ascii_uppercase[int(d) % 26] for d in str(self.timestamp)[-3:]])
        test_code = f'REW{ts_suffix}'[:6].ljust(6, 'X')
        
        # Insert the invite code into the database
        if not insert_invite_code(test_code, active=True, description="reward test code"):
            pytest.fail(f"Failed to insert test invite code: {test_code}")
        
        # Register user with the invite code
        username = f"{TEST_USER_PREFIX}reward_{self.timestamp}"
        email = f"{username}@{TEST_EMAIL_DOMAIN}"
        
        response = requests.post(
            f"{API_BASE_URL}/users/register",
            json={
                "username": username,
                "email": email,
                "password": self.test_password,
                "invite_code": test_code
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'reward' in data['msg'].lower()
        
        user_id = data['userID']
        
        # Check that a reward record was created in the database
        if not check_reward_exists(user_id, amount=5.0, currency='usd'):
            pytest.fail(f"No reward record found for user {user_id}")
        
        # Verify the invite code is now marked as inactive/used
        code_status = check_invite_code_used(test_code, expected_user_id=user_id)
        assert code_status['is_used'] == True, f"Invite code {test_code} should be marked as used"
        assert code_status['used_by_user_id'] == user_id, f"Invite code should be used by user {user_id}"
        assert code_status['active'] == False, f"Invite code {test_code} should be inactive"
        
        # Verify user's balance reflects the $5 reward
        login_response = self.api.login(email, self.test_password)
        assert login_response['success'] == True, "Should be able to login with new user"
        
        # Get user balance to verify $5 reward was added
        balance_data = self.api.get_balance()
        
        # Check that USD balance is $5.00 from the invite reward
        usd_balance = balance_data.get('balance', {}).get('usd', 0)
        assert usd_balance == 5.0, f"User balance should be $5.00 from invite reward, but got ${usd_balance}"
    
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