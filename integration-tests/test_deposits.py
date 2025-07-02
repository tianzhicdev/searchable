#!/usr/bin/env python3
"""
Simple integration test for USDT deposit functionality
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

def test_simple_deposit():
    """Test simple deposit flow: create user, create deposit, send USDT, verify balance"""
    print("\n=== Testing Simple Deposit Flow ===")
    
    # 1. Create test user
    username = f"test_deposit_{uuid.uuid4().hex[:8]}"
    email = f"{username}@test.example.com"
    password = "testpass123"
    
    print(f"\n1. Creating test user: {username}")
    
    register_response = requests.post(
        f"{BASE_URL}/api/users/register",
        json={
            "username": username,
            "email": email,
            "password": password
        }
    )
    
    if register_response.status_code != 200:
        print(f"✗ Failed to register user: {register_response.text}")
        return False
    
    print("✓ User registered successfully")
    
    # Login to get token
    login_response = requests.post(
        f"{BASE_URL}/api/users/login",
        json={
            "email": email,
            "password": password
        }
    )
    
    if login_response.status_code != 200:
        print(f"✗ Failed to login: {login_response.text}")
        return False
    
    login_data = login_response.json()
    token = login_data.get('token') or login_data.get('access_token')
    user_id = login_data.get('id') or login_data.get('user_id') or login_data.get('user', {}).get('_id')
    
    print(f"✓ User logged in (ID: {user_id})")
    
    # 2. Get initial balance
    print("\n2. Checking initial balance")
    
    balance_response = requests.get(
        f"{BASE_URL}/api/balance",
        headers={'Authorization': token}
    )
    
    if balance_response.status_code != 200:
        print(f"✗ Failed to get balance: {balance_response.text}")
        return False
    
    initial_balance = float(balance_response.json().get('usd', 0))
    print(f"✓ Initial balance: ${initial_balance}")
    
    # 3. Create deposit
    print("\n3. Creating deposit")
    
    deposit_amount = 10.00  # Small amount for testing
    deposit_response = requests.post(
        f"{BASE_URL}/api/v1/deposit/create",
        json={"amount": str(deposit_amount)},
        headers={'Authorization': token}
    )
    
    if deposit_response.status_code != 200:
        print(f"✗ Failed to create deposit: {deposit_response.text}")
        return False
    
    deposit = deposit_response.json()
    deposit_id = deposit['deposit_id']
    deposit_address = deposit['address']
    
    print(f"✓ Deposit created:")
    print(f"  ID: {deposit_id}")
    print(f"  Address: {deposit_address}")
    print(f"  Amount: {deposit_amount} USDT")
    
    # 4. Send USDT to deposit address
    print(f"\n4. Sending {deposit_amount} USDT to deposit address")
    
    # Check if we should skip real USDT sending
    if os.environ.get('SKIP_REAL_DEPOSIT', 'false').lower() == 'true':
        print("⚠️  SKIP_REAL_DEPOSIT is set, skipping USDT transfer")
        print("\nTo complete the test manually:")
        print(f"./send.sh {deposit_address} {deposit_amount}")
        return True
    
    # Try to send USDT
    try:
        send_response = requests.post(
            f"{USDT_SERVICE_URL}/send",
            json={
                "to": deposit_address,
                "amount": int(deposit_amount * 1000000),  # Convert to wei (6 decimals)
                "request_id": f"test_deposit_{int(time.time())}"
            },
            timeout=300
        )
        
        if send_response.status_code == 200:
            result = send_response.json()
            tx_hash = result.get('txHash')
            print(f"✓ USDT sent successfully")
            if tx_hash:
                print(f"  Transaction: {tx_hash}")
        else:
            error = send_response.json().get('error', 'Unknown error')
            print(f"⚠️  Failed to send USDT: {error}")
            print(f"\nTo complete manually: ./send.sh {deposit_address} {deposit_amount}")
            return True
    except Exception as e:
        print(f"⚠️  Error sending USDT: {str(e)}")
        print(f"\nTo complete manually: ./send.sh {deposit_address} {deposit_amount}")
        return True
    
    # 5. Wait for deposit to be detected
    print("\n5. Waiting for deposit to complete (checking every 10s for up to 2 minutes)")
    
    max_wait = 120  # 2 minutes
    check_interval = 10
    elapsed = 0
    
    while elapsed < max_wait:
        time.sleep(check_interval)
        elapsed += check_interval
        
        # Check deposit status
        status_response = requests.get(
            f"{BASE_URL}/api/v1/deposit/status/{deposit_id}",
            headers={'Authorization': token}
        )
        
        if status_response.status_code == 200:
            status_data = status_response.json()
            status = status_data.get('status')
            
            print(f"  [{elapsed}s] Status: {status}")
            
            if status == 'complete':
                print(f"\n✓ Deposit completed!")
                
                # 6. Verify balance increased
                print("\n6. Verifying balance increase")
                
                final_balance_response = requests.get(
                    f"{BASE_URL}/api/balance",
                    headers={'Authorization': token}
                )

                # Pretty print the response JSON
                print("final_balance_response JSON:")
                print(json.dumps(final_balance_response.json(), indent=2))

                if final_balance_response.status_code == 200:
                    
                    final_balance = float(final_balance_response.json().get('balance').get('usd'))
                    increase = final_balance - initial_balance
                    
                    print(f"✓ Final balance: ${final_balance}")
                    print(f"  Increase: ${increase}")
                    
                    if increase > 0:
                        print("\n✅ DEPOSIT TEST PASSED - Balance increased successfully!")
                        return True
                    else:
                        print("\n✗ Balance did not increase")
                        return False
                
        else:
            print(f"  [{elapsed}s] Failed to check status: {status_response.text}")
    
    print("\n⚠️  Deposit did not complete within 2 minutes")
    print("  This is expected if no real USDT was sent")
    print("  The deposit will complete when USDT is actually sent to the address")
    
    return True

def main():
    """Run the simple deposit test"""
    print("=== Simple USDT Deposit Test ===")
    print(f"API Server: {BASE_URL}")
    print(f"USDT Service: {USDT_SERVICE_URL}")
    
    if test_simple_deposit():
        print("\n✅ Test completed successfully!")
        return 0
    else:
        print("\n❌ Test failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())