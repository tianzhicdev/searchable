#!/usr/bin/env python3
"""Integration tests for user search returning full profile data with all fields"""

import pytest
import uuid
import time
from api_client import APIClient
from config import TEST_USER_PREFIX, TEST_EMAIL_DOMAIN, DEFAULT_PASSWORD

def generate_test_username():
    """Generate a unique test username"""
    return f"{TEST_USER_PREFIX}{uuid.uuid4().hex[:8]}"

def test_user_search_returns_complete_profile_data():
    """Test that user search returns complete user profile data including all fields"""
    
    client = APIClient()
    
    # Create and login as a test user
    username = generate_test_username()
    email = f"{username}@{TEST_EMAIL_DOMAIN}"
    
    # Register user
    user_data = client.register_user(username, email, DEFAULT_PASSWORD)
    user_id = user_data["userID"]
    
    # Login
    auth_data = client.login(email, DEFAULT_PASSWORD)
    client.set_auth_token(auth_data["token"])
    
    # Update user profile with complete data
    profile_data = {
        "introduction": "Full stack developer with expertise in Python and JavaScript",
        "profile_image_url": "https://example.com/profile-pic.jpg",
        "metadata": {
            "display_name": f"Professional {username}",
            "social_links": {
                "github": "https://github.com/example",
                "linkedin": "https://linkedin.com/in/example"
            }
        }
    }
    
    profile_response = client.update_user_profile(profile_data)
    assert 'profile' in profile_response
    
    # Create a searchable so the user appears in search results
    searchable_data = {
        "payloads": {
            "public": {
                "title": "Professional Services",
                "description": "High quality development services",
                "type": "direct",
                "price": 150.00,
                "category": "services"
            }
        }
    }
    
    searchable_response = client.create_searchable(searchable_data)
    assert 'searchable_id' in searchable_response
    
    # Search for the user by username
    response = client.search_users(username=username)
    
    assert response["success"] is True
    assert len(response["users"]) > 0
    
    # Find our test user
    test_user = None
    for user in response["users"]:
        if user["id"] == user_id:
            test_user = user
            break
    
    assert test_user is not None, f"User {user_id} not found in search results"
    
    # Verify all profile fields are returned
    assert test_user["id"] == user_id
    assert test_user["username"] == username
    assert test_user["displayName"] == profile_data["metadata"]["display_name"]
    assert test_user["introduction"] == profile_data["introduction"]
    assert test_user["profile_image_url"] == profile_data["profile_image_url"]
    assert "rating" in test_user
    assert test_user["rating"] == 0.0  # New user has no ratings
    assert "totalRatings" in test_user
    assert test_user["totalRatings"] == 0
    assert "searchableCount" in test_user
    assert test_user["searchableCount"] >= 1
    assert "tags" in test_user
    assert isinstance(test_user["tags"], list)


def test_user_search_partial_username_match():
    """Test that user search works with partial username matching"""
    
    client = APIClient()
    
    # Create user with specific username pattern
    base_name = f"searchtest_{uuid.uuid4().hex[:6]}"
    username = f"{base_name}_full"
    email = f"{username}@{TEST_EMAIL_DOMAIN}"
    
    # Register and login
    user_data = client.register_user(username, email, DEFAULT_PASSWORD)
    user_id = user_data["userID"]
    auth_data = client.login(email, DEFAULT_PASSWORD)
    client.set_auth_token(auth_data["token"])
    
    # Create searchable
    searchable_data = {
        "payloads": {
            "public": {
                "title": "Test Item",
                "description": "For search testing",
                "type": "offline",
                "price": 50.00
            }
        }
    }
    
    client.create_searchable(searchable_data)
    
    # Search with partial username
    response = client.search_users(username=base_name)
    
    assert response["success"] is True
    assert len(response["users"]) > 0
    
    # Verify our user is in results
    found = False
    for user in response["users"]:
        if user["id"] == user_id:
            found = True
            assert base_name in user["username"]
            break
    
    assert found, f"User with partial username '{base_name}' not found"


def test_user_search_without_profile_data():
    """Test that user search handles users without profile data gracefully"""
    
    client = APIClient()
    
    # Create user without updating profile
    username = generate_test_username()
    email = f"{username}@{TEST_EMAIL_DOMAIN}"
    
    # Register and login
    user_data = client.register_user(username, email, DEFAULT_PASSWORD)
    user_id = user_data["userID"]
    auth_data = client.login(email, DEFAULT_PASSWORD)
    client.set_auth_token(auth_data["token"])
    
    # Create a searchable (required for search visibility)
    searchable_data = {
        "payloads": {
            "public": {
                "title": "Basic Item",
                "description": "User with no profile",
                "type": "downloadable",
                "price": 25.00,
                "downloadableFiles": [{
                    "id": 1,
                    "fileId": 1,
                    "name": "file.pdf",
                    "price": 25.00
                }]
            }
        }
    }
    
    client.create_searchable(searchable_data)
    
    # Search for user
    response = client.search_users(username=username)
    
    assert response["success"] is True
    users = response["users"]
    
    # Find test user
    test_user = None
    for user in users:
        if user["id"] == user_id:
            test_user = user
            break
    
    assert test_user is not None
    
    # Verify fields exist but may be null/default
    assert test_user["username"] == username
    assert test_user["displayName"] is None or test_user["displayName"] == ""
    assert test_user["introduction"] is None or test_user["introduction"] == ""
    assert test_user["profile_image_url"] is None or test_user["profile_image_url"] == ""
    assert test_user["rating"] == 0.0
    assert test_user["totalRatings"] == 0
    assert test_user["searchableCount"] >= 1


def test_user_search_pagination():
    """Test that user search pagination works correctly"""
    
    client = APIClient()
    
    # Search with pagination parameters
    response = client.search_users(username="", page=1, limit=5)
    
    assert response["success"] is True
    assert "users" in response
    assert "pagination" in response
    
    pagination = response["pagination"]
    assert pagination["page"] == 1
    assert pagination["limit"] == 5
    assert "total" in pagination
    assert "pages" in pagination
    
    # Verify limit is respected
    if pagination["total"] > 5:
        assert len(response["users"]) == 5
    else:
        assert len(response["users"]) == pagination["total"]


def test_user_search_empty_results():
    """Test that user search handles empty results properly"""
    
    client = APIClient()
    
    # Search for non-existent username
    non_existent = f"nonexistent_{uuid.uuid4().hex}"
    response = client.search_users(username=non_existent)
    
    assert response["success"] is True
    assert response["users"] == []
    assert response["pagination"]["total"] == 0
    assert response["pagination"]["pages"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])