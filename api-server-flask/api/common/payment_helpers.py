from .logging_config import setup_logger
from .models import Currency

# Set up the logger
logger = setup_logger(__name__, 'payment_helpers.log')

def calc_invoice(searchable_data, selections):
    """
    Calculate invoice details for USD-based payments

    Args:
        searchable_data: Dictionary containing searchable item data
        selections: List of selected items/files (each with an 'id' field)

    Returns:
        dict: Invoice calculation results with amount_usd and description
    """
    try:
        logger.info("Calculating invoice with searchable_data and selections")
        logger.info(f"searchable_data: {searchable_data}")
        logger.info(f"selections: {selections}")

        payloads = searchable_data.get('payloads', {})
        public_data = payloads.get('public', {})
        downloadable_files = public_data.get('downloadableFiles', [])

        # Build a mapping from file id to price (as float)
        id_to_price = {file.get('fileId'): float(file.get('price')) for file in downloadable_files}

        # Calculate total amount in USD using ids from selections
        total_amount_usd = 0.0
        for item in selections:
            file_id = item.get('id')
            price = id_to_price.get(file_id)
            total_amount_usd += price

        total_amount_usd = round(total_amount_usd, 2)
        total_items = len(selections)

        # Generate description
        title = public_data.get('title', 'Digital Item')
        if total_items > 1:
            description = f"{title} (x{total_items})"
        else:
            description = title

        return {
            "amount_usd": total_amount_usd,
            "total_amount_usd": total_amount_usd,
            "description": description,
            "currency": Currency.USD.value
        }

    except Exception as e:
        logger.error(f"Error calculating invoice: {str(e)}")
        raise ValueError("Invalid searchable data or selections") from e