import pytest
import uuid
import time
import json
from api_client import APIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD, BASE_URL


class TestAIContent:
    """Test AI Content Manager functionality"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with a test user"""
        cls.test_id = str(uuid.uuid4())[:8]
        cls.username = f"{TEST_USER_PREFIX}ai_{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        cls.client = APIClient()
        cls.ai_content_ids = []
        
    def make_authenticated_request(self, method, endpoint, **kwargs):
        """Helper method to make authenticated requests"""
        headers = kwargs.pop('headers', {})
        if self.client.token:
            headers['authorization'] = self.client.token
        
        url = f"{self.client.base_url}{endpoint}"
        response = self.client.session.request(method, url, headers=headers, **kwargs)
        return response.json()
    
    def make_request(self, method, endpoint, **kwargs):
        """Helper method to make unauthenticated requests"""
        url = f"{self.client.base_url}{endpoint}"
        response = self.client.session.request(method, url, **kwargs)
        return response.json()
        
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        if cls.client.token:
            try:
                cls.client.logout()
            except:
                pass
    
    def test_01_register_and_login(self):
        """Register and login test user"""
        # Register user
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        print(f"[RESPONSE] Register: {response}")
        assert response['success'] is True
        assert 'userID' in response
        
        # Login
        login_response = self.client.login_user(self.email, self.password)
        print(f"[RESPONSE] Login: {login_response}")
        assert login_response['success'] is True
        assert 'token' in login_response
        assert 'user' in login_response
        
    def test_02_create_ai_content(self):
        """Create AI content submission"""
        # Prepare test data
        ai_content_data = {
            "title": "Test AI Content",
            "instructions": "Please process these test files for integration testing",
            "files": [
                {
                    "fileId": "test-file-1",
                    "fileName": "test_document.pdf",
                    "fileSize": 1024000,
                    "mimeType": "application/pdf"
                },
                {
                    "fileId": "test-file-2",
                    "fileName": "test_image.png",
                    "fileSize": 512000,
                    "mimeType": "image/png"
                }
            ]
        }
        
        # Create AI content
        response = self.make_authenticated_request(
            'POST',
            '/v1/ai-content',
            json=ai_content_data
        )
        print(f"[RESPONSE] Create AI Content: {response}")
        
        assert response['success'] is True
        assert 'id' in response
        assert response['message'] == "AI content created successfully"
        
        # Store the AI content ID
        self.ai_content_ids.append(response['id'])
        
    def test_03_get_user_ai_contents(self):
        """Get user's AI content submissions"""
        response = self.make_authenticated_request(
            'GET',
            '/v1/ai-content'
        )
        print(f"[RESPONSE] Get AI Contents: {response}")
        
        assert response['success'] is True
        assert 'ai_contents' in response
        assert 'total' in response
        assert response['total'] >= 1
        
        # Verify our created content is in the list
        ai_contents = response['ai_contents']
        created_content = next((c for c in ai_contents if c['id'] == self.ai_content_ids[0]), None)
        assert created_content is not None
        assert created_content['title'] == "Test AI Content"
        assert created_content['status'] == "submitted"
        assert created_content['file_count'] == 2
        
    def test_04_get_specific_ai_content(self):
        """Get specific AI content details"""
        ai_content_id = self.ai_content_ids[0]
        
        response = self.make_authenticated_request(
            'GET',
            f'/v1/ai-content/{ai_content_id}'
        )
        print(f"[RESPONSE] Get AI Content Detail: {response}")
        
        assert response['success'] is True
        assert response['id'] == ai_content_id
        assert response['title'] == "Test AI Content"
        assert response['instructions'] == "Please process these test files for integration testing"
        assert response['status'] == "submitted"
        assert 'metadata' in response
        assert len(response['metadata']['files']) == 2
        
    def test_05_create_multiple_ai_contents(self):
        """Create multiple AI content submissions"""
        # Create second AI content
        ai_content_data = {
            "title": "Marketing Materials Update",
            "instructions": "Update all marketing materials with new branding",
            "files": [
                {
                    "fileId": "test-file-3",
                    "fileName": "new_logo.png",
                    "fileSize": 204800,
                    "mimeType": "image/png"
                }
            ]
        }
        
        response = self.make_authenticated_request(
            'POST',
            '/v1/ai-content',
            json=ai_content_data
        )
        assert response['success'] is True
        self.ai_content_ids.append(response['id'])
        
        # Create third AI content with maximum files
        files = []
        for i in range(10):  # Maximum 10 files
            files.append({
                "fileId": f"test-file-{i+10}",
                "fileName": f"document_{i+1}.pdf",
                "fileSize": 500 * 1024 * 1024,  # 500MB each (max size)
                "mimeType": "application/pdf"
            })
        
        ai_content_data = {
            "title": "Large Document Collection",
            "instructions": "Process all documents and create a comprehensive report",
            "files": files
        }
        
        response = self.make_authenticated_request(
            'POST',
            '/v1/ai-content',
            json=ai_content_data
        )
        assert response['success'] is True
        self.ai_content_ids.append(response['id'])
        
        # Verify total count
        response = self.make_authenticated_request(
            'GET',
            '/v1/ai-content'
        )
        assert response['total'] >= 3
        
    def test_06_employee_get_all_contents(self):
        """Test employee endpoint to get all AI contents (no auth)"""
        # Use unauthenticated request for employee endpoints
        
        response = self.make_request(
            'GET',
            '/v1/employee/ai-content'
        )
        print(f"[RESPONSE] Employee Get All: {response}")
        
        assert response['success'] is True
        assert 'ai_contents' in response
        assert response['total'] >= 3
        
        # Verify our contents are visible
        ai_contents = response['ai_contents']
        our_content_ids = set(self.ai_content_ids)
        found_ids = set(c['id'] for c in ai_contents)
        assert our_content_ids.issubset(found_ids)
        
    def test_07_employee_get_specific_content(self):
        """Test employee endpoint to get specific AI content"""
        ai_content_id = self.ai_content_ids[0]
        
        response = self.make_request(
            'GET',
            f'/v1/employee/ai-content/{ai_content_id}'
        )
        print(f"[RESPONSE] Employee Get Detail: {response}")
        
        assert response['success'] is True
        assert response['id'] == ai_content_id
        assert 'user_id' in response
        assert 'username' in response
        assert 'user_email' in response
        
    def test_08_employee_update_status(self):
        """Test employee endpoint to update AI content status"""
        ai_content_id = self.ai_content_ids[0]
        
        update_data = {
            "status": "processed",
            "notes": "Test processing completed successfully",
            "processed_by": "test-employee"
        }
        
        response = self.make_request(
            'PUT',
            f'/v1/employee/ai-content/{ai_content_id}',
            json=update_data
        )
        print(f"[RESPONSE] Employee Update Status: {response}")
        
        assert response['success'] is True
        assert response['message'] == "Status updated successfully"
        assert response['status'] == "processed"
        
        # Verify status was updated
        response = self.make_authenticated_request(
            'GET',
            f'/v1/ai-content/{ai_content_id}'
        )
        assert response['status'] == "processed"
        assert response['metadata']['processedBy'] == "test-employee"
        assert response['metadata']['notes'] == "Test processing completed successfully"
        
    def test_09_employee_export_endpoint(self):
        """Test employee bulk export endpoint"""
        
        # Export submitted contents
        response = self.make_request(
            'GET',
            '/v1/employee/ai-content/export?status=submitted'
        )
        print(f"[RESPONSE] Employee Export (submitted): {response}")
        
        assert response['success'] is True
        assert 'ai_contents' in response
        assert 'exported_at' in response
        
        # All exported contents should have status 'submitted'
        for content in response['ai_contents']:
            assert content['status'] == 'submitted'
            
        # Export processed contents
        response = self.make_request(
            'GET',
            '/v1/employee/ai-content/export?status=processed'
        )
        
        assert response['success'] is True
        # We should have at least one processed content
        assert len(response['ai_contents']) >= 1
        
    def test_10_validation_errors(self):
        """Test validation and error handling"""
        
        # Test missing title
        response = self.make_authenticated_request(
            'POST',
            '/v1/ai-content',
            json={
                "instructions": "Test instructions",
                "files": [{"fileId": "test", "fileName": "test.pdf", "fileSize": 1024, "mimeType": "application/pdf"}]
            }
        )
        assert response['success'] is False
        assert "Title is required" in response['msg']
        
        # Test missing instructions
        response = self.make_authenticated_request(
            'POST',
            '/v1/ai-content',
            json={
                "title": "Test Title",
                "files": [{"fileId": "test", "fileName": "test.pdf", "fileSize": 1024, "mimeType": "application/pdf"}]
            }
        )
        assert response['success'] is False
        assert "Instructions are required" in response['msg']
        
        # Test no files
        response = self.make_authenticated_request(
            'POST',
            '/v1/ai-content',
            json={
                "title": "Test Title",
                "instructions": "Test instructions",
                "files": []
            }
        )
        assert response['success'] is False
        assert "At least one file is required" in response['msg']
        
        # Test too many files
        files = [{"fileId": f"file-{i}", "fileName": f"test{i}.pdf", "fileSize": 1024, "mimeType": "application/pdf"} for i in range(11)]
        response = self.make_authenticated_request(
            'POST',
            '/v1/ai-content',
            json={
                "title": "Test Title",
                "instructions": "Test instructions",
                "files": files
            }
        )
        assert response['success'] is False
        assert "Maximum 10 files allowed" in response['msg']
        
        # Test title too long
        response = self.make_authenticated_request(
            'POST',
            '/v1/ai-content',
            json={
                "title": "x" * 256,  # 256 characters, limit is 255
                "instructions": "Test instructions",
                "files": [{"fileId": "test", "fileName": "test.pdf", "fileSize": 1024, "mimeType": "application/pdf"}]
            }
        )
        assert response['success'] is False
        assert "Title must be 255 characters or less" in response['msg']
        
    def test_11_immutability_check(self):
        """Test that AI content cannot be deleted after creation"""
        ai_content_id = self.ai_content_ids[0]
        
        response = self.make_authenticated_request(
            'DELETE',
            f'/v1/ai-content/{ai_content_id}'
        )
        print(f"[RESPONSE] Delete attempt: {response}")
        
        assert response['success'] is False
        assert "AI content cannot be deleted after creation" in response['msg']