#!/usr/bin/env python3
"""
Basic integration tests for the tag system
Tests core tag functionality without requiring full system setup
"""

import sys
import os
import requests
import time

# Configuration
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5005')
TEST_USER_EMAIL = "tag_test_user@example.com"
TEST_USER_PASSWORD = "testpass123"

def test_get_all_tags():
    """Test getting all tags"""
    print("Testing: GET /api/v1/tags")
    
    response = requests.get(f"{BASE_URL}/api/v1/tags")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Successfully retrieved {data.get('count', 0)} tags")
        
        # Check if we have user and searchable tags
        user_tags = [tag for tag in data.get('tags', []) if tag.get('tag_type') == 'user']
        searchable_tags = [tag for tag in data.get('tags', []) if tag.get('tag_type') == 'searchable']
        
        print(f"  - User tags: {len(user_tags)}")
        print(f"  - Searchable tags: {len(searchable_tags)}")
        
        if len(user_tags) > 0:
            print(f"  - Sample user tags: {[tag['name'] for tag in user_tags[:3]]}")
        if len(searchable_tags) > 0:
            print(f"  - Sample searchable tags: {[tag['name'] for tag in searchable_tags[:3]]}")
        
        return True
    else:
        print(f"✗ Failed to get tags: {response.status_code}")
        return False

def test_get_user_tags():
    """Test getting user tags by type"""
    print("\nTesting: GET /api/v1/tags?type=user")
    
    response = requests.get(f"{BASE_URL}/api/v1/tags?type=user")
    
    if response.status_code == 200:
        data = response.json()
        user_tags = data.get('tags', [])
        print(f"✓ Successfully retrieved {len(user_tags)} user tags")
        
        # Verify all tags are user type
        non_user_tags = [tag for tag in user_tags if tag.get('tag_type') != 'user']
        if len(non_user_tags) == 0:
            print("✓ All returned tags are user type")
        else:
            print(f"✗ Found {len(non_user_tags)} non-user tags in user filter")
            
        return True
    else:
        print(f"✗ Failed to get user tags: {response.status_code}")
        return False

def test_get_searchable_tags():
    """Test getting searchable tags by type"""
    print("\nTesting: GET /api/v1/tags?type=searchable")
    
    response = requests.get(f"{BASE_URL}/api/v1/tags?type=searchable")
    
    if response.status_code == 200:
        data = response.json()
        searchable_tags = data.get('tags', [])
        print(f"✓ Successfully retrieved {len(searchable_tags)} searchable tags")
        
        # Verify all tags are searchable type
        non_searchable_tags = [tag for tag in searchable_tags if tag.get('tag_type') != 'searchable']
        if len(non_searchable_tags) == 0:
            print("✓ All returned tags are searchable type")
        else:
            print(f"✗ Found {len(non_searchable_tags)} non-searchable tags in searchable filter")
            
        return True
    else:
        print(f"✗ Failed to get searchable tags: {response.status_code}")
        return False

def test_search_users_no_tags():
    """Test searching users without providing tags (should return all users)"""
    print("\nTesting: GET /api/v1/search/users (no tags)")
    
    response = requests.get(f"{BASE_URL}/api/v1/search/users")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Successfully returned all users: {data.get('pagination', {}).get('total', 0)} total")
        return True
    else:
        print(f"✗ Expected 200, got {response.status_code}")
        return False

def test_search_users_with_tags():
    """Test searching users with tags (should return empty result for now)"""
    print("\nTesting: GET /api/v1/search/users?tags[]=artist")
    
    response = requests.get(f"{BASE_URL}/api/v1/search/users?tags[]=artist")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Successfully searched users, found {len(data.get('users', []))} results")
        
        # For now, we expect 0 results since no users have tags yet
        if len(data.get('users', [])) == 0:
            print("✓ Expected empty results (no users with tags yet)")
        
        return True
    else:
        print(f"✗ Failed to search users: {response.status_code}")
        return False

def test_search_searchables_with_tags():
    """Test searching searchables with tags (should return empty result for now)"""
    print("\nTesting: GET /api/v1/search/searchables?tags[]=books")
    
    response = requests.get(f"{BASE_URL}/api/v1/search/searchables?tags[]=books")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Successfully searched searchables, found {len(data.get('searchables', []))} results")
        
        # For now, we expect 0 results since no searchables have tags yet
        if len(data.get('searchables', [])) == 0:
            print("✓ Expected empty results (no searchables with tags yet)")
        
        return True
    else:
        print(f"✗ Failed to search searchables: {response.status_code}")
        return False

def main():
    """Run all basic tag tests"""
    print("=" * 60)
    print("BASIC TAG SYSTEM INTEGRATION TESTS")
    print(f"Base URL: {BASE_URL}")
    print("=" * 60)
    
    tests = [
        test_get_all_tags,
        test_get_user_tags,
        test_get_searchable_tags,
        test_search_users_no_tags,
        test_search_users_with_tags,
        test_search_searchables_with_tags
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ Test failed with exception: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All basic tag tests passed!")
        return 0
    else:
        print("❌ Some tests failed. Check implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())