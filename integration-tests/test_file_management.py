import pytest
import uuid
import os
import json
import time
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD, TEST_FILES_DIR


class TestFileManagement:
    """Test comprehensive file management operations"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with user and test files"""
        cls.test_id = str(uuid.uuid4())[:8]
        cls.username = f"{TEST_USER_PREFIX}f_{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        cls.client = SearchableAPIClient()
        cls.uploaded_files = []
        cls.test_files_created = []
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        # Clean up test files
        for file_path in cls.test_files_created:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except:
                pass
        
        if cls.client.token:
            cls.client.logout()
    
    def test_01_setup_user(self):
        """Register and login user for file management tests"""
        
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        assert 'success' in response or 'user' in response or 'id' in response
        
        login_response = self.client.login_user(self.email, self.password)
        assert 'token' in login_response
        assert 'user' in login_response
        
    
    def test_02_create_test_files(self):
        """Create various test files for upload testing"""
        test_file_configs = [
            {'name': 'document.txt', 'content': 'This is a test document file.\nLine 2 of content.\nLine 3 with more text.', 'type': 'document'},
            {'name': 'data.json', 'content': '{"test": "data", "number": 42, "array": [1, 2, 3]}', 'type': 'data'},
            {'name': 'script.py', 'content': 'print("Hello World")\ndef test_function():\n    return "test"', 'type': 'code'},
            {'name': 'large_file.txt', 'content': 'Large file content.\n' * 1000, 'type': 'large'},
            {'name': 'config.yaml', 'content': 'server:\n  host: localhost\n  port: 8080\ndebug: true', 'type': 'config'}
        ]
        
        assert len(test_file_configs) == 5, "Expected 5 test file configurations"
        
        for config in test_file_configs:
            file_path = os.path.join(TEST_FILES_DIR, f"{self.test_id}_{config['name']}")
            
            with open(file_path, 'w') as f:
                f.write(config['content'])
            
            assert os.path.exists(file_path), f"File {file_path} was not created successfully"
            self.test_files_created.append(file_path)
            config['path'] = file_path
            config['size'] = len(config['content'])
        
        self.__class__.test_file_configs = test_file_configs  # Store as class variable
        assert len(self.test_files_created) == 5, "Expected 5 test files to be created"
    
    def test_03_upload_files_with_metadata(self):
        """Test uploading files with various metadata configurations"""
        assert hasattr(self, 'test_file_configs'), "test_file_configs not available from previous test"
        assert len(self.test_file_configs) > 0, "No test file configs available"
        
        for i, config in enumerate(self.test_file_configs):
            metadata = {
                'description': f'Test {config["type"]} file for file management testing',
                'type': config['type'],
                'category': 'test_files',
                'version': '1.0'
            }
            
            response = self.client.upload_file(config['path'], metadata)
            
            assert 'file_id' in response, f"Upload response missing file_id for {config['name']}: {response}"
            
            file_info = {
                'file_id': response['file_id'],
                'uuid': response.get('uuid', response.get('file_id')),
                'file_path': response.get('file_path', ''),
                'original_name': config['name'],
                'metadata': metadata,
                'config': config
            }
            
            self.__class__.uploaded_files.append(file_info)
        
        assert len(self.uploaded_files) == len(self.test_file_configs), f"Expected {len(self.test_file_configs)} uploaded files, got {len(self.uploaded_files)}"
    
    def test_04_retrieve_file_metadata(self):
        """Test retrieving file metadata by file ID"""
        assert len(self.uploaded_files) > 0, "No uploaded files available for metadata retrieval test"
        
        for file_info in self.uploaded_files:
            response = self.client.get_file_metadata(file_info['file_id'])
            
            # Handle both response formats (direct fields or nested under 'file')
            if 'file' in response:
                file_data = response['file']
            else:
                file_data = response  # Direct fields
            
            # Verify basic file information
            assert 'file_id' in file_data or 'id' in file_data, f"Response missing file_id/id: {file_data.keys()}"
            
            # Verify file ID matches
            actual_id = file_data.get('file_id', file_data.get('id'))
            assert actual_id == file_info['file_id'], f"File ID mismatch: expected {file_info['file_id']}, got {actual_id}"
            
            # Check for metadata structure
            assert 'metadata' in file_data, f"Response missing metadata field: {file_data.keys()}"
    
    def test_05_list_user_files(self):
        """Test listing user's files with pagination"""
        # Test default listing (first page)
        response = self.client.list_user_files()
        
        assert 'files' in response, f"Response missing 'files' field: {response.keys()}"
        assert 'pagination' in response, f"Response missing 'pagination' field: {response.keys()}"
        
        files = response['files']
        pagination = response['pagination']
        
        # Should have files since we uploaded some
        assert len(files) >= len(self.uploaded_files), f"Expected at least {len(self.uploaded_files)} files, got {len(files)}"
        
        # Verify pagination info
        page_field = 'page' if 'page' in pagination else 'current_page'
        size_field = 'pageSize' if 'pageSize' in pagination else 'per_page' 
        count_field = 'totalCount' if 'totalCount' in pagination else 'total_count'
        pages_field = 'totalPages' if 'totalPages' in pagination else 'total_pages'
        
        assert page_field in pagination, f"Pagination missing page field: {pagination.keys()}"
        assert size_field in pagination, f"Pagination missing size field: {pagination.keys()}"
        assert count_field in pagination, f"Pagination missing count field: {pagination.keys()}"
        assert pages_field in pagination, f"Pagination missing pages field: {pagination.keys()}"
        
        page_num = pagination.get('page', pagination.get('current_page', 1))
        total_count = pagination.get('totalCount', pagination.get('total_count', 0))
        assert page_num == 1, f"Expected page 1, got {page_num}"
        assert total_count >= len(self.uploaded_files), f"Expected total count >= {len(self.uploaded_files)}, got {total_count}"
        
        # Test with custom page size
        response_small = self.client.list_user_files(page=1, page_size=2)
        
        assert 'files' in response_small, "Small page size response missing 'files' field"
        files_small = response_small['files']
        assert len(files_small) <= 2, f"Expected at most 2 files with page_size=2, got {len(files_small)}"
        
        # Verify file information in listing - check all files if list not empty
        if len(files) > 0:
            for file_data in files[:min(3, len(files))]:
                assert 'id' in file_data or 'file_id' in file_data, f"File data missing ID field: {file_data.keys()}"
                
                # Check for filename in different locations
                has_filename = ('original_filename' in file_data or
                              ('metadata' in file_data and 'original_filename' in file_data['metadata']))
                assert has_filename, f"File data missing filename: {file_data.keys()}"
                
                assert 'metadata' in file_data, f"File data missing metadata: {file_data.keys()}"
    
    def test_06_file_filtering_and_search(self):
        """Test file filtering by metadata and content type"""
        response = self.client.list_user_files()
        files = response['files']
        
        assert len(files) > 0, "No files available for filtering test"
        
        # Test filtering by file type
        document_files = []
        code_files = []
        
        for file_data in files:
            metadata = file_data.get('metadata', {})
            file_type = metadata.get('type', '')
            
            if file_type == 'document':
                document_files.append(file_data)
            elif file_type == 'code':
                code_files.append(file_data)
        
        # We should have at least one document and one code file from our uploads
        assert len(document_files) >= 1, f"Expected at least 1 document file, found {len(document_files)}"
        assert len(code_files) >= 1, f"Expected at least 1 code file, found {len(code_files)}"
        
        # Test searching by filename pattern
        txt_files = []
        json_files = []
        
        for f in files:
            filename = None
            if 'original_filename' in f:
                filename = f['original_filename']
            elif 'metadata' in f and 'original_filename' in f['metadata']:
                filename = f['metadata']['original_filename']
                
            if filename:
                if filename.endswith('.txt'):
                    txt_files.append(f)
                elif filename.endswith('.json'):
                    json_files.append(f)
        
        # We should have txt and json files from our uploads
        assert len(txt_files) >= 2, f"Expected at least 2 .txt files, found {len(txt_files)}"
        assert len(json_files) >= 1, f"Expected at least 1 .json file, found {len(json_files)}"
    
    def test_07_file_size_verification(self):
        """Verify file sizes match original uploads"""
        assert len(self.uploaded_files) > 0, "No uploaded files available for size verification"
        
        for file_info in self.uploaded_files:
            response = self.client.get_file_metadata(file_info['file_id'])
            
            # Handle different response structures
            if 'file' in response:
                file_data = response['file']
            else:
                file_data = response
            
            # Check if file_size is available and verify it
            if 'file_size' in file_data:
                stored_size = file_data['file_size']
                expected_size = file_info['config']['size']
                
                # Exact size match (no tolerance for vague assertions)
                assert stored_size == expected_size, f"Size mismatch for {file_info['original_name']}: expected {expected_size}, got {stored_size}"
            else:
                # If file_size not available, we still verify the file exists and has metadata
                assert 'metadata' in file_data, f"File {file_info['original_name']} metadata missing file_size and other metadata"
    
    def test_08_file_content_type_detection(self):
        """Test that content types are properly detected"""
        assert len(self.uploaded_files) > 0, "No uploaded files available for content type detection test"
        
        for file_info in self.uploaded_files:
            response = self.client.get_file_metadata(file_info['file_id'])
            
            # Handle different response structures
            if 'file' in response:
                file_data = response['file']
            else:
                file_data = response
            
            filename = file_info['original_name']
            detected_type = file_data.get('content_type')
            
            # If content_type is available, verify it's reasonable for the file type
            if detected_type:
                if filename.endswith('.txt'):
                    assert 'text' in detected_type.lower(), f"Expected text content type for {filename}, got {detected_type}"
                elif filename.endswith('.json'):
                    assert 'json' in detected_type.lower() or 'text' in detected_type.lower(), f"Expected JSON/text content type for {filename}, got {detected_type}"
                elif filename.endswith('.py'):
                    assert 'python' in detected_type.lower() or 'text' in detected_type.lower(), f"Expected Python/text content type for {filename}, got {detected_type}"
                elif filename.endswith('.yaml'):
                    assert 'yaml' in detected_type.lower() or 'text' in detected_type.lower(), f"Expected YAML/text content type for {filename}, got {detected_type}"
            # If content_type not available, at least verify the file metadata exists
            else:
                assert 'metadata' in file_data, f"File {filename} missing both content_type and metadata"
    
    def test_09_file_metadata_updates(self):
        """Test updating file metadata"""
        assert len(self.uploaded_files) > 0, "No uploaded files available for metadata update test"
            
        file_info = self.uploaded_files[0]
        file_id = file_info['file_id']
        
        updated_metadata = {
            'description': 'Updated description for file management test',
            'type': 'updated_document',
            'category': 'updated_test_files',
            'version': '2.0'
        }
        
        # Attempt to update metadata
        response = self.client.update_file_metadata(file_id, updated_metadata)
        
        # If the API supports metadata updates, verify the response
        if 'success' in response:
            assert response['success'] is True, f"Metadata update failed: {response}"
            
            # Verify the update by retrieving the file metadata
            verify_response = self.client.get_file_metadata(file_id)
            
            if 'file' in verify_response:
                updated_file_data = verify_response['file']
            else:
                updated_file_data = verify_response
            
            assert 'metadata' in updated_file_data, "Updated file missing metadata field"
            stored_metadata = updated_file_data['metadata']
            
            assert stored_metadata['description'] == updated_metadata['description'], f"Description not updated: expected '{updated_metadata['description']}', got '{stored_metadata.get('description')}'"
            assert stored_metadata['version'] == updated_metadata['version'], f"Version not updated: expected '{updated_metadata['version']}', got '{stored_metadata.get('version')}'"
        else:
            # If no 'success' field, check if the API returned updated data directly
            assert 'file_id' in response or 'id' in response, f"Unexpected response format for metadata update: {response}"
    
    def test_10_file_access_permissions(self):
        """Test file access permissions and security"""
        assert len(self.uploaded_files) > 0, "No uploaded files available for access permission test"
        
        # Create a second user to test cross-user access
        other_user_client = SearchableAPIClient()
        other_username = f"{TEST_USER_PREFIX}other_files_{self.test_id}"
        other_email = f"{other_username}@{TEST_EMAIL_DOMAIN}"
        
        # Register other user
        other_response = other_user_client.register_user(
            username=other_username,
            email=other_email,
            password=self.password
        )
        assert 'success' in other_response or 'user' in other_response or 'userID' in other_response, f"Failed to register other user: {other_response}"
        
        # Login other user
        other_login = other_user_client.login_user(other_email, self.password)
        assert 'token' in other_login, f"Failed to login other user: {other_login}"
            
        file_id = self.uploaded_files[0]['file_id']
        
        # This should fail with 403/404 since other user doesn't own the file
        access_denied = False
        try:
            response = other_user_client.get_file_metadata(file_id)
            # If we get here without exception, check if response indicates access denied
            if 'error' in response or 'message' in response:
                access_denied = True
        except Exception:
            # Expected to fail - access should be denied
            access_denied = True
        
        assert access_denied, f"Security issue: Other user should not be able to access file {file_id}"
        
        # Cleanup other user
        other_user_client.logout()
    
    def test_11_delete_files(self):
        """Test file deletion functionality"""
        assert len(self.uploaded_files) > 0, "No uploaded files available for deletion test"
            
        file_to_delete = self.uploaded_files[-1]
        file_id = file_to_delete['file_id']
        filename = file_to_delete['original_name']
        
        response = self.client.delete_file(file_id)
        
        # Verify deletion was successful
        assert 'success' in response, f"Delete response missing success field: {response}"
        assert response['success'] is True, f"File deletion failed: {response}"
        
        # Verify file is no longer accessible
        file_still_accessible = False
        try:
            verify_response = self.client.get_file_metadata(file_id)
            # If we get a successful response, the file is still accessible
            if 'file' in verify_response or 'id' in verify_response:
                file_still_accessible = True
        except Exception:
            # Expected - file should not be accessible after deletion
            pass
        
        assert not file_still_accessible, f"Deleted file {file_id} is still accessible"
        
        # Remove from our tracking list
        self.uploaded_files.remove(file_to_delete)
        
        # Verify our tracking list is updated correctly
        assert len(self.uploaded_files) == len(self.test_file_configs) - 1, "Uploaded files list not updated correctly after deletion"
    
    def test_12_file_storage_verification(self):
        """Verify file storage consistency and integrity"""
        # Re-list files and verify consistency
        response = self.client.list_user_files()
        current_files = response['files']
        
        # Count should match our remaining uploaded files
        our_files = []
        if len(current_files) > 0:
            for f in current_files:
                filename = None
                if 'original_filename' in f:
                    filename = f['original_filename']
                elif 'metadata' in f and 'original_filename' in f['metadata']:
                    filename = f['metadata']['original_filename']
                
                if filename and self.test_id in filename:
                    our_files.append(f)
        
        # We should find exactly as many files as we have in our uploaded_files list
        assert len(our_files) == len(self.uploaded_files), f"File count mismatch: expected {len(self.uploaded_files)} test files in listing, found {len(our_files)}"
        
        # Verify each remaining file is still accessible
        accessible_count = 0
        if len(self.uploaded_files) > 0:
            for file_info in self.uploaded_files:
                try:
                    response = self.client.get_file_metadata(file_info['file_id'])
                    if 'file' in response or 'id' in response:
                        accessible_count += 1
                except:
                    pass
        
        assert accessible_count == len(self.uploaded_files), f"Accessibility mismatch: expected {len(self.uploaded_files)} files to be accessible, found {accessible_count}"
        
        # Verify file IDs are consistent
        if len(self.uploaded_files) > 0:
            for file_info in self.uploaded_files:
                response = self.client.get_file_metadata(file_info['file_id'])
                if 'file' in response:
                    file_data = response['file']
                else:
                    file_data = response
                
                actual_id = file_data.get('id', file_data.get('file_id'))
                assert actual_id == file_info['file_id'], f"File ID inconsistency: expected {file_info['file_id']}, got {actual_id}"
                
                actual_uuid = file_data.get('uuid', file_data.get('file_id'))
                assert actual_uuid == file_info['uuid'], f"UUID inconsistency: expected {file_info['uuid']}, got {actual_uuid}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])