import pytest
import uuid
import time
import json
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD


class TestTagSearchAnyLogic:
    """Tests for tag search with ANY logic (OR) and optional tags"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with users and data"""
        cls.test_id = str(uuid.uuid4())[:8]
        
        # Create 3 test users with different tag combinations
        cls.users = []
        cls.clients = []
        
        # User 1: artist only
        cls.username1 = f"{TEST_USER_PREFIX}any1_{cls.test_id}"
        cls.email1 = f"{cls.username1}@{TEST_EMAIL_DOMAIN}"
        cls.client1 = SearchableAPIClient()
        
        # User 2: musician only
        cls.username2 = f"{TEST_USER_PREFIX}any2_{cls.test_id}"
        cls.email2 = f"{cls.username2}@{TEST_EMAIL_DOMAIN}"
        cls.client2 = SearchableAPIClient()
        
        # User 3: both artist and musician
        cls.username3 = f"{TEST_USER_PREFIX}any3_{cls.test_id}"
        cls.email3 = f"{cls.username3}@{TEST_EMAIL_DOMAIN}"
        cls.client3 = SearchableAPIClient()
        
        # User 4: no tags
        cls.username4 = f"{TEST_USER_PREFIX}any4_{cls.test_id}"
        cls.email4 = f"{cls.username4}@{TEST_EMAIL_DOMAIN}"
        cls.client4 = SearchableAPIClient()
        
        cls.password = DEFAULT_PASSWORD
        
        # Store tag IDs
        cls.artist_tag_id = None
        cls.musician_tag_id = None
        cls.designer_tag_id = None
        cls.books_tag_id = None
        cls.music_tag_id = None
        cls.art_tag_id = None
        
        # Store created searchables
        cls.created_searchables = []
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        for client in [cls.client1, cls.client2, cls.client3, cls.client4]:
            if hasattr(client, 'token') and client.token:
                client.logout()
    
    def test_01_setup_users(self):
        """Register and login test users"""
        users_data = [
            (self.username1, self.email1, self.client1),
            (self.username2, self.email2, self.client2),
            (self.username3, self.email3, self.client3),
            (self.username4, self.email4, self.client4)
        ]
        
        for username, email, client in users_data:
            # Register user
            response = client.register_user(
                username=username,
                email=email,
                password=self.password
            )
            print(f"[RESPONSE] Register {username}: {response}")
            assert isinstance(response, dict)
            assert 'success' in response
            assert response['success'] is True
            
            # Login user
            login_response = client.login_user(email, self.password)
            print(f"[RESPONSE] Login {username}: {login_response}")
            assert isinstance(login_response, dict)
            assert 'token' in login_response
            assert 'user' in login_response
            assert '_id' in login_response['user']
            
            # Store user info
            user_info = {
                'id': login_response['user']['_id'],
                'username': username,
                'email': email,
                'client': client
            }
            TestTagSearchAnyLogic.users.append(user_info)
            TestTagSearchAnyLogic.clients.append(client)
    
    def test_02_get_and_store_tag_ids(self):
        """Get all tags and store specific tag IDs"""
        response = self.client1.get_tags()
        print(f"[RESPONSE] Get all tags: {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'tags' in response
        assert isinstance(response['tags'], list)
        
        # Find and store specific tags
        for tag in response['tags']:
            if tag['tag_type'] == 'user':
                if tag['name'] == 'artist':
                    TestTagSearchAnyLogic.artist_tag_id = tag['id']
                elif tag['name'] == 'musician':
                    TestTagSearchAnyLogic.musician_tag_id = tag['id']
                elif tag['name'] == 'designer':
                    TestTagSearchAnyLogic.designer_tag_id = tag['id']
            elif tag['tag_type'] == 'searchable':
                if tag['name'] == 'books':
                    TestTagSearchAnyLogic.books_tag_id = tag['id']
                elif tag['name'] == 'music':
                    TestTagSearchAnyLogic.music_tag_id = tag['id']
                elif tag['name'] == 'art':
                    TestTagSearchAnyLogic.art_tag_id = tag['id']
        
        assert TestTagSearchAnyLogic.artist_tag_id is not None
        assert TestTagSearchAnyLogic.musician_tag_id is not None
        assert TestTagSearchAnyLogic.designer_tag_id is not None
        assert TestTagSearchAnyLogic.books_tag_id is not None
        assert TestTagSearchAnyLogic.music_tag_id is not None
        assert TestTagSearchAnyLogic.art_tag_id is not None
    
    def test_03_add_tags_to_users(self):
        """Add different tags to users"""
        # User 1: artist only
        response = self.client1.add_user_tags(
            TestTagSearchAnyLogic.users[0]['id'], 
            [TestTagSearchAnyLogic.artist_tag_id]
        )
        print(f"[RESPONSE] Add artist tag to user 1: {response}")
        assert response['success'] is True
        assert len(response['tags']) == 1
        
        # User 2: musician only
        response = self.client2.add_user_tags(
            TestTagSearchAnyLogic.users[1]['id'], 
            [TestTagSearchAnyLogic.musician_tag_id]
        )
        print(f"[RESPONSE] Add musician tag to user 2: {response}")
        assert response['success'] is True
        assert len(response['tags']) == 1
        
        # User 3: both artist and musician
        response = self.client3.add_user_tags(
            TestTagSearchAnyLogic.users[2]['id'], 
            [TestTagSearchAnyLogic.artist_tag_id, TestTagSearchAnyLogic.musician_tag_id]
        )
        print(f"[RESPONSE] Add artist and musician tags to user 3: {response}")
        assert response['success'] is True
        assert len(response['tags']) == 2
        
        # User 4: no tags (skip)
        print("[INFO] User 4 has no tags")
    
    def test_04_search_users_no_tags_should_return_all(self):
        """Search users without tags should return all users"""
        response = self.client1.search_users_by_tags([])
        print(f"[RESPONSE] Search users with no tags: {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'users' in response
        assert isinstance(response['users'], list)
        
        # Should return all users (or at least our 4 test users)
        user_ids_found = [user['id'] for user in response['users']]
        for user in TestTagSearchAnyLogic.users:
            assert user['id'] in user_ids_found, f"User {user['id']} should be in results"
    
    def test_05_search_users_artist_or_musician_tags(self):
        """Search users with artist OR musician tags (ANY logic)"""
        response = self.client1.search_users_by_tags(['artist', 'musician'])
        print(f"[RESPONSE] Search users with artist OR musician tags: {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'users' in response
        
        # Should find users 1, 2, and 3 (all have at least one of the tags)
        user_ids_found = [user['id'] for user in response['users']]
        assert TestTagSearchAnyLogic.users[0]['id'] in user_ids_found, "User 1 (artist) should be found"
        assert TestTagSearchAnyLogic.users[1]['id'] in user_ids_found, "User 2 (musician) should be found"
        assert TestTagSearchAnyLogic.users[2]['id'] in user_ids_found, "User 3 (both) should be found"
        assert TestTagSearchAnyLogic.users[3]['id'] not in user_ids_found, "User 4 (no tags) should not be found"
    
    def test_06_search_users_single_tag_artist(self):
        """Search users with only artist tag"""
        response = self.client1.search_users_by_tags(['artist'])
        print(f"[RESPONSE] Search users with artist tag: {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'users' in response
        
        # Should find users 1 and 3 (both have artist tag)
        user_ids_found = [user['id'] for user in response['users']]
        assert TestTagSearchAnyLogic.users[0]['id'] in user_ids_found, "User 1 (artist) should be found"
        assert TestTagSearchAnyLogic.users[1]['id'] not in user_ids_found, "User 2 (musician) should not be found"
        assert TestTagSearchAnyLogic.users[2]['id'] in user_ids_found, "User 3 (both) should be found"
        assert TestTagSearchAnyLogic.users[3]['id'] not in user_ids_found, "User 4 (no tags) should not be found"
    
    def test_07_create_searchables_with_different_tags(self):
        """Create searchables with different tag combinations"""
        # Searchable 1: books only
        searchable_data_1 = {
            'payloads': {
                'public': {
                    'title': 'Digital Book Collection',
                    'description': 'A collection of ebooks',
                    'currency': 'usd',
                    'type': 'downloadable',
                    'downloadableFiles': [
                        {
                            'name': 'Book Bundle',
                            'price': 10.00,
                            'fileId': f'book-{TestTagSearchAnyLogic.test_id}',
                            'fileName': 'books.zip'
                        }
                    ]
                }
            }
        }
        
        response = self.client1.create_searchable(searchable_data_1)
        print(f"[RESPONSE] Create searchable 1: {response}")
        searchable_id_1 = response['searchable_id']
        TestTagSearchAnyLogic.created_searchables.append(searchable_id_1)
        
        # Add books tag
        response = self.client1.add_searchable_tags(searchable_id_1, [TestTagSearchAnyLogic.books_tag_id])
        assert response['success'] is True
        
        # Searchable 2: music only
        searchable_data_2 = {
            'payloads': {
                'public': {
                    'title': 'Music Sample Pack',
                    'description': 'Electronic music samples',
                    'currency': 'usd',
                    'type': 'downloadable',
                    'downloadableFiles': [
                        {
                            'name': 'Samples',
                            'price': 15.00,
                            'fileId': f'music-{TestTagSearchAnyLogic.test_id}',
                            'fileName': 'samples.zip'
                        }
                    ]
                }
            }
        }
        
        response = self.client2.create_searchable(searchable_data_2)
        print(f"[RESPONSE] Create searchable 2: {response}")
        searchable_id_2 = response['searchable_id']
        TestTagSearchAnyLogic.created_searchables.append(searchable_id_2)
        
        # Add music tag
        response = self.client2.add_searchable_tags(searchable_id_2, [TestTagSearchAnyLogic.music_tag_id])
        assert response['success'] is True
        
        # Searchable 3: both books and art
        searchable_data_3 = {
            'payloads': {
                'public': {
                    'title': 'Art Book Collection',
                    'description': 'Books about art',
                    'currency': 'usd',
                    'type': 'downloadable',
                    'downloadableFiles': [
                        {
                            'name': 'Art Books',
                            'price': 20.00,
                            'fileId': f'artbook-{TestTagSearchAnyLogic.test_id}',
                            'fileName': 'artbooks.zip'
                        }
                    ]
                }
            }
        }
        
        response = self.client3.create_searchable(searchable_data_3)
        print(f"[RESPONSE] Create searchable 3: {response}")
        searchable_id_3 = response['searchable_id']
        TestTagSearchAnyLogic.created_searchables.append(searchable_id_3)
        
        # Add books and art tags
        response = self.client3.add_searchable_tags(
            searchable_id_3, 
            [TestTagSearchAnyLogic.books_tag_id, TestTagSearchAnyLogic.art_tag_id]
        )
        assert response['success'] is True
        
        # Searchable 4: no tags
        searchable_data_4 = {
            'payloads': {
                'public': {
                    'title': 'Generic Product',
                    'description': 'A product without tags',
                    'currency': 'usd',
                    'type': 'downloadable',
                    'downloadableFiles': [
                        {
                            'name': 'Product',
                            'price': 5.00,
                            'fileId': f'generic-{TestTagSearchAnyLogic.test_id}',
                            'fileName': 'product.zip'
                        }
                    ]
                }
            }
        }
        
        response = self.client4.create_searchable(searchable_data_4)
        print(f"[RESPONSE] Create searchable 4: {response}")
        searchable_id_4 = response['searchable_id']
        TestTagSearchAnyLogic.created_searchables.append(searchable_id_4)
    
    def test_08_search_searchables_no_tags_should_return_all(self):
        """Search searchables without tags should return all searchables"""
        response = self.client1.search_searchables_by_tags([])
        print(f"[RESPONSE] Search searchables with no tags: {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'searchables' in response
        assert isinstance(response['searchables'], list)
        
        # Should return all searchables (at least our 4 test searchables)
        searchable_ids_found = [s['id'] for s in response['searchables']]
        for searchable_id in TestTagSearchAnyLogic.created_searchables:
            assert searchable_id in searchable_ids_found, f"Searchable {searchable_id} should be in results"
    
    def test_09_search_searchables_books_or_music_tags(self):
        """Search searchables with books OR music tags (ANY logic)"""
        response = self.client1.search_searchables_by_tags(['books', 'music'])
        print(f"[RESPONSE] Search searchables with books OR music tags: {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'searchables' in response
        
        # Should find searchables 1, 2, and 3 (all have at least one of the tags)
        searchable_ids_found = [s['id'] for s in response['searchables']]
        assert TestTagSearchAnyLogic.created_searchables[0] in searchable_ids_found, "Searchable 1 (books) should be found"
        assert TestTagSearchAnyLogic.created_searchables[1] in searchable_ids_found, "Searchable 2 (music) should be found"
        assert TestTagSearchAnyLogic.created_searchables[2] in searchable_ids_found, "Searchable 3 (books+art) should be found"
        assert TestTagSearchAnyLogic.created_searchables[3] not in searchable_ids_found, "Searchable 4 (no tags) should not be found"
    
    def test_10_search_searchables_single_tag_books(self):
        """Search searchables with only books tag"""
        response = self.client1.search_searchables_by_tags(['books'])
        print(f"[RESPONSE] Search searchables with books tag: {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'searchables' in response
        
        # Should find searchables 1 and 3 (both have books tag)
        searchable_ids_found = [s['id'] for s in response['searchables']]
        assert TestTagSearchAnyLogic.created_searchables[0] in searchable_ids_found, "Searchable 1 (books) should be found"
        assert TestTagSearchAnyLogic.created_searchables[1] not in searchable_ids_found, "Searchable 2 (music) should not be found"
        assert TestTagSearchAnyLogic.created_searchables[2] in searchable_ids_found, "Searchable 3 (books+art) should be found"
        assert TestTagSearchAnyLogic.created_searchables[3] not in searchable_ids_found, "Searchable 4 (no tags) should not be found"
    
    def test_11_pagination_with_any_logic(self):
        """Test pagination works correctly with ANY logic"""
        response = self.client1.search_users_by_tags(['artist', 'musician'], page=1, limit=2)
        print(f"[RESPONSE] Search users with pagination (page 1, limit 2): {response}")
        
        assert isinstance(response, dict)
        assert 'success' in response
        assert response['success'] is True
        assert 'pagination' in response
        
        pagination = response['pagination']
        assert pagination['page'] == 1
        assert pagination['limit'] == 2
        assert len(response['users']) <= 2
        
        # There should be at least 3 users with these tags
        assert pagination['total'] >= 3
        assert pagination['pages'] >= 2


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])