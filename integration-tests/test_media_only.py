#!/usr/bin/env python3
"""
Simple media endpoint test script for verifying the v1/media upload and retrieval endpoints
"""
import requests
import base64
import uuid
import json

# Configuration
BASE_URL = "https://silkroadonlightning.com/api"
TEST_USER_PREFIX = "test_media_"
TEST_EMAIL_DOMAIN = "test.example.com"
DEFAULT_PASSWORD = "TestPassword123!"

class MediaTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_id = str(uuid.uuid4())[:8]
        self.username = f"{TEST_USER_PREFIX}{self.test_id}"
        self.email = f"{self.username}@{TEST_EMAIL_DOMAIN}"
        
    def register_and_login(self):
        """Register a test user and login to get token"""
        print(f"Registering test user: {self.username}")
        
        # Register
        register_url = f"{BASE_URL}/users/register"
        register_data = {
            "username": self.username,
            "email": self.email,
            "password": DEFAULT_PASSWORD
        }
        
        try:
            response = self.session.post(register_url, json=register_data, timeout=30)
            response.raise_for_status()
            print(f"✓ Registration successful")
        except Exception as e:
            print(f"Registration error (may already exist): {e}")
        
        # Login
        login_url = f"{BASE_URL}/users/login"
        login_data = {
            "email": self.email,
            "password": DEFAULT_PASSWORD
        }
        
        response = self.session.post(login_url, json=login_data, timeout=30)
        response.raise_for_status()
        result = response.json()
        
        if 'token' not in result:
            raise Exception(f"No token in login response: {result}")
        
        self.token = result['token']
        self.session.headers.update({'authorization': self.token})
        print(f"✓ Login successful, token obtained")
        
    def test_media_upload(self):
        """Test the v1/media/upload endpoint"""
        print("Testing media upload endpoint...")
        
        # Create test image data (1x1 transparent PNG)
        test_image_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==")
        
        upload_url = f"{BASE_URL}/v1/media/upload"
        files = {'file': ('test_media.png', test_image_data, 'image/png')}
        
        response = self.session.post(upload_url, files=files, timeout=60)
        print(f"Upload response status: {response.status_code}")
        print(f"Upload response text: {response.text}")
        response.raise_for_status()
        result = response.json()
        
        # Verify response
        assert 'success' in result, f"No success in response: {result}"
        assert result['success'], f"Upload failed: {result}"
        assert 'media_id' in result, f"No media_id in response: {result}"
        assert 'media_uri' in result, f"No media_uri in response: {result}"
        assert 'file_id' in result, f"No file_id in response: {result}"
        
        print(f"✓ Media upload successful")
        print(f"  Media ID: {result['media_id']}")
        print(f"  Media URI: {result['media_uri']}")
        print(f"  File ID: {result['file_id']}")
        
        return result
        
    def test_media_retrieval(self, media_id):
        """Test the v1/media/<media_id> retrieval endpoint"""
        print(f"Testing media retrieval for ID: {media_id}")
        
        retrieval_url = f"{BASE_URL}/v1/media/{media_id}"
        response = self.session.get(retrieval_url, timeout=30)
        
        print(f"Retrieval response status: {response.status_code}")
        print(f"Retrieval response text: {response.text}")
        
        # Verify response
        assert response.status_code == 200, f"Media retrieval failed with status: {response.status_code}"
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert 'image' in content_type.lower(), f"Expected image content type, got: {content_type}"
        
        # Check that we got some content
        content_length = len(response.content)
        assert content_length > 0, "No content in media response"
        
        print(f"✓ Media retrieval successful")
        print(f"  Content-Type: {content_type}")
        print(f"  Content-Length: {content_length} bytes")
        
        return response
        
    def test_profile_update_with_media_uri(self, media_uri):
        """Test updating profile with media URI instead of base64"""
        print("Testing profile update with media URI...")
        
        profile_url = f"{BASE_URL}/v1/profile"
        profile_data = {
            "introduction": f"Profile updated with media URI at {uuid.uuid4()}",
            "profile_image_uri": media_uri  # Use URI instead of base64
        }
        
        response = self.session.put(profile_url, json=profile_data, timeout=30)
        response.raise_for_status()
        result = response.json()
        
        # Verify response
        assert 'profile' in result, f"No profile in response: {result}"
        
        profile = result['profile']
        assert profile['username'] == self.username
        assert profile['introduction'] == profile_data['introduction']
        
        # Check that profile image URL is set (should be the media URI)
        assert 'profile_image_url' in profile, "No profile_image_url in response"
        assert profile['profile_image_url'] == media_uri, f"Expected media URI {media_uri}, got {profile['profile_image_url']}"
        
        print(f"✓ Profile update with media URI successful")
        print(f"  Media URI: {media_uri}")
        print(f"  Profile Image URL: {profile['profile_image_url']}")
        
        return result
        
    def run_tests(self):
        """Run all media endpoint tests"""
        try:
            print("=== Media Endpoint Integration Test ===")
            print(f"Target: {BASE_URL}")
            print()
            
            # Step 1: Register and login
            self.register_and_login()
            print()
            
            # Step 2: Test media upload
            upload_result = self.test_media_upload()
            print()
            
            # Step 3: Test media retrieval
            media_id = upload_result['media_id']
            self.test_media_retrieval(media_id)
            print()
            
            # Step 4: Test profile update with media URI
            media_uri = upload_result['media_uri']
            self.test_profile_update_with_media_uri(media_uri)
            print()
            
            print("=== ALL TESTS PASSED ===")
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    tester = MediaTester()
    success = tester.run_tests()
    exit(0 if success else 1)