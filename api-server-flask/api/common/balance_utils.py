"""
Balance calculation utilities - broken down into smaller, testable functions
"""
from .database import db_transaction, execute_sql
from .query_builders import build_balance_calculation_query, build_balance_query_params
from .logging_config import setup_logger

logger = setup_logger(__name__, 'balance_utils.log')


def calculate_user_balance(user_id):
    """
    Calculate total balance for a user across all sources
    
    Args:
        user_id: User ID to calculate balance for
        
    Returns:
        float: Total balance in USD
        
    Raises:
        Exception: If balance calculation fails
    """
    try:
        logger.info(f"Calculating balance for user_id: {user_id}")
        
        with db_transaction() as (conn, cur):
            query, _ = build_balance_calculation_query()
            params = build_balance_query_params(user_id)
            
            execute_sql(cur, query, params)
            result = cur.fetchone()
            
            total_balance = float(result[0]) if result and result[0] else 0.0
            
        logger.info(f"Final balance for user {user_id}: ${total_balance:.2f}")
        return total_balance
        
    except Exception as e:
        logger.error(f"Error calculating balance for user {user_id}: {str(e)}")
        raise


def get_balance_by_currency(user_id):
    """
    Get user balance formatted by currency (maintains existing API)
    
    Args:
        user_id: User ID to get balance for
        
    Returns:
        dict: Balance by currency {'usd': balance_amount}
    """
    try:
        total_balance = calculate_user_balance(user_id)
        
        balance_by_currency = {
            'usd': total_balance
        }
        
        return balance_by_currency
        
    except Exception as e:
        logger.error(f"Error getting balance by currency for user {user_id}: {str(e)}")
        raise


def validate_sufficient_balance(user_id, required_amount, currency='usd'):
    """
    Check if user has sufficient balance for a transaction
    
    Args:
        user_id: User ID to check
        required_amount: Amount required for transaction
        currency: Currency (default: 'usd')
        
    Returns:
        tuple: (has_sufficient_balance: bool, current_balance: float)
        
    Raises:
        ValueError: If invalid currency or negative amount
    """
    if currency.lower() != 'usd':
        raise ValueError(f"Unsupported currency: {currency}")
    
    if required_amount < 0:
        raise ValueError("Required amount cannot be negative")
    
    try:
        current_balance = calculate_user_balance(user_id)
        has_sufficient = current_balance >= required_amount
        
        logger.info(f"Balance check for user {user_id}: "
                   f"required=${required_amount:.2f}, available=${current_balance:.2f}, "
                   f"sufficient={has_sufficient}")
        
        return has_sufficient, current_balance
        
    except Exception as e:
        logger.error(f"Error validating balance for user {user_id}: {str(e)}")
        raise


def get_balance_breakdown(user_id):
    """
    Get detailed breakdown of balance sources (useful for debugging)
    
    Args:
        user_id: User ID to get breakdown for
        
    Returns:
        dict: Breakdown of balance sources
    """
    try:
        with db_transaction() as (conn, cur):
            # Modified query to get breakdown by source type
            query = """
            WITH balance_sources AS (
                -- Income from sales (seller earnings after fees)
                SELECT 
                    'sale' as source_type,
                    (i.amount - i.fee) as net_amount,
                    i.currency
                FROM invoice i
                JOIN payment p ON i.id = p.invoice_id
                WHERE i.seller_id = %s
                AND p.status = %s
                AND i.currency = 'usd'
                
                UNION ALL
                
                -- Rewards
                SELECT 
                    'reward' as source_type,
                    r.amount as net_amount,
                    r.currency
                FROM rewards r
                WHERE r.user_id = %s
                AND r.currency = 'usd'
                
                UNION ALL
                
                -- Completed deposits
                SELECT 
                    'deposit' as source_type,
                    d.amount as net_amount,
                    d.currency
                FROM deposit d
                WHERE d.user_id = %s
                AND d.status = 'complete'
                AND d.currency = 'usd'
                
                UNION ALL
                
                -- Withdrawals (negative amounts)
                SELECT 
                    'withdrawal' as source_type,
                    -w.amount as net_amount,
                    w.currency
                FROM withdrawal w
                WHERE w.user_id = %s
                AND w.status IN (%s, %s, %s)
                AND w.currency = 'usd'
                
                UNION ALL
                
                -- Balance payments (negative amounts) - purchases made with balance
                SELECT 
                    'balance_payment' as source_type,
                    -i.amount as net_amount,
                    i.currency
                FROM invoice i
                JOIN payment p ON i.id = p.invoice_id
                WHERE i.buyer_id = %s
                AND p.type = 'balance'
                AND p.status = %s
                AND i.currency = 'usd'
            )
            SELECT 
                source_type,
                COALESCE(SUM(net_amount), 0) as total_amount,
                COUNT(*) as transaction_count
            FROM balance_sources
            GROUP BY source_type
            """
            
            params = build_balance_query_params(user_id)
            execute_sql(cur, query, params)
            results = cur.fetchall()
            
            breakdown = {}
            total = 0
            
            for source_type, amount, count in results:
                amount = float(amount)
                breakdown[source_type] = {
                    'amount': amount,
                    'transaction_count': count
                }
                total += amount
            
            breakdown['total'] = total
            
        logger.info(f"Balance breakdown for user {user_id}: {breakdown}")
        return breakdown
        
    except Exception as e:
        logger.error(f"Error getting balance breakdown for user {user_id}: {str(e)}")
        raise