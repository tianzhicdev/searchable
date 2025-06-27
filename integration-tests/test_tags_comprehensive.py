#!/usr/bin/env python3
"""
Comprehensive integration tests for the tag system
Tests full tag functionality including CRUD operations and search
"""

import sys
import os
import requests
import time
import random
import string

# Configuration
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5005')

def generate_random_string(length=8):
    """Generate a random string for unique usernames/emails"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

class TagTestSuite:
    def __init__(self):
        self.base_url = BASE_URL
        self.user_token = None
        self.user_id = None
        self.searchable_id = None
        
    def setup(self):
        """Create a test user and searchable for tag testing"""
        print("Setting up test data...")
        
        # Register a new user
        random_suffix = generate_random_string()
        register_data = {
            "username": f"tagtest_{random_suffix}",
            "email": f"tagtest_{random_suffix}@example.com",
            "password": "testpass123"
        }
        
        response = requests.post(f"{self.base_url}/api/users/register", json=register_data)
        if response.status_code != 200:
            print(f"✗ Failed to register test user: {response.status_code}")
            return False
            
        self.user_id = response.json().get('userID')
        
        # Login to get token
        login_data = {
            "email": register_data['email'],
            "password": register_data['password']
        }
        
        response = requests.post(f"{self.base_url}/api/users/login", json=login_data)
        if response.status_code != 200:
            print(f"✗ Failed to login: {response.status_code}")
            return False
            
        login_result = response.json()
        self.user_token = login_result.get('token')
        if not self.user_token:
            print("✗ No token received from login")
            return False
        print(f"✓ Login successful, token received")
        
        # Create a searchable
        headers = {"authorization": self.user_token}
        searchable_data = {
            "payloads": {
                "public": {
                    "title": f"Test Searchable {random_suffix}",
                    "description": "A test searchable for tag testing",
                    "type": "downloadable",
                    "category": "test",
                    "currency": "usd",
                    "downloadableFiles": [],
                    "selectables": []
                }
            }
        }
        
        response = requests.post(
            f"{self.base_url}/api/v1/searchable/create",
            json=searchable_data,
            headers=headers
        )
        
        if response.status_code == 201:
            self.searchable_id = response.json().get('searchable_id')
            print(f"✓ Test setup complete. User ID: {self.user_id}, Searchable ID: {self.searchable_id}")
            return True
        else:
            print(f"✗ Failed to create searchable: {response.status_code}")
            if response.text:
                print(f"  Error details: {response.text}")
            return False
    
    def test_add_user_tags(self):
        """Test adding tags to a user"""
        print("\nTesting: Add tags to user")
        
        headers = {"authorization": self.user_token}
        
        # Get available user tags
        response = requests.get(f"{self.base_url}/api/v1/tags?type=user")
        if response.status_code != 200:
            print("✗ Failed to get available tags")
            return False
            
        available_tags = response.json().get('tags', [])
        if len(available_tags) < 2:
            print("✗ Not enough user tags available for testing")
            return False
        
        # Select first 2 tags
        tag_ids = [tag['id'] for tag in available_tags[:2]]
        
        # Add tags to user
        tag_data = {"tag_ids": tag_ids}
        response = requests.post(
            f"{self.base_url}/api/v1/users/{self.user_id}/tags",
            json=tag_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            user_tags = data.get('tags', [])
            print(f"✓ Successfully added {len(user_tags)} tags to user")
            
            # Verify the tags were added
            added_tag_ids = [tag['id'] for tag in user_tags]
            for tag_id in tag_ids:
                if tag_id in added_tag_ids:
                    print(f"  ✓ Tag ID {tag_id} was added")
                else:
                    print(f"  ✗ Tag ID {tag_id} was not added")
                    return False
            
            return True
        else:
            print(f"✗ Failed to add tags: {response.status_code}")
            return False
    
    def test_get_user_tags(self):
        """Test getting tags for a specific user"""
        print("\nTesting: Get user tags")
        
        response = requests.get(f"{self.base_url}/api/v1/users/{self.user_id}/tags")
        
        if response.status_code == 200:
            data = response.json()
            tags = data.get('tags', [])
            print(f"✓ Successfully retrieved {len(tags)} tags for user")
            
            for tag in tags:
                print(f"  - {tag['name']} ({tag['tag_type']})")
            
            return True
        else:
            print(f"✗ Failed to get user tags: {response.status_code}")
            return False
    
    def test_add_searchable_tags(self):
        """Test adding tags to a searchable"""
        print("\nTesting: Add tags to searchable")
        
        headers = {"authorization": self.user_token}
        
        # Get available searchable tags
        response = requests.get(f"{self.base_url}/api/v1/tags?type=searchable")
        if response.status_code != 200:
            print("✗ Failed to get available tags")
            return False
            
        available_tags = response.json().get('tags', [])
        if len(available_tags) < 3:
            print("✗ Not enough searchable tags available for testing")
            return False
        
        # Select first 3 tags
        tag_ids = [tag['id'] for tag in available_tags[:3]]
        
        # Add tags to searchable
        tag_data = {"tag_ids": tag_ids}
        response = requests.post(
            f"{self.base_url}/api/v1/searchables/{self.searchable_id}/tags",
            json=tag_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            searchable_tags = data.get('tags', [])
            print(f"✓ Successfully added {len(searchable_tags)} tags to searchable")
            
            # Verify the tags were added
            added_tag_ids = [tag['id'] for tag in searchable_tags]
            for tag_id in tag_ids:
                if tag_id in added_tag_ids:
                    print(f"  ✓ Tag ID {tag_id} was added")
                else:
                    print(f"  ✗ Tag ID {tag_id} was not added")
                    return False
            
            return True
        else:
            print(f"✗ Failed to add tags: {response.status_code}")
            return False
    
    def test_search_by_user_tags(self):
        """Test searching users by tags"""
        print("\nTesting: Search users by tags")
        
        # Get the tags we added to our user
        response = requests.get(f"{self.base_url}/api/v1/users/{self.user_id}/tags")
        if response.status_code != 200:
            print("✗ Failed to get user tags")
            return False
            
        user_tags = response.json().get('tags', [])
        if len(user_tags) == 0:
            print("✗ User has no tags for search testing")
            return False
        
        # Search by first tag name
        tag_name = user_tags[0]['name']
        response = requests.get(f"{self.base_url}/api/v1/search/users?tags[]={tag_name}")
        
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            print(f"✓ Search returned {len(users)} users with tag '{tag_name}'")
            
            # Check if our test user is in results
            user_ids = [user['id'] for user in users]
            if self.user_id in user_ids:
                print(f"  ✓ Test user found in search results")
                return True
            else:
                print(f"  ✗ Test user not found in search results")
                return False
        else:
            print(f"✗ Search failed: {response.status_code}")
            return False
    
    def test_search_by_searchable_tags(self):
        """Test searching searchables by tags"""
        print("\nTesting: Search searchables by tags")
        
        # Get the tags we added to our searchable
        response = requests.get(f"{self.base_url}/api/v1/searchables/{self.searchable_id}/tags")
        if response.status_code != 200:
            print("✗ Failed to get searchable tags")
            return False
            
        searchable_tags = response.json().get('tags', [])
        if len(searchable_tags) == 0:
            print("✗ Searchable has no tags for search testing")
            return False
        
        # Search by first tag name
        tag_name = searchable_tags[0]['name']
        response = requests.get(f"{self.base_url}/api/v1/search/searchables?tags[]={tag_name}")
        
        if response.status_code == 200:
            data = response.json()
            searchables = data.get('searchables', [])
            print(f"✓ Search returned {len(searchables)} searchables with tag '{tag_name}'")
            
            # Check if our test searchable is in results
            searchable_ids = [s['searchable_id'] for s in searchables]
            if self.searchable_id in searchable_ids:
                print(f"  ✓ Test searchable found in search results")
                return True
            else:
                print(f"  ✗ Test searchable not found in search results")
                return False
        else:
            print(f"✗ Search failed: {response.status_code}")
            return False
    
    def test_remove_user_tag(self):
        """Test removing a tag from a user"""
        print("\nTesting: Remove tag from user")
        
        headers = {"authorization": self.user_token}
        
        # Get current user tags
        response = requests.get(f"{self.base_url}/api/v1/users/{self.user_id}/tags")
        if response.status_code != 200:
            print("✗ Failed to get user tags")
            return False
            
        user_tags = response.json().get('tags', [])
        if len(user_tags) == 0:
            print("✗ User has no tags to remove")
            return False
        
        # Remove the first tag
        tag_to_remove = user_tags[0]
        response = requests.delete(
            f"{self.base_url}/api/v1/users/{self.user_id}/tags/{tag_to_remove['id']}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            remaining_tags = data.get('tags', [])
            print(f"✓ Successfully removed tag '{tag_to_remove['name']}'")
            
            # Verify tag was removed
            remaining_tag_ids = [tag['id'] for tag in remaining_tags]
            if tag_to_remove['id'] not in remaining_tag_ids:
                print(f"  ✓ Tag was removed from user")
                return True
            else:
                print(f"  ✗ Tag still exists on user")
                return False
        else:
            print(f"✗ Failed to remove tag: {response.status_code}")
            return False
    
    def test_tag_limits(self):
        """Test tag limits (max 10 for users, max 15 for searchables)"""
        print("\nTesting: Tag limits")
        
        headers = {"authorization": self.user_token}
        
        # Try to add more than 10 tags to user
        response = requests.get(f"{self.base_url}/api/v1/tags?type=user")
        available_tags = response.json().get('tags', [])
        
        if len(available_tags) >= 10:
            # Try to add 11 tags
            tag_ids = [tag['id'] for tag in available_tags[:11]]
            tag_data = {"tag_ids": tag_ids}
            
            response = requests.post(
                f"{self.base_url}/api/v1/users/{self.user_id}/tags",
                json=tag_data,
                headers=headers
            )
            
            if response.status_code == 400:
                print("✓ Correctly rejected adding more than 10 tags to user")
                return True
            else:
                print(f"✗ Should have rejected >10 tags, got: {response.status_code}")
                return False
        else:
            print("  - Not enough tags available to test limit")
            return True
    
    def run_all_tests(self):
        """Run all comprehensive tag tests"""
        if not self.setup():
            print("✗ Test setup failed")
            return 0, 1
        
        tests = [
            self.test_add_user_tags,
            self.test_get_user_tags,
            self.test_add_searchable_tags,
            self.test_search_by_user_tags,
            self.test_search_by_searchable_tags,
            self.test_remove_user_tag,
            self.test_tag_limits
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"✗ Test failed with exception: {str(e)}")
        
        return passed, total

def main():
    """Run comprehensive tag tests"""
    print("=" * 60)
    print("COMPREHENSIVE TAG SYSTEM INTEGRATION TESTS")
    print(f"Base URL: {BASE_URL}")
    print("=" * 60)
    
    suite = TagTestSuite()
    passed, total = suite.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All comprehensive tag tests passed!")
        return 0
    else:
        print("❌ Some tests failed. Check implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())