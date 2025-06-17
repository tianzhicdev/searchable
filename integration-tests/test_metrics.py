"""
Integration tests for metrics collection system
Tests metric event recording and retrieval
"""

import pytest
import time
import uuid
from datetime import datetime, timedelta
from api_client import SearchableAPIClient

class TestMetrics:
    """Test metrics collection and retrieval"""
    
    @classmethod
    def setup_class(cls):
        """Set up test client and test data"""
        cls.client = SearchableAPIClient()
        cls.test_id = str(uuid.uuid4())[:8]
        cls.test_username = f"test_metrics_{cls.test_id}"
        cls.test_email = f"test_metrics_{cls.test_id}@example.com"
        cls.test_password = "test_password_123"
        cls.user_id = None
        
        # Direct metrics API endpoint for testing
        cls.metrics_base_url = "http://localhost:5007"
    
    def test_01_metrics_service_health(self):
        """Test that metrics service is healthy"""
        print("Testing metrics service health...")
        
        response = self.client.session.get(f"{self.metrics_base_url}/health")
        assert response.status_code == 200, f"Metrics service unhealthy: {response.text}"
        
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'metrics'
        print("✓ Metrics service is healthy")
    
    def test_02_user_signup_creates_metric(self):
        """Test that user signup creates a metric event"""
        print(f"Testing user signup metric for: {self.test_username}")
        
        # Allow time for any previous metrics to be processed
        time.sleep(1)
        
        # Register a new user
        response = self.client.register(self.test_username, self.test_email, self.test_password)
        assert response['success'] is True
        self.user_id = response['userID']
        print(f"✓ User registered with ID: {self.user_id}")
        
        # Wait for metric to be processed
        time.sleep(2)
        
        # Query metrics API directly
        params = {
            'metric_name': 'user_signup',
            'limit': 10
        }
        response = self.client.session.get(f"{self.metrics_base_url}/api/v1/metrics", params=params)
        assert response.status_code == 200
        
        metrics_data = response.json()
        assert 'metrics' in metrics_data
        
        # Find our signup metric
        found_metric = None
        for metric in metrics_data['metrics']:
            if metric['tags'].get('user_id') == str(self.user_id):
                found_metric = metric
                break
        
        assert found_metric is not None, f"Signup metric not found for user {self.user_id}"
        assert found_metric['metric_name'] == 'user_signup'
        assert found_metric['metric_value'] == 1.0
        print("✓ User signup metric recorded correctly")
    
    def test_03_user_login_creates_metric(self):
        """Test that user login creates a metric event"""
        print(f"Testing user login metric for: {self.test_email}")
        
        # Login the user
        response = self.client.login(self.test_email, self.test_password)
        assert response['success'] is True
        print("✓ User logged in successfully")
        
        # Wait for metric to be processed
        time.sleep(2)
        
        # Query metrics API
        params = {
            'metric_name': 'user_login',
            'limit': 10
        }
        response = self.client.session.get(f"{self.metrics_base_url}/api/v1/metrics", params=params)
        assert response.status_code == 200
        
        metrics_data = response.json()
        
        # Find our login metric
        found_metric = None
        for metric in metrics_data['metrics']:
            if metric['tags'].get('user_id') == str(self.user_id):
                found_metric = metric
                break
        
        assert found_metric is not None, f"Login metric not found for user {self.user_id}"
        assert found_metric['metric_name'] == 'user_login'
        assert found_metric['metric_value'] == 1.0
        print("✓ User login metric recorded correctly")
    
    def test_04_create_metric_directly(self):
        """Test creating metrics directly via API"""
        print("Testing direct metric creation...")
        
        # Create a test metric
        metric_data = {
            'metric_name': 'test_event',
            'metric_value': 42.5,
            'tags': {
                'test_id': self.test_id,
                'environment': 'integration_test'
            },
            'metadata': {
                'test_run': True,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        response = self.client.session.post(
            f"{self.metrics_base_url}/api/v1/metrics",
            json=metric_data
        )
        assert response.status_code == 201
        
        result = response.json()
        assert result['success'] is True
        assert 'event_id' in result
        print(f"✓ Direct metric created with ID: {result['event_id']}")
    
    def test_05_batch_create_metrics(self):
        """Test creating multiple metrics in batch"""
        print("Testing batch metric creation...")
        
        # Create batch of metrics
        metrics = []
        for i in range(5):
            metrics.append({
                'metric_name': 'batch_test_event',
                'metric_value': i + 1,
                'tags': {
                    'test_id': self.test_id,
                    'batch_index': str(i)
                },
                'metadata': {
                    'batch_test': True
                }
            })
        
        batch_data = {'metrics': metrics}
        
        response = self.client.session.post(
            f"{self.metrics_base_url}/api/v1/metrics/batch",
            json=batch_data
        )
        assert response.status_code == 201
        
        result = response.json()
        assert result['success'] is True
        assert result['inserted'] == 5
        print("✓ Batch metrics created successfully")
    
    def test_06_query_metrics_with_filters(self):
        """Test querying metrics with various filters"""
        print("Testing metric queries with filters...")
        
        # Wait for batch metrics to be available
        time.sleep(1)
        
        # Query by metric name
        params = {
            'metric_name': 'batch_test_event',
            'limit': 10
        }
        response = self.client.session.get(f"{self.metrics_base_url}/api/v1/metrics", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data['metrics']) >= 5
        print(f"✓ Found {len(data['metrics'])} batch test events")
        
        # Query by tags
        import json
        params = {
            'tags': json.dumps({'test_id': self.test_id}),
            'limit': 20
        }
        response = self.client.session.get(f"{self.metrics_base_url}/api/v1/metrics", params=params)
        assert response.status_code == 200
        
        data = response.json()
        test_metrics = [m for m in data['metrics'] if m['tags'].get('test_id') == self.test_id]
        assert len(test_metrics) >= 6  # 1 direct + 5 batch
        print(f"✓ Found {len(test_metrics)} metrics for test_id {self.test_id}")
    
    def test_07_time_range_queries(self):
        """Test querying metrics by time range"""
        print("Testing time range queries...")
        
        # Query recent metrics
        start_time = (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        params = {
            'start_time': start_time,
            'limit': 100
        }
        response = self.client.session.get(f"{self.metrics_base_url}/api/v1/metrics", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data['metrics']) > 0
        
        # Verify all metrics are within time range
        for metric in data['metrics']:
            metric_time = datetime.fromisoformat(metric['created_at'].replace('Z', '+00:00'))
            assert metric_time >= datetime.fromisoformat(start_time)
        
        print(f"✓ Time range query returned {len(data['metrics'])} recent metrics")
    
    def test_08_aggregate_metrics(self):
        """Test metrics aggregation endpoint"""
        print("Testing metrics aggregation...")
        
        # Get aggregated metrics for last 24 hours
        params = {'hours': 24}
        response = self.client.session.get(
            f"{self.metrics_base_url}/api/v1/metrics/aggregate",
            params=params
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'aggregations' in data
        aggregations = data['aggregations']
        
        # Check expected aggregation fields
        assert 'unique_visitors' in aggregations
        assert 'page_views' in aggregations
        assert 'new_users' in aggregations
        assert 'item_views_by_type' in aggregations
        assert 'new_items_by_type' in aggregations
        assert 'invoices_by_type' in aggregations
        
        print("✓ Metrics aggregation working correctly")
        print(f"  Unique visitors: {aggregations['unique_visitors']}")
        print(f"  New users: {aggregations['new_users']}")
    
    def test_09_searchable_item_metrics(self):
        """Test metrics for searchable item events"""
        print("Testing searchable item metrics...")
        
        # Create a searchable item (would normally be done through the API)
        # For now, just create a metric directly
        metric_data = {
            'metric_name': 'item_created',
            'metric_value': 1,
            'tags': {
                'user_id': str(self.user_id),
                'searchable_id': '999',
                'searchable_type': 'downloadable'
            },
            'metadata': {
                'title': 'Test Item'
            }
        }
        
        response = self.client.session.post(
            f"{self.metrics_base_url}/api/v1/metrics",
            json=metric_data
        )
        assert response.status_code == 201
        
        # Create item view metric
        view_metric = {
            'metric_name': 'item_view',
            'metric_value': 1,
            'tags': {
                'searchable_id': '999',
                'searchable_type': 'downloadable',
                'ip': '192.168.1.100'
            }
        }
        
        response = self.client.session.post(
            f"{self.metrics_base_url}/api/v1/metrics",
            json=view_metric
        )
        assert response.status_code == 201
        
        print("✓ Searchable item metrics created successfully")
    
    def test_10_metrics_performance(self):
        """Test metrics system performance with bulk operations"""
        print("Testing metrics performance...")
        
        start_time = time.time()
        
        # Create 100 metrics in batches of 20
        total_created = 0
        for batch_num in range(5):
            metrics = []
            for i in range(20):
                metrics.append({
                    'metric_name': 'performance_test',
                    'metric_value': batch_num * 20 + i,
                    'tags': {
                        'test_id': self.test_id,
                        'batch': str(batch_num)
                    }
                })
            
            response = self.client.session.post(
                f"{self.metrics_base_url}/api/v1/metrics/batch",
                json={'metrics': metrics}
            )
            assert response.status_code == 201
            total_created += 20
        
        elapsed = time.time() - start_time
        print(f"✓ Created {total_created} metrics in {elapsed:.2f} seconds")
        print(f"  Rate: {total_created/elapsed:.1f} metrics/second")
        
        # Query performance
        start_time = time.time()
        params = {
            'metric_name': 'performance_test',
            'limit': 100
        }
        response = self.client.session.get(
            f"{self.metrics_base_url}/api/v1/metrics",
            params=params
        )
        assert response.status_code == 200
        
        query_elapsed = time.time() - start_time
        data = response.json()
        print(f"✓ Queried {len(data['metrics'])} metrics in {query_elapsed:.3f} seconds")

if __name__ == '__main__':
    pytest.main([__file__, '-v'])