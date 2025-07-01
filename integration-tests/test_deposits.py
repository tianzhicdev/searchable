#!/usr/bin/env python3
"""
Integration tests for USDT deposit functionality
"""

import os
import sys
import requests
import time
import json
import uuid
from decimal import Decimal

# Configuration
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5005')
USDT_SERVICE_URL = os.environ.get('USDT_SERVICE_URL', 'http://localhost:3100')

def create_test_user(username_suffix=""):
    """Create a test user and return auth info"""
    username = f"test_deposit_{username_suffix}_{uuid.uuid4().hex[:8]}"
    email = f"{username}@test.example.com"
    password = "testpass123"
    
    # Register user
    register_data = {
        "username": username,
        "email": email,
        "password": password
    }
    
    register_response = requests.post(
        f"{BASE_URL}/api/users/register",
        json=register_data
    )
    
    if register_response.status_code != 200:
        raise Exception(f"Failed to register user: {register_response.text}")
    
    # Login
    login_data = {
        "email": email,
        "password": password
    }
    
    login_response = requests.post(
        f"{BASE_URL}/api/users/login",
        json=login_data
    )
    
    if login_response.status_code != 200:
        raise Exception(f"Failed to login: {login_response.text}")
    
    login_result = login_response.json()
    
    # Handle different response formats
    user_id = login_result.get('id') or login_result.get('user_id') or login_result.get('user', {}).get('_id')
    token = login_result.get('token') or login_result.get('access_token')
    
    if not user_id or not token:
        raise Exception(f"Unexpected login response format: {login_result}")
    
    return {
        'token': token,
        'user_id': user_id,
        'username': username,
        'email': email
    }

def get_auth_header(token):
    """Get authorization header"""
    return {'Authorization': token}

def test_create_deposit():
    """Test creating a deposit request"""
    print("\n=== Testing Deposit Creation ===")
    
    user = create_test_user("create")
    
    # Test 1: Create valid deposit
    print("Creating deposit request...")
    deposit_data = {
        "amount": "100.50"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/deposit/create",
        json=deposit_data,
        headers=get_auth_header(user['token'])
    )
    
    if response.status_code != 200:
        print(f"✗ Failed to create deposit: {response.text}")
        return False
    
    deposit = response.json()
    print(f"✓ Deposit created with ID: {deposit['deposit_id']}")
    print(f"  Address: {deposit['address']}")
    print(f"  Amount: {deposit['amount']} USDT")
    print(f"  Expires at: {deposit['expires_at']}")
    
    # Test 2: Check deposit status
    print("\nChecking deposit status...")
    status_response = requests.get(
        f"{BASE_URL}/api/v1/deposit/status/{deposit['deposit_id']}",
        headers=get_auth_header(user['token'])
    )
    
    if status_response.status_code != 200:
        print(f"✗ Failed to get deposit status: {status_response.text}")
        return False
    
    status = status_response.json()
    print(f"✓ Deposit status: {status['status']}")
    
    # Test 3: Test minimum amount validation
    print("\nTesting minimum amount validation...")
    invalid_deposit = {
        "amount": "5.00"  # Below minimum
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/deposit/create",
        json=invalid_deposit,
        headers=get_auth_header(user['token'])
    )
    
    if response.status_code == 400:
        print("✓ Correctly rejected deposit below minimum amount")
    else:
        print("✗ Should have rejected deposit below minimum amount")
        return False
    
    return True

def test_deposit_list():
    """Test listing user deposits"""
    print("\n=== Testing Deposit List ===")
    
    user = create_test_user("list")
    
    # Create multiple deposits
    amounts = ["50.00", "100.00", "200.00"]
    deposit_ids = []
    
    for amount in amounts:
        response = requests.post(
            f"{BASE_URL}/api/v1/deposit/create",
            json={"amount": amount},
            headers=get_auth_header(user['token'])
        )
        
        if response.status_code == 200:
            deposit_ids.append(response.json()['deposit_id'])
    
    print(f"Created {len(deposit_ids)} deposits")
    
    # List deposits
    list_response = requests.get(
        f"{BASE_URL}/api/v1/deposits",
        headers=get_auth_header(user['token'])
    )
    
    if list_response.status_code != 200:
        print(f"✗ Failed to list deposits: {list_response.text}")
        return False
    
    deposits = list_response.json()
    print(f"✓ Retrieved {len(deposits['deposits'])} deposits")
    print(f"  Total: {deposits['total']}")
    
    # Verify all created deposits are in the list
    listed_ids = [d['deposit_id'] for d in deposits['deposits']]
    for dep_id in deposit_ids:
        if dep_id in listed_ids:
            print(f"✓ Found deposit {dep_id} in list")
        else:
            print(f"✗ Deposit {dep_id} not found in list")
            return False
    
    return True

def test_deposit_balance_integration():
    """Test that completed deposits affect user balance"""
    print("\n=== Testing Deposit Balance Integration ===")
    
    user = create_test_user("balance")
    
    # Get initial balance
    balance_response = requests.get(
        f"{BASE_URL}/api/balance",
        headers=get_auth_header(user['token'])
    )
    
    if balance_response.status_code != 200:
        print(f"✗ Failed to get balance: {balance_response.text}")
        return False
    
    initial_balance = balance_response.json()
    print(f"Initial balance: ${initial_balance.get('usd', 0)}")
    
    # Create a deposit (it won't be complete yet, so balance shouldn't change)
    deposit_response = requests.post(
        f"{BASE_URL}/api/v1/deposit/create",
        json={"amount": "100.00"},
        headers=get_auth_header(user['token'])
    )
    
    if deposit_response.status_code != 200:
        print(f"✗ Failed to create deposit: {deposit_response.text}")
        return False
    
    deposit = deposit_response.json()
    print(f"✓ Created deposit {deposit['deposit_id']} for 100 USDT")
    
    # Check balance again (should be unchanged since deposit is pending)
    balance_response = requests.get(
        f"{BASE_URL}/api/balance",
        headers=get_auth_header(user['token'])
    )
    
    if balance_response.status_code != 200:
        print(f"✗ Failed to get balance: {balance_response.text}")
        return False
    
    pending_balance = balance_response.json()
    
    if pending_balance.get('usd', 0) == initial_balance.get('usd', 0):
        print("✓ Balance correctly unchanged for pending deposit")
    else:
        print("✗ Balance changed for pending deposit")
        return False
    
    # Note: In a real test, we would:
    # 1. Send actual USDT to the deposit address
    # 2. Wait for the background job to detect it
    # 3. Verify the balance increased
    
    print("✓ Deposit balance integration test passed (pending state)")
    return True

def test_deposit_expiration():
    """Test deposit expiration logic"""
    print("\n=== Testing Deposit Expiration ===")
    
    user = create_test_user("expire")
    
    # Create a deposit
    deposit_response = requests.post(
        f"{BASE_URL}/api/v1/deposit/create",
        json={"amount": "50.00"},
        headers=get_auth_header(user['token'])
    )
    
    if deposit_response.status_code != 200:
        print(f"✗ Failed to create deposit: {deposit_response.text}")
        return False
    
    deposit = deposit_response.json()
    print(f"✓ Created deposit {deposit['deposit_id']}")
    print(f"  Expires at: {deposit['expires_at']}")
    
    # In a real test, we would wait 23 hours or manipulate the database
    # For now, just verify the expiration time is set correctly
    import datetime
    created = datetime.datetime.fromisoformat(deposit['created_at'].replace('Z', '+00:00'))
    expires = datetime.datetime.fromisoformat(deposit['expires_at'].replace('Z', '+00:00'))
    
    time_diff = expires - created
    hours_diff = time_diff.total_seconds() / 3600
    
    if 22.5 < hours_diff < 23.5:  # Allow some margin
        print(f"✓ Expiration time correctly set to ~23 hours ({hours_diff:.1f} hours)")
    else:
        print(f"✗ Incorrect expiration time: {hours_diff:.1f} hours")
        return False
    
    return True

def test_usdt_service_integration():
    """Test USDT service address generation"""
    print("\n=== Testing USDT Service Integration ===")
    
    # Test the USDT service directly
    print("Testing USDT service /receive endpoint...")
    
    try:
        response = requests.post(f"{USDT_SERVICE_URL}/receive")
        
        if response.status_code != 200:
            print(f"✗ USDT service error: {response.text}")
            return False
        
        data = response.json()
        
        if 'address' in data and data['address'].startswith('0x'):
            print(f"✓ Generated address: {data['address']}")
        else:
            print("✗ Invalid address format")
            return False
        
        # Test balance check for new address (should be 0)
        print("\nChecking balance for new address...")
        balance_response = requests.get(
            f"{USDT_SERVICE_URL}/balance/{data['address']}"
        )
        
        if balance_response.status_code != 200:
            print(f"✗ Balance check failed: {balance_response.text}")
            return False
        
        balance_data = balance_response.json()
        # Handle different balance response formats
        if 'formatted' in balance_data:
            print(f"✓ Balance: {balance_data['formatted']} USDT")
        elif 'balance' in balance_data:
            print(f"✓ Balance: {balance_data['balance']} USDT (raw)")
        else:
            print(f"✓ Balance response: {balance_data}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to USDT service")
        print("  Make sure USDT service is running on port 3100")
        return False

def main():
    """Run all deposit tests"""
    print("=== USDT Deposit Integration Tests ===")
    print(f"Testing against: {BASE_URL}")
    print(f"USDT Service: {USDT_SERVICE_URL}")
    
    tests = [
        ("USDT Service Integration", test_usdt_service_integration),
        ("Create Deposit", test_create_deposit),
        ("List Deposits", test_deposit_list),
        ("Balance Integration", test_deposit_balance_integration),
        ("Deposit Expiration", test_deposit_expiration)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
                print(f"\n✅ {test_name} PASSED")
            else:
                failed += 1
                print(f"\n❌ {test_name} FAILED")
        except Exception as e:
            failed += 1
            print(f"\n❌ {test_name} FAILED with error: {str(e)}")
    
    print(f"\n{'='*50}")
    print(f"Total: {len(tests)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n✅ All deposit tests passed!")
        return 0
    else:
        print(f"\n❌ {failed} deposit tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())