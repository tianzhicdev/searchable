from .logging_config import setup_logger
from .models import Currency

# Set up the logger
logger = setup_logger(__name__, 'payment_helpers.log')

def calc_invoice(searchable_data, selections):
    """
    Calculate invoice details for USD-based payments
    
    Args:
        searchable_data: Dictionary containing searchable item data
        selections: List of selected items/files
        
    Returns:
        dict: Invoice calculation results with amount_usd and description
    """
    try:
        logger.info("Calculating invoice with searchable_data and selections")
        logger.info(f"searchable_data: {searchable_data}")
        logger.info(f"selections: {selections}")

        # Extract pricing information from searchable data
        payloads = searchable_data.get('payloads', {})
        public_data = payloads.get('public', {})
        private_data = payloads.get('private', {})
        
        # Get base price (default to $1.00 if not specified)
        base_price_usd = float(public_data.get('price'))
        
        # Calculate total based on selections
        total_items = len(selections) if selections else 1
        total_amount_usd = base_price_usd * total_items
        
        # Convert to cents for Stripe
        amount_usd_cents = int(total_amount_usd * 100)
        
        # Generate description
        title = public_data.get('title', 'Digital Item')
        if total_items > 1:
            description = f"{title} (x{total_items})"
        else:
            description = title
            
        return {
            "amount_usd": total_amount_usd,
            "amount_usd_cents": amount_usd_cents,
            "description": description,
            "currency": Currency.USD.value
        }
        
    except Exception as e:
        logger.error(f"Error calculating invoice: {str(e)}")
        # Return default values on error
        return {
            "amount_usd": 1.0,
            "amount_usd_cents": 100,
            "description": "Digital Item",
            "currency": Currency.USD.value
        }