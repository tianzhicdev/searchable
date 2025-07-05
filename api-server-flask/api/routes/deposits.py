"""
Deposit management API routes (simplified version)
Handles USDT deposits on Ethereum
"""

import os
import uuid
import requests
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from flask import request, jsonify
from flask_restx import Resource
from psycopg2.extras import Json

from .. import rest_api
from .auth import token_required
from ..common.database import get_db_connection, execute_sql
from ..common.logging_config import setup_logger

# Set up logger
logger = setup_logger(__name__, 'deposits.log')

# USDT service configuration
USDT_SERVICE_URL = os.getenv('USDT_SERVICE_URL', 'http://usdt-api:3100')

@rest_api.route('/api/v1/deposit/create', methods=['POST'])
class CreateDeposit(Resource):
    """Create a new deposit request"""
    
    @token_required
    def post(self, current_user):
        """Create a new USDT deposit request"""
        logger.info(f"=== DEPOSIT CREATE START - User {current_user.id} ===")
        try:
            logger.info(f"Create deposit called for user {current_user.id}")
            # Handle both empty body and JSON body
            try:
                data = request.get_json() or {}
            except:
                data = {}
            amount_str = data.get('amount', '0')
            
            # Validate amount if provided
            try:
                amount = Decimal(amount_str)
                # Ensure minimum amount
                if amount < Decimal('0.01'):
                    amount = Decimal('0.01')
            except:
                amount = Decimal('0.01')  # Default to minimal amount
            
            # Create deposit record first to get the ID
            logger.info(f"Creating deposit record for user {current_user.id}")
            conn = get_db_connection()
            cur = conn.cursor()
            
            try:
                # Calculate expiration (23 hours from now)
                expires_at = datetime.now(timezone.utc) + timedelta(hours=23)
                
                # First, create deposit record with temporary external_id to get the ID
                execute_sql(cur, """
                    INSERT INTO deposit (user_id, amount, currency, external_id, status, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, params=(
                    current_user.id,
                    amount,
                    'usdt',
                    f'temp_{current_user.id}_{datetime.now().timestamp()}',  # Temporary unique ID
                    'pending',
                    Json({})
                ), commit=True, connection=conn)
                
                result = cur.fetchone()
                deposit_id = result[0]
                created_at = result[1]
                
                logger.info(f"Created deposit record {deposit_id} for user {current_user.id}")
                
                # Now get deterministic address using deposit ID
                try:
                    usdt_response = requests.post(
                        # f"{USDT_SERVICE_URL}/receive",
                        f"{USDT_SERVICE_URL}/zero-balance-address",
                        json={'deposit_id': deposit_id},
                        timeout=10
                    )
                    
                    if usdt_response.status_code != 200:
                        logger.error(f"USDT service error: {usdt_response.text}")
                        # Delete the deposit record
                        execute_sql(cur, "DELETE FROM deposit WHERE id = %s", params=(deposit_id,), commit=True, connection=conn)
                        return {"error": "Failed to generate deposit address"}, 500
                    
                    usdt_data = usdt_response.json()
                    eth_address = usdt_data['address']
                    address_index = usdt_data['index']
                    
                except Exception as e:
                    logger.error(f"Failed to contact USDT service: {str(e)}")
                    # Delete the deposit record
                    execute_sql(cur, "DELETE FROM deposit WHERE id = %s", params=(deposit_id,), commit=True, connection=conn)
                    return {"error": "Deposit service temporarily unavailable"}, 503
                
                # Prepare metadata
                metadata = {
                    'address_index': address_index,
                    'eth_address': eth_address,
                    'deposit_id': deposit_id,  # Store deposit ID for reference
                    'expires_at': expires_at.isoformat(),
                    'checked_at': None,
                    'tx_hash': None,
                    'confirmations': 0
                }
                
                # Update deposit record with actual address
                execute_sql(cur, """
                    UPDATE deposit 
                    SET external_id = %s, metadata = %s
                    WHERE id = %s
                """, params=(
                    eth_address,
                    Json(metadata),
                    deposit_id
                ), commit=True, connection=conn)
                
                logger.info(f"Created deposit {deposit_id} for user {current_user.id} with address {eth_address}")
                
                # Return deposit information
                return {
                    'deposit_id': deposit_id,
                    'address': eth_address,
                    'amount': str(amount),
                    'currency': 'USDT',
                    'status': 'pending',
                    'expires_at': expires_at.isoformat(),
                    'created_at': created_at.isoformat()
                }, 200
                
            finally:
                cur.close()
                conn.close()
                
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
            conn = get_db_connection()
            cur = conn.cursor()
            
            try:
                # Get deposit record
                execute_sql(cur, """
                    SELECT id, amount, currency, status, metadata, created_at, tx_hash
                    FROM deposit
                    WHERE id = %s AND user_id = %s
                """, params=(deposit_id, current_user.id))
                
                result = cur.fetchone()
                if not result:
                    return {"error": "Deposit not found"}, 404
                
                dep_id, amount, currency, status, metadata, created_at, tx_hash = result
                
                # Extract address from metadata
                eth_address = metadata.get('eth_address', '')
                expires_at = metadata.get('expires_at', '')
                
                response = {
                    'deposit_id': dep_id,
                    'address': eth_address,
                    'amount': str(amount),
                    'status': status,
                    'expires_at': expires_at,
                    'created_at': created_at.isoformat()
                }
                
                if tx_hash:
                    response['tx_hash'] = tx_hash
                    
                return response, 200
                
            finally:
                cur.close()
                conn.close()
                
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
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            try:
                # Get total count
                execute_sql(cur, """
                    SELECT COUNT(*) FROM deposit WHERE user_id = %s
                """, params=(current_user.id,))
                
                total_count = cur.fetchone()[0]
                
                # Get deposits
                execute_sql(cur, """
                    SELECT id, amount, currency, status, metadata, created_at, tx_hash
                    FROM deposit
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s
                """, params=(current_user.id, per_page, offset))
                
                deposits = []
                for row in cur.fetchall():
                    dep_id, amount, currency, status, metadata, created_at, tx_hash = row
                    
                    deposit_data = {
                        'deposit_id': dep_id,
                        'amount': str(amount),
                        'currency': currency,
                        'status': status,
                        'address': metadata.get('eth_address', ''),
                        'tx_hash': tx_hash,  # Now from column, not metadata
                        'expires_at': metadata.get('expires_at'),
                        'created_at': created_at.isoformat(),
                        'metadata': metadata
                    }
                    
                    deposits.append(deposit_data)
                
                return {
                    'deposits': deposits,
                    'total': total_count,
                    'page': page,
                    'per_page': per_page,
                    'total_pages': (total_count + per_page - 1) // per_page
                }, 200
                
            finally:
                cur.close()
                conn.close()
                
        except Exception as e:
            logger.error(f"Error listing deposits: {str(e)}")
            return {"error": "Failed to list deposits"}, 500