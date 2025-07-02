#!/usr/bin/env python3
"""
Integration tests for USDT deposit functionality
"""

import pytest
import uuid
import time
import json
import os
from decimal import Decimal
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD

# USDT service configuration
USDT_SERVICE_URL = os.environ.get('USDT_SERVICE_URL', 'http://localhost:3100')


class TestDepositOperations:
    """Test deposit operations including USDT deposits"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class"""
        cls.test_id = str(uuid.uuid4())[:8]
        cls.username = f"{TEST_USER_PREFIX}deposit_{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        cls.client = SearchableAPIClient()
        cls.user_id = None
        cls.created_deposits = []
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        if cls.client.token:
            cls.client.logout()
    
    def wait_for_deposit_completion(self, deposit_id, max_wait_seconds=120):
        """
        Wait for a deposit to complete
        Returns the final deposit status
        """
        start_time = time.time()
        while time.time() - start_time < max_wait_seconds:
            try:
                deposit_data = self.client.get_deposit_status(deposit_id)
                status = deposit_data.get('status', 'unknown')
                
                print(f"[DEBUG] Deposit {deposit_id} status: {status}")
                
                if status == 'complete':
                    return deposit_data
                elif status == 'failed':
                    print(f"[DEBUG] Deposit {deposit_id} failed")
                    return deposit_data
                elif status == 'pending':
                    # Still pending, wait a bit more
                    time.sleep(10)
                    continue
                else:
                    pytest.fail(f"Unknown deposit status: {status}")
                    
            except Exception as e:
                print(f"[DEBUG] Error checking deposit status: {e}")
                time.sleep(10)
                continue
        
        # If we get here, we timed out - but for deposits this might be expected
        # if no actual USDT was sent
        print(f"[DEBUG] Deposit {deposit_id} did not complete within {max_wait_seconds} seconds")
        return None
    
    def test_01_register_and_login(self):
        """Register and login test user"""
        # Register user
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        print(f"[RESPONSE] Register user: {response}")
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        
        # Login user
        login_response = self.client.login_user(self.email, self.password)
        print(f"[RESPONSE] Login user: {login_response}")
        assert isinstance(login_response, dict)
        assert 'token' in login_response
        assert isinstance(login_response['token'], str)
        assert len(login_response['token']) > 0
        assert 'user' in login_response
        assert isinstance(login_response['user'], dict)
        assert '_id' in login_response['user']
        self.user_id = login_response['user']['_id']
    
    def test_02_check_initial_balance(self):
        """Check initial balance is zero"""
        balance_response = self.client.get_balance()
        print(f"[RESPONSE] Initial balance: {balance_response}")
        
        assert isinstance(balance_response, dict)
        assert 'balance' in balance_response
        assert 'usd' in balance_response['balance']
        
        initial_balance = float(balance_response['balance']['usd'])
        assert initial_balance == 0.0, f"Expected initial balance to be 0, got {initial_balance}"
    
    def test_03_create_deposit(self):
        """Create a deposit request"""
        deposit_amount = "10.00"
        
        deposit_data = self.client.create_deposit(deposit_amount)
        print(f"[RESPONSE] Create deposit: {deposit_data}")
        
        assert 'deposit_id' in deposit_data
        assert 'address' in deposit_data
        assert 'amount' in deposit_data
        assert deposit_data['amount'] == deposit_amount
        
        # Save deposit info for later tests
        self.deposit_id = deposit_data['deposit_id']
        self.deposit_address = deposit_data['address']
        self.deposit_amount = float(deposit_amount)
        self.created_deposits.append(self.deposit_id)
        
        print(f"[DEBUG] Created deposit {self.deposit_id} with address {self.deposit_address}")
    
    def test_04_list_deposits(self):
        """List user deposits"""
        deposits_data = self.client.get_deposits()
        print(f"[RESPONSE] List deposits: {deposits_data}")
        
        assert 'deposits' in deposits_data
        assert isinstance(deposits_data['deposits'], list)
        assert len(deposits_data['deposits']) > 0
        
        # Find our created deposit
        found = False
        for deposit in deposits_data['deposits']:
            if deposit['deposit_id'] == self.deposit_id:
                found = True
                assert deposit['status'] == 'pending'
                assert deposit['address'] == self.deposit_address
                break
        
        assert found, f"Deposit {self.deposit_id} not found in list"
    
    def test_05_send_usdt_and_verify_balance(self):
        """Send USDT to deposit address and verify balance increase"""
        
        # Check if we should skip real USDT sending
        if os.environ.get('SKIP_REAL_DEPOSIT', 'false').lower() == 'true':
            print("[DEBUG] SKIP_REAL_DEPOSIT is set, skipping USDT transfer test")
            pytest.skip("SKIP_REAL_DEPOSIT environment variable is set")
        
        # Get initial balance
        initial_balance_response = self.client.get_balance()
        initial_balance = float(initial_balance_response['balance']['usd'])
        print(f"[DEBUG] Initial balance: ${initial_balance}")
        
        # Try to send USDT
        print(f"[DEBUG] Attempting to send {self.deposit_amount} USDT to {self.deposit_address}")
        
        try:
            import requests
            send_response = requests.post(
                f"{USDT_SERVICE_URL}/send",
                json={
                    "to": self.deposit_address,
                    "amount": int(self.deposit_amount * 1000000),  # Convert to wei (6 decimals)
                    "request_id": f"test_deposit_{int(time.time())}"
                },
                timeout=300
            )
            
            if send_response.status_code != 200:
                error = send_response.json().get('error', 'Unknown error') if send_response.status_code < 500 else send_response.text
                pytest.fail(f"Failed to send USDT: {error}")
            
            result = send_response.json()
            tx_hash = result.get('txHash')
            
            if not tx_hash:
                pytest.fail("No transaction hash returned from USDT send")
            
            print(f"[DEBUG] USDT sent successfully, tx_hash: {tx_hash}")
            
        except requests.exceptions.Timeout:
            pytest.fail("USDT send request timed out after 300 seconds")
        except Exception as e:
            pytest.fail(f"Error sending USDT: {str(e)}")
        
        # Wait for deposit to complete
        print(f"[DEBUG] Waiting for deposit to complete...")
        final_deposit = self.wait_for_deposit_completion(self.deposit_id, max_wait_seconds=120)
        
        if not final_deposit:
            pytest.fail("Deposit did not complete within timeout period")
        
        assert final_deposit['status'] == 'complete', f"Expected deposit status 'complete', got '{final_deposit['status']}'"
        
        # Verify balance increased
        print("[DEBUG] Verifying balance increase...")
        time.sleep(5)  # Give a bit more time for balance to update
        
        final_balance_response = self.client.get_balance()
        final_balance = float(final_balance_response['balance']['usd'])
        balance_increase = final_balance - initial_balance
        
        print(f"[DEBUG] Final balance: ${final_balance}, increase: ${balance_increase}")
        
        assert balance_increase > 0, f"Balance did not increase. Initial: ${initial_balance}, Final: ${final_balance}"
        
        # The actual deposited amount might be slightly different due to gas fees or rounding
        # So we check if it's reasonably close (within 10%)
        if abs(balance_increase - self.deposit_amount) > (self.deposit_amount * 0.1):
            pytest.fail(f"Balance increase ${balance_increase} significantly different from expected ${self.deposit_amount}")
    
    def test_06_deposit_expiration(self):
        """Test deposit expiration time"""
        # Create another deposit
        deposit_data = self.client.create_deposit("50.00")
        print(f"[RESPONSE] Create deposit for expiration test: {deposit_data}")
        
        assert 'expires_at' in deposit_data
        assert 'created_at' in deposit_data
        
        # Parse timestamps
        from datetime import datetime
        created = datetime.fromisoformat(deposit_data['created_at'].replace('Z', '+00:00'))
        expires = datetime.fromisoformat(deposit_data['expires_at'].replace('Z', '+00:00'))
        
        # Check expiration is approximately 23 hours (allowing some margin)
        time_diff = expires - created
        hours_diff = time_diff.total_seconds() / 3600
        
        assert 22.5 < hours_diff < 23.5, f"Incorrect expiration time: {hours_diff:.1f} hours"
        
        print(f"[DEBUG] Deposit expires in {hours_diff:.1f} hours")
    
    def test_07_hd_wallet_consistency(self):
        """Test that HD wallet generates consistent addresses"""
        # Create multiple deposits and verify addresses are deterministic
        deposit_addresses = {}
        
        for i in range(3):
            deposit_data = self.client.create_deposit("25.00")
            
            deposit_id = deposit_data['deposit_id']
            address = deposit_data['address']
            deposit_addresses[deposit_id] = address
            
            print(f"[DEBUG] Deposit {deposit_id}: {address}")
            
            # Verify address format
            assert address.startswith('0x'), "Address should start with 0x"
            assert len(address) == 42, "Address should be 42 characters long"
        
        # Call USDT service directly to verify addresses are deterministic
        import requests
        for deposit_id, expected_address in deposit_addresses.items():
            response = requests.post(
                f"{USDT_SERVICE_URL}/receive",
                json={"deposit_id": deposit_id}
            )
            
            assert response.status_code == 200, f"Failed to verify address generation: {response.text}"
            
            data = response.json()
            assert data['address'] == expected_address, f"Address mismatch for deposit {deposit_id}"
        
        print("[DEBUG] HD wallet address generation is consistent")


if __name__ == "__main__":
    # Run with pytest
    pytest.main([__file__, "-v"])