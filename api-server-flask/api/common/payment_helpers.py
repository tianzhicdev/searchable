from .logging_config import setup_logger
from .models import Currency

# Set up the logger
logger = setup_logger(__name__, 'payment_helpers.log')

def calc_invoice(searchable_data, selections):
    """
    Calculate invoice details for USD-based payments

    Args:
        searchable_data: Dictionary containing searchable item data
        selections: List of selected items/files (each with an 'id' field and optional 'count' field)

    Returns:
        dict: Invoice calculation results with amount_usd and description
    """
    try:
        logger.info("Calculating invoice with searchable_data and selections")
        logger.info(f"searchable_data: {searchable_data}")
        logger.info(f"selections: {selections}")

        payloads = searchable_data.get('payloads', {})
        public_data = payloads.get('public', {})
        
        # Handle both downloadable and offline items
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
            "currency": Currency.USD.value,
            "total_item_count": total_item_count
        }

    except Exception as e:
        logger.error(f"Error calculating invoice: {str(e)}")
        raise ValueError("Invalid searchable data or selections") from e