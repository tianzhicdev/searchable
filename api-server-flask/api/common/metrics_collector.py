"""
Metrics collection system with pluggable backends
Supports sending metrics to configurable endpoints
"""

import json
import logging
import requests
from datetime import datetime
from typing import Dict, Optional, List, Union
from dataclasses import dataclass, asdict
from enum import Enum
from urllib.parse import urljoin
import threading
from queue import Queue, Full
import time

logger = logging.getLogger(__name__)

class MetricType(Enum):
    """Standard metric types for consistency"""
    PAGE_VIEW = "page_view"
    USER_SIGNUP = "user_signup"
    USER_LOGIN = "user_login"
    ITEM_VIEW = "item_view"
    ITEM_SEARCH = "item_search"
    ITEM_CREATED = "item_created"
    INVOICE_CREATED = "invoice_created"
    PAYMENT_COMPLETED = "payment_completed"
    FILE_UPLOAD = "file_upload"
    FILE_DOWNLOAD = "file_download"
    API_REQUEST = "api_request"
    ERROR = "error"

@dataclass
class Metric:
    """Metric data structure"""
    metric_name: str
    metric_value: float = 1.0
    tags: Dict[str, str] = None
    metadata: Dict = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = {}
        if self.metadata is None:
            self.metadata = {}
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'metric_name': self.metric_name,
            'metric_value': self.metric_value,
            'tags': self.tags,
            'metadata': self.metadata,
            'timestamp': self.timestamp.isoformat()
        }

class MetricsCollector:
    """Main metrics collector with HTTP backend"""
    
    def __init__(self, 
                 metrics_domain: str = "http://localhost:5007",
                 api_key: Optional[str] = None,
                 batch_size: int = 50,
                 flush_interval: float = 5.0,
                 max_queue_size: int = 10000):
        """
        Initialize metrics collector
        
        Args:
            metrics_domain: Base URL for metrics service
            api_key: Optional API key for authentication
            batch_size: Number of metrics to batch before sending
            flush_interval: Seconds between automatic flushes
            max_queue_size: Maximum queue size before dropping metrics
        """
        self.metrics_domain = metrics_domain.rstrip('/')
        self.api_key = api_key
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        
        # Queue for async metric collection
        self._queue = Queue(maxsize=max_queue_size)
        self._running = False
        self._worker_thread = None
        
        # Session for HTTP requests
        self._session = requests.Session()
        if api_key:
            self._session.headers['X-API-Key'] = api_key
        self._session.headers['Content-Type'] = 'application/json'
        
    def start(self):
        """Start the background worker thread"""
        if self._running:
            return
            
        self._running = True
        self._worker_thread = threading.Thread(target=self._worker, daemon=True)
        self._worker_thread.start()
        logger.info(f"Metrics collector started, sending to {self.metrics_domain}")
        
    def stop(self):
        """Stop the background worker thread"""
        self._running = False
        if self._worker_thread:
            self._worker_thread.join(timeout=5)
        
        # Flush remaining metrics
        self._flush_batch(list(self._queue.queue))
        
    def track(self, 
              metric_name: Union[str, MetricType], 
              value: float = 1.0,
              user_id: Optional[int] = None,
              searchable_id: Optional[int] = None,
              searchable_type: Optional[str] = None,
              ip_address: Optional[str] = None,
              **extra_tags):
        """
        Track a metric event
        
        Args:
            metric_name: Name of the metric or MetricType enum
            value: Metric value (default 1 for count events)
            user_id: Optional user ID
            searchable_id: Optional searchable ID
            searchable_type: Optional searchable type
            ip_address: Optional IP address
            **extra_tags: Additional tags as kwargs
        """
        # Build tags
        tags = {}
        if user_id is not None:
            tags['user_id'] = str(user_id)
        if searchable_id is not None:
            tags['searchable_id'] = str(searchable_id)
        if searchable_type:
            tags['searchable_type'] = searchable_type
        if ip_address:
            tags['ip'] = ip_address
            
        # Add extra tags
        tags.update({k: str(v) for k, v in extra_tags.items() if v is not None})
        
        # Handle enum
        if isinstance(metric_name, MetricType):
            metric_name = metric_name.value
            
        metric = Metric(
            metric_name=metric_name,
            metric_value=value,
            tags=tags,
            metadata={}
        )
        
        # Non-blocking add to queue
        try:
            self._queue.put_nowait(metric)
        except Full:
            logger.warning(f"Metrics queue full, dropping metric: {metric_name}")
    
    def _worker(self):
        """Background worker to process metrics queue"""
        batch = []
        last_flush = time.time()
        
        while self._running:
            try:
                # Try to get a metric with timeout
                metric = self._queue.get(timeout=0.1)
                batch.append(metric)
                
                # Send batch if size reached or time elapsed
                current_time = time.time()
                if len(batch) >= self.batch_size or (current_time - last_flush) >= self.flush_interval:
                    self._flush_batch(batch)
                    batch = []
                    last_flush = current_time
                    
            except:
                # Queue.get timeout - check if we need to flush
                current_time = time.time()
                if batch and (current_time - last_flush) >= self.flush_interval:
                    self._flush_batch(batch)
                    batch = []
                    last_flush = current_time
        
        # Flush any remaining metrics
        if batch:
            self._flush_batch(batch)
    
    def _flush_batch(self, batch: List[Metric]):
        """Send a batch of metrics to the metrics service"""
        if not batch:
            return
            
        url = urljoin(self.metrics_domain, '/api/v1/metrics/batch')
        
        try:
            # Convert metrics to dict format
            data = {
                'metrics': [metric.to_dict() for metric in batch]
            }
            
            response = self._session.post(url, json=data, timeout=5)
            response.raise_for_status()
            
            logger.debug(f"Successfully sent {len(batch)} metrics")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send metrics batch: {e}")
            # In production, you might want to implement retry logic here
        except Exception as e:
            logger.error(f"Unexpected error sending metrics: {e}")
    
    def get_metrics(self, 
                    metric_name: Optional[str] = None,
                    start_time: Optional[datetime] = None,
                    end_time: Optional[datetime] = None,
                    tags: Optional[Dict[str, str]] = None,
                    limit: int = 100) -> Optional[List[Dict]]:
        """
        Retrieve metrics from the metrics service
        
        Args:
            metric_name: Filter by metric name
            start_time: Start time for date range
            end_time: End time for date range
            tags: Filter by tags
            limit: Maximum number of results
            
        Returns:
            List of metrics or None if error
        """
        url = urljoin(self.metrics_domain, '/api/v1/metrics')
        
        params = {'limit': limit}
        if metric_name:
            params['metric_name'] = metric_name
        if start_time:
            params['start_time'] = start_time.isoformat()
        if end_time:
            params['end_time'] = end_time.isoformat()
        if tags:
            params['tags'] = json.dumps(tags)
            
        try:
            response = self._session.get(url, params=params, timeout=5)
            response.raise_for_status()
            return response.json().get('metrics', [])
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to retrieve metrics: {e}")
            return None

# Singleton instance
_collector = None

def init_metrics(metrics_domain: str = None, **kwargs):
    """Initialize the global metrics collector"""
    global _collector
    
    # Use environment variable if domain not provided
    if not metrics_domain:
        import os
        metrics_domain = os.environ.get('METRICS_DOMAIN', 'http://localhost:5007')
    
    _collector = MetricsCollector(metrics_domain=metrics_domain, **kwargs)
    _collector.start()
    
    return _collector

def get_collector() -> Optional[MetricsCollector]:
    """Get the global metrics collector instance"""
    return _collector

def track(*args, **kwargs):
    """Global track function"""
    if _collector:
        _collector.track(*args, **kwargs)
    else:
        logger.debug("Metrics collector not initialized")

# Convenience tracking functions
def track_page_view(user_id=None, ip_address=None, page=None, **kwargs):
    """Track a page view event"""
    track(MetricType.PAGE_VIEW, user_id=user_id, ip_address=ip_address, page=page, **kwargs)

def track_item_view(searchable_id, searchable_type=None, user_id=None, ip_address=None, **kwargs):
    """Track an item view event"""
    track(MetricType.ITEM_VIEW, 
          searchable_id=searchable_id, 
          searchable_type=searchable_type,
          user_id=user_id, 
          ip_address=ip_address,
          **kwargs)

def track_user_signup(user_id, ip_address=None, **kwargs):
    """Track a user signup event"""
    track(MetricType.USER_SIGNUP, user_id=user_id, ip_address=ip_address, **kwargs)

def track_user_login(user_id, ip_address=None, **kwargs):
    """Track a user login event"""
    track(MetricType.USER_LOGIN, user_id=user_id, ip_address=ip_address, **kwargs)

def track_item_created(searchable_id, searchable_type, user_id, **kwargs):
    """Track searchable item creation"""
    track(MetricType.ITEM_CREATED,
          searchable_id=searchable_id,
          searchable_type=searchable_type,
          user_id=user_id,
          **kwargs)

def track_invoice_created(invoice_id, amount, invoice_type, user_id=None, **kwargs):
    """Track invoice creation"""
    track(MetricType.INVOICE_CREATED, 
          value=amount,
          invoice_id=invoice_id,
          invoice_type=invoice_type,
          user_id=user_id,
          **kwargs)

def track_payment_completed(payment_id, amount, user_id=None, **kwargs):
    """Track payment completion"""
    track(MetricType.PAYMENT_COMPLETED,
          value=amount,
          payment_id=payment_id,
          user_id=user_id,
          **kwargs)

def track_api_request(endpoint, method, status_code, response_time, user_id=None, **kwargs):
    """Track API request metrics"""
    track(MetricType.API_REQUEST,
          value=response_time,
          endpoint=endpoint,
          method=method,
          status_code=str(status_code),
          user_id=user_id,
          **kwargs)

def track_error(error_type, error_message, user_id=None, **kwargs):
    """Track error events"""
    track(MetricType.ERROR,
          error_type=error_type,
          error_message=error_message[:100],  # Truncate long messages
          user_id=user_id,
          **kwargs)