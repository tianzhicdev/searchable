"""
Integration tests for AI Content Manager API
"""

import pytest
import json
from datetime import datetime
from unittest.mock import patch, MagicMock

from api import app
from api.common.ai_helpers import create_ai_content, get_user_ai_contents, update_ai_content_status


class TestAIContentAPI:
    """Test AI Content API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client
    
    @pytest.fixture
    def auth_headers(self):
        """Mock authentication headers"""
        return {
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json'
        }
    
    @pytest.fixture
    def mock_jwt(self):
        """Mock JWT authentication"""
        with patch('flask_jwt_extended.get_jwt_identity') as mock:
            mock.return_value = 123  # Mock user ID
            yield mock
    
    @pytest.fixture
    def mock_user_required(self):
        """Mock user_required decorator"""
        with patch('api.common.auth_utils.user_required') as mock:
            mock.return_value = lambda f: f
            yield mock
    
    def test_create_ai_content_success(self, client, auth_headers, mock_jwt, mock_user_required):
        """Test successful AI content creation"""
        # Mock file ownership validation
        with patch('api.routes.ai_content.validate_file_ownership') as mock_validate:
            mock_validate.return_value = True
            
            # Mock create_ai_content
            with patch('api.routes.ai_content.create_ai_content') as mock_create:
                mock_create.return_value = 1  # Return AI content ID
                
                data = {
                    'title': 'Test AI Content',
                    'instructions': 'Please process these files',
                    'files': [
                        {
                            'fileId': 'file123',
                            'fileName': 'document.pdf',
                            'fileSize': 1024000,
                            'mimeType': 'application/pdf'
                        }
                    ]
                }
                
                response = client.post('/v1/ai-content', 
                                     data=json.dumps(data),
                                     headers=auth_headers)
                
                assert response.status_code == 200
                result = json.loads(response.data)
                assert result['success'] is True
                assert result['data']['id'] == 1
                assert result['data']['message'] == 'AI content created successfully'
    
    def test_create_ai_content_missing_title(self, client, auth_headers, mock_jwt, mock_user_required):
        """Test AI content creation with missing title"""
        data = {
            'instructions': 'Please process these files',
            'files': [{'fileId': 'file123', 'fileName': 'doc.pdf'}]
        }
        
        response = client.post('/v1/ai-content',
                             data=json.dumps(data),
                             headers=auth_headers)
        
        assert response.status_code == 400
        result = json.loads(response.data)
        assert result['success'] is False
        assert 'Title is required' in result['msg']
    
    def test_create_ai_content_too_many_files(self, client, auth_headers, mock_jwt, mock_user_required):
        """Test AI content creation with too many files"""
        files = [{'fileId': f'file{i}', 'fileName': f'doc{i}.pdf'} for i in range(11)]
        
        data = {
            'title': 'Test',
            'instructions': 'Process files',
            'files': files
        }
        
        response = client.post('/v1/ai-content',
                             data=json.dumps(data),
                             headers=auth_headers)
        
        assert response.status_code == 400
        result = json.loads(response.data)
        assert 'Maximum 10 files allowed' in result['msg']
    
    def test_get_user_ai_contents(self, client, auth_headers, mock_jwt, mock_user_required):
        """Test getting user's AI content list"""
        # Mock get_user_ai_contents
        with patch('api.routes.ai_content.get_user_ai_contents') as mock_get:
            mock_get.return_value = [
                {
                    'id': 1,
                    'title': 'Test Content',
                    'status': 'submitted',
                    'created_at': datetime.utcnow(),
                    'metadata': {'files': [{'fileId': 'file1'}]}
                }
            ]
            
            response = client.get('/v1/ai-content', headers=auth_headers)
            
            assert response.status_code == 200
            result = json.loads(response.data)
            assert result['success'] is True
            assert len(result['data']['ai_contents']) == 1
            assert result['data']['ai_contents'][0]['title'] == 'Test Content'
            assert result['data']['ai_contents'][0]['file_count'] == 1
    
    def test_get_ai_content_by_id(self, client, auth_headers, mock_jwt, mock_user_required):
        """Test getting specific AI content"""
        # Mock get_ai_content_by_id
        with patch('api.routes.ai_content.get_ai_content_by_id') as mock_get:
            mock_get.return_value = {
                'id': 1,
                'user_id': 123,
                'title': 'Test Content',
                'instructions': 'Process these',
                'status': 'submitted',
                'metadata': {'files': []},
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            response = client.get('/v1/ai-content/1', headers=auth_headers)
            
            assert response.status_code == 200
            result = json.loads(response.data)
            assert result['success'] is True
            assert result['data']['title'] == 'Test Content'
    
    def test_delete_ai_content_immutable(self, client, auth_headers, mock_jwt, mock_user_required):
        """Test that AI content cannot be deleted"""
        # Mock get_ai_content_by_id
        with patch('api.routes.ai_content.get_ai_content_by_id') as mock_get:
            mock_get.return_value = {
                'id': 1,
                'user_id': 123
            }
            
            response = client.delete('/v1/ai-content/1', headers=auth_headers)
            
            assert response.status_code == 400
            result = json.loads(response.data)
            assert 'cannot be deleted' in result['msg']
    
    def test_employee_get_all_ai_contents(self, client):
        """Test employee endpoint to get all AI contents"""
        # Mock get_all_ai_contents
        with patch('api.routes.ai_content.get_all_ai_contents') as mock_get:
            mock_get.return_value = [
                {
                    'id': 1,
                    'user_id': 123,
                    'username': 'testuser',
                    'title': 'Test Content',
                    'instructions': 'Process',
                    'status': 'submitted',
                    'metadata': {'files': []},
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            ]
            
            response = client.get('/v1/employee/ai-content')
            
            assert response.status_code == 200
            result = json.loads(response.data)
            assert result['success'] is True
            assert len(result['data']['ai_contents']) == 1
    
    def test_employee_update_status(self, client):
        """Test employee endpoint to update status"""
        # Mock update_ai_content_status
        with patch('api.routes.ai_content.update_ai_content_status') as mock_update:
            mock_update.return_value = True
            
            data = {
                'status': 'processed',
                'notes': 'Completed processing',
                'processed_by': 'employee1'
            }
            
            response = client.put('/v1/employee/ai-content/1',
                                data=json.dumps(data),
                                headers={'Content-Type': 'application/json'})
            
            assert response.status_code == 200
            result = json.loads(response.data)
            assert result['success'] is True
            assert result['data']['status'] == 'processed'
    
    def test_employee_export_endpoint(self, client):
        """Test employee bulk export endpoint"""
        # Mock get_all_ai_contents
        with patch('api.routes.ai_content.get_all_ai_contents') as mock_get:
            mock_get.return_value = [
                {
                    'id': 1,
                    'user_id': 123,
                    'username': 'testuser',
                    'title': 'Test Content',
                    'instructions': 'Process',
                    'status': 'submitted',
                    'metadata': {'files': [{'fileId': 'file1', 'fileName': 'doc.pdf'}]},
                    'created_at': datetime.utcnow()
                }
            ]
            
            response = client.get('/v1/employee/ai-content/export?status=submitted')
            
            assert response.status_code == 200
            result = json.loads(response.data)
            assert result['success'] is True
            assert len(result['data']['ai_contents']) == 1
            assert len(result['data']['ai_contents'][0]['files']) == 1


class TestAIContentHelpers:
    """Test AI content helper functions"""
    
    @pytest.fixture
    def mock_db_connection(self):
        """Mock database connection"""
        with patch('api.common.ai_helpers.get_db_connection') as mock:
            conn = MagicMock()
            cursor = MagicMock()
            conn.cursor.return_value = cursor
            mock.return_value = conn
            yield conn, cursor
    
    def test_create_ai_content_helper(self, mock_db_connection):
        """Test create_ai_content helper function"""
        conn, cursor = mock_db_connection
        cursor.fetchone.return_value = [1]  # Return ID
        
        from api.common.ai_helpers import create_ai_content
        
        result = create_ai_content(
            user_id=123,
            title='Test',
            instructions='Process',
            metadata={'files': []}
        )
        
        assert result == 1
        cursor.execute.assert_called_once()
        conn.commit.assert_called_once()
    
    def test_update_ai_content_status_helper(self, mock_db_connection):
        """Test update_ai_content_status helper function"""
        conn, cursor = mock_db_connection
        cursor.fetchone.return_value = [{'files': []}]  # Current metadata
        cursor.rowcount = 1
        
        from api.common.ai_helpers import update_ai_content_status
        
        result = update_ai_content_status(
            ai_content_id=1,
            status='processed',
            notes='Done',
            processed_by='employee1'
        )
        
        assert result is True
        assert cursor.execute.call_count == 2  # Get + Update
        conn.commit.assert_called_once()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])