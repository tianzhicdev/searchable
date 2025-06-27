import pytest
import uuid
import time
import json
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestTagOperations:
    """Comprehensive tests for tag system operations"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with users and data"""
        cls.test_id = str(uuid.uuid4())[:8]
        
        # Main test user
        cls.username = f"{TEST_USER_PREFIX}tag_{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        cls.client = SearchableAPIClient()
        cls.user_id = None
        
        # Second test user for ownership tests
        cls.username2 = f"{TEST_USER_PREFIX}tag2_{cls.test_id}"
        cls.email2 = f"{cls.username2}@{TEST_EMAIL_DOMAIN}"
        cls.client2 = SearchableAPIClient()
        cls.user_id2 = None
        
        # Store tag IDs for testing
        cls.user_tag_ids = []
        cls.searchable_tag_ids = []
        cls.created_searchables = []
        
        # Specific tag mappings for testing
        cls.artist_tag_id = None
        cls.designer_tag_id = None
        cls.books_tag_id = None
        cls.music_tag_id = None
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        if cls.client.token:
            cls.client.logout()
        if cls.client2.token:
            cls.client2.logout()
    
    def test_01_setup_users(self):
        """Register and login test users"""
        
        # Register first user
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        print(f"[RESPONSE] Register user 1: {response}")
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        
        # Login first user
        login_response = self.client.login_user(self.email, self.password)
        print(f"[RESPONSE] Login user 1: {login_response}")
        assert isinstance(login_response, dict)
        assert 'token' in login_response
        assert isinstance(login_response['token'], str)
        assert len(login_response['token']) > 0
        assert 'user' in login_response
        assert isinstance(login_response['user'], dict)
        assert '_id' in login_response['user']
        
        # Store user ID in class variable
        TestTagOperations.user_id = login_response['user']['_id']
        assert isinstance(TestTagOperations.user_id, int)
        assert TestTagOperations.user_id > 0
        
        # Register second user
        response2 = self.client2.register_user(
            username=self.username2,
            email=self.email2,
            password=self.password
        )
        print(f"[RESPONSE] Register user 2: {response2}")
        assert isinstance(response2, dict)
        assert 'success' in response2
        assert response2['success'] is True
        
        # Login second user
        login_response2 = self.client2.login_user(self.email2, self.password)
        print(f"[RESPONSE] Login user 2: {login_response2}")
        assert isinstance(login_response2, dict)
        assert 'token' in login_response2
        assert isinstance(login_response2['token'], str)
        assert len(login_response2['token']) > 0
        assert 'user' in login_response2
        assert isinstance(login_response2['user'], dict)
        assert '_id' in login_response2['user']
        
        # Store user ID in class variable
        TestTagOperations.user_id2 = login_response2['user']['_id']
        assert isinstance(TestTagOperations.user_id2, int)
        assert TestTagOperations.user_id2 > 0
        assert TestTagOperations.user_id2 != TestTagOperations.user_id  # Different users
    
    def test_02_get_all_tags(self):
        """Test retrieving all available tags and store specific tag IDs"""
        
        response = self.client.get_tags()
        print(f"[RESPONSE] Get all tags: {response}")
        
        # Validate response structure
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'tags' in response
        assert isinstance(response['tags'], list)
        assert 'count' in response
        assert isinstance(response['count'], int)
        assert response['count'] > 0
        assert len(response['tags']) == response['count']
        
        # Store tag IDs for later tests and find specific tags
        for tag in response['tags']:
            assert isinstance(tag, dict)
            assert 'id' in tag
            assert isinstance(tag['id'], int)
            assert tag['id'] > 0
            assert 'name' in tag
            assert isinstance(tag['name'], str)
            assert len(tag['name']) > 0
            assert 'tag_type' in tag
            assert tag['tag_type'] in ['user', 'searchable']
            assert 'description' in tag
            assert 'is_active' in tag
            assert tag['is_active'] is True
            assert 'created_at' in tag
            
            # Store in appropriate list
            if tag['tag_type'] == 'user':
                TestTagOperations.user_tag_ids.append(tag['id'])
                # Store specific user tags
                if tag['name'] == 'artist':
                    TestTagOperations.artist_tag_id = tag['id']
                elif tag['name'] == 'designer':
                    TestTagOperations.designer_tag_id = tag['id']
            elif tag['tag_type'] == 'searchable':
                TestTagOperations.searchable_tag_ids.append(tag['id'])
                # Store specific searchable tags
                if tag['name'] == 'books':
                    TestTagOperations.books_tag_id = tag['id']
                elif tag['name'] == 'music':
                    TestTagOperations.music_tag_id = tag['id']
        
        assert len(TestTagOperations.user_tag_ids) > 0, "Should have user tags"
        assert len(TestTagOperations.searchable_tag_ids) > 0, "Should have searchable tags"
        assert TestTagOperations.artist_tag_id is not None, "Should find 'artist' user tag"
        assert TestTagOperations.designer_tag_id is not None, "Should find 'designer' user tag"
        assert TestTagOperations.books_tag_id is not None, "Should find 'books' searchable tag"
        assert TestTagOperations.music_tag_id is not None, "Should find 'music' searchable tag"
        
        print(f"[DEBUG] Found {len(TestTagOperations.user_tag_ids)} user tags, {len(TestTagOperations.searchable_tag_ids)} searchable tags")
        print(f"[DEBUG] Artist tag ID: {TestTagOperations.artist_tag_id}, Designer tag ID: {TestTagOperations.designer_tag_id}")
        print(f"[DEBUG] Books tag ID: {TestTagOperations.books_tag_id}, Music tag ID: {TestTagOperations.music_tag_id}")
    
    def test_03_get_user_tags_initially_empty(self):
        """Test that users start with no tags"""
        
        response = self.client.get_user_tags(TestTagOperations.user_id)
        print(f"[RESPONSE] Get user {TestTagOperations.user_id} tags (initial): {response}")
        
        # Validate response
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'user_id' in response
        assert response['user_id'] == TestTagOperations.user_id
        assert 'tags' in response
        assert isinstance(response['tags'], list)
        assert len(response['tags']) == 0  # Should start empty
        assert 'count' in response
        assert response['count'] == 0
    
    def test_04_add_user_tags_success(self):
        """Test adding valid user tags to user 1"""
        
        # Add artist and designer tags to user 1
        tag_ids_to_add = [TestTagOperations.artist_tag_id, TestTagOperations.designer_tag_id]
        
        response = self.client.add_user_tags(TestTagOperations.user_id, tag_ids_to_add)
        print(f"[RESPONSE] Add user tags {tag_ids_to_add}: {response}")
        
        # Validate response
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'user_id' in response
        assert response['user_id'] == TestTagOperations.user_id
        assert 'tags' in response
        assert isinstance(response['tags'], list)
        assert len(response['tags']) == 2
        assert 'count' in response
        assert response['count'] == 2
        
        # Validate returned tags
        returned_tag_ids = [tag['id'] for tag in response['tags']]
        for tag_id in tag_ids_to_add:
            assert tag_id in returned_tag_ids, f"Tag ID {tag_id} not found in response"
        
        # Validate tag structure
        for tag in response['tags']:
            assert isinstance(tag, dict)
            assert 'id' in tag
            assert tag['id'] in tag_ids_to_add
            assert 'name' in tag
            assert isinstance(tag['name'], str)
            assert 'tag_type' in tag
            assert tag['tag_type'] == 'user'
    
    def test_05_add_different_user_tags_to_user2(self):
        """Test adding different user tags to user 2"""
        
        # Find some different user tags for user 2
        other_user_tag_ids = [tag_id for tag_id in TestTagOperations.user_tag_ids 
                              if tag_id not in [TestTagOperations.artist_tag_id, TestTagOperations.designer_tag_id]][:2]
        
        response = self.client2.add_user_tags(TestTagOperations.user_id2, other_user_tag_ids)
        print(f"[RESPONSE] Add user 2 tags {other_user_tag_ids}: {response}")
        
        # Validate response
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'user_id' in response
        assert response['user_id'] == TestTagOperations.user_id2
        assert 'tags' in response
        assert isinstance(response['tags'], list)
        assert len(response['tags']) == 2
        assert 'count' in response
        assert response['count'] == 2
    
    def test_06_create_searchable_with_tags(self):
        """Create searchable items and add tags to them"""
        
        # Create first searchable for user 1
        searchable_data_1 = {
            'payloads': {
                'public': {
                    'title': 'Art Book Collection',
                    'description': 'A collection of digital art books and tutorials',
                    'currency': 'usd',
                    'type': 'downloadable',
                    'downloadableFiles': [
                        {
                            'name': 'Art Tutorial Book',
                            'description': 'Comprehensive guide to digital art',
                            'price': 15.00,
                            'fileId': f'art-book-{TestTagOperations.test_id}',
                            'fileName': 'art_tutorial.pdf',
                            'fileType': 'application/pdf',
                            'fileSize': 2048
                        }
                    ],
                    'visibility': {
                        'udf': 'always_true',
                        'data': {}
                    }
                }
            }
        }
        
        response = self.client.create_searchable(searchable_data_1)
        print(f"[RESPONSE] Create searchable 1: {response}")
        
        assert isinstance(response, dict)
        assert 'searchable_id' in response
        assert isinstance(response['searchable_id'], int)
        assert response['searchable_id'] > 0
        
        searchable_id_1 = response['searchable_id']
        TestTagOperations.created_searchables.append(searchable_id_1)
        
        # Add books and art tags to first searchable
        tag_ids_to_add = [TestTagOperations.books_tag_id]
        response = self.client.add_searchable_tags(searchable_id_1, tag_ids_to_add)
        print(f"[RESPONSE] Add searchable 1 tags {tag_ids_to_add}: {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'searchable_id' in response
        assert response['searchable_id'] == searchable_id_1
        assert 'tags' in response
        assert len(response['tags']) == 1
        
        # Create second searchable for user 2
        searchable_data_2 = {
            'payloads': {
                'public': {
                    'title': 'Music Production Pack',
                    'description': 'Electronic music samples and loops',
                    'currency': 'usd',
                    'type': 'downloadable',
                    'downloadableFiles': [
                        {
                            'name': 'Synth Loops Pack',
                            'description': 'High quality synthesizer loops',
                            'price': 20.00,
                            'fileId': f'music-pack-{TestTagOperations.test_id}',
                            'fileName': 'synth_loops.zip',
                            'fileType': 'application/zip',
                            'fileSize': 4096
                        }
                    ],
                    'visibility': {
                        'udf': 'always_true',
                        'data': {}
                    }
                }
            }
        }
        
        response = self.client2.create_searchable(searchable_data_2)
        print(f"[RESPONSE] Create searchable 2: {response}")
        
        assert isinstance(response, dict)
        assert 'searchable_id' in response
        assert isinstance(response['searchable_id'], int)
        assert response['searchable_id'] > 0
        
        searchable_id_2 = response['searchable_id']
        TestTagOperations.created_searchables.append(searchable_id_2)
        
        # Add music tags to second searchable
        tag_ids_to_add = [TestTagOperations.music_tag_id]
        response = self.client2.add_searchable_tags(searchable_id_2, tag_ids_to_add)
        print(f"[RESPONSE] Add searchable 2 tags {tag_ids_to_add}: {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'searchable_id' in response
        assert response['searchable_id'] == searchable_id_2
        assert 'tags' in response
        assert len(response['tags']) == 1
    
    def test_07_search_users_by_artist_tag(self):
        """Test searching users by artist tag - should find user 1"""
        
        response = self.client.search_users_by_tags(['artist'])
        print(f"[RESPONSE] Search users by 'artist' tag: {response}")
        
        # Validate response structure
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'users' in response
        assert isinstance(response['users'], list)
        assert 'pagination' in response
        assert isinstance(response['pagination'], dict)
        
        # Should find user 1 who has artist tag
        assert len(response['users']) >= 1, "Should find at least one user with artist tag"
        
        # Check pagination structure
        pagination = response['pagination']
        assert 'page' in pagination
        assert 'limit' in pagination
        assert 'total' in pagination
        assert 'pages' in pagination
        assert isinstance(pagination['page'], int)
        assert isinstance(pagination['limit'], int)
        assert isinstance(pagination['total'], int)
        assert isinstance(pagination['pages'], int)
        
        # Verify we found our test user
        user_ids_found = [user['id'] for user in response['users']]
        assert TestTagOperations.user_id in user_ids_found, f"Test user {TestTagOperations.user_id} should be found with artist tag"
        
        # Validate user structure in results
        test_user = next((user for user in response['users'] if user['id'] == TestTagOperations.user_id), None)
        assert test_user is not None, "Test user should be in results"
        assert 'tags' in test_user
        assert isinstance(test_user['tags'], list)
        
        # Verify the user has the artist tag
        user_tag_ids = [tag['id'] for tag in test_user['tags']]
        assert TestTagOperations.artist_tag_id in user_tag_ids, "User should have artist tag in results"
    
    def test_08_search_users_by_multiple_tags(self):
        """Test searching users by multiple tags (AND logic) - should find user 1"""
        
        response = self.client.search_users_by_tags(['artist', 'designer'])
        print(f"[RESPONSE] Search users by 'artist' AND 'designer' tags: {response}")
        
        # Validate response structure
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'users' in response
        assert isinstance(response['users'], list)
        
        # Should find user 1 who has both tags
        assert len(response['users']) >= 1, "Should find at least one user with both artist and designer tags"
        
        # Verify we found our test user
        user_ids_found = [user['id'] for user in response['users']]
        assert TestTagOperations.user_id in user_ids_found, f"Test user {TestTagOperations.user_id} should be found with both tags"
        
        # Verify the user has both tags
        test_user = next((user for user in response['users'] if user['id'] == TestTagOperations.user_id), None)
        assert test_user is not None
        user_tag_ids = [tag['id'] for tag in test_user['tags']]
        assert TestTagOperations.artist_tag_id in user_tag_ids, "User should have artist tag"
        assert TestTagOperations.designer_tag_id in user_tag_ids, "User should have designer tag"
    
    def test_09_search_searchables_by_books_tag(self):
        """Test searching searchables by books tag - should find searchable 1"""
        
        response = self.client.search_searchables_by_tags(['books'])
        print(f"[RESPONSE] Search searchables by 'books' tag: {response}")
        
        # Validate response structure
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'searchables' in response
        assert isinstance(response['searchables'], list)
        assert 'pagination' in response
        assert isinstance(response['pagination'], dict)
        
        # Should find our books searchable
        assert len(response['searchables']) >= 1, "Should find at least one searchable with books tag"
        
        # Verify we found our test searchable
        searchable_ids_found = [s['id'] for s in response['searchables']]
        assert TestTagOperations.created_searchables[0] in searchable_ids_found, "Test searchable should be found with books tag"
        
        # Validate searchable structure in results
        test_searchable = next((s for s in response['searchables'] if s['id'] == TestTagOperations.created_searchables[0]), None)
        assert test_searchable is not None, "Test searchable should be in results"
        assert 'tags' in test_searchable
        assert isinstance(test_searchable['tags'], list)
        
        # Verify the searchable has the books tag
        searchable_tag_ids = [tag['id'] for tag in test_searchable['tags']]
        assert TestTagOperations.books_tag_id in searchable_tag_ids, "Searchable should have books tag in results"
    
    def test_10_search_searchables_by_music_tag(self):
        """Test searching searchables by music tag - should find searchable 2"""
        
        response = self.client.search_searchables_by_tags(['music'])
        print(f"[RESPONSE] Search searchables by 'music' tag: {response}")
        
        # Validate response structure
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'searchables' in response
        assert isinstance(response['searchables'], list)
        
        # Should find our music searchable
        assert len(response['searchables']) >= 1, "Should find at least one searchable with music tag"
        
        # Verify we found our test searchable
        searchable_ids_found = [s['id'] for s in response['searchables']]
        assert TestTagOperations.created_searchables[1] in searchable_ids_found, "Test searchable should be found with music tag"
    
    def test_11_search_no_results_for_nonexistent_tag(self):
        """Test searching with a tag combination that should return no results"""
        
        response = self.client.search_users_by_tags(['nonexistent_tag'])
        print(f"[RESPONSE] Search users by nonexistent tag: {response}")
        
        # Should return valid structure but empty results
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'users' in response
        assert isinstance(response['users'], list)
        assert len(response['users']) == 0, "Should return empty results for nonexistent tag"
        
        # Pagination should indicate no results
        assert 'pagination' in response
        pagination = response['pagination']
        assert pagination['total'] == 0
        assert pagination['pages'] == 0
    
    def test_12_remove_user_tag(self):
        """Test removing a specific user tag"""
        
        # Remove the designer tag from user 1
        response = self.client.remove_user_tag(TestTagOperations.user_id, TestTagOperations.designer_tag_id)
        print(f"[RESPONSE] Remove designer tag from user 1: {response}")
        
        # Validate response
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'user_id' in response
        assert response['user_id'] == TestTagOperations.user_id
        assert 'tags' in response
        assert isinstance(response['tags'], list)
        assert len(response['tags']) == 1  # Should have 1 tag left (artist)
        assert 'count' in response
        assert response['count'] == 1
        
        # Validate the removed tag is not in the list
        returned_tag_ids = [tag['id'] for tag in response['tags']]
        assert TestTagOperations.designer_tag_id not in returned_tag_ids, "Removed tag should not be in list"
        assert TestTagOperations.artist_tag_id in returned_tag_ids, "Artist tag should still be present"
    
    def test_13_verify_search_after_tag_removal(self):
        """Test that search results update after tag removal"""
        
        # Search for users with both artist and designer tags
        response = self.client.search_users_by_tags(['artist', 'designer'])
        print(f"[RESPONSE] Search users by 'artist' AND 'designer' after removal: {response}")
        
        # Should not find user 1 anymore since we removed designer tag
        user_ids_found = [user['id'] for user in response['users']]
        assert TestTagOperations.user_id not in user_ids_found, "User 1 should not be found since designer tag was removed"
        
        # But searching for just artist should still find user 1
        response = self.client.search_users_by_tags(['artist'])
        print(f"[RESPONSE] Search users by 'artist' only after removal: {response}")
        
        user_ids_found = [user['id'] for user in response['users']]
        assert TestTagOperations.user_id in user_ids_found, "User 1 should still be found with artist tag"
    
    def test_14_remove_searchable_tag(self):
        """Test removing a searchable tag"""
        
        searchable_id = TestTagOperations.created_searchables[0]
        
        response = self.client.remove_searchable_tag(searchable_id, TestTagOperations.books_tag_id)
        print(f"[RESPONSE] Remove books tag from searchable: {response}")
        
        # Validate response
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'searchable_id' in response
        assert response['searchable_id'] == searchable_id
        assert 'tags' in response
        assert isinstance(response['tags'], list)
        assert len(response['tags']) == 0  # Should have no tags left
        
        # Verify the tag was removed
        returned_tag_ids = [tag['id'] for tag in response['tags']]
        assert TestTagOperations.books_tag_id not in returned_tag_ids, "Books tag should be removed"
    
    def test_15_verify_searchable_search_after_tag_removal(self):
        """Test that searchable search results update after tag removal"""
        
        response = self.client.search_searchables_by_tags(['books'])
        print(f"[RESPONSE] Search searchables by 'books' after removal: {response}")
        
        # Should not find our first searchable anymore
        searchable_ids_found = [s['id'] for s in response['searchables']]
        assert TestTagOperations.created_searchables[0] not in searchable_ids_found, "Searchable should not be found after books tag removal"
    
    def test_16_pagination_testing(self):
        """Test pagination in search results"""
        
        # Test with pagination parameters
        response = self.client.search_users_by_tags(['artist'], page=1, limit=5)
        print(f"[RESPONSE] Search users with pagination: {response}")
        
        # Validate pagination
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'pagination' in response
        
        pagination = response['pagination']
        assert pagination['page'] == 1
        assert pagination['limit'] == 5
        assert isinstance(pagination['total'], int)
        assert isinstance(pagination['pages'], int)
        
        # Verify limit is respected
        assert len(response['users']) <= 5
    
    def test_17_unauthorized_user_tag_modification(self):
        """Test that users cannot modify other users' tags"""
        
        # Try to add tags to user2 using user1's client
        try:
            response = self.client.add_user_tags(TestTagOperations.user_id2, [TestTagOperations.artist_tag_id])
            print(f"[RESPONSE] Unauthorized user tag addition: {response}")
            
            # Should fail with authorization error
            assert isinstance(response, dict)
            assert 'success' in response
            assert response['success'] is False
            assert 'error' in response
            assert 'unauthorized' in response['error'].lower() or 'only modify your own' in response['error'].lower()
        except Exception as e:
            # Could also get HTTP error
            error_msg = str(e).lower()
            assert '403' in error_msg or 'unauthorized' in error_msg or 'forbidden' in error_msg
            print(f"[DEBUG] Expected authorization error: {e}")
        
        # Try to remove tags from user2 using user1's client
        try:
            response = self.client.remove_user_tag(TestTagOperations.user_id2, TestTagOperations.artist_tag_id)
            print(f"[RESPONSE] Unauthorized user tag removal: {response}")
            
            # Should fail with authorization error
            assert isinstance(response, dict)
            assert 'success' in response
            assert response['success'] is False
            assert 'error' in response
            assert 'unauthorized' in response['error'].lower() or 'only modify your own' in response['error'].lower()
        except Exception as e:
            # Could also get HTTP error
            error_msg = str(e).lower()
            assert '403' in error_msg or 'unauthorized' in error_msg or 'forbidden' in error_msg
            print(f"[DEBUG] Expected authorization error: {e}")
    
    def test_18_unauthorized_searchable_tag_modification(self):
        """Test that users cannot modify other users' searchable tags"""
        
        # Get searchable created by user2
        searchable_id_2 = TestTagOperations.created_searchables[1]  # Music searchable created by user2
        
        # Try to add tags to user2's searchable using user1's client
        try:
            response = self.client.add_searchable_tags(searchable_id_2, [TestTagOperations.books_tag_id])
            print(f"[RESPONSE] Unauthorized searchable tag addition: {response}")
            
            # Should fail with authorization error
            assert isinstance(response, dict)
            assert 'success' in response
            assert response['success'] is False
            assert 'error' in response
            assert 'unauthorized' in response['error'].lower() or 'only modify your own' in response['error'].lower()
        except Exception as e:
            # Could also get HTTP error
            error_msg = str(e).lower()
            assert '403' in error_msg or 'unauthorized' in error_msg or 'forbidden' in error_msg
            print(f"[DEBUG] Expected authorization error: {e}")
        
        # Try to remove tags from user2's searchable using user1's client
        try:
            response = self.client.remove_searchable_tag(searchable_id_2, TestTagOperations.music_tag_id)
            print(f"[RESPONSE] Unauthorized searchable tag removal: {response}")
            
            # Should fail with authorization error
            assert isinstance(response, dict)
            assert 'success' in response
            assert response['success'] is False
            assert 'error' in response
            assert 'unauthorized' in response['error'].lower() or 'only modify your own' in response['error'].lower()
        except Exception as e:
            # Could also get HTTP error
            error_msg = str(e).lower()
            assert '403' in error_msg or 'unauthorized' in error_msg or 'forbidden' in error_msg
            print(f"[DEBUG] Expected authorization error: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])