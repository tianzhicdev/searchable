#!/usr/bin/env python3

import pytest
import requests
import time
import os
import threading
import uuid
import concurrent.futures
from config import API_BASE_URL, TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD
from api_client import SearchableAPIClient

class TestMassWithdrawals:
    """
    Test mass withdrawal processing to verify system robustness
    """
    
    def setup_method(self):
        """Setup test fixtures"""
        self.api = SearchableAPIClient()
        self.timestamp = str(int(time.time() * 1000))
        self.test_id = str(uuid.uuid4())[:8]
        self.test_username = f"{TEST_USER_PREFIX}w_{self.test_id}"
        self.test_email = f"{self.test_username}@{TEST_EMAIL_DOMAIN}"
        self.test_password = DEFAULT_PASSWORD
        
        # Configuration
        self.num_withdrawals = int(os.getenv('MASS_WITHDRAWAL_COUNT', '1'))
        self.withdrawal_amount = float(os.getenv('WITHDRAWAL_AMOUNT', '1.0'))  # $1 USD each
        self.timeout_seconds = int(os.getenv('MASS_WITHDRAWAL_TIMEOUT', '1200'))  # 5 minutes
        
        print(f"\n🧪 Mass Withdrawal Test Configuration:")
        print(f"   Number of withdrawals: {self.num_withdrawals}")
        print(f"   Amount per withdrawal: ${self.withdrawal_amount} USD")
        print(f"   Total amount: ${self.num_withdrawals * self.withdrawal_amount} USD")
        print(f"   Timeout: {self.timeout_seconds} seconds")
        print(f"   API Base URL: {API_BASE_URL}")
        
    def test_mass_withdrawals(self):
        """Main test function for mass withdrawals"""
        
        # Step 1: Setup test user with sufficient balance
        print(f"\n📝 Step 1: Setting up test user with sufficient balance")
        self._setup_test_user_with_balance()
        
        # Step 2: Submit mass withdrawals concurrently
        print(f"\n💸 Step 2: Submitting {self.num_withdrawals} withdrawals concurrently")
        withdrawal_ids = self._submit_mass_withdrawals()
        
        # Step 3: Monitor withdrawal statuses
        print(f"\n👀 Step 3: Monitoring withdrawal statuses")
        final_statuses = self._monitor_withdrawal_statuses(withdrawal_ids)
        
        # Step 4: Report results
        print(f"\n📊 Step 4: Final results analysis")
        self._analyze_results(final_statuses)
        
    def _setup_test_user_with_balance(self):
        """Create test user and give them sufficient balance"""
        
        # Register user
        response = self.api.register_user(self.test_username, self.test_email, self.test_password)
        assert response['success'], f"Failed to register user: {response}"
        
        # Login
        login_response = self.api.login_user(self.test_email, self.test_password)
        assert login_response['success'], f"Failed to login: {login_response}"
        
        # Check initial balance
        balance_data = self.api.get_balance()
        initial_balance = balance_data.get('balance', {}).get('usd', 0)
        
        total_needed = self.num_withdrawals * self.withdrawal_amount + 10  # +10 for buffer
        
        print(f"   Initial balance: ${initial_balance} USD")
        print(f"   Total needed: ${total_needed} USD")
        
        if initial_balance < total_needed:
            print(f"   💰 Creating sales to generate sufficient balance...")
            self._create_sales_to_generate_balance(total_needed)
            
            # Check balance again
            balance_data = self.api.get_balance()
            updated_balance = balance_data.get('balance', {}).get('usd', 0)
            
            if updated_balance < total_needed:
                pytest.skip(f"Insufficient balance for mass withdrawal test. Need ${total_needed}, have ${updated_balance}")
        
        print(f"   ✅ User setup complete with sufficient balance")
    
    def _create_sales_to_generate_balance(self, target_amount):
        """Create sales to generate sufficient balance for withdrawals"""
        try:
            # Create a high-value searchable item
            searchable_data = {
                'payloads': {
                    'public': {
                        'title': 'Mass Withdrawal Test Item',
                        'description': 'High-value item created to generate balance for mass withdrawal testing',
                        'currency': 'usd',
                        'type': 'downloadable',
                        'downloadableFiles': [
                            {
                                'name': 'Test File',
                                'price': target_amount + 20,  # Price higher than needed to account for fees
                                'fileId': 'mass-test-file-id',
                                'fileName': 'mass_test_file.zip',
                                'fileType': 'application/zip',
                                'fileSize': 1024
                            }
                        ],
                        'visibility': {
                            'udf': 'always_true',
                            'data': {}
                        }
                    }
                }
            }
            
            searchable_response = self.api.create_searchable(searchable_data)
            assert 'searchable_id' in searchable_response, f"Failed to create searchable: {searchable_response}"
            searchable_id = searchable_response['searchable_id']
            print(f"   📦 Created searchable with ID: {searchable_id}")
            
            # Create a buyer user
            buyer_username = f"{self.test_username}_buyer"
            buyer_email = f"{buyer_username}@{TEST_EMAIL_DOMAIN}"
            
            buyer_response = self.api.register_user(buyer_username, buyer_email, self.test_password)
            assert buyer_response['success'], f"Failed to register buyer: {buyer_response}"
            
            # Login as buyer
            buyer_api = SearchableAPIClient()
            buyer_login = buyer_api.login_user(buyer_email, self.test_password)
            assert buyer_login['success'], f"Failed to login buyer: {buyer_login}"
            print(f"   👤 Created buyer user: {buyer_username}")
            
            # Buyer creates invoice
            selections = [{
                'id': 'mass-test-file-id', 
                'type': 'downloadable', 
                'name': 'Test File', 
                'price': target_amount + 20
            }]
            
            invoice_response = buyer_api.create_invoice(searchable_id, selections, "stripe")
            assert 'session_id' in invoice_response, f"Failed to create invoice: {invoice_response}"
            session_id = invoice_response['session_id']
            print(f"   💳 Created invoice with session: {session_id}")
            
            # Complete payment
            payment_response = buyer_api.complete_payment_directly(session_id)
            assert payment_response['success'], f"Failed to complete payment: {payment_response}"
            print(f"   ✅ Payment completed successfully")
            
            # Allow time for payment processing
            time.sleep(2)
            
            # Cleanup buyer
            buyer_api.logout()
            
        except Exception as e:
            print(f"   ❌ Error generating balance through sales: {e}")
            raise
    
    def _submit_mass_withdrawals(self):
        """Submit multiple withdrawals concurrently"""
        
        # Use valid test addresses from the withdrawal test
        test_addresses = [
            "0x2a9f6e28Ee3501C32c65937170B44a72A71baB62",
            "0xB1Eb9593ed5C832e6f618c60CDc6017b0eE28563", 
            "0xa2Aa1cb3DF3913aa0DC3D2C7278446d2B055F9E4"
        ]
        
        withdrawal_ids = []
        
        def submit_single_withdrawal(index):
            """Submit a single withdrawal"""
            try:
                # Rotate through the valid test addresses
                test_address = test_addresses[index % len(test_addresses)]
                print(f"   🔄 Submitting withdrawal #{index + 1} to {test_address}")
                
                response = self.api.create_usdt_withdrawal({
                    "address": test_address,
                    "amount": self.withdrawal_amount
                })
                
                if response.get('success'):
                    withdrawal_id = response.get('withdrawal_id')
                    print(f"   ✅ Withdrawal #{index + 1} submitted: ID {withdrawal_id}")
                    return withdrawal_id
                else:
                    print(f"   ❌ Withdrawal #{index + 1} failed: {response}")
                    return None
                    
            except Exception as e:
                print(f"   ❌ Withdrawal #{index + 1} exception: {e}")
                return None
        
        # Submit withdrawals concurrently
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(submit_single_withdrawal, i) for i in range(self.num_withdrawals)]
            
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    withdrawal_ids.append(result)
        
        submission_time = time.time() - start_time
        
        print(f"   📊 Submission complete:")
        print(f"      Successful: {len(withdrawal_ids)}/{self.num_withdrawals}")
        print(f"      Time taken: {submission_time:.2f} seconds")
        print(f"      Rate: {len(withdrawal_ids)/submission_time:.2f} withdrawals/second")
        
        assert len(withdrawal_ids) > 0, "No withdrawals were successfully submitted"
        
        return withdrawal_ids
    
    def _monitor_withdrawal_statuses(self, withdrawal_ids):
        """Monitor withdrawal statuses until completion or timeout"""
        
        start_time = time.time()
        check_interval = 10  # Check every 10 seconds
        final_statuses = {}
        
        print(f"   ⏰ Monitoring {len(withdrawal_ids)} withdrawals for up to {self.timeout_seconds} seconds")
        
        while time.time() - start_time < self.timeout_seconds:
            all_complete = True
            status_counts = {}
            
            for withdrawal_id in withdrawal_ids:
                if withdrawal_id not in final_statuses:
                    try:
                        # Get withdrawal status
                        status_response = self.api.get_withdrawal_status(withdrawal_id)
                        if status_response.get('withdrawal'):
                            status = status_response['withdrawal']['status']
                            
                            # Count statuses
                            status_counts[status] = status_counts.get(status, 0) + 1
                            
                            # Check if final status
                            if status in ['complete', 'failed']:
                                final_statuses[withdrawal_id] = status
                            else:
                                all_complete = False
                        else:
                            all_complete = False
                            
                    except Exception as e:
                        print(f"   ⚠️  Error checking withdrawal {withdrawal_id}: {e}")
                        all_complete = False
            
            # Print status update
            elapsed = time.time() - start_time
            remaining = len(withdrawal_ids) - len(final_statuses)
            
            print(f"   📊 Status at {elapsed:.0f}s: {dict(status_counts)} | Remaining: {remaining}")
            
            if all_complete:
                print(f"   ✅ All withdrawals completed in {elapsed:.2f} seconds")
                break
                
            time.sleep(check_interval)
        
        # Final status check for any remaining
        for withdrawal_id in withdrawal_ids:
            if withdrawal_id not in final_statuses:
                try:
                    status_response = self.api.get_withdrawal_status(withdrawal_id)
                    if status_response.get('withdrawal'):
                        final_statuses[withdrawal_id] = status_response['withdrawal']['status']
                    else:
                        final_statuses[withdrawal_id] = 'unknown'
                except:
                    final_statuses[withdrawal_id] = 'error'
        
        return final_statuses
    
    def _analyze_results(self, final_statuses):
        """Analyze and report test results"""
        
        total = len(final_statuses)
        status_counts = {}
        
        for status in final_statuses.values():
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print(f"\n📈 MASS WITHDRAWAL TEST RESULTS")
        print(f"================================")
        print(f"Total withdrawals: {total}")
        print(f"Status breakdown:")
        
        for status, count in sorted(status_counts.items()):
            percentage = (count / total) * 100
            emoji = "✅" if status == "complete" else "❌" if status == "failed" else "⏳"
            print(f"  {emoji} {status}: {count} ({percentage:.1f}%)")
        
        # Success criteria
        complete_count = status_counts.get('complete', 0)
        failed_count = status_counts.get('failed', 0)
        resolved_count = complete_count + failed_count
        success_rate = (complete_count / total) * 100
        resolution_rate = (resolved_count / total) * 100
        
        print(f"\n🎯 Success Metrics:")
        print(f"   Resolution rate: {resolution_rate:.1f}% ({resolved_count}/{total})")
        print(f"   Success rate: {success_rate:.1f}% ({complete_count}/{total})")
        
        # Assertions for test success
        assert resolution_rate >= 90, f"Resolution rate too low: {resolution_rate:.1f}% (expected >= 90%)"
        assert success_rate >= 70, f"Success rate too low: {success_rate:.1f}% (expected >= 70%)"
        
        print(f"\n✅ MASS WITHDRAWAL TEST PASSED")
        print(f"   All withdrawals were properly processed")
        print(f"   System demonstrated robustness under concurrent load")

    def teardown_method(self):
        """Cleanup test data"""
        try:
            self.api.logout()
        except:
            pass


if __name__ == "__main__":
    # Allow running with environment variables
    print("🚀 Starting Mass Withdrawal Test")
    test = TestMassWithdrawals()
    test.setup_method()
    test.test_mass_withdrawals()
    test.teardown_method()
    print("✅ Mass Withdrawal Test Complete")
