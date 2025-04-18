from flask_restx import Resource
from . import rest_api
from .routes import token_required
from flask import request
import requests
import time
from psycopg2.extras import Json
from .routes import get_db_connection
from .helper import get_amount_to_withdraw, get_balance_by_currency, pay_lightning_invoice, execute_sql

@rest_api.route('/api/v1/withdrawal-usdt', methods=['POST'])
class WithdrawFundsUSDT(Resource):
    """
    Processes a withdrawal request via Lightning Network
    """
    @token_required
    def post(self, current_user):
        address = request.json.get('address')
        amount = request.json.get('amount')
        # Validate inputs
        if not address or not amount:
            return {"error": "Address and amount are required"}, 400
            
        try:
            amount = float(amount)
            if amount <= 0:
                return {"error": "Amount must be greater than 0"}, 400
        except ValueError:
            return {"error": "Invalid amount format"}, 400
        
        USDT_DECIMALS = 6

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Generate a unique transaction ID for this withdrawal
            tx_id = f"usdt-{current_user.id}-{int(time.time())}"
            
            # Prepare withdrawal data with pending status
            withdrawal_data = {
                'invoice': tx_id,
                "tx_id": tx_id,
                'status': [('pending', int(time.time()))],
                'user_id': current_user.id,
                'amount': amount,
                'address': address,
                'currency': 'usdt'
            }
            
            # Store withdrawal record
            execute_sql(cur, f"""
                INSERT INTO kv (type, fkey, pkey, data)
                VALUES ('withdrawal', '{current_user.id}', '{tx_id}', {Json(withdrawal_data)})
                RETURNING pkey
            """, commit=True, connection=conn)
            cur.close()
            conn.close()

            return {"success": True, "msg": "Withdrawal request submitted successfully"}, 200
        except Exception as e:
            return {"error": f"Failed to process withdrawal: {str(e)}"}, 500

@rest_api.route('/api/v1/withdrawal-sats', methods=['POST'])
class WithdrawFunds(Resource):
    """
    Processes a withdrawal request via Lightning Network
    """
    @token_required
    def post(self, current_user):
        try:
            data = request.get_json()
            
            if not data or 'invoice' not in data:
                return {"error": "Lightning invoice is required"}, 400
            
            invoice = data['invoice']
            
            amount_to_withdraw = get_amount_to_withdraw(invoice)
            current_balance = get_balance_by_currency(current_user.id)['sats']
            
            # todo: add a bit for fees
            if current_balance < amount_to_withdraw:
                return {
                    "error": "Insufficient funds", 
                    "available_balance": current_balance, 
                    "withdrawal_amount": amount_to_withdraw
                }, 400
            
            # Record the withdrawal as pending in the database
            conn = get_db_connection()
            cur = conn.cursor()
            
            withdrawal_data = {
                'invoice': invoice,
                'status': [('pending', int(time.time()))],
                'user_id': current_user.id,
                'currency': 'sats',
                'amount': amount_to_withdraw
            }
    
            # Store withdrawal record
            execute_sql(cur, f"""
                INSERT INTO kv (type, fkey, pkey, data)
                VALUES ('withdrawal', '{current_user.id}', '{invoice}', {Json(withdrawal_data)})
                RETURNING pkey
            """, commit=True, connection=conn)
            cur.close()
            conn.close()
    
            return {"recorded": True, "status": "pending"}, 200
            
        except Exception as e:
            print(f"Error processing withdrawal: {str(e)}")
            return {"error": str(e)}, 500
        