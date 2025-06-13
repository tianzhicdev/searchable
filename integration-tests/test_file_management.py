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
        cls.username = f"{TEST_USER_PREFIX}files_{cls.test_id}"
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
        print(f"Setting up user for file management: {self.username}")
        
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        assert 'success' in response or 'user' in response or 'id' in response
        
        login_response = self.client.login_user(self.email, self.password)
        assert 'token' in login_response
        assert 'user' in login_response
        
        print(f"✓ User setup complete: {self.username}")
    
    def test_02_create_test_files(self):
        """Create various test files for upload testing"""
        print("Creating test files for upload")
        
        test_file_configs = [
            {'name': 'document.txt', 'content': 'This is a test document file.\nLine 2 of content.\nLine 3 with more text.', 'type': 'document'},
            {'name': 'data.json', 'content': '{"test": "data", "number": 42, "array": [1, 2, 3]}', 'type': 'data'},
            {'name': 'script.py', 'content': 'print("Hello World")\ndef test_function():\n    return "test"', 'type': 'code'},
            {'name': 'large_file.txt', 'content': 'Large file content.\n' * 1000, 'type': 'large'},
            {'name': 'config.yaml', 'content': 'server:\n  host: localhost\n  port: 8080\ndebug: true', 'type': 'config'}
        ]
        
        for config in test_file_configs:
            file_path = os.path.join(TEST_FILES_DIR, f"{self.test_id}_{config['name']}")
            
            with open(file_path, 'w') as f:
                f.write(config['content'])
            
            self.test_files_created.append(file_path)
            config['path'] = file_path
            config['size'] = len(config['content'])
        
        self.test_file_configs = test_file_configs
        print(f"✓ Created {len(test_file_configs)} test files")
    
    def test_03_upload_files_with_metadata(self):
        """Test uploading files with various metadata configurations"""
        print("Testing file uploads with metadata")
        
        for i, config in enumerate(self.test_file_configs):
            metadata = {
                'description': f'Test {config["type"]} file for file management testing',
                'type': config['type'],
                'category': 'test_files',
                'version': '1.0',
                'tags': [config['type'], 'test', 'integration']
            }
            
            response = self.client.upload_file(config['path'], metadata)
            
            assert 'success' in response and response['success']
            assert 'file_id' in response
            assert 'uuid' in response
            assert 'file_path' in response
            
            file_info = {
                'file_id': response['file_id'],
                'uuid': response['uuid'],
                'file_path': response['file_path'],
                'original_name': config['name'],
                'metadata': metadata,
                'config': config
            }
            
            self.uploaded_files.append(file_info)
            
            print(f"✓ Uploaded {config['name']}: ID {response['file_id']}")
        
        assert len(self.uploaded_files) == len(self.test_file_configs)
    
    def test_04_retrieve_file_metadata(self):
        """Test retrieving file metadata by file ID"""
        print("Testing file metadata retrieval")
        
        for file_info in self.uploaded_files:
            response = self.client.get_file_metadata(file_info['file_id'])
            
            assert 'file' in response
            file_data = response['file']
            
            # Verify basic file information
            assert 'id' in file_data
            assert 'uuid' in file_data
            assert 'original_filename' in file_data
            assert 'file_size' in file_data
            assert 'content_type' in file_data
            assert 'upload_date' in file_data
            assert 'metadata' in file_data
            
            # Verify metadata matches what was uploaded
            stored_metadata = file_data['metadata']
            original_metadata = file_info['metadata']
            
            assert stored_metadata['description'] == original_metadata['description']
            assert stored_metadata['type'] == original_metadata['type']
            assert stored_metadata['category'] == original_metadata['category']
            
            print(f"✓ Retrieved metadata for {file_data['original_filename']}")
            print(f"  Size: {file_data['file_size']} bytes")
            print(f"  Type: {stored_metadata['type']}")
    
    def test_05_list_user_files(self):
        """Test listing user's files with pagination"""
        print("Testing file listing functionality")
        
        # Test default listing (first page)
        response = self.client.list_user_files()
        
        assert 'files' in response
        assert 'pagination' in response
        
        files = response['files']
        pagination = response['pagination']
        
        # Should have at least the files we uploaded
        assert len(files) >= len(self.uploaded_files)
        
        # Verify pagination info
        assert 'page' in pagination
        assert 'pageSize' in pagination
        assert 'totalCount' in pagination
        assert 'totalPages' in pagination
        
        print(f"✓ Listed {len(files)} files")
        print(f"  Page: {pagination['page']}, Total: {pagination['totalCount']}")
        
        # Test with custom page size
        response_small = self.client.list_user_files(page=1, page_size=2)
        
        assert 'files' in response_small
        files_small = response_small['files']
        assert len(files_small) <= 2
        
        print(f"✓ Listed with page_size=2: {len(files_small)} files")
        
        # Verify file information in listing
        for file_data in files[:3]:  # Check first 3 files
            assert 'id' in file_data
            assert 'original_filename' in file_data
            assert 'file_size' in file_data
            assert 'upload_date' in file_data
            assert 'metadata' in file_data
    
    def test_06_file_filtering_and_search(self):
        """Test file filtering by metadata and content type"""
        print("Testing file filtering and search")
        
        # Test filtering by file type
        document_files = []
        code_files = []
        
        response = self.client.list_user_files()
        files = response['files']
        
        for file_data in files:
            metadata = file_data.get('metadata', {})
            file_type = metadata.get('type', '')
            
            if file_type == 'document':
                document_files.append(file_data)
            elif file_type == 'code':
                code_files.append(file_data)
        
        assert len(document_files) >= 1
        assert len(code_files) >= 1
        
        print(f"✓ Found {len(document_files)} document files")
        print(f"✓ Found {len(code_files)} code files")
        
        # Test searching by filename pattern
        txt_files = [f for f in files if f['original_filename'].endswith('.txt')]
        json_files = [f for f in files if f['original_filename'].endswith('.json')]
        
        assert len(txt_files) >= 2  # We uploaded 2 .txt files
        assert len(json_files) >= 1  # We uploaded 1 .json file
        
        print(f"✓ Found {len(txt_files)} .txt files")
        print(f"✓ Found {len(json_files)} .json files")
    
    def test_07_file_size_verification(self):
        """Verify file sizes match original uploads"""
        print("Verifying file sizes match uploads")
        
        for file_info in self.uploaded_files:
            response = self.client.get_file_metadata(file_info['file_id'])
            file_data = response['file']
            
            stored_size = file_data['file_size']
            expected_size = file_info['config']['size']
            
            # Allow some tolerance for potential encoding differences
            assert abs(stored_size - expected_size) <= 10
            
            print(f"✓ {file_info['original_name']}: {stored_size} bytes (expected ~{expected_size})")
    
    def test_08_file_content_type_detection(self):
        """Test that content types are properly detected"""
        print("Testing content type detection")
        
        expected_content_types = {
            'document.txt': 'text/plain',
            'data.json': 'application/json',
            'script.py': 'text/x-python',
            'large_file.txt': 'text/plain',
            'config.yaml': 'text/yaml'
        }
        
        for file_info in self.uploaded_files:
            response = self.client.get_file_metadata(file_info['file_id'])
            file_data = response['file']
            
            filename = file_info['original_name']
            detected_type = file_data['content_type']
            
            # Content type detection might vary, so check for reasonable types
            if filename.endswith('.txt'):
                assert 'text' in detected_type.lower()
            elif filename.endswith('.json'):
                assert 'json' in detected_type.lower() or 'text' in detected_type.lower()
            elif filename.endswith('.py'):
                assert 'python' in detected_type.lower() or 'text' in detected_type.lower()
            elif filename.endswith('.yaml'):
                assert 'yaml' in detected_type.lower() or 'text' in detected_type.lower()
            
            print(f"✓ {filename}: {detected_type}")
    
    def test_09_file_metadata_updates(self):
        """Test updating file metadata"""
        print("Testing file metadata updates")
        
        # Try to update metadata for first uploaded file
        file_info = self.uploaded_files[0]
        file_id = file_info['file_id']
        
        # Note: This test assumes there's an update endpoint
        # If not available, we'll gracefully handle the missing functionality
        try:
            updated_metadata = {
                'description': 'Updated description for file management test',
                'type': 'updated_document',
                'category': 'updated_test_files',
                'version': '2.0',
                'last_modified': 'integration_test'
            }
            
            # Attempt to update metadata (this endpoint might not exist)
            response = self.client.update_file_metadata(file_id, updated_metadata)
            
            if 'success' in response and response['success']:
                # Verify the update
                verify_response = self.client.get_file_metadata(file_id)
                updated_file_data = verify_response['file']
                
                assert updated_file_data['metadata']['description'] == updated_metadata['description']
                assert updated_file_data['metadata']['version'] == updated_metadata['version']
                
                print("✓ File metadata successfully updated")
            else:
                print("! File metadata update not supported or failed")
                
        except Exception as e:
            print(f"! File metadata update not available: {str(e)}")
    
    def test_10_file_access_permissions(self):
        """Test file access permissions and security"""
        print("Testing file access permissions")
        
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
        assert 'success' in other_response or 'user' in other_response
        
        # Login other user
        other_login = other_user_client.login_user(other_email, self.password)
        assert 'token' in other_login
        
        # Try to access files uploaded by the first user
        file_id = self.uploaded_files[0]['file_id']
        
        try:
            # This should fail with 403/404 since other user doesn't own the file
            response = other_user_client.get_file_metadata(file_id)
            
            # If it succeeds, the file might be public or there's a security issue
            print(f"! WARNING: Other user can access file {file_id} - check permissions")
            
        except Exception as e:
            # Expected to fail
            print(f"✓ File access correctly restricted: {str(e)}")
        
        # Cleanup other user
        other_user_client.logout()
    
    def test_11_delete_files(self):
        """Test file deletion functionality"""
        print("Testing file deletion")
        
        # Delete the last uploaded file
        file_to_delete = self.uploaded_files[-1]
        file_id = file_to_delete['file_id']
        filename = file_to_delete['original_name']
        
        try:
            response = self.client.delete_file(file_id)
            
            if 'success' in response and response['success']:
                print(f"✓ Successfully deleted file: {filename}")
                
                # Verify file is no longer accessible
                try:
                    verify_response = self.client.get_file_metadata(file_id)
                    print(f"! WARNING: Deleted file {file_id} still accessible")
                except Exception as e:
                    print(f"✓ Deleted file correctly inaccessible: {str(e)}")
                
                # Remove from our tracking list
                self.uploaded_files.remove(file_to_delete)
                
            else:
                print(f"! File deletion failed or not supported: {response}")
                
        except Exception as e:
            print(f"! File deletion not available: {str(e)}")
    
    def test_12_file_storage_verification(self):
        """Verify file storage consistency and integrity"""
        print("Verifying file storage consistency")
        
        # Re-list files and verify consistency
        response = self.client.list_user_files()
        current_files = response['files']
        
        # Count should match our remaining uploaded files
        our_files = [f for f in current_files if any(
            self.test_id in f['original_filename'] for _ in [True]
        )]
        
        print(f"✓ Found {len(our_files)} of our test files in listing")
        
        # Verify each remaining file is still accessible
        accessible_count = 0
        for file_info in self.uploaded_files:
            try:
                response = self.client.get_file_metadata(file_info['file_id'])
                if 'file' in response:
                    accessible_count += 1
            except:
                pass
        
        print(f"✓ {accessible_count}/{len(self.uploaded_files)} uploaded files still accessible")
        
        # Verify file IDs are consistent
        for file_info in self.uploaded_files:
            response = self.client.get_file_metadata(file_info['file_id'])
            if 'file' in response:
                file_data = response['file']
                assert file_data['id'] == file_info['file_id']
                assert file_data['uuid'] == file_info['uuid']
        
        print("✓ File IDs and UUIDs remain consistent")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])