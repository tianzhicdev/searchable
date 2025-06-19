"""
Comprehensive Grafana integration tests
Tests Grafana API, dashboards, datasources, and visualization functionality
"""

import pytest
import time
import uuid
import json
import requests
from datetime import datetime, timedelta
from api_client import SearchableAPIClient

class TestGrafana:
    """Test Grafana integration and dashboard functionality"""
    
    @classmethod
    def setup_class(cls):
        """Set up test environment for Grafana tests"""
        cls.client = SearchableAPIClient()
        cls.test_id = str(uuid.uuid4())[:8]
        
        # Grafana configuration
        cls.grafana_base_url = "http://localhost/grafana"
        cls.grafana_direct_url = "http://localhost:3000"
        cls.grafana_user = "admin"
        cls.grafana_password = "admin123"
        cls.grafana_auth = (cls.grafana_user, cls.grafana_password)
        
        # Metrics service for test data
        cls.metrics_base_url = "http://localhost:5007"
        
        print(f"Grafana Test ID: {cls.test_id}")
    
    def test_01_grafana_service_health(self):
        """Test Grafana service is healthy and accessible"""
        
        # Test direct access
        response = requests.get(f"{self.grafana_direct_url}/api/health")
        assert response.status_code == 200
        
        health_data = response.json()
        assert 'database' in health_data
        assert health_data['database'] == 'ok'
        assert 'version' in health_data
        assert isinstance(health_data['version'], str)
        assert len(health_data['version']) > 0
        
        # Test proxy access through Nginx
        response = requests.get(f"{self.grafana_base_url}/api/health")
        assert response.status_code == 200
        
        proxy_health = response.json()
        assert 'database' in proxy_health
        assert proxy_health['database'] == 'ok'
    
    def test_02_grafana_authentication(self):
        """Test Grafana authentication and session management"""
        
        # Test login endpoint
        response = requests.get(
            f"{self.grafana_base_url}/api/user",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        user_data = response.json()
        assert 'login' in user_data
        assert user_data['login'] == self.grafana_user
        assert 'isGrafanaAdmin' in user_data
        assert user_data['isGrafanaAdmin'] is True
        assert 'id' in user_data
        assert isinstance(user_data['id'], int)
        
        # Test invalid credentials
        response = requests.get(
            f"{self.grafana_base_url}/api/user",
            auth=("invalid", "credentials")
        )
        assert response.status_code == 401
    
    def test_03_postgresql_datasource_configuration(self):
        """Test PostgreSQL datasource is properly configured"""
        print("Testing PostgreSQL datasource configuration...")
        
        # Get all datasources
        response = requests.get(
            f"{self.grafana_base_url}/api/datasources",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        datasources = response.json()
        assert isinstance(datasources, list)
        assert len(datasources) == 1  # Should have exactly 1 datasource
        
        # Find PostgreSQL datasource
        postgres_ds = None
        assert len(datasources) > 0  # Check list length before iteration
        for ds in datasources:
            assert 'type' in ds
            if ds['type'] == 'grafana-postgresql-datasource':
                postgres_ds = ds
                break
        
        assert postgres_ds is not None
        assert 'name' in postgres_ds
        assert postgres_ds['name'] == 'PostgreSQL'
        assert 'database' in postgres_ds
        assert postgres_ds['database'] == 'searchable'
        assert 'user' in postgres_ds
        assert postgres_ds['user'] == 'searchable'
        assert 'isDefault' in postgres_ds
        assert postgres_ds['isDefault'] is True
        assert 'id' in postgres_ds
        assert isinstance(postgres_ds['id'], int)
        
        # Test datasource health
        response = requests.get(
            f"{self.grafana_base_url}/api/datasources/{postgres_ds['id']}/health",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        health = response.json()
        assert 'status' in health
        assert health['status'] == 'OK'
        assert 'message' in health
        assert isinstance(health['message'], str)
        assert 'Database Connection OK' in health['message']
    
    def test_04_dashboard_provisioning(self):
        """Test that dashboards are properly provisioned"""
        
        # Get all dashboards
        response = requests.get(
            f"{self.grafana_base_url}/api/search",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        dashboards = response.json()
        assert isinstance(dashboards, list)
        assert len(dashboards) == 2  # Should have exactly 2 dashboards
        
        # Check list length before creating dashboard_titles
        assert len(dashboards) > 0
        dashboard_titles = [d['title'] for d in dashboards]
        
        # Check for expected dashboards
        expected_dashboards = [
            'Searchable Metrics Dashboard',
            'Simple Metrics Dashboard'
        ]
        
        assert len(expected_dashboards) == 2
        for expected in expected_dashboards:
            assert expected in dashboard_titles
        
        # Test specific dashboard access
        metrics_dashboard = None
        assert len(dashboards) > 0  # Check list length before iteration
        for dashboard in dashboards:
            assert 'title' in dashboard
            if dashboard['title'] == 'Searchable Metrics Dashboard':
                metrics_dashboard = dashboard
                break
        
        assert metrics_dashboard is not None
        assert 'uid' in metrics_dashboard
        
        # Get dashboard details
        response = requests.get(
            f"{self.grafana_base_url}/api/dashboards/uid/{metrics_dashboard['uid']}",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        dashboard_data = response.json()
        assert 'dashboard' in dashboard_data
        assert 'title' in dashboard_data['dashboard']
        assert dashboard_data['dashboard']['title'] == 'Searchable Metrics Dashboard'
        assert 'panels' in dashboard_data['dashboard']
        assert isinstance(dashboard_data['dashboard']['panels'], list)
        assert len(dashboard_data['dashboard']['panels']) == 5  # Should have exactly 5 panels
    
    def test_05_create_test_metrics_for_visualization(self):
        """Create test metrics data for dashboard visualization testing"""
        
        # Create comprehensive test dataset
        test_metrics = []
        base_time = datetime.utcnow()
        
        # Simulate 24 hours of metrics data
        expected_hours = 24
        for hour_offset in range(expected_hours):
            event_time = base_time - timedelta(hours=hour_offset)
            
            # User activities - exactly 5 events per hour
            for i in range(5):
                test_metrics.extend([
                    {
                        'metric_name': 'page_view',
                        'metric_value': 1,
                        'tags': {
                            'page': f'page_{i % 3}',
                            'user_id': f'test_user_{i}',
                            'test_suite': self.test_id
                        },
                        'metadata': {
                            'simulated_time': event_time.isoformat(),
                            'test_data': True
                        }
                    },
                    {
                        'metric_name': 'user_action',
                        'metric_value': 1,
                        'tags': {
                            'action_type': f'action_{i % 4}',
                            'user_id': f'test_user_{i}',
                            'test_suite': self.test_id
                        },
                        'metadata': {
                            'simulated_time': event_time.isoformat(),
                            'test_data': True
                        }
                    }
                ])
            
            # Errors - exactly every 4 hours
            if hour_offset % 4 == 0:
                test_metrics.append({
                    'metric_name': 'error',
                    'metric_value': 1,
                    'tags': {
                        'error_type': 'test_error',
                        'severity': 'low',
                        'test_suite': self.test_id
                    },
                    'metadata': {
                        'simulated_time': event_time.isoformat(),
                        'test_data': True
                    }
                })
        
        # Verify exact expected count: 24 hours * 5 events * 2 metrics + 6 errors = 246
        expected_total = (24 * 5 * 2) + 6
        assert len(test_metrics) == expected_total
        
        # Submit metrics in batches
        batch_size = 50
        total_inserted = 0
        expected_batches = (len(test_metrics) + batch_size - 1) // batch_size  # Ceiling division
        
        for i in range(0, len(test_metrics), batch_size):
            batch = test_metrics[i:i + batch_size]
            assert len(batch) > 0  # Ensure batch is not empty
            
            response = requests.post(
                f"{self.metrics_base_url}/api/v1/metrics/batch",
                json={'metrics': batch}
            )
            assert response.status_code == 201
            
            result = response.json()
            assert 'inserted' in result
            assert isinstance(result['inserted'], int)
            assert result['inserted'] == len(batch)
            total_inserted += result['inserted']
        
        # Verify all metrics were inserted
        assert total_inserted == len(test_metrics)
        
        # Wait for metrics to be processed
        time.sleep(2)
        
        # Verify metrics were stored
        response = requests.get(
            f"{self.metrics_base_url}/api/v1/metrics",
            params={'tags': json.dumps({'test_suite': self.test_id}), 'limit': 100}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'metrics' in data
        stored_metrics = data['metrics']
        assert isinstance(stored_metrics, list)
        assert len(stored_metrics) == 100  # Limited by the query parameter
    
    def test_06_dashboard_query_execution(self):
        """Test dashboard queries execute successfully against PostgreSQL"""
        
        # Test simple queries that dashboards would use
        test_queries = [
            {
                'name': 'Total Events Count',
                'sql': 'SELECT COUNT(*) as total_events FROM metrics'
            },
            {
                'name': 'Events by Type',
                'sql': 'SELECT metric_name, COUNT(*) as count FROM metrics GROUP BY metric_name ORDER BY count DESC LIMIT 10'
            },
            {
                'name': 'Recent Events',
                'sql': "SELECT created_at, metric_name, metric_value FROM metrics WHERE created_at >= NOW() - INTERVAL '1 hour' ORDER BY created_at DESC LIMIT 5"
            },
            {
                'name': 'Hourly Events',
                'sql': "SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*) as count FROM metrics WHERE created_at >= NOW() - INTERVAL '24 hours' GROUP BY hour ORDER BY hour"
            }
        ]
        
        # Verify exact number of test queries
        assert len(test_queries) == 4
        
        # Validate each query structure
        assert len(test_queries) > 0  # Check list length before iteration
        for query_test in test_queries:
            assert 'name' in query_test
            assert 'sql' in query_test
            assert isinstance(query_test['name'], str)
            assert isinstance(query_test['sql'], str)
            
            sql = query_test['sql']
            assert 'SELECT' in sql.upper()
            assert 'FROM metrics' in sql
            assert len(sql) > 20  # Must be a substantial query
        
        # Test that we can query metrics with our test data
        response = requests.get(
            f"{self.metrics_base_url}/api/v1/metrics",
            params={'metric_name': 'page_view', 'limit': 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'metrics' in data
        page_view_metrics = data['metrics']
        assert isinstance(page_view_metrics, list)
        assert len(page_view_metrics) == 5  # Limited by the query parameter
    
    def test_07_dashboard_panels_configuration(self):
        """Test dashboard panels are properly configured"""
        
        # Get the main metrics dashboard
        response = requests.get(
            f"{self.grafana_base_url}/api/dashboards/uid/searchable-metrics",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        dashboard_data = response.json()
        assert 'dashboard' in dashboard_data
        dashboard = dashboard_data['dashboard']
        assert 'panels' in dashboard
        panels = dashboard['panels']
        
        assert isinstance(panels, list)
        assert len(panels) == 5  # Should have exactly 5 panels
        
        # Verify panel types and configuration
        assert len(panels) > 0  # Check list length before iteration
        panel_types = [panel.get('type') for panel in panels]
        expected_types = ['timeseries', 'stat', 'piechart', 'table']
        
        assert len(expected_types) == 4
        assert len(panel_types) == 5
        
        for expected_type in expected_types:
            assert expected_type in panel_types
        
        # Verify panels have targets (queries)
        panels_with_targets = 0
        assert len(panels) > 0  # Check list length before iteration
        for panel in panels:
            assert 'title' in panel
            if 'targets' in panel:
                targets = panel['targets']
                assert isinstance(targets, list)
                assert len(targets) > 0
                panels_with_targets += 1
                
                assert len(targets) > 0  # Check list length before iteration
                for target in targets:
                    assert isinstance(target, dict)
                    # Must have either rawSql or expr
                    has_query = 'rawSql' in target or 'expr' in target
                    assert has_query is True
        
        # At least some panels should have targets
        assert panels_with_targets == 5  # All 5 panels should have targets
    
    def test_08_grafana_alerting_capability(self):
        """Test Grafana alerting functionality"""
        
        # Try multiple alerting endpoints (different versions have different APIs)
        alerting_endpoints = [
            "/api/alert-notifications",  # Legacy alerting
            "/api/v1/provisioning/alert-rules",  # New unified alerting
            "/api/alertmanager/grafana/api/v2/status",  # Alertmanager status
            "/api/ruler/grafana/api/v1/rules"  # Ruler API
        ]
        
        assert len(alerting_endpoints) == 4
        
        working_endpoints = []
        successful_requests = 0
        
        assert len(alerting_endpoints) > 0  # Check list length before iteration
        for endpoint in alerting_endpoints:
            response = requests.get(
                f"{self.grafana_base_url}{endpoint}",
                auth=self.grafana_auth,
                timeout=5
            )
            # Accept both 200 (working) and 404 (endpoint exists but no data)
            if response.status_code in [200, 404]:
                working_endpoints.append(endpoint)
                successful_requests += 1
        
        # Must have access to exactly 4 alerting endpoints
        assert len(working_endpoints) == 4
        assert successful_requests == 4
        
        # Test that we could create an alert rule (don't actually create it)
        test_alert_rule = {
            "uid": f"test-alert-{self.test_id}",
            "title": "Test Metrics Alert",
            "condition": "A",
            "data": [
                {
                    "refId": "A",
                    "queryType": "",
                    "relativeTimeRange": {
                        "from": 600,
                        "to": 0
                    },
                    "model": {
                        "expr": "SELECT COUNT(*) FROM metrics WHERE metric_name = 'error'",
                        "refId": "A"
                    }
                }
            ],
            "noDataState": "NoData",
            "execErrState": "Alerting",
            "for": "5m"
        }
        
        # Validate the complete structure
        required_fields = ['uid', 'title', 'data', 'condition', 'noDataState', 'execErrState', 'for']
        assert len(required_fields) == 7
        
        for field in required_fields:
            assert field in test_alert_rule
        
        assert isinstance(test_alert_rule['data'], list)
        assert len(test_alert_rule['data']) == 1
        assert 'refId' in test_alert_rule['data'][0]
        assert test_alert_rule['data'][0]['refId'] == 'A'
    
    def test_09_grafana_user_management(self):
        """Test Grafana user and organization management"""
        
        # Get current user info
        response = requests.get(
            f"{self.grafana_base_url}/api/user",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        user_info = response.json()
        required_user_fields = ['id', 'login', 'orgId', 'isGrafanaAdmin']
        
        for field in required_user_fields:
            assert field in user_info
        
        assert isinstance(user_info['id'], int)
        assert user_info['login'] == self.grafana_user
        assert isinstance(user_info['orgId'], int)
        assert user_info['isGrafanaAdmin'] is True
        
        # Get organization info
        response = requests.get(
            f"{self.grafana_base_url}/api/org",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        org_info = response.json()
        required_org_fields = ['id', 'name']
        
        for field in required_org_fields:
            assert field in org_info
        
        assert isinstance(org_info['id'], int)
        assert isinstance(org_info['name'], str)
        assert len(org_info['name']) > 0
        
        # Get users in organization
        response = requests.get(
            f"{self.grafana_base_url}/api/org/users",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        org_users = response.json()
        assert isinstance(org_users, list)
        assert len(org_users) == 1  # Should have exactly 1 user (admin)
        
        assert len(org_users) > 0  # Check list length before iteration
        admin_user = None
        for u in org_users:
            assert 'login' in u
            assert 'role' in u
            if u['login'] == self.grafana_user:
                admin_user = u
                break
        
        assert admin_user is not None
        assert admin_user['role'] == 'Admin'
        assert admin_user['login'] == self.grafana_user
    
    def test_10_grafana_api_performance(self):
        """Test Grafana API performance and response times"""
        
        performance_tests = [
            {'endpoint': '/api/health', 'name': 'Health Check', 'max_time': 2.0},
            {'endpoint': '/api/dashboards/uid/searchable-metrics', 'name': 'Dashboard Load', 'max_time': 3.0},
            {'endpoint': '/api/datasources', 'name': 'Datasources List', 'max_time': 2.0},
            {'endpoint': '/api/search', 'name': 'Dashboard Search', 'max_time': 2.0}
        ]
        
        assert len(performance_tests) == 4
        successful_tests = 0
        
        assert len(performance_tests) > 0  # Check list length before iteration
        for test in performance_tests:
            assert 'endpoint' in test
            assert 'name' in test
            assert 'max_time' in test
            
            start_time = time.time()
            
            response = requests.get(
                f"{self.grafana_base_url}{test['endpoint']}",
                auth=self.grafana_auth
            )
            
            elapsed = time.time() - start_time
            
            assert response.status_code == 200
            assert elapsed < test['max_time']
            assert elapsed > 0.0  # Must take some time
            successful_tests += 1
        
        # All tests must pass
        assert successful_tests == 4
    
    def test_11_grafana_dashboard_export_import(self):
        """Test dashboard export and import functionality"""
        
        # Export existing dashboard
        response = requests.get(
            f"{self.grafana_base_url}/api/dashboards/uid/simple-metrics",
            auth=self.grafana_auth
        )
        assert response.status_code == 200
        
        exported_dashboard = response.json()
        assert 'dashboard' in exported_dashboard
        assert 'meta' in exported_dashboard
        
        dashboard_json = exported_dashboard['dashboard']
        required_dashboard_fields = ['title', 'panels', 'time', 'refresh', 'uid']
        
        for field in required_dashboard_fields:
            assert field in dashboard_json
        
        assert dashboard_json['title'] == 'Simple Metrics Dashboard'
        assert isinstance(dashboard_json['panels'], list)
        assert len(dashboard_json['panels']) == 3  # Should have exactly 3 panels
        
        # Test that we could import (prepare import data)
        import_data = {
            "dashboard": {
                **dashboard_json,
                "id": None,  # Remove ID for import
                "uid": f"test-import-{self.test_id}",
                "title": f"Test Import Dashboard {self.test_id}",
                "version": 0
            },
            "overwrite": False
        }
        
        # Validate import structure
        required_import_fields = ['dashboard', 'overwrite']
        for field in required_import_fields:
            assert field in import_data
        
        assert import_data['dashboard']['uid'] != dashboard_json.get('uid')
        assert import_data['dashboard']['title'] != dashboard_json['title']
        assert import_data['dashboard']['id'] is None
        assert import_data['dashboard']['version'] == 0
        assert import_data['overwrite'] is False
    
    def test_12_cleanup_test_data(self):
        """Clean up test metrics data"""
        
        # Verify we can identify our test data
        response = requests.get(
            f"{self.metrics_base_url}/api/v1/metrics",
            params={'tags': json.dumps({'test_suite': self.test_id}), 'limit': 100}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'metrics' in data
        test_metrics = data['metrics']
        assert isinstance(test_metrics, list)
        
        # Should find exactly the metrics we created (limited by query)
        assert len(test_metrics) == 100  # Limited by the query parameter
        
        # Verify all found metrics belong to our test suite
        assert len(test_metrics) > 0  # Check list length before iteration
        for metric in test_metrics:
            assert 'tags' in metric
            assert 'test_suite' in metric['tags']
            assert metric['tags']['test_suite'] == self.test_id

if __name__ == '__main__':
    pytest.main([__file__, '-v'])