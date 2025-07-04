import pytest
import uuid
import base64
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestMediaEndpoints:
    """Test media upload and retrieval endpoints"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with API client and test data"""
        cls.client = SearchableAPIClient()
        cls.test_id = str(uuid.uuid4())[:8]
        cls.username = f"{TEST_USER_PREFIX}media_{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        cls.uploaded_media = None
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        if cls.client.token:
            try:
                cls.client.logout()
            except:
                pass
    
    def test_01_register_and_login_user(self):
        """Register test user and login to get token"""
        
        # Register user
        register_response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        assert 'success' in register_response
        assert register_response['success'] is True
        
        # Login user
        login_response = self.client.login_user(self.email, self.password)
        assert 'token' in login_response
        assert isinstance(login_response['token'], str)
        assert len(login_response['token']) > 0
        assert 'user' in login_response
        assert isinstance(login_response['user'], dict)
        assert '_id' in login_response['user']
        
        # Verify token is set in client
        assert self.client.token == login_response['token']
    
    def test_02_media_upload_endpoint(self):
        """Test the v1/media/upload endpoint"""
        
        # Verify authentication state
        assert self.client.token is not None
        assert len(self.client.token) > 0
        
        # Create test image data (1x1 transparent PNG)
        test_image_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==")
        
        response = self.client.upload_media(test_image_data, filename='test_media.png')
        
        # Verify exact upload response structure
        assert 'success' in response
        assert response['success'] is True
        assert 'media_id' in response
        assert isinstance(response['media_id'], str)
        assert len(response['media_id']) > 0
        assert 'media_uri' in response
        assert isinstance(response['media_uri'], str)
        assert len(response['media_uri']) > 0
        assert 'file_id' in response
        assert response['file_id'] is not None
        
        # Store media info for later tests
        self.__class__.uploaded_media = response
    
    def test_03_media_retrieval_endpoint(self):
        """Test the v1/media/<media_id> retrieval endpoint"""
        
        # Verify prerequisites
        assert self.uploaded_media is not None
        assert 'media_id' in self.uploaded_media
        
        media_id = self.uploaded_media['media_id']
        assert isinstance(media_id, str)
        assert len(media_id) > 0
        
        response = self.client.retrieve_media(media_id)
        
        # Verify exact retrieval response
        assert hasattr(response, 'status_code')
        assert response.status_code == 200
        assert hasattr(response, 'headers')
        assert hasattr(response, 'content')
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert content_type is not None
        assert 'image' in content_type.lower()
        
        # Check that we got content
        content_length = len(response.content)
        assert content_length > 0
    
    def test_04_profile_update_with_media_uri(self):
        """Test updating profile with media URI instead of base64"""
        
        # Verify prerequisites
        assert self.uploaded_media is not None
        assert 'media_uri' in self.uploaded_media
        
        media_uri = self.uploaded_media['media_uri']
        assert isinstance(media_uri, str)
        assert len(media_uri) > 0
        
        profile_data = {
            "introduction": f"Profile updated with media URI at {uuid.uuid4()}",
            "profile_image_url": media_uri
        }
        
        response = self.client.update_profile(profile_data)
        
        # Verify exact response structure
        assert 'profile' in response
        assert isinstance(response['profile'], dict)
        
        profile = response['profile']
        assert 'username' in profile
        assert profile['username'] == self.username
        assert 'introduction' in profile
        assert profile['introduction'] == profile_data['introduction']
        assert 'profile_image_url' in profile
        assert profile['profile_image_url'] == media_uri


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])