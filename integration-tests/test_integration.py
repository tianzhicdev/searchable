import pytest
import uuid
import time
import base64
import os
import json
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD, TEST_FILES_DIR


class TestSearchableIntegration:
    """Integration tests for the Searchable platform"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with API client and test data"""
        cls.client = SearchableAPIClient()
        cls.test_id = str(uuid.uuid4())[:8]  # Short unique ID for this test run
        cls.username = f"{TEST_USER_PREFIX}{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        cls.user_token = None
        cls.created_searchable_id = None
        cls.created_invoice = None
        cls.payment_test_uuid = None
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        if cls.client.token:
            cls.client.logout()
    
    def test_01_register_user(self):
        """Test user registration with dummy data"""
        
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        
        # Verify exact registration response structure
        assert 'success' in response
        assert response['success'] is True
        assert isinstance(response, dict)
        
        # Store for verification
        self.__class__.registration_response = response
    
    def test_02_login_user(self):
        """Test user login and token retrieval"""
        
        response = self.client.login_user(
            email=self.email,
            password=self.password
        )
        
        # Verify exact login response structure
        assert 'token' in response
        assert 'user' in response
        assert isinstance(response['token'], str)
        assert len(response['token']) > 0
        assert isinstance(response['user'], dict)
        assert '_id' in response['user']
        
        # Store token and user info for later tests
        self.__class__.user_token = response['token']
        self.__class__.user_id = response['user']['_id']
        
        # Verify token is set in client
        assert self.client.token == response['token']
    
    def test_03_upload_test_file(self):
        """Test file upload functionality"""
        
        # Verify authentication state
        assert self.client.token is not None
        assert len(self.client.token) > 0
        
        test_file_path = os.path.join(TEST_FILES_DIR, 'sample.txt')
        assert os.path.exists(test_file_path)
        
        response = self.client.upload_file(test_file_path)
        
        # Verify exact upload response structure
        assert 'success' in response
        assert response['success'] is True
        assert 'file_id' in response
        assert isinstance(response['file_id'], int)
        assert response['file_id'] > 0
        
        # Store file info for searchable creation
        self.__class__.uploaded_file = response
        self.__class__.file_upload_success = True
    
    def test_04_publish_searchable_with_downloadable(self):
        """Test publishing a searchable item with a downloadable file"""
        
        # Verify prerequisites
        assert hasattr(self.__class__, 'uploaded_file')
        assert hasattr(self.__class__, 'file_upload_success')
        assert self.file_upload_success is True
        assert self.client.token is not None
        
        # Get file ID from successful upload
        file_id = self.uploaded_file['file_id']
        assert isinstance(file_id, int)
        assert file_id > 0
        
        # Create downloadable searchable with real file
        searchable_data = {
            "payloads": {
                "public": {
                    "type": "downloadable",
                    "title": f"Test Searchable Item {self.test_id}",
                    "description": f"Integration test searchable {self.test_id}",
                    "category": "test",
                    "currency": "usd",
                    "downloadableFiles": [
                        {
                            "fileId": file_id,
                            "fileName": "sample.txt",
                            "price": 1.99,
                            "description": "Test downloadable file"
                        }
                    ],
                    "selectables": [
                        {
                            "id": file_id,
                            "type": "downloadable",
                            "name": "Download sample.txt",
                            "price": 1.99
                        }
                    ]
                },
                "private": {
                    "notes": f"Private notes for test item {self.test_id}"
                }
            }
        }
        
        response = self.client.create_searchable(searchable_data)
        
        # Verify exact creation response
        assert 'searchable_id' in response
        assert isinstance(response['searchable_id'], int)
        assert response['searchable_id'] > 0
        
        # Store for later tests
        self.__class__.created_searchable_id = response['searchable_id']
        self.__class__.expected_title = f"Test Searchable Item {self.test_id}"
    
    def test_05_retrieve_searchable_info(self):
        """Test retrieving information about the created searchable"""
        
        # Verify prerequisites
        assert self.created_searchable_id is not None
        assert isinstance(self.created_searchable_id, int)
        assert self.client.token is not None
        
        response = self.client.get_searchable(self.created_searchable_id)
        
        # Verify exact response structure
        assert 'payloads' in response
        assert 'public' in response['payloads']
        assert 'private' in response['payloads']
        
        public_data = response['payloads']['public']
        
        # Verify exact data matches what we created
        assert 'title' in public_data
        assert public_data['title'] == self.expected_title
        assert 'type' in public_data
        assert public_data['type'] == "downloadable"
        assert 'downloadableFiles' in public_data
        assert isinstance(public_data['downloadableFiles'], list)
        assert len(public_data['downloadableFiles']) == 1
        assert 'selectables' in public_data
        assert isinstance(public_data['selectables'], list)
        assert len(public_data['selectables']) == 1
        
        # Verify file structure
        file_data = public_data['downloadableFiles'][0]
        assert 'fileId' in file_data
        assert 'fileName' in file_data
        assert file_data['fileName'] == "sample.txt"
        assert 'price' in file_data
        assert file_data['price'] == 1.99
        
        # Store retrieved data for later tests
        self.__class__.retrieved_searchable = response
    
    def test_06_search_for_created_item(self):
        """Test searching for the created searchable item"""
        
        assert self.client.token is not None
        
        # Search for our specific test item
        search_query = f"Test Searchable Item {self.test_id}"
        response = self.client.search_searchables(query_term=search_query)
        
        # Verify exact search response structure
        assert 'results' in response
        assert isinstance(response['results'], list)
        assert len(response['results']) > 0
        
        # Find our specific item in results
        found_item = None
        assert len(response['results']) > 0  # Check list length before iteration
        for item in response['results']:
            assert 'searchable_id' in item
            if item['searchable_id'] == self.created_searchable_id:
                found_item = item
                break
        
        assert found_item is not None
        
        # Verify exact item data
        assert 'payloads' in found_item
        assert 'public' in found_item['payloads']
        public_data = found_item['payloads']['public']
        assert 'title' in public_data
        assert public_data['title'] == self.expected_title
        assert 'type' in public_data
        assert public_data['type'] == "downloadable"
        
        # Store search results for verification
        self.__class__.search_results_count = len(response['results'])
        self.__class__.found_our_item = True
    
    def test_07_get_user_profile(self):
        """Test retrieving user profile information"""
        
        assert self.client.token is not None
        
        response = self.client.get_user_profile()
        # Verify exact profile response structure
        assert response is not None
        assert isinstance(response, dict)
        assert 'profile' in response
        
        profile = response['profile']
        assert isinstance(profile, dict)
        assert 'username' in profile
        assert profile['username'] == self.username
        
        
        # Store profile data for verification
        self.__class__.initial_profile = profile
    
    def test_08_create_invoice_for_payment(self):
        """Test creating an invoice for purchasing the searchable item"""
        print("Testing invoice creation for payment...")
        
        assert self.client.token, "No authentication token available"
        assert self.created_searchable_id, "No searchable ID available"
        
        # Generate unique UUID for testing payment completion
        test_uuid = str(uuid.uuid4())
        self.__class__.payment_test_uuid = test_uuid
        
        # Get the searchable info to determine selections
        searchable_info = self.client.get_searchable(self.created_searchable_id)
        assert 'payloads' in searchable_info
        assert 'public' in searchable_info['payloads']
        public_data = searchable_info['payloads']['public']
        
        # Verify downloadable type and get selections
        assert public_data['type'] == 'downloadable'
        assert 'selectables' in public_data
        assert isinstance(public_data['selectables'], list)
        assert len(public_data['selectables']) == 1
        
        # Use the actual selectables from the searchable
        selections = [public_data['selectables'][0]]
        expected_amount = public_data['selectables'][0]['price']
        assert expected_amount == 1.99
        
        # Store expected fees for verification
        self.__class__.expected_invoice_amount = expected_amount
        self.__class__.expected_platform_fee = expected_amount * 0.001  # 0.1%
        self.__class__.expected_stripe_fee = expected_amount * 0.035   # 3.5%
        self.__class__.expected_payment_amount = expected_amount + self.expected_stripe_fee
        
        response = self.client.create_invoice(
            self.created_searchable_id,
            selections,
            "stripe"
        )
        
        # Verify exact invoice creation response
        assert 'session_id' in response
        assert isinstance(response['session_id'], str)
        assert len(response['session_id']) > 0
        assert 'url' in response
        assert isinstance(response['url'], str)
        assert response['url'].startswith('https://')
        
        # Store invoice info for payment testing
        self.__class__.created_invoice = response
        self.__class__.invoice_session_id = response['session_id']
        self.__class__.invoice_created = True
    
    def test_09_simulate_payment_completion(self):
        """Test simulating payment completion via test endpoint"""
        
        # Verify prerequisites
        assert hasattr(self.__class__, 'invoice_created')
        assert self.invoice_created is True
        assert hasattr(self.__class__, 'invoice_session_id')
        assert self.invoice_session_id is not None
        
        session_id = self.invoice_session_id
        
        # Check initial payment status
        initial_status = self.client.check_payment_status(session_id)
        assert 'status' in initial_status
        assert initial_status['status'] in ['pending', 'incomplete']
        
        # Complete the payment using test endpoint
        completion_response = self.client.complete_payment_directly(
            session_id=session_id,
            test_uuid=self.payment_test_uuid
        )
        
        # Verify exact completion response
        assert 'success' in completion_response
        assert completion_response['success'] is True
        
        # Verify payment status is now complete
        updated_status = self.client.check_payment_status(session_id)
        assert 'status' in updated_status
        assert updated_status['status'] == 'complete'
        
        # Store completion state
        self.__class__.payment_completed = True
        self.__class__.payment_status_verified = True
    
    def test_10_check_user_paid_files(self):
        """Test checking what files the user has paid for"""
        
        # Verify prerequisites
        assert self.client.token is not None
        assert self.created_searchable_id is not None
        assert hasattr(self.__class__, 'payment_completed')
        assert self.payment_completed is True
        
        response = self.client.get_user_paid_files(self.created_searchable_id)
        
        # Verify exact response structure
        assert 'searchable_id' in response
        # Handle string/int ID conversion
        response_id = str(response['searchable_id'])
        created_id = str(self.created_searchable_id)
        assert response_id == created_id
        assert 'user_id' in response
        # Handle user_id type (can be string or int)
        user_id = response['user_id']
        assert user_id is not None
        assert str(user_id).isdigit()
        assert 'paid_file_ids' in response
        assert isinstance(response['paid_file_ids'], list)
        
        # Since payment was completed, should have paid files
        paid_file_ids = response['paid_file_ids']
        assert len(paid_file_ids) > 0
        # Handle file_id type (can be string or int)
        first_file_id = paid_file_ids[0]
        assert first_file_id is not None
        # Convert string to int if needed
        if isinstance(first_file_id, str) and first_file_id.isdigit():
            first_file_id = int(first_file_id)
        assert isinstance(first_file_id, int)
        assert first_file_id > 0
        
        # Store for download test
        self.__class__.paid_file_ids = paid_file_ids
        self.__class__.paid_files_verified = True
    
    def test_11_test_file_download_access(self):
        """Test downloading files after payment"""
        
        # Verify prerequisites
        assert self.client.token is not None
        assert self.created_searchable_id is not None
        assert hasattr(self.__class__, 'paid_files_verified')
        assert self.paid_files_verified is True
        assert hasattr(self.__class__, 'paid_file_ids')
        assert len(self.paid_file_ids) > 0
        
        # Download the paid file
        file_id = self.paid_file_ids[0]
        
        response = self.client.download_file(self.created_searchable_id, file_id)
        
        # Verify exact download response
        assert hasattr(response, 'status_code')
        assert response.status_code == 200
        assert hasattr(response, 'headers')
        assert hasattr(response, 'content')
        assert len(response.content) > 0
        
        # Store download verification
        self.__class__.file_download_verified = True
        self.__class__.downloaded_content_length = len(response.content)
    
    def test_12_create_user_profile(self):
        """Test creating a user profile"""
        
        assert self.client.token is not None
        
        # Test profile data
        profile_data = {
            "username": self.username,
            "introduction": f"Integration test profile for {self.username}",
            "profile_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        }
        
        response = self.client.update_profile(profile_data)  # Use update_profile instead
        
        # Verify exact profile creation response
        assert 'profile' in response
        assert isinstance(response['profile'], dict)
        
        profile = response['profile']
        assert 'username' in profile
        assert profile['username'] == self.username
        assert 'introduction' in profile
        assert profile['introduction'] == profile_data['introduction']
        assert 'profile_image_url' in profile
        assert isinstance(profile['profile_image_url'], str)
        assert len(profile['profile_image_url']) > 0
        
        # Store profile info for later tests
        self.__class__.created_profile = profile
        self.__class__.profile_created = True
    
    def test_13_get_user_profile(self):
        """Test retrieving user profile"""
        
        # Verify prerequisites
        assert self.client.token is not None
        assert hasattr(self.__class__, 'profile_created')
        assert self.profile_created is True
        
        response = self.client.get_user_profile()
        # Verify exact profile response structure
        assert 'profile' in response
        
        profile = response['profile']
        
        # Verify profile data matches what we created
        assert isinstance(profile, dict)
        assert 'username' in profile
        assert profile['username'] == self.username
        assert 'introduction' in profile
        assert 'profile_image_url' in profile
        
        # Store updated profile data
        self.__class__.retrieved_profile = profile
    
    def test_14_update_user_profile(self):
        """Test updating user profile"""
        
        assert self.client.token is not None
        
        # Updated profile data with timestamp
        timestamp = str(int(time.time()))
        updated_introduction = f"Updated introduction for {self.username} at {timestamp}"
        updated_data = {
            "introduction": updated_introduction
        }
        
        response = self.client.update_user_profile(updated_data)
        
        # Verify exact profile update response
        assert 'profile' in response
        assert isinstance(response['profile'], dict)
        
        profile = response['profile']
        assert 'username' in profile
        assert profile['username'] == self.username
        assert 'introduction' in profile
        assert profile['introduction'] == updated_introduction
        
        # Store updated profile
        self.__class__.updated_profile = profile
        self.__class__.profile_updated = True
        self.__class__.final_introduction = updated_introduction
    
    def test_15_media_upload_endpoint(self):
        """Test the v1/media/upload endpoint"""
        
        assert self.client.token is not None
        
        # Create test image data (1x1 transparent PNG)
        test_image_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==")
        
        response = self.client.upload_media(test_image_data, filename='test_media.png')
        
        # Verify media upload response structure (may vary)
        assert 'success' in response
        assert response['success'] is True
        assert 'media_id' in response
        assert isinstance(response['media_id'], str)
        assert len(response['media_id']) > 0
        assert 'media_uri' in response
        assert isinstance(response['media_uri'], str)
        assert len(response['media_uri']) > 0
        assert 'file_id' in response
        # file_id can be int or string UUID
        file_id = response['file_id']
        assert file_id is not None
        assert len(str(file_id)) > 0
        
        # Store media info for retrieval test
        self.__class__.uploaded_media = response
        self.__class__.media_uploaded = True
        self.__class__.test_media_id = response['media_id']
    
    def test_16_media_retrieval_endpoint(self):
        """Test the v1/media/<media_id> retrieval endpoint"""
        
        # Verify prerequisites
        assert hasattr(self.__class__, 'media_uploaded')
        assert self.media_uploaded is True
        assert hasattr(self.__class__, 'test_media_id')
        
        media_id = self.test_media_id
        
        response = self.client.retrieve_media(media_id)
        
        # Verify exact media retrieval response
        assert hasattr(response, 'status_code')
        assert response.status_code == 200
        assert hasattr(response, 'headers')
        assert hasattr(response, 'content')
        
        # Verify content type and content
        content_type = response.headers.get('content-type', '')
        assert content_type is not None
        assert len(content_type) > 0
        
        content_length = len(response.content)
        assert content_length > 0
        # PNG should be small but size may vary slightly
        assert content_length < 200
        
        # Store retrieval verification
        self.__class__.media_retrieved = True
        self.__class__.retrieved_content_length = content_length
    
    def test_17_media_profile_update_with_uri(self):
        """Test updating profile with media URI instead of base64"""
        
        # Verify prerequisites
        assert self.client.token is not None
        assert hasattr(self.__class__, 'uploaded_media')
        assert hasattr(self.__class__, 'media_uploaded')
        assert self.media_uploaded is True
        
        media_uri = self.uploaded_media['media_uri']
        
        # Updated profile data using media URI
        timestamp = str(int(time.time()))
        updated_introduction = f"Profile with media URI at {timestamp}"
        updated_data = {
            "introduction": updated_introduction,
            "profile_image_uri": media_uri
        }
        
        response = self.client.update_user_profile(updated_data)
        
        # Verify exact profile update response
        assert 'profile' in response
        assert isinstance(response['profile'], dict)
        
        profile = response['profile']
        assert 'username' in profile
        assert profile['username'] == self.username
        assert 'introduction' in profile
        assert profile['introduction'] == updated_introduction
        assert 'profile_image_url' in profile
        assert profile['profile_image_url'] == media_uri
        
        # Store final profile state
        self.__class__.final_profile_with_media = profile
        self.__class__.media_profile_updated = True

    def test_18_pending_invoices_24h_display(self):
        """Test that pending invoices API endpoint works correctly"""
        
        # Verify prerequisites
        assert self.client.token is not None
        assert self.created_searchable_id is not None
        
        # Test the invoices endpoint
        invoices_response = self.client.get_invoices_by_searchable(self.created_searchable_id)
        
        # Verify exact response
        assert hasattr(invoices_response, 'status_code')
        assert invoices_response.status_code == 200
        
        invoices_data = invoices_response.json()
        assert isinstance(invoices_data, dict)
        assert 'invoices' in invoices_data
        assert 'user_role' in invoices_data
        
        invoices = invoices_data['invoices']
        user_role = invoices_data['user_role']
        
        assert isinstance(invoices, list)
        assert len(invoices) > 0  # Should have at least 1 invoice from our test
        assert isinstance(user_role, str)
        # User role can be 'owner' or 'seller' 
        assert user_role in ['owner', 'seller']
        
        # Check the completed invoice from our test
        assert len(invoices) > 0  # Check list length before iteration
        completed_invoices = [inv for inv in invoices if inv.get('payment_status') == 'complete']
        assert len(completed_invoices) > 0  # Should have at least 1 completed invoice
        
        # Verify invoice structure
        invoice = completed_invoices[0]
        assert 'payment_status' in invoice
        assert invoice['payment_status'] == 'complete'
        assert 'searchable_id' in invoice
        assert invoice['searchable_id'] == self.created_searchable_id
        
        # Store final verification
        self.__class__.invoices_verified = True
        self.__class__.final_invoice_count = len(invoices)


if __name__ == "__main__":
    # Run tests with verbose output
    pytest.main([__file__, "-v", "-s", "--tb=short"])