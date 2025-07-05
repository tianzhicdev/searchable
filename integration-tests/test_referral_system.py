#!/usr/bin/env python3

import pytest
import requests
import time
from config import API_BASE_URL, TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD
from api_client import APIClient
from db_helpers import insert_invite_code, check_reward_exists, check_invite_code_used

class TestReferralSystem:
    """Test suite for the new referral system functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.api = APIClient()
        self.timestamp = str(int(time.time() * 1000))
        self.referrer_username = f"{TEST_USER_PREFIX}referrer_{self.timestamp}"
        self.referrer_email = f"{self.referrer_username}@{TEST_EMAIL_DOMAIN}"
        self.test_password = DEFAULT_PASSWORD
        
    def test_user_can_generate_invite_code(self):
        """Test that authenticated users can generate their own invite codes"""
        # Register and login as referrer
        response = self.api.register(self.referrer_username, self.referrer_email, self.test_password)
        assert response['success'] == True
        self.referrer_id = response['userID']
        
        login_response = self.api.login(self.referrer_email, self.test_password)
        assert login_response['success'] == True
        
        # Generate invite code
        response = requests.post(
            f"{API_BASE_URL}/v1/generate-invite-code",
            headers={"authorization": self.api.token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'invite_code' in data
        assert len(data['invite_code']) == 6
        assert data['invite_code'].isupper()
        assert data['invite_code'].isalpha()
        
        self.generated_code = data['invite_code']
        print(f"Generated invite code: {self.generated_code}")
        
        # Try to generate another code - should get the same one
        response2 = requests.post(
            f"{API_BASE_URL}/v1/generate-invite-code",
            headers={"authorization": self.api.token}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2['success'] == True
        assert data2['invite_code'] == self.generated_code
        assert 'already have an active invite code' in data2['message']
        
    def test_referral_stats_endpoint(self):
        """Test the referral statistics endpoint"""
        # Register and login
        response = self.api.register(f"{self.referrer_username}_stats", f"{self.referrer_username}_stats@{TEST_EMAIL_DOMAIN}", self.test_password)
        assert response['success'] == True
        
        login_response = self.api.login(f"{self.referrer_username}_stats@{TEST_EMAIL_DOMAIN}", self.test_password)
        assert login_response['success'] == True
        
        # Get referral stats
        response = requests.get(
            f"{API_BASE_URL}/v1/referral-stats",
            headers={"authorization": self.api.token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'stats' in data
        assert 'referred_users' in data
        
        # Check stats structure
        stats = data['stats']
        assert 'total_referrals' in stats
        assert 'qualified_referrals' in stats
        assert 'pending_referrals' in stats
        assert 'total_rewards_earned' in stats
        assert 'times_code_used' in stats
        
        # New user should have 0 referrals
        assert stats['total_referrals'] == 0
        assert stats['qualified_referrals'] == 0
        assert stats['pending_referrals'] == 0
        assert stats['total_rewards_earned'] == 0.0
        
    def test_multi_use_invite_code_flow(self):
        """Test complete multi-use invite code flow"""
        # Register referrer
        response = self.api.register(f"{self.referrer_username}_flow", f"{self.referrer_username}_flow@{TEST_EMAIL_DOMAIN}", self.test_password)
        assert response['success'] == True
        referrer_id = response['userID']
        
        login_response = self.api.login(f"{self.referrer_username}_flow@{TEST_EMAIL_DOMAIN}", self.test_password)
        assert login_response['success'] == True
        
        # Generate invite code
        response = requests.post(
            f"{API_BASE_URL}/v1/generate-invite-code",
            headers={"authorization": self.api.token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        invite_code = data['invite_code']
        
        # Logout referrer
        self.api.logout()
        
        # Register multiple users with the invite code
        referred_users = []
        for i in range(2):
            username = f"{TEST_USER_PREFIX}referred{i}_{self.timestamp}"
            email = f"{username}@{TEST_EMAIL_DOMAIN}"
            
            response = requests.post(
                f"{API_BASE_URL}/users/register",
                json={
                    "username": username,
                    "email": email,
                    "password": self.test_password,
                    "invite_code": invite_code
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] == True
            # All users should get reward with multi-use code
            assert 'reward' in data['msg'].lower(), f"User {i+1} should get reward"
            
            referred_users.append({
                'id': data['userID'],
                'username': username,
                'email': email
            })
        
        # Login back as referrer and check stats
        login_response = self.api.login(f"{self.referrer_username}_flow@{TEST_EMAIL_DOMAIN}", self.test_password)
        assert login_response['success'] == True
        
        response = requests.get(
            f"{API_BASE_URL}/v1/referral-stats",
            headers={"authorization": self.api.token}
        )
        assert response.status_code == 200
        data = response.json()
        
        stats = data['stats']
        assert stats['total_referrals'] == 2
        assert stats['pending_referrals'] == 2  # No searchables created yet
        assert stats['qualified_referrals'] == 0
        assert stats['times_code_used'] == 2
        
        # Check referred users list
        assert len(data['referred_users']) == 2
        
    def test_unauthenticated_cannot_generate_code(self):
        """Test that unauthenticated users cannot generate invite codes"""
        response = requests.post(f"{API_BASE_URL}/v1/generate-invite-code")
        assert response.status_code == 401
        
    def test_unauthenticated_cannot_get_stats(self):
        """Test that unauthenticated users cannot get referral stats"""
        response = requests.get(f"{API_BASE_URL}/v1/referral-stats")
        assert response.status_code == 401
        
    def teardown_method(self):
        """Cleanup test data"""
        try:
            self.api.logout()
        except:
            pass

if __name__ == "__main__":
    pytest.main([__file__, "-v"])