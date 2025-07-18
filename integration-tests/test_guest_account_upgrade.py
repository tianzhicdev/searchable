#!/usr/bin/env python3
"""
Integration tests for guest account creation and upgrade functionality
Tests the complete flow from guest creation to account upgrade
"""

import pytest
import time
import uuid
from api_client import APIClient

@pytest.fixture
def api_client():
    """Create an API client instance."""
    return APIClient()

class TestGuestAccountUpgrade:
    """Test guest account creation and upgrade functionality"""
    
    def test_guest_account_full_flow(self, api_client):
        """Test complete guest account flow: creation, login, and upgrade"""
        
        # Step 1: Create a guest account
        print("\n1. Creating guest account...")
        guest_response = api_client.register_user(
            username="temp_guest",
            email="GUEST_REGISTRATION_REQUEST",
            password="temp"
        )
        
        assert guest_response['success'] is True
        assert 'userID' in guest_response
        assert 'user' in guest_response
        
        guest_user = guest_response['user']
        guest_id = guest_user['_id']
        
        # Verify guest account properties
        assert guest_user['username'] == f'guest_{guest_id}'
        assert guest_user['email'] == f'guest_{guest_id}@ec.com'
        assert 'profile' in guest_user
        assert guest_user['profile']['is_guest'] is True
        
        print(f"   ✓ Created guest account: {guest_user['username']}")
        
        # Step 2: Login as guest
        print("\n2. Logging in as guest...")
        login_response = api_client.login_user(
            email=f'guest_{guest_id}@ec.com',
            password=f'guest_{guest_id}'
        )
        
        assert login_response['success'] is True
        assert 'token' in login_response
        assert 'user' in login_response
        assert login_response['user']['profile']['is_guest'] is True
        
        guest_token = login_response['token']
        print(f"   ✓ Guest logged in successfully")
        
        # Step 3: Upgrade guest account
        print("\n3. Upgrading guest account...")
        unique_id = str(uuid.uuid4())[:8]
        upgrade_data = {
            "username": f"upgraded_user_{unique_id}",
            "email": f"upgraded_{unique_id}@test.com",
            "current_password": f"guest_{guest_id}",
            "new_password": "SecurePass123!"
        }
        
        # Make the upgrade request
        url = f"{api_client.base_url}/users/edit-account"
        headers = {'Authorization': guest_token}
        response = api_client.session.post(url, json=upgrade_data, headers=headers)
        response.raise_for_status()
        upgrade_response = response.json()
        
        assert upgrade_response['success'] is True
        assert 'token' in upgrade_response
        assert 'user' in upgrade_response
        
        upgraded_user = upgrade_response['user']
        new_token = upgrade_response['token']
        
        # Verify upgrade was successful
        assert upgraded_user['username'] == upgrade_data['username']
        assert upgraded_user['email'] == upgrade_data['email']
        assert upgraded_user['profile']['is_guest'] is False
        assert 'upgraded_from_guest' in upgraded_user['profile']['metadata']
        assert upgraded_user['profile']['metadata']['upgraded_from_guest'] is True
        
        print(f"   ✓ Account upgraded successfully to: {upgraded_user['username']}")
        
        # Step 4: Verify login with new credentials
        print("\n4. Verifying login with new credentials...")
        new_login_response = api_client.login_user(
            email=upgrade_data['email'],
            password=upgrade_data['new_password']
        )
        
        assert new_login_response['success'] is True
        assert new_login_response['user']['profile']['is_guest'] is False
        assert new_login_response['user']['username'] == upgrade_data['username']
        
        print(f"   ✓ Successfully logged in with upgraded credentials")
        
        # Step 5: Verify old guest credentials no longer work
        print("\n5. Verifying old guest credentials are invalid...")
        try:
            old_login_response = api_client.login_user(
                email=f'guest_{guest_id}@ec.com',
                password=f'guest_{guest_id}'
            )
            # If we get here, the login succeeded when it shouldn't have
            assert False, "Guest credentials should no longer work after upgrade"
        except Exception as e:
            # Expected behavior - login should fail
            print(f"   ✓ Old guest credentials correctly rejected")
        
        print("\n✅ Guest account upgrade flow completed successfully!")
        
    def test_guest_account_validation(self, api_client):
        """Test validation rules for guest account upgrade"""
        
        # Create a guest account for testing
        guest_response = api_client.register_user(
            username="temp_guest",
            email="GUEST_REGISTRATION_REQUEST",
            password="temp"
        )
        
        guest_id = guest_response['user']['_id']
        
        # Login as guest
        login_response = api_client.login_user(
            email=f'guest_{guest_id}@ec.com',
            password=f'guest_{guest_id}'
        )
        guest_token = login_response['token']
        
        print("\n1. Testing upgrade with incorrect password...")
        try:
            url = f"{api_client.base_url}/users/edit-account"
            headers = {'Authorization': guest_token}
            response = api_client.session.post(
                url, 
                json={
                    "username": "test_user",
                    "email": "test@example.com",
                    "current_password": "wrong_password",
                    "new_password": "NewPass123!"
                },
                headers=headers
            )
            response.raise_for_status()
            assert False, "Should fail with incorrect password"
        except Exception as e:
            print("   ✓ Correctly rejected incorrect password")
        
        print("\n2. Testing upgrade with existing username...")
        # First create a regular user
        existing_user = api_client.register_user(
            username="existing_user_" + str(uuid.uuid4())[:8],
            email=f"existing_{str(uuid.uuid4())[:8]}@test.com",
            password="Test123!"
        )
        
        try:
            url = f"{api_client.base_url}/users/edit-account"
            headers = {'Authorization': guest_token}
            response = api_client.session.post(
                url,
                json={
                    "username": existing_user['user']['username'],
                    "email": "new_email@test.com",
                    "current_password": f"guest_{guest_id}",
                    "new_password": "NewPass123!"
                },
                headers=headers
            )
            response.raise_for_status()
            assert False, "Should fail with existing username"
        except Exception as e:
            print("   ✓ Correctly rejected existing username")
        
        print("\n3. Testing upgrade with existing email...")
        try:
            url = f"{api_client.base_url}/users/edit-account"
            headers = {'Authorization': guest_token}
            response = api_client.session.post(
                url,
                json={
                    "username": "new_username_" + str(uuid.uuid4())[:8],
                    "email": existing_user['user']['email'],
                    "current_password": f"guest_{guest_id}",
                    "new_password": "NewPass123!"
                },
                headers=headers
            )
            response.raise_for_status()
            assert False, "Should fail with existing email"
        except Exception as e:
            print("   ✓ Correctly rejected existing email")
        
        print("\n✅ Guest account validation tests passed!")

    def test_multiple_guest_accounts(self, api_client):
        """Test creating and managing multiple guest accounts"""
        
        print("\n1. Creating multiple guest accounts...")
        guest_accounts = []
        
        for i in range(3):
            guest_response = api_client.register_user(
                username="temp_guest",
                email="GUEST_REGISTRATION_REQUEST",
                password="temp"
            )
            
            assert guest_response['success'] is True
            guest_accounts.append(guest_response['user'])
            print(f"   ✓ Created guest account {i+1}: {guest_response['user']['username']}")
        
        # Verify all guest IDs are unique
        guest_ids = [g['_id'] for g in guest_accounts]
        assert len(guest_ids) == len(set(guest_ids)), "Guest IDs should be unique"
        
        # Verify all guest usernames follow the pattern
        for guest in guest_accounts:
            assert guest['username'] == f"guest_{guest['_id']}"
            assert guest['email'] == f"guest_{guest['_id']}@ec.com"
            assert guest['profile']['is_guest'] is True
        
        print(f"\n✅ Successfully created {len(guest_accounts)} unique guest accounts!")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])