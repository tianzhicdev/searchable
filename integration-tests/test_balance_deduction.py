"""
Test that balance payments are properly deducted from user balance
"""
import pytest
import uuid
import time
import json
from api_client import APIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestBalanceDeduction:
    """Test that balance payments properly deduct from user balance"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with API client and test data"""
        cls.client = APIClient()
        cls.test_id = str(uuid.uuid4())[:8]
        cls.test_password = DEFAULT_PASSWORD
    
    def create_test_deposit(self, user_id, amount):
        """Helper to create a completed deposit for testing"""
        # This simulates a deposit being completed
        # In production, this would happen through USDT blockchain monitoring
        import psycopg2
        from psycopg2.extras import Json
        
        conn = psycopg2.connect(
            host="localhost",
            port=5433,
            database="searchable",
            user="searchable",
            password="searchable"
        )
        cur = conn.cursor()
        
        # Insert a completed deposit
        cur.execute("""
            INSERT INTO deposit (user_id, amount, currency, address, status, metadata)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING deposit_id
        """, (
            user_id,
            amount,
            'USDT',
            f'0xtest{uuid.uuid4().hex[:20]}',
            'complete',
            Json({'test': True, 'test_id': self.test_id})
        ))
        
        deposit_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return deposit_id
    
    def test_balance_payment_deduction(self):
        """Test that balance payments are properly deducted from balance"""
        # 1. Register and login seller
        seller_username = f"seller_deduct_{self.test_id}"
        seller_email = f"{seller_username}@{TEST_EMAIL_DOMAIN}"
        seller_resp = self.client.register(seller_username, seller_email, self.test_password)
        seller_id = seller_resp.get('userID')
        self.client.login_user(seller_email, self.test_password)
        
        # Create a searchable item as seller
        searchable_data = {
            "payloads": {
                "private": {},
                "public": {
                    "title": f"Test Item for Balance Deduction {self.test_id}",
                    "description": "Item to test balance payment deduction",
                    "type": "direct",
                    "defaultAmount": 25.00
                }
            }
        }
        create_resp = self.client.create_searchable(searchable_data)
        searchable_id = create_resp.get('searchable_id')
        
        # 2. Register and login buyer
        buyer_username = f"buyer_deduct_{self.test_id}"
        buyer_email = f"{buyer_username}@{TEST_EMAIL_DOMAIN}"
        buyer_resp = self.client.register(buyer_username, buyer_email, self.test_password)
        buyer_id = buyer_resp.get('userID')
        self.client.login_user(buyer_email, self.test_password)
        
        # 3. Check initial balance (should be 0)
        initial_balance_resp = self.client.get_balance()
        initial_balance = initial_balance_resp['balance']['usd']
        assert initial_balance == 0, f"Initial balance should be 0, got {initial_balance}"
        print(f"✅ Initial balance: ${initial_balance}")
        
        # 4. Add balance via deposit
        deposit_amount = 100.00
        self.create_test_deposit(buyer_id, deposit_amount)
        
        # 5. Check balance after deposit
        balance_after_deposit_resp = self.client.get_balance()
        balance_after_deposit = balance_after_deposit_resp['balance']['usd']
        assert balance_after_deposit == deposit_amount, f"Balance after deposit should be {deposit_amount}, got {balance_after_deposit}"
        print(f"✅ Balance after deposit: ${balance_after_deposit}")
        
        # 6. Make a balance payment
        payment_amount = 25.00
        balance_invoice_data = {
            "searchable_id": searchable_id,
            "invoice_type": "balance",
            "selections": [{
                "amount": payment_amount,
                "type": "direct"
            }]
        }
        
        payment_resp = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json=balance_invoice_data,
            timeout=10
        )
        
        assert payment_resp.status_code == 200, f"Balance payment failed: {payment_resp.text}"
        payment_data = payment_resp.json()
        assert payment_data.get('success') == True
        print(f"✅ Balance payment successful for ${payment_amount}")
        
        # 7. Check balance after payment - THIS IS THE KEY TEST
        balance_after_payment_resp = self.client.get_balance()
        balance_after_payment = balance_after_payment_resp['balance']['usd']
        expected_balance = balance_after_deposit - payment_amount
        
        assert balance_after_payment == expected_balance, \
            f"Balance after payment should be {expected_balance}, got {balance_after_payment}. " \
            f"Payment of ${payment_amount} was not deducted from balance!"
        
        print(f"✅ Balance after payment: ${balance_after_payment} (correctly deducted ${payment_amount})")
        
        # 8. Make another payment to further verify
        second_payment_amount = 30.00
        balance_invoice_data['selections'][0]['amount'] = second_payment_amount
        
        second_payment_resp = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json=balance_invoice_data,
            timeout=10
        )
        
        assert second_payment_resp.status_code == 200, f"Second balance payment failed: {second_payment_resp.text}"
        
        # 9. Check final balance
        final_balance_resp = self.client.get_balance()
        final_balance = final_balance_resp['balance']['usd']
        expected_final_balance = expected_balance - second_payment_amount
        
        assert final_balance == expected_final_balance, \
            f"Final balance should be {expected_final_balance}, got {final_balance}. " \
            f"Second payment of ${second_payment_amount} was not deducted!"
        
        print(f"✅ Final balance: ${final_balance} (correctly deducted total ${payment_amount + second_payment_amount})")
        
        # 10. Try to make a payment that exceeds balance
        excessive_payment_amount = 50.00  # More than remaining balance
        balance_invoice_data['selections'][0]['amount'] = excessive_payment_amount
        
        excessive_payment_resp = self.client.session.post(
            f"{self.client.base_url}/v1/create-balance-invoice",
            json=balance_invoice_data,
            timeout=10
        )
        
        assert excessive_payment_resp.status_code == 400, "Payment exceeding balance should fail"
        error_data = excessive_payment_resp.json()
        assert "Insufficient balance" in error_data.get('error', '')
        assert error_data.get('balance') == final_balance
        assert error_data.get('required') == excessive_payment_amount
        
        print(f"✅ Correctly rejected payment of ${excessive_payment_amount} (balance: ${final_balance})")
        
        print("\n🎉 All balance deduction tests passed!")
        print(f"Summary: Started with $0, deposited ${deposit_amount}, ")
        print(f"paid ${payment_amount} + ${second_payment_amount} = ${payment_amount + second_payment_amount}, ")
        print(f"ending balance ${final_balance}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])