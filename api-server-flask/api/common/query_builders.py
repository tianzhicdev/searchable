"""
SQL query builders to extract complex query logic into reusable functions
"""
from .models import PaymentStatus


def build_balance_calculation_query():
    """
    Build the complex balance calculation query
    
    Returns:
        tuple: (query_string, placeholder_count) where placeholder_count is the number of parameters needed
    """
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
        COALESCE(SUM(net_amount), 0) as total_balance
    FROM balance_sources
    """
    
    return query, 8  # 8 parameters needed


def build_balance_query_params(user_id):
    """
    Build parameters for the balance calculation query
    
    Args:
        user_id: User ID for balance calculation
        
    Returns:
        tuple: Parameters for the balance query
    """
    return (
        user_id,  # for sales
        PaymentStatus.COMPLETE.value,
        user_id,  # for rewards
        user_id,  # for deposits
        user_id,  # for withdrawals
        PaymentStatus.COMPLETE.value,
        PaymentStatus.PENDING.value,
        PaymentStatus.DELAYED.value,
        user_id,  # for balance payments (buyer_id)
        PaymentStatus.COMPLETE.value  # for balance payments status
    )


def build_invoice_query_conditions(buyer_id=None, seller_id=None, searchable_id=None, external_id=None):
    """
    Build WHERE conditions for invoice queries
    
    Args:
        buyer_id: Buyer ID filter
        seller_id: Seller ID filter  
        searchable_id: Searchable ID filter
        external_id: External ID filter
        
    Returns:
        tuple: (conditions_list, params_list)
    """
    conditions = []
    params = []
    
    if buyer_id is not None:
        if isinstance(buyer_id, list):
            placeholders = ','.join(['%s'] * len(buyer_id))
            conditions.append(f"i.buyer_id IN ({placeholders})")
            params.extend([str(b) for b in buyer_id])
        else:
            conditions.append("i.buyer_id = %s")
            params.append(str(buyer_id))
    
    if seller_id is not None:
        if isinstance(seller_id, list):
            placeholders = ','.join(['%s'] * len(seller_id))
            conditions.append(f"i.seller_id IN ({placeholders})")
            params.extend([str(s) for s in seller_id])
        else:
            conditions.append("i.seller_id = %s")
            params.append(str(seller_id))
    
    if searchable_id is not None:
        if isinstance(searchable_id, list):
            placeholders = ','.join(['%s'] * len(searchable_id))
            conditions.append(f"i.searchable_id IN ({placeholders})")
            params.extend([str(s) for s in searchable_id])
        else:
            conditions.append("i.searchable_id = %s")
            params.append(str(searchable_id))
    
    if external_id:
        conditions.append("i.external_id = %s")
        params.append(external_id)
    
    return conditions, params


def build_invoice_query_with_payment_status(conditions, params, status=None):
    """
    Build complete invoice query with payment status joins
    
    Args:
        conditions: List of WHERE conditions
        params: List of query parameters
        status: Payment status filter
        
    Returns:
        tuple: (query_string, updated_params)
    """
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    query = f"""
        SELECT i.id, i.buyer_id, i.seller_id, i.searchable_id, i.amount, i.fee, i.currency, i.type,
               i.external_id, i.created_at, i.metadata,
               p.id as payment_id, p.amount as payment_amount, p.fee as payment_fee,
               p.currency as payment_currency, p.type as payment_type, p.status as payment_status,
               p.external_id as payment_external_id, p.created_at as payment_created_at,
               p.metadata as payment_metadata
        FROM invoice i 
        LEFT JOIN payment p ON i.id = p.invoice_id
        WHERE {where_clause}
    """
    
    if status:
        query += " AND p.status = %s"
        params.append(status)
    
    query += " ORDER BY i.created_at DESC"
    
    return query, params