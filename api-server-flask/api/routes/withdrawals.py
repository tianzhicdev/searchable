# Withdrawal routes
import os
import re
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

SOLANA_NETWORK = os.getenv('SOLANA_NETWORK', 'devnet')
WITHDRAWAL_TYPE_ALIASES = {
    'solana_usdc': 'usdc_solana',
    'usdc_sol': 'usdc_solana',
}
SUPPORTED_WITHDRAWAL_TYPES = {'usdt', 'usdc_solana'}

ETHEREUM_ADDRESS_RE = re.compile(r'^0x[a-fA-F0-9]{40}$')
SOLANA_ADDRESS_RE = re.compile(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$')


def normalize_withdrawal_type(raw_type):
    withdrawal_type = (raw_type or 'usdt').strip().lower()
    return WITHDRAWAL_TYPE_ALIASES.get(withdrawal_type, withdrawal_type)


def is_valid_ethereum_address(address):
    return bool(ETHEREUM_ADDRESS_RE.match(address))


def is_valid_solana_address(address):
    return bool(SOLANA_ADDRESS_RE.match(address))

@rest_api.route('/api/v1/withdrawal-usd', methods=['POST'])
class WithdrawFundsUSD(Resource):
    """
    Processes a USD withdrawal request
    """
    @token_required
    def post(self, current_user):
        data = request.get_json() or {}
        address = (data.get('address') or '').strip()
        amount = data.get('amount')
        withdrawal_type = normalize_withdrawal_type(data.get('type') or data.get('rail') or 'usdt')

        if withdrawal_type not in SUPPORTED_WITHDRAWAL_TYPES:
            return {"error": "Invalid withdrawal type. Must be 'usdt' or 'usdc_solana'"}, 400
        
        # Validate inputs
        if not address or not amount:
            return {"error": "Address and amount are required"}, 400

        if withdrawal_type == 'usdt' and not is_valid_ethereum_address(address):
            return {
                "error": "Invalid Ethereum address. Must start with 0x followed by 40 hexadecimal characters"
            }, 400

        if withdrawal_type == 'usdc_solana' and not is_valid_solana_address(address):
            return {
                "error": "Invalid Solana address. Must be a valid wallet or token account on the configured Solana network"
            }, 400
            
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
            
            # Calculate withdrawal fee (1%)
            withdrawal_fee = amount * 0.01  # 1%
            
            # Generate a unique transaction ID for this withdrawal
            tx_id = f"{withdrawal_type}-{current_user.id}-{int(time.time())}"
            
            # Prepare withdrawal metadata
            withdrawal_metadata = {
                'type': withdrawal_type,
                'asset': 'USDC' if withdrawal_type == 'usdc_solana' else 'USDT',
                'network': SOLANA_NETWORK if withdrawal_type == 'usdc_solana' else 'ethereum',
                'address': address,
                'timestamp': int(time.time()),
                'original_amount': amount,
                'fee_percentage': 1,
                'amount_after_fee': amount - withdrawal_fee
            }
            
            # Create withdrawal record with fee
            withdrawal = create_withdrawal(
                user_id=current_user.id,
                amount=amount,
                fee=withdrawal_fee,
                currency=Currency.USD.value,
                withdrawal_type=withdrawal_type,
                external_id=tx_id,
                metadata=withdrawal_metadata
            )
            
            if withdrawal:
                logger.info(f"USD withdrawal created with ID: {withdrawal['id']}, amount: {amount}, fee: {withdrawal_fee}")
                return {
                    "success": True, 
                    "msg": "Withdrawal request submitted successfully", 
                    "withdrawal_id": withdrawal['id'],
                    "type": withdrawal_type,
                    "asset": withdrawal_metadata['asset'],
                    "network": withdrawal_metadata['network'],
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
