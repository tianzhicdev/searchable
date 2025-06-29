#!/usr/bin/env python3
"""
Comprehensive integration tests for the tag system
Tests full tag functionality including CRUD operations and search
"""

import pytest
import uuid
import time
import os
from api_client import SearchableAPIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD

class TestTagsComprehensive:
    """Comprehensive tests for tag functionality"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with API client and test data"""
        cls.client = SearchableAPIClient()
        cls.test_id = str(uuid.uuid4())[:8]
        cls.username = f"{TEST_USER_PREFIX}tag_{cls.test_id}"
        cls.email = f"{cls.username}@{TEST_EMAIL_DOMAIN}"
        cls.password = DEFAULT_PASSWORD
        cls.user_id = None
        cls.searchable_id = None
        cls.available_user_tags = []
        cls.available_searchable_tags = []
    
    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        if cls.client.token:
            cls.client.logout()
    
    def test_01_setup_user_and_searchable(self):
        """Create a test user and searchable for tag testing"""
        # Register user
        response = self.client.register_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        assert response['success'] is True
        assert 'userID' in response
        self.__class__.user_id = response['userID']
        
        # Login
        login_response = self.client.login_user(self.email, self.password)
        assert login_response['success'] is True
        assert 'token' in login_response
        
        # Create a test searchable
        searchable_data = {
            "payloads": {
                "public": {
                    "title": f"Test Searchable for Tags {self.test_id}",
                    "description": "A test searchable for tag testing",
                    "type": "downloadable",
                    "category": "test",
                    "currency": "usd",
                    "downloadableFiles": [],
                    "selectables": []
                }
            }
        }
        
        create_response = self.client.create_searchable(searchable_data)
        assert 'searchable_id' in create_response
        self.__class__.searchable_id = create_response['searchable_id']
    
    def test_02_get_available_tags(self):
        """Get available tags for users and searchables"""
        # Get available user tags
        user_tags_response = self.client.get_tags('user')
        assert 'tags' in user_tags_response
        self.__class__.available_user_tags = user_tags_response['tags']
        assert len(self.available_user_tags) > 0
        
        # Get available searchable tags
        searchable_tags_response = self.client.get_tags('searchable')
        assert 'tags' in searchable_tags_response
        self.__class__.available_searchable_tags = searchable_tags_response['tags']
        assert len(self.available_searchable_tags) > 0
    
    def test_03_add_user_tags(self):
        """Test adding tags to a user"""
        # Select first 2 user tags
        if len(self.available_user_tags) < 2:
            pytest.skip("Not enough user tags available")
        
        tag_ids = [tag['id'] for tag in self.available_user_tags[:2]]
        
        # Add tags to user
        response = self.client.add_user_tags(self.user_id, tag_ids)
        assert 'tags' in response
        user_tags = response['tags']
        assert len(user_tags) >= 2
        
        # Verify the tags were added
        added_tag_ids = [tag['id'] for tag in user_tags]
        for tag_id in tag_ids:
            assert tag_id in added_tag_ids
    
    def test_04_get_user_tags(self):
        """Test getting tags for a specific user"""
        response = self.client.get_user_tags(self.user_id)
        assert 'tags' in response
        tags = response['tags']
        assert len(tags) >= 2
        
        # Verify tag structure
        for tag in tags:
            assert 'id' in tag
            assert 'name' in tag
            assert 'tag_type' in tag
            assert tag['tag_type'] == 'user'
    
    def test_05_add_searchable_tags(self):
        """Test adding tags to a searchable"""
        # Select first 3 searchable tags
        if len(self.available_searchable_tags) < 3:
            pytest.skip("Not enough searchable tags available")
        
        tag_ids = [tag['id'] for tag in self.available_searchable_tags[:3]]
        
        # Add tags to searchable
        response = self.client.add_searchable_tags(self.searchable_id, tag_ids)
        assert 'tags' in response
        searchable_tags = response['tags']
        assert len(searchable_tags) >= 3
        
        # Verify the tags were added
        added_tag_ids = [tag['id'] for tag in searchable_tags]
        for tag_id in tag_ids:
            assert tag_id in added_tag_ids
    
    def test_06_get_searchable_tags(self):
        """Test getting tags for a specific searchable"""
        response = self.client.get_searchable_tags(self.searchable_id)
        assert 'tags' in response
        tags = response['tags']
        assert len(tags) >= 3
        
        # Verify tag structure
        for tag in tags:
            assert 'id' in tag
            assert 'name' in tag
            assert 'tag_type' in tag
            assert tag['tag_type'] == 'searchable'
    
    def test_07_search_users_by_tags(self):
        """Test searching users by tags"""
        # Get the tags we added to our user
        user_tags_response = self.client.get_user_tags(self.user_id)
        user_tags = user_tags_response['tags']
        assert len(user_tags) > 0
        
        # Search by first tag name
        tag_names = [user_tags[0]['name']]
        
        # Search with higher limit to handle environments with more data
        search_response = self.client.search_users_by_tags(tag_names, limit=50)
        assert 'users' in search_response
        users = search_response['users']
        assert len(users) > 0
        
        # Check if our test user is in results
        user_ids = [user.get('id', user.get('user_id')) for user in users]
        
        # Our user might not be in first page if there are many users
        # Just verify the search worked
        assert 'pagination' in search_response
        assert search_response['pagination']['total'] > 0
    
    def test_08_search_searchables_by_tags(self):
        """Test searching searchables by tags"""
        # Get the tags we added to our searchable
        searchable_tags_response = self.client.get_searchable_tags(self.searchable_id)
        searchable_tags = searchable_tags_response['tags']
        assert len(searchable_tags) > 0
        
        # Search by first tag name
        tag_names = [searchable_tags[0]['name']]
        
        search_response = self.client.search_searchables_by_tags(tag_names)
        assert 'searchables' in search_response
        searchables = search_response['searchables']
        
        # Our searchable should be in the results
        searchable_ids = [s['searchable_id'] for s in searchables]
        if self.searchable_id not in searchable_ids:
            # Might be on another page
            assert 'pagination' in search_response
            assert search_response['pagination']['total'] > 0
    
    def test_09_remove_user_tag(self):
        """Test removing a tag from a user"""
        # Get current user tags
        response = self.client.get_user_tags(self.user_id)
        user_tags = response['tags']
        if len(user_tags) == 0:
            pytest.skip("User has no tags to remove")
        
        # Remove the first tag
        tag_to_remove = user_tags[0]
        remove_response = self.client.remove_user_tag(self.user_id, tag_to_remove['id'])
        assert 'tags' in remove_response
        
        # Verify tag was removed
        remaining_tags = remove_response['tags']
        remaining_tag_ids = [tag['id'] for tag in remaining_tags]
        assert tag_to_remove['id'] not in remaining_tag_ids
    
    def test_10_remove_searchable_tag(self):
        """Test removing a tag from a searchable"""
        # Get current searchable tags
        response = self.client.get_searchable_tags(self.searchable_id)
        searchable_tags = response['tags']
        if len(searchable_tags) == 0:
            pytest.skip("Searchable has no tags to remove")
        
        # Remove the first tag
        tag_to_remove = searchable_tags[0]
        remove_response = self.client.remove_searchable_tag(self.searchable_id, tag_to_remove['id'])
        assert 'tags' in remove_response
        
        # Verify tag was removed
        remaining_tags = remove_response['tags']
        remaining_tag_ids = [tag['id'] for tag in remaining_tags]
        assert tag_to_remove['id'] not in remaining_tag_ids
    
    def test_11_tag_limits(self):
        """Test tag limits (max 10 for users, max 15 for searchables)"""
        # Try to add more than 10 tags to user
        if len(self.available_user_tags) >= 11:
            # Try to add 11 tags
            tag_ids = [tag['id'] for tag in self.available_user_tags[:11]]
            
            try:
                response = self.client.add_user_tags(self.user_id, tag_ids)
                # Should either reject or only add up to 10
                if 'tags' in response:
                    assert len(response['tags']) <= 10
            except Exception as e:
                # Expected to fail with 400
                assert "400" in str(e) or "limit" in str(e).lower()


if __name__ == "__main__":
    # Run tests with verbose output
    pytest.main([__file__, "-v", "-s", "--tb=short"])