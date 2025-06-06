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
from ..common.payment_helpers import (
    get_amount_to_withdraw,
    pay_lightning_invoice
)
from ..common.logging_config import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'withdrawals.log')

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
                withdrawal_type='bank_transfer',
                external_id=tx_id,
                metadata=withdrawal_metadata
            )
            
            if withdrawal:
                logger.info(f"USDT withdrawal created with ID: {withdrawal['id']}")
                return {
                    "success": True, 
                    "msg": "Withdrawal request submitted successfully", 
                    "withdrawal_id": withdrawal['id']
                }, 200
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
            
            # Get withdrawal amount from invoice
            amount_to_withdraw = get_amount_to_withdraw(invoice)
            current_balance = get_balance_by_currency(current_user.id)['sats']
            
            # Check if user has sufficient balance (add small buffer for fees)
            fee_buffer = 1000  # 1000 sats buffer for fees
            total_needed = amount_to_withdraw + fee_buffer
            
            if current_balance < total_needed:
                return {
                    "error": "Insufficient funds", 
                    "available_balance": current_balance, 
                    "withdrawal_amount": amount_to_withdraw,
                    "fee_buffer": fee_buffer,
                    "total_needed": total_needed
                }, 400
            
            # Prepare withdrawal metadata
            withdrawal_metadata = {
                'lightning_invoice': invoice,
                'timestamp': int(time.time()),
                'original_amount': amount_to_withdraw,
                'fee_buffer': fee_buffer
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
                return {
                    "recorded": True, 
                    "status": "pending", 
                    "withdrawal_id": withdrawal['id'],
                    "amount": amount_to_withdraw
                }, 200
            else:
                return {"error": "Failed to create withdrawal record"}, 500
            
        except Exception as e:
            logger.error(f"Error processing sats withdrawal: {str(e)}")
            return {"error": str(e)}, 500

@rest_api.route('/api/v1/withdrawal-sats-process', methods=['POST'])
class ProcessSatsWithdrawal(Resource):
    """
    Actually processes a sats withdrawal by paying the Lightning invoice
    This is a separate endpoint that can be called manually or automatically
    """
    @token_required
    def post(self, current_user):
        try:
            data = request.get_json()
            
            if not data or 'withdrawal_id' not in data:
                return {"error": "withdrawal_id is required"}, 400
            
            withdrawal_id = data['withdrawal_id']
            
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
            
            if withdrawal['status'] != 'pending':
                return {"error": f"Withdrawal is not pending (status: {withdrawal['status']})"}, 400
            
            if withdrawal['type'] != 'lightning':
                return {"error": "This endpoint is only for Lightning withdrawals"}, 400
            
            # Extract invoice from metadata
            invoice = withdrawal['metadata'].get('lightning_invoice')
            if not invoice:
                return {"error": "Lightning invoice not found in withdrawal record"}, 400
            
            # Pay the Lightning invoice
            payment_result = pay_lightning_invoice(invoice)
            
            if 'error' in payment_result:
                logger.error(f"Lightning payment failed: {payment_result['error']}")
                return {"error": f"Payment failed: {payment_result['error']}"}, 500
            
            # Update withdrawal status based on payment result
            # This would typically update the withdrawal record in the database
            # For now, we'll return the payment result
            
            logger.info(f"Lightning payment successful for withdrawal {withdrawal_id}")
            return {
                "success": True,
                "withdrawal_id": withdrawal_id,
                "payment_result": payment_result,
                "status": "completed"
            }, 200
            
        except Exception as e:
            logger.error(f"Error processing Lightning withdrawal: {str(e)}")
            return {"error": str(e)}, 500

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