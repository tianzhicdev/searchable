"""
Pure business logic for invoice calculations
This module contains the core calculation logic separated from logging and database dependencies
"""

def calc_invoice_core(searchable_data, selections):
    """
    Calculate invoice details for USD-based payments (pure business logic)

    Args:
        searchable_data: Dictionary containing searchable item data
        selections: List of selected items/files (each with an 'id' field and optional 'count' field)
                   For 'direct' type, selection items should have 'amount' and 'type' fields

    Returns:
        dict: Invoice calculation results with amount_usd and description
    """
    try:
        if not searchable_data or not isinstance(searchable_data, dict):
            raise ValueError("Invalid searchable data")

        payloads = searchable_data.get('payloads', {})
        public_data = payloads.get('public', {})
        searchable_type = public_data.get('type', 'downloadable')
        
        # Handle direct payment type with runtime amount
        if searchable_type == 'direct':
            total_amount_usd = 0.0
            total_item_count = 0
            
            for item in selections:
                if item.get('type') == 'direct' and item.get('amount'):
                    amount = float(item.get('amount'))
                    count = item.get('count', 1)
                    total_amount_usd += amount * count
                    total_item_count += count
            
            total_amount_usd = round(total_amount_usd, 2)
            
            # Generate description for direct payment
            title = public_data.get('title', 'Direct Payment Item')
            description = f"{title} - Direct Payment"
            
            return {
                "amount_usd": total_amount_usd,
                "total_amount_usd": total_amount_usd,
                "description": description,
                "currency": "usd",  # Hardcoded as this is pure logic without enum dependency
                "total_item_count": total_item_count
            }
        
        # Handle downloadable and offline items with predefined prices
        downloadable_files = public_data.get('downloadableFiles', [])
        offline_items = public_data.get('offlineItems', [])
        
        # Build mappings from id to price (as float)
        id_to_price = {}
        
        # Add downloadable files to mapping
        for file in downloadable_files:
            id_to_price[file.get('fileId')] = float(file.get('price'))
        
        # Add offline items to mapping  
        for item in offline_items:
            id_to_price[item.get('itemId')] = float(item.get('price'))

        # Calculate total amount in USD using ids from selections
        total_amount_usd = 0.0
        total_item_count = 0
        
        for item in selections:
            item_id = item.get('id')
            price = id_to_price.get(item_id)
            count = item.get('count', 1)  # Default to 1 if count not specified
            
            if price is not None:
                total_amount_usd += price * count
                total_item_count += count

        total_amount_usd = round(total_amount_usd, 2)

        # Generate description
        title = public_data.get('title', 'Item')
        if total_item_count > 1:
            description = f"{title} (x{total_item_count} items)"
        else:
            description = title

        return {
            "amount_usd": total_amount_usd,
            "total_amount_usd": total_amount_usd,
            "description": description,
            "currency": "usd",  # Hardcoded as this is pure logic without enum dependency
            "total_item_count": total_item_count
        }

    except Exception as e:
        raise ValueError("Invalid searchable data or selections") from e