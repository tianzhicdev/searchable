import os
import stripe
from .logging_config import setup_logger
from .models import PaymentStatus, PaymentType, Currency

# Set up the logger
logger = setup_logger(__name__, 'payment_helpers.log')

# Environment variables
stripe.api_key = os.environ.get('STRIPE_API_KEY')

def create_stripe_checkout_session(amount_usd, success_url, cancel_url, metadata=None):
    """
    Creates a Stripe checkout session for USD payment
    
    Args:
        amount_usd: Amount in USD (as float, e.g., 10.50)
        success_url: URL to redirect to on successful payment
        cancel_url: URL to redirect to on cancelled payment
        metadata: Optional metadata dictionary
        
    Returns:
        dict: Stripe session data or error
    """
    try:
        # Convert USD to cents for Stripe
        amount_cents = int(amount_usd * 100)
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': Currency.USD.value,
                    'product_data': {
                        'name': 'Payment',
                    },
                    'unit_amount': amount_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata or {}
        )
        
        return {
            'session_id': session.id,
            'checkout_url': session.url,
            'amount_usd': amount_usd,
            'currency': Currency.USD.value,
            'status': PaymentStatus.PENDING.value
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {str(e)}")
        return {'error': f'Payment processing error: {str(e)}'}
    except Exception as e:
        logger.error(f"Error creating Stripe checkout session: {str(e)}")
        return {'error': f'Unexpected error: {str(e)}'}

def verify_stripe_payment(session_id):
    """
    Verifies a Stripe payment session
    
    Args:
        session_id: Stripe session ID
        
    Returns:
        dict: Payment verification result
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == 'paid':
            return {
                'verified': True,
                'status': PaymentStatus.COMPLETE.value,
                'amount_usd': session.amount_total / 100,  # Convert cents to USD
                'currency': Currency.USD.value,
                'session_id': session_id
            }
        else:
            return {
                'verified': False,
                'status': PaymentStatus.PENDING.value,
                'payment_status': session.payment_status
            }
            
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error verifying payment: {str(e)}")
        return {'error': f'Payment verification error: {str(e)}'}
    except Exception as e:
        logger.error(f"Error verifying Stripe payment: {str(e)}")
        return {'error': f'Unexpected error: {str(e)}'}

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
        # Extract pricing information from searchable data
        payloads = searchable_data.get('payloads', {})
        public_data = payloads.get('public', {})
        private_data = payloads.get('private', {})
        
        # Get base price (default to $1.00 if not specified)
        base_price_usd = float(public_data.get('price', 1.0))
        
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