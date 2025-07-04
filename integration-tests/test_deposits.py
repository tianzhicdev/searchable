#!/usr/bin/env python3
"""
Simple integration test for USDT deposit functionality
"""

import pytest
import time
import os
import random
from decimal import Decimal
from api_client import SearchableAPIClient

# USDT service configuration
USDT_SERVICE_URL = os.environ.get('USDT_SERVICE_URL', 'http://localhost:3100')

def test_simple_deposit():
    """Test simple deposit flow: create user, create deposit, send USDT, verify balance"""
    
    # Create unique user
    test_id = f"{int(time.time())}_{random.randint(1000, 9999)}"
    username = f"test_dep_{test_id}"[:32]
    email = f"dep_{test_id}@test.example.com"
    password = "testpass123"
    
    client = SearchableAPIClient()
    
    print(f"\n1. Creating user: {username}")
    # Register user
    response = client.register_user(username=username, email=email, password=password)
    assert response['success'] is True
    print(f"   ✓ User created")
    
    # Login
    login_response = client.login_user(email, password)
    assert 'token' in login_response
    print(f"   ✓ Logged in")
    
    print(f"\n2. Checking initial balance")
    # Check initial balance
    balance_response = client.get_balance()
    initial_balance = float(balance_response['balance']['usd'])
    assert initial_balance == 0.0
    print(f"   ✓ Initial balance: ${initial_balance}")
    
    print(f"\n3. Creating deposit")
    # Create deposit
    deposit_amount = random.randint(1, 10)  # Random amount between 1-10 USDT
    deposit_data = client.create_deposit(str(deposit_amount))
    deposit_id = deposit_data['deposit_id']
    deposit_address = deposit_data['address']
    print(f"   ✓ Deposit {deposit_id} created")
    print(f"   ✓ Address: {deposit_address}")
    print(f"   ✓ Amount: {deposit_amount} USDT")
    
    # Skip if we're not doing real deposits
    if os.environ.get('SKIP_REAL_DEPOSIT', 'false').lower() == 'true':
        print("\n4. SKIP_REAL_DEPOSIT is set, skipping USDT transfer")
        pytest.skip("Skipping real USDT transfer")
    
    print(f"\n4. Sending {deposit_amount} USDT to deposit address {deposit_address}")
    # Send USDT
    try:
        import requests
        send_response = requests.post(
            f"{USDT_SERVICE_URL}/send",
            json={
                "to": deposit_address,
                "amount": int(deposit_amount * 1000000),  # Convert to wei (6 decimals)
                "request_id": f"test_{test_id}"
            },
            timeout=300
        )
        
        assert send_response.status_code == 200
        result = send_response.json()
        tx_hash = result.get('txHash')
        assert tx_hash is not None
        print(f"   ✓ USDT sent, tx: {tx_hash}")
        
    except Exception as e:
        pytest.fail(f"Failed to send USDT: {str(e)}")
    
    print(f"\n5. Waiting for deposit to be processed")
    # Wait for deposit to complete (check every 10 seconds, max 2 minutes)
    max_wait = 120
    check_interval = 10
    elapsed = 0
    
    while elapsed < max_wait:
        deposit_status = client.get_deposit_status(deposit_id)
        status = deposit_status.get('status')
        print(f"   Status: {status} (waited {elapsed}s)")
        
        if status == 'complete':
            print(f"   ✓ Deposit completed!")
            break
        
        time.sleep(check_interval)
        elapsed += check_interval
    else:
        pytest.fail(f"Deposit did not complete within {max_wait} seconds")
    
    print(f"\n6. Verifying balance")
    # Check final balance
    final_balance_response = client.get_balance()
    final_balance = float(final_balance_response['balance']['usd'])
    balance_increase = final_balance - initial_balance
    
    print(f"   Initial balance: ${initial_balance}")
    print(f"   Final balance: ${final_balance}")
    print(f"   Increase: ${balance_increase}")
    
    # Just verify we got some funds
    assert balance_increase > 0, "Balance did not increase"
    print(f"   ✓ Balance increased by ${balance_increase}")
    
    # Verify the deposit record
    assert deposit_status['status'] == 'complete'
    if 'tx_hash' in deposit_status:
        print(f"   ✓ Transaction hash recorded: {deposit_status['tx_hash']}")
    
    print(f"\n✅ Test completed successfully!")
    
    # Cleanup
    client.logout()


if __name__ == "__main__":
    # Run the test
    test_simple_deposit()