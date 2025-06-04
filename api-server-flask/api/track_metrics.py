from prometheus_client import Counter, Histogram, Summary, generate_latest, REGISTRY
from functools import wraps
from flask import request
from .helper import setup_logger

# Set up the logger
logger = setup_logger(__name__, 'track_metrics.log')

# Define Prometheus metrics (these should match those in searchable_v1.py)
# Define Prometheus metrics
searchable_requests = Counter('searchable_v1_requests_total', 'Total number of searchable API v1 requests', 
                             ['endpoint', 'method', 'status', 'origin'])
searchable_latency = Histogram('searchable_v1_request_latency_seconds', 'Request latency in seconds for v1 API', 
                              ['endpoint', 'origin'])
search_results_count = Summary('searchable_v1_search_results_count', 'Number of search results returned in v1 API')

# Enhanced metrics tracking decorator
def track_metrics(endpoint):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Get the origin from request headers, default to 'unknown'
            origin = request.headers.get('Origin', 'unknown')
            # Normalize origin to remove protocol and trailing slashes
            if origin != 'unknown':
                try:
                    # Remove protocol (http://, https://)
                    if '://' in origin:
                        origin = origin.split('://')[1]
                    # Remove trailing slash if present
                    if origin.endswith('/'):
                        origin = origin[:-1]
                    # Remove port if present
                    if ':' in origin:
                        origin = origin.split(':')[0]
                except Exception:
                    # If any parsing fails, fall back to the original
                    pass
            
            # Add origin to kwargs so the wrapped function can use it
            kwargs['request_origin'] = origin
            
            # Use histogram to track latency
            with searchable_latency.labels(endpoint, origin).time():
                try:
                    # Execute the original function
                    response, status_code = f(*args, **kwargs)
                    # Track successful request
                    searchable_requests.labels(endpoint, request.method, status_code, origin).inc()
                    return response, status_code
                except Exception as e:
                    # Track failed request
                    searchable_requests.labels(endpoint, request.method, 500, origin).inc()
                    # Log the exception
                    logger.error(f"Exception in {endpoint}: {str(e)}")
                    # Re-raise the exception
                    raise e
        return decorated
    return decorator

