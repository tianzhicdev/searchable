from flask_restx import Resource
from . import rest_api
from .routes import token_required
from flask import request
import requests
import time
from psycopg2.extras import Json
from .routes import get_db_connection
from .helper import (
    get_amount_to_withdraw, 
    get_balance_by_currency, 
    pay_lightning_invoice, 
    execute_sql, 
    setup_logger,
    create_withdrawal
)

# Set up the logger
logger = setup_logger(__name__, 'searchable_v1_withdrawal.log')

@rest_api.route('/api/v1/withdrawal-usdt', methods=['POST'])
class WithdrawFundsUSDT(Resource):
    """
    Processes a USDT withdrawal request
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

        try:
            # Check user balance
            current_balance = get_balance_by_currency(current_user.id)['usdt']
            
            if current_balance < amount:
                return {
                    "error": "Insufficient funds", 
                    "available_balance": current_balance, 
                    "withdrawal_amount": amount
                }, 400
            
            # Generate a unique transaction ID for this withdrawal
            tx_id = f"usdt-{current_user.id}-{int(time.time())}"
            
            # Prepare withdrawal metadata
            withdrawal_metadata = {
                'address': address,
                'timestamp': int(time.time()),
                'original_amount': amount
            }
            
            # Create withdrawal record
            withdrawal = create_withdrawal(
                user_id=current_user.id,
                amount=amount,
                currency='usdt',
                withdrawal_type='bank_transfer',  # or whatever type is appropriate
                external_id=tx_id,
                metadata=withdrawal_metadata
            )
            
            if withdrawal:
                logger.info(f"USDT withdrawal created with ID: {withdrawal['id']}")
                return {"success": True, "msg": "Withdrawal request submitted successfully", "withdrawal_id": withdrawal['id']}, 200
            else:
                return {"error": "Failed to create withdrawal record"}, 500

        except Exception as e:
            logger.error(f"Failed to process USDT withdrawal: {str(e)}")
            return {"error": f"Failed to process withdrawal: {str(e)}"}, 500

@rest_api.route('/api/v1/withdrawal-sats', methods=['POST'])
class WithdrawFunds(Resource):
    """
    Processes a sats withdrawal request via Lightning Network
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
            
            # TODO: add a bit for fees
            if current_balance < amount_to_withdraw:
                return {
                    "error": "Insufficient funds", 
                    "available_balance": current_balance, 
                    "withdrawal_amount": amount_to_withdraw
                }, 400
            
            # Prepare withdrawal metadata
            withdrawal_metadata = {
                'lightning_invoice': invoice,
                'timestamp': int(time.time()),
                'original_amount': amount_to_withdraw
            }
            
            # Create withdrawal record
            withdrawal = create_withdrawal(
                user_id=current_user.id,
                amount=amount_to_withdraw,
                currency='sats',
                withdrawal_type='lightning',
                external_id=invoice,
                metadata=withdrawal_metadata
            )
            
            if withdrawal:
                logger.info(f"Sats withdrawal created with ID: {withdrawal['id']}")
                return {"recorded": True, "status": "pending", "withdrawal_id": withdrawal['id']}, 200
            else:
                return {"error": "Failed to create withdrawal record"}, 500
            
        except Exception as e:
            logger.error(f"Error processing sats withdrawal: {str(e)}")
            return {"error": str(e)}, 500
        