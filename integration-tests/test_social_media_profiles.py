#!/usr/bin/env python3
"""
Integration tests for social media links feature in user profiles
"""

import pytest
import requests
import json
import time
from datetime import datetime
from api_client import APIClient
from config import BASE_URL, get_logger

logger = get_logger(__name__)

class TestSocialMediaProfiles:
    """Test class for social media links in user profiles"""
    
    @classmethod
    def setup_class(cls):
        """Set up test class with API client and authentication"""
        cls.api = APIClient(BASE_URL)
        cls.username = f"social_test_user_{int(time.time())}"
        cls.email = f"{cls.username}@example.com"
        cls.password = "testpassword123"
        
        # Register test user
        logger.info(f"Registering test user: {cls.email}")
        register_response = cls.api.register_user(cls.username, cls.email, cls.password)
        assert register_response is not None, "Failed to register test user"
        
        # Login to get token
        login_response = cls.api.login(cls.email, cls.password)
        assert login_response is not None, "Failed to login test user"
        assert 'token' in login_response, "No token in login response"
        
        cls.token = login_response['token']
        cls.user_id = login_response['user']['_id']
        logger.info(f"Successfully authenticated user {cls.user_id}")

    def test_profile_creation_with_social_media(self):
        """Test creating a user profile with social media links"""
        logger.info("Testing profile creation with social media links")
        
        profile_data = {
            "username": self.username,
            "introduction": "Test user profile with social media links",
            "metadata": {
                "socialMedia": {
                    "instagram": "testuser_insta",
                    "x": "testuser_x", 
                    "youtube": "TestUserChannel"
                }
            }
        }
        
        response = self.api.update_profile(profile_data, self.token)
        assert response is not None, "Failed to create profile"
        assert response.get('message') == 'Profile updated successfully', f"Unexpected response: {response}"
        
        # Verify profile was created with social media data
        profile = response.get('profile')
        assert profile is not None, "No profile in response"
        assert 'metadata' in profile, "No metadata in profile"
        assert 'socialMedia' in profile['metadata'], "No socialMedia in metadata"
        
        social_media = profile['metadata']['socialMedia']
        assert social_media['instagram'] == 'testuser_insta', "Instagram username mismatch"
        assert social_media['x'] == 'testuser_x', "X username mismatch"
        assert social_media['youtube'] == 'TestUserChannel', "YouTube username mismatch"
        
        logger.info("✅ Profile created successfully with social media links")

    def test_profile_update_social_media(self):
        """Test updating social media links in existing profile"""
        logger.info("Testing social media links update")
        
        # First, get current profile
        current_profile = self.api.get_my_profile(self.token)
        assert current_profile is not None, "Failed to get current profile"
        
        # Update with new social media links
        updated_data = {
            "username": self.username,
            "introduction": "Updated test user profile",
            "metadata": {
                "socialMedia": {
                    "instagram": "updated_instagram",
                    "x": "updated_x",
                    "youtube": "UpdatedChannel"
                }
            }
        }
        
        response = self.api.update_profile(updated_data, self.token)
        assert response is not None, "Failed to update profile"
        
        # Verify updates
        updated_profile = response.get('profile')
        assert updated_profile is not None, "No profile in update response"
        
        social_media = updated_profile['metadata']['socialMedia']
        assert social_media['instagram'] == 'updated_instagram', "Instagram update failed"
        assert social_media['x'] == 'updated_x', "X update failed"
        assert social_media['youtube'] == 'UpdatedChannel', "YouTube update failed"
        
        logger.info("✅ Social media links updated successfully")

    def test_profile_partial_social_media_update(self):
        """Test updating only some social media links"""
        logger.info("Testing partial social media links update")
        
        # Update only Instagram and YouTube, leaving X unchanged
        partial_data = {
            "username": self.username,
            "introduction": "Partially updated profile",
            "metadata": {
                "socialMedia": {
                    "instagram": "partial_instagram",
                    "youtube": "PartialChannel"
                    # Note: X is intentionally omitted
                }
            }
        }
        
        response = self.api.update_profile(partial_data, self.token)
        assert response is not None, "Failed to update profile partially"
        
        # Verify partial update
        updated_profile = response.get('profile')
        social_media = updated_profile['metadata']['socialMedia']
        
        assert social_media['instagram'] == 'partial_instagram', "Partial Instagram update failed"
        assert social_media['youtube'] == 'PartialChannel', "Partial YouTube update failed"
        # X should not be present since we didn't include it in the update
        assert 'x' not in social_media, "X should not be present in partial update"
        
        logger.info("✅ Partial social media links update successful")

    def test_profile_remove_social_media(self):
        """Test removing social media links from profile"""
        logger.info("Testing social media links removal")
        
        # Update profile without social media data
        clean_data = {
            "username": self.username,
            "introduction": "Profile without social media",
            "metadata": {}
        }
        
        response = self.api.update_profile(clean_data, self.token)
        assert response is not None, "Failed to remove social media links"
        
        # Verify social media links are removed
        updated_profile = response.get('profile')
        metadata = updated_profile.get('metadata', {})
        
        # Social media should either be absent or empty
        social_media = metadata.get('socialMedia', {})
        assert len(social_media) == 0, f"Social media links not properly removed: {social_media}"
        
        logger.info("✅ Social media links removed successfully")

    def test_get_public_profile_with_social_media(self):
        """Test retrieving public profile that includes social media links"""
        logger.info("Testing public profile retrieval with social media")
        
        # First, add social media links back
        profile_data = {
            "username": self.username,
            "introduction": "Public profile test",
            "metadata": {
                "socialMedia": {
                    "instagram": "public_instagram",
                    "x": "public_x",
                    "youtube": "PublicChannel"
                }
            }
        }
        
        update_response = self.api.update_profile(profile_data, self.token)
        assert update_response is not None, "Failed to update profile for public test"
        
        # Now get the public profile by user ID
        public_profile = self.api.get_user_profile(self.user_id)
        assert public_profile is not None, "Failed to get public profile"
        
        profile = public_profile.get('profile')
        assert profile is not None, "No profile in public response"
        assert profile['username'] == self.username, "Username mismatch in public profile"
        
        # Verify social media links are included in public profile
        assert 'metadata' in profile, "No metadata in public profile"
        assert 'socialMedia' in profile['metadata'], "No socialMedia in public profile metadata"
        
        social_media = profile['metadata']['socialMedia']
        assert social_media['instagram'] == 'public_instagram', "Public Instagram mismatch"
        assert social_media['x'] == 'public_x', "Public X mismatch"
        assert social_media['youtube'] == 'PublicChannel', "Public YouTube mismatch"
        
        logger.info("✅ Public profile with social media links retrieved successfully")

    def test_social_media_validation(self):
        """Test validation of social media usernames"""
        logger.info("Testing social media username validation")
        
        # Test with valid usernames (should work)
        valid_data = {
            "username": self.username,
            "introduction": "Validation test",
            "metadata": {
                "socialMedia": {
                    "instagram": "valid_username123",
                    "x": "valid.user_name",
                    "youtube": "ValidChannel"
                }
            }
        }
        
        response = self.api.update_profile(valid_data, self.token)
        assert response is not None, "Failed to update with valid social media usernames"
        
        # Verify the valid usernames were saved
        profile = response.get('profile')
        social_media = profile['metadata']['socialMedia']
        assert social_media['instagram'] == 'valid_username123', "Valid Instagram username not saved"
        assert social_media['x'] == 'valid.user_name', "Valid X username not saved"
        assert social_media['youtube'] == 'ValidChannel', "Valid YouTube username not saved"
        
        logger.info("✅ Social media username validation passed")

    def test_empty_social_media_handling(self):
        """Test handling of empty social media values"""
        logger.info("Testing empty social media values handling")
        
        # Test with empty strings (should be cleaned up)
        empty_data = {
            "username": self.username,
            "introduction": "Empty values test",
            "metadata": {
                "socialMedia": {
                    "instagram": "",
                    "x": "  ",  # Whitespace only
                    "youtube": "ValidChannel"
                }
            }
        }
        
        response = self.api.update_profile(empty_data, self.token)
        assert response is not None, "Failed to update with empty social media values"
        
        # Empty/whitespace values should be filtered out
        profile = response.get('profile')
        social_media = profile['metadata'].get('socialMedia', {})
        
        # Only YouTube should be present since it has a valid value
        assert 'instagram' not in social_media or social_media.get('instagram') == '', "Empty Instagram not filtered"
        assert 'x' not in social_media or social_media.get('x') == '', "Whitespace X not filtered"
        assert social_media.get('youtube') == 'ValidChannel', "Valid YouTube channel missing"
        
        logger.info("✅ Empty social media values handled correctly")

    @classmethod
    def teardown_class(cls):
        """Clean up after tests"""
        logger.info(f"Cleaning up test user: {cls.email}")
        
        # Note: In a real implementation, you might want to add a cleanup endpoint
        # or mark the test user for deletion. For now, we'll just log the cleanup.
        logger.info("Test cleanup completed")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])