"""
Deposit management API routes.
Handles Stripe deposits plus crypto deposits on Ethereum USDT and Solana USDC.
"""

import os
import requests
import stripe
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from flask import request
from flask_restx import Resource
from psycopg2.extras import Json

from .. import rest_api
from .auth import token_required
from ..common.database import execute_sql
from ..common.database_context import database_cursor, database_transaction, db
from ..common.logging_config import setup_logger

# Set up logger
logger = setup_logger(__name__, 'deposits.log')

# Service configurations
USDT_SERVICE_URL = os.getenv('USDT_SERVICE_URL', 'http://usdt-api:3100')
SOLANA_USDC_SERVICE_URL = os.getenv(
    'SOLANA_USDC_SERVICE_URL',
    os.getenv('USDC_SOLANA_SERVICE_URL', 'http://usdc-solana-api:3200')
)
SOLANA_NETWORK = os.getenv('SOLANA_NETWORK', 'devnet')
SOLANA_USDC_MINT = os.getenv('SOLANA_USDC_MINT')
CRYPTO_DEPOSIT_EXPIRATION_HOURS = int(os.getenv('CRYPTO_DEPOSIT_EXPIRATION_HOURS', '23'))
stripe.api_key = os.getenv('STRIPE_API_KEY')

DEPOSIT_TYPE_ALIASES = {
    'solana_usdc': 'usdc_solana',
    'usdc_sol': 'usdc_solana',
}
SUPPORTED_DEPOSIT_TYPES = {'usdt', 'usdc_solana', 'stripe'}


def normalize_deposit_type(raw_type):
    deposit_type = (raw_type or 'usdt').strip().lower()
    return DEPOSIT_TYPE_ALIASES.get(deposit_type, deposit_type)


def create_crypto_deposit_address(deposit_type, deposit_id, expires_at):
    if deposit_type == 'usdt':
        response = requests.post(
            f"{USDT_SERVICE_URL}/zero-balance-address",
            json={'deposit_id': deposit_id},
            timeout=10
        )

        if response.status_code != 200:
            logger.error(f"USDT service error: {response.text}")
            raise Exception("Failed to generate deposit address")

        payload = response.json()
        address = payload['address']
        address_index = payload['index']

        return {
            'external_id': address,
            'metadata': {
                'type': 'usdt',
                'asset': 'USDT',
                'network': 'ethereum',
                'address_index': address_index,
                'eth_address': address,
                'deposit_id': deposit_id,
                'expires_at': expires_at.isoformat(),
                'checked_at': None,
                'tx_hash': None,
                'confirmations': 0,
            },
            'response': {
                'address': address,
                'currency': 'USDT',
                'network': 'ethereum',
            }
        }

    if deposit_type == 'usdc_solana':
        response = requests.post(
            f"{SOLANA_USDC_SERVICE_URL}/zero-balance-address",
            json={'deposit_id': deposit_id},
            timeout=10
        )

        if response.status_code != 200:
            logger.error(f"Solana USDC service error: {response.text}")
            raise Exception("Failed to generate deposit address")

        payload = response.json()
        wallet_address = payload['address']
        token_account = payload['token_account']
        address_index = payload['index']

        return {
            'external_id': wallet_address,
            'metadata': {
                'type': 'usdc_solana',
                'asset': 'USDC',
                'network': SOLANA_NETWORK,
                'mint': SOLANA_USDC_MINT,
                'address_index': address_index,
                'wallet_address': wallet_address,
                'token_account': token_account,
                'deposit_id': deposit_id,
                'expires_at': expires_at.isoformat(),
                'checked_at': None,
                'tx_hash': None,
                'signature': None,
                'confirmations': 0,
            },
            'response': {
                'address': wallet_address,
                'token_account': token_account,
                'currency': 'USDC',
                'network': SOLANA_NETWORK,
                'mint': SOLANA_USDC_MINT,
            }
        }

    raise ValueError(f"Unsupported crypto deposit type: {deposit_type}")

@rest_api.route('/api/v1/deposit/create', methods=['POST'])
class CreateDeposit(Resource):
    """Create a new deposit request"""
    
    @token_required
    def post(self, current_user):
        """Create a new deposit request (USDT, Solana USDC, or Stripe)"""
        logger.info(f"=== DEPOSIT CREATE START - User {current_user.id} ===")
        try:
            logger.info(f"Create deposit called for user {current_user.id}")
            # Handle both empty body and JSON body
            try:
                data = request.get_json() or {}
            except:
                data = {}
            
            deposit_type = normalize_deposit_type(data.get('type', 'usdt'))
            success_url = data.get('success_url')
            cancel_url = data.get('cancel_url')
            
            # Validate deposit type
            if deposit_type not in SUPPORTED_DEPOSIT_TYPES:
                return {
                    "error": "Invalid deposit type. Must be 'usdt', 'usdc_solana', or 'stripe'"
                }, 400
            
            # Validate URLs for Stripe deposits
            if deposit_type == 'stripe' and (not success_url or not cancel_url):
                return {"error": "success_url and cancel_url are required for Stripe deposits"}, 400
            
            # Handle amount based on deposit type
            if deposit_type == 'stripe':
                # Stripe requires an amount
                amount_str = data.get('amount')
                if not amount_str:
                    return {"error": "Amount is required for Stripe deposits"}, 400
                try:
                    amount = Decimal(amount_str)
                    if amount < Decimal('1.00'):
                        return {"error": "Minimum deposit amount is $1.00"}, 400
                except:
                    return {"error": "Invalid amount format"}, 400
            else:
                # Crypto deposits can have optional amount (user sends whatever they want)
                amount_str = data.get('amount', '0')
                try:
                    amount = Decimal(amount_str)
                    # If amount is provided, it must be positive
                    if amount_str != '0' and amount <= 0:
                        return {"error": "Amount must be greater than 0"}, 400
                except:
                    return {"error": "Invalid amount format"}, 400
            
            # Create deposit record first to get the ID
            logger.info(f"Creating deposit record for user {current_user.id}")
            
            try:
                with database_transaction() as (cur, conn):
                    # Stripe deposits do not expire; crypto deposits use a shared timeout.
                    expires_at = datetime.now(timezone.utc) + timedelta(
                        hours=CRYPTO_DEPOSIT_EXPIRATION_HOURS
                    )
                    
                    # First, create deposit record with temporary external_id to get the ID
                    initial_metadata = {'type': deposit_type}
                    execute_sql(cur, """
                        INSERT INTO deposit (user_id, amount, currency, external_id, status, metadata, type)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        RETURNING id, created_at
                    """, params=(
                        current_user.id,
                        amount,
                        'usd',  # Always use lowercase 'usd'
                        f'temp_{current_user.id}_{datetime.now().timestamp()}',  # Temporary unique ID
                        'pending',
                        Json(initial_metadata),
                        deposit_type  # Set the type field directly
                    ))
                    
                    result = cur.fetchone()
                    deposit_id = result[0]
                    created_at = result[1]
                    
                    logger.info(f"Created deposit record {deposit_id} for user {current_user.id}")
                
                    if deposit_type == 'stripe':
                        # Handle Stripe deposit
                        try:
                            # Calculate fees
                            stripe_fee = float(amount) * 0.035  # 3.5% fee
                            total_charge = float(amount) + stripe_fee
                        
                            # Create Stripe checkout session
                            session = stripe.checkout.Session.create(
                                line_items=[{
                                    'price_data': {
                                        'currency': 'usd',
                                        'product_data': {
                                            'name': 'Account Balance Refill',
                                            'description': f'Add ${amount} to your account balance'
                                        },
                                        'unit_amount': int(total_charge * 100),  # Stripe uses cents
                                    },
                                    'quantity': 1,
                                }],
                                mode='payment',
                                success_url=success_url,
                                cancel_url=cancel_url,
                                metadata={
                                    'deposit_id': str(deposit_id),
                                    'user_id': str(current_user.id),
                                    'type': 'deposit'
                                }
                            )
                            
                            # Prepare metadata
                            metadata = {
                                'type': 'stripe',
                                'stripe_session_id': session.id,
                                'stripe_fee': stripe_fee,
                                'total_charged': total_charge,
                                'deposit_id': deposit_id,
                                'payment_intent': session.payment_intent,
                                'created_at': datetime.now(timezone.utc).isoformat()
                            }
                            
                            # Update deposit record with Stripe session info
                            execute_sql(cur, """
                                UPDATE deposit 
                                SET external_id = %s, metadata = %s
                                WHERE id = %s
                            """, params=(
                                session.id,
                                Json(metadata),
                                deposit_id
                            ))
                            
                            logger.info(f"Created Stripe deposit {deposit_id} for user {current_user.id} with session {session.id}")
                            
                            # Return Stripe checkout URL
                            return {
                                'deposit_id': deposit_id,
                                'url': session.url,
                                'session_id': session.id,
                                'amount': str(amount),
                                'stripe_fee': stripe_fee,
                                'total_charge': total_charge,
                                'currency': 'usd',
                                'status': 'pending',
                                'created_at': created_at.isoformat()
                            }, 200
                        
                        except stripe.error.StripeError as e:
                            logger.error(f"Stripe error: {str(e)}")
                            # Delete the deposit record
                            execute_sql(cur, "DELETE FROM deposit WHERE id = %s", params=(deposit_id,))
                            # Let the transaction roll back
                            raise Exception("Failed to create payment session")
                            
                    else:
                        # Handle crypto deposit address generation
                        try:
                            deposit_info = create_crypto_deposit_address(
                                deposit_type=deposit_type,
                                deposit_id=deposit_id,
                                expires_at=expires_at
                            )
                        except Exception as e:
                            logger.error(
                                f"Failed to contact crypto deposit service for {deposit_type}: {str(e)}"
                            )
                            # Delete the deposit record
                            execute_sql(cur, "DELETE FROM deposit WHERE id = %s", params=(deposit_id,))
                            # Let the transaction roll back
                            raise Exception("Deposit service temporarily unavailable")

                        metadata = deposit_info['metadata']

                        # Update deposit record with actual address
                        execute_sql(cur, """
                            UPDATE deposit 
                            SET external_id = %s, metadata = %s
                            WHERE id = %s
                        """, params=(
                            deposit_info['external_id'],
                            Json(metadata),
                            deposit_id
                        ))
                        
                        logger.info(
                            f"Created {deposit_type} deposit {deposit_id} for user {current_user.id} "
                            f"with address {deposit_info['response'].get('address')}"
                        )

                        response_payload = {
                            'deposit_id': deposit_id,
                            'amount': str(amount),
                            'status': 'pending',
                            'expires_at': expires_at.isoformat(),
                            'created_at': created_at.isoformat()
                        }
                        response_payload.update(deposit_info['response'])
                        return response_payload, 200
                
            except stripe.error.StripeError:
                return {"error": "Failed to create payment session"}, 500
            except Exception as e:
                if "temporarily unavailable" in str(e):
                    return {"error": "Deposit service temporarily unavailable"}, 503
                elif "generate deposit address" in str(e):
                    return {"error": "Failed to generate deposit address"}, 500
                else:
                    logger.error(f"Error creating deposit: {str(e)}")
                    return {"error": "Failed to create deposit"}, 500
                
        except Exception as e:
            logger.error(f"Error creating deposit: {str(e)}")
            return {"error": "Failed to create deposit"}, 500

@rest_api.route('/api/v1/deposit/status/<int:deposit_id>')
class DepositStatus(Resource):
    """Check deposit status"""
    
    @token_required
    def get(self, current_user, deposit_id):
        """Get status of a specific deposit"""
        try:
            # Get deposit record
            result = db.fetch_one("""
                SELECT id, amount, currency, status, metadata, created_at, tx_hash, type
                FROM deposit
                WHERE id = %s AND user_id = %s
            """, (deposit_id, current_user.id))
            
            if not result:
                return {"error": "Deposit not found"}, 404
            
            dep_id, amount, currency, status, metadata, created_at, tx_hash, deposit_type = result
            
            metadata = metadata or {}
            expires_at = metadata.get('expires_at', '')
            address = metadata.get('eth_address') or metadata.get('wallet_address') or ''
            
            response = {
                'deposit_id': dep_id,
                'address': address,
                'amount': str(amount),
                'currency': currency,
                'status': status,
                'type': deposit_type,
                'expires_at': expires_at,
                'created_at': created_at.isoformat()
            }
            
            if tx_hash:
                response['tx_hash'] = tx_hash

            if deposit_type == 'usdc_solana':
                response['token_account'] = metadata.get('token_account')
                response['network'] = metadata.get('network', SOLANA_NETWORK)
                response['mint'] = metadata.get('mint', SOLANA_USDC_MINT)
            elif deposit_type == 'usdt':
                response['network'] = metadata.get('network', 'ethereum')
                
            return response, 200
                
        except Exception as e:
            logger.error(f"Error getting deposit status: {str(e)}")
            return {"error": "Failed to get deposit status"}, 500

@rest_api.route('/api/v1/deposits')
class ListDeposits(Resource):
    """List user deposits"""
    
    @token_required
    def get(self, current_user):
        """Get list of user's deposits"""
        try:
            # Get pagination parameters
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 20))
            
            if per_page > 100:
                per_page = 100
                
            offset = (page - 1) * per_page
            
            with database_cursor() as (cur, conn):
                # Get total count
                execute_sql(cur, """
                    SELECT COUNT(*) FROM deposit WHERE user_id = %s
                """, params=(current_user.id,))
                
                total_count = cur.fetchone()[0]
                
                # Get deposits
                execute_sql(cur, """
                    SELECT id, amount, currency, status, metadata, created_at, tx_hash, type
                    FROM deposit
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s
                """, params=(current_user.id, per_page, offset))
                
                deposits = []
                for row in cur.fetchall():
                    dep_id, amount, currency, status, metadata, created_at, tx_hash, deposit_type = row
                    
                    deposit_data = {
                        'deposit_id': dep_id,
                        'amount': str(amount),
                        'currency': currency,
                        'status': status,
                        'type': deposit_type,
                        'tx_hash': tx_hash,
                        'created_at': created_at.isoformat(),
                        'metadata': metadata
                    }
                    
                    # Add type-specific fields
                    if deposit_type == 'usdt':
                        deposit_data['address'] = metadata.get('eth_address', '')
                        deposit_data['network'] = metadata.get('network', 'ethereum')
                        deposit_data['expires_at'] = metadata.get('expires_at')
                    elif deposit_type == 'usdc_solana':
                        deposit_data['address'] = metadata.get('wallet_address', '')
                        deposit_data['token_account'] = metadata.get('token_account', '')
                        deposit_data['network'] = metadata.get('network', SOLANA_NETWORK)
                        deposit_data['mint'] = metadata.get('mint', SOLANA_USDC_MINT)
                        deposit_data['expires_at'] = metadata.get('expires_at')
                    elif deposit_type == 'stripe':
                        deposit_data['session_id'] = metadata.get('stripe_session_id', '')
                        deposit_data['stripe_fee'] = metadata.get('stripe_fee', 0)
                        deposit_data['total_charged'] = metadata.get('total_charged', 0)
                    
                    deposits.append(deposit_data)
                
                return {
                    'deposits': deposits,
                    'total': total_count,
                    'page': page,
                    'per_page': per_page,
                    'total_pages': (total_count + per_page - 1) // per_page
                }, 200
                
        except Exception as e:
            logger.error(f"Error listing deposits: {str(e)}")
            return {"error": "Failed to list deposits"}, 500
