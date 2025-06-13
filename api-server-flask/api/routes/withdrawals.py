# Withdrawal routes
import time
from flask import request
from flask_restx import Resource

# Import from our new structure
from .. import rest_api
from .auth import token_required
from ..common.data_helpers import (
    get_balance_by_currency,
    create_withdrawal
)
from ..common.models import PaymentStatus, Currency
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'withdrawals.log')

@rest_api.route('/api/v1/withdrawal-usd', methods=['POST'])
class WithdrawFundsUSD(Resource):
    """
    Processes a USD withdrawal request
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
            current_balance = get_balance_by_currency(current_user.id)['usd']
            
            if current_balance < amount:
                return {
                    "error": "Insufficient funds", 
                    "available_balance": current_balance, 
                    "withdrawal_amount": amount
                }, 400
            
            # Calculate withdrawal fee (0.1%)
            withdrawal_fee = amount * 0.001  # 0.1%
            
            # Generate a unique transaction ID for this withdrawal
            tx_id = f"usd-{current_user.id}-{int(time.time())}"
            
            # Prepare withdrawal metadata
            withdrawal_metadata = {
                'address': address,
                'timestamp': int(time.time()),
                'original_amount': amount,
                'fee_percentage': 0.1,
                'amount_after_fee': amount - withdrawal_fee
            }
            
            # Create withdrawal record with fee
            withdrawal = create_withdrawal(
                user_id=current_user.id,
                amount=amount,
                fee=withdrawal_fee,
                currency=Currency.USD.value,
                withdrawal_type='bank_transfer',
                external_id=tx_id,
                metadata=withdrawal_metadata
            )
            
            if withdrawal:
                logger.info(f"USD withdrawal created with ID: {withdrawal['id']}, amount: {amount}, fee: {withdrawal_fee}")
                return {
                    "success": True, 
                    "msg": "Withdrawal request submitted successfully", 
                    "withdrawal_id": withdrawal['id'],
                    "amount": amount,
                    "fee": withdrawal_fee,
                    "amount_after_fee": amount - withdrawal_fee
                }, 200
            else:
                return {"error": "Failed to create withdrawal record"}, 500

        except Exception as e:
            logger.error(f"Failed to process USD withdrawal: {str(e)}")
            return {"error": f"Failed to process withdrawal: {str(e)}"}, 500

@rest_api.route('/api/v1/withdrawals', methods=['GET'])
class GetWithdrawals(Resource):
    """
    Get withdrawal history for the current user
    """
    @token_required
    def get(self, current_user):
        try:
            # Get query parameters
            status = request.args.get('status')
            currency = request.args.get('currency')
            
            # Get withdrawals from database
            from ..common.data_helpers import get_withdrawals
            withdrawals = get_withdrawals(
                user_id=current_user.id,
                status=status,
                currency=currency
            )
            
            return {"withdrawals": withdrawals}, 200
            
        except Exception as e:
            logger.error(f"Error retrieving withdrawals for user {current_user.id}: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/withdrawal-status/<int:withdrawal_id>', methods=['GET'])
class GetWithdrawalStatus(Resource):
    """
    Get the status of a specific withdrawal
    """
    @token_required
    def get(self, current_user, withdrawal_id):
        try:
            # Get withdrawal record from database
            from ..common.data_helpers import get_withdrawals
            withdrawals = get_withdrawals(user_id=current_user.id)
            
            # Find the specific withdrawal
            withdrawal = None
            for w in withdrawals:
                if w['id'] == withdrawal_id:
                    withdrawal = w
                    break
            
            if not withdrawal:
                return {"error": "Withdrawal not found"}, 404
            
            return {"withdrawal": withdrawal}, 200
            
        except Exception as e:
            logger.error(f"Error retrieving withdrawal status: {str(e)}")
            return {"error": str(e)}, 500 