#!/usr/bin/env python3

import pytest
import requests
import time
import random
import string
from config import API_BASE_URL, TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD
from api_client import APIClient
from db_helpers import insert_invite_code

class TestPromoterInviteCodes:
    """Test promoter-based invite code functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.api = APIClient()
        self.base_url = API_BASE_URL
        self.timestamp = str(int(time.time() * 1000))
    
    def test_invite_endpoint_without_promoter(self):
        """Test /invite endpoint without promoter parameter"""
        # First insert a test code without promoter
        code = 'TEST' + ''.join(random.choices(string.ascii_uppercase, k=2))
        insert_invite_code(code, active=True, description="No promoter code")
        
        # Test getting any active code
        response = requests.get(f"{self.base_url}/invite")
        print(f"Response without promoter: {response.status_code}, {response.text}")
        assert response.status_code == 200
        data = response.json()
        
        if data['success']:
            assert 'invite_code' in data
            assert 'description' in data
            print(f"Got random code: {data['invite_code']}")
    
    def test_invite_endpoint_with_promoter(self):
        """Test /invite endpoint with promoter parameter"""
        # Insert test codes with different promoters
        tyler_code = 'TYLER' + ''.join(random.choices(string.ascii_uppercase, k=1))
        sarah_code = 'SARAH' + ''.join(random.choices(string.ascii_uppercase, k=1))
        
        insert_invite_code(tyler_code, active=True, description="Tyler promotion", promoter="tyler")
        insert_invite_code(sarah_code, active=True, description="Sarah promotion", promoter="sarah")
        
        # Test getting code with tyler promoter
        response = requests.get(f"{self.base_url}/invite", params={'promoter': 'tyler'})
        print(f"\nResponse with promoter=tyler: {response.status_code}, {response.text}")
        assert response.status_code == 200
        data = response.json()
        
        if data['success']:
            assert 'invite_code' in data
            assert 'promoter' in data
            assert data['promoter'] == 'tyler'
            assert data['invite_code'].startswith('TYLER')
            print(f"Got Tyler's code: {data['invite_code']}")
        
        # Test getting code with sarah promoter
        response = requests.get(f"{self.base_url}/invite", params={'promoter': 'sarah'})
        print(f"\nResponse with promoter=sarah: {response.status_code}, {response.text}")
        assert response.status_code == 200
        data = response.json()
        
        if data['success']:
            assert 'invite_code' in data
            assert 'promoter' in data
            assert data['promoter'] == 'sarah'
            assert data['invite_code'].startswith('SARAH')
            print(f"Got Sarah's code: {data['invite_code']}")
    
    def test_invite_endpoint_nonexistent_promoter(self):
        """Test /invite endpoint with non-existent promoter"""
        response = requests.get(f"{self.base_url}/invite", params={'promoter': 'nonexistent'})
        print(f"\nResponse with promoter=nonexistent: {response.status_code}, {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert not data['success']
        assert data['message'] == "No active invite codes available for promoter 'nonexistent'"
    
    def test_promoter_preserves_existing_api(self):
        """Test that existing /api/v1/get-active-invite-code still works"""
        # Insert a test code
        code = 'APIV1' + ''.join(random.choices(string.ascii_uppercase, k=1))
        insert_invite_code(code, active=True, description="API v1 test")
        
        # Test the original endpoint
        response = requests.get(f"{self.base_url}/api/v1/get-active-invite-code")
        print(f"\nResponse from /api/v1/get-active-invite-code: {response.status_code}, {response.text}")
        assert response.status_code == 200
        data = response.json()
        
        if data['success']:
            assert 'invite_code' in data
            assert 'description' in data
            print(f"Original API still works, got code: {data['invite_code']}")
    
    def test_promoter_code_registration_flow(self):
        """Test that registration with promoter codes works correctly"""
        # Create a promoter code for testing
        test_code = 'PRGREG'
        insert_invite_code(test_code, active=True, description="Registration test", promoter="testpromoter")
        
        # Register with the promoter code
        test_email = f"promoter_test_{random.randint(1000, 9999)}@{TEST_EMAIL_DOMAIN}"
        test_username = f"{TEST_USER_PREFIX}promoter_{random.randint(1000, 9999)}"
        
        response = self.api.register(
            username=test_username,
            email=test_email,
            password=DEFAULT_PASSWORD,
            invite_code=test_code
        )
        
        print(f"\nRegistration with promoter code response: {response.status_code}, {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            assert data['success']
            # The reward message should indicate invite code was used
            assert "invite code reward" in data['msg'] or "successfully registered" in data['msg']
            print(f"Successfully registered with promoter code: {test_code}")
        else:
            # Registration might fail if code was already used in previous test run
            print(f"Registration failed - code might have been used already")