"""
Test Configuration Module
Provides shared configuration and utilities for integration tests
"""

import uuid
import time
from datetime import datetime

class TestConfig:
    """Central configuration for integration tests"""
    
    def __init__(self):
        # Generate a unique test session identifier
        self.test_session_id = f"test_session_{int(time.time())}_{str(uuid.uuid4())[:8]}"
        self.test_timestamp = datetime.utcnow().isoformat()
        
    def get_test_metadata(self):
        """Get metadata to inject into all test records"""
        return {
            "test_session_id": self.test_session_id,
            "test_timestamp": self.test_timestamp,
            "test_marker": "integration_test_data"
        }
    
    def get_searchable_metadata(self):
        """Get metadata specifically for searchable records"""
        base_metadata = self.get_test_metadata()
        base_metadata.update({
            "created_by_test": True,
            "test_data_type": "searchable"
        })
        return base_metadata
    
    def get_user_metadata(self):
        """Get metadata for user records"""
        base_metadata = self.get_test_metadata()
        base_metadata.update({
            "created_by_test": True,
            "test_data_type": "user"
        })
        return base_metadata

# Global test configuration instance
test_config = TestConfig()

# Export commonly used functions
def get_test_session_id():
    """Get the current test session ID"""
    return test_config.test_session_id

def get_test_metadata():
    """Get test metadata for injection into records"""
    return test_config.get_test_metadata()

def get_searchable_test_metadata():
    """Get searchable-specific test metadata"""
    return test_config.get_searchable_metadata()

def get_user_test_metadata():
    """Get user-specific test metadata"""
    return test_config.get_user_metadata()

print(f"[TEST CONFIG] Initialized test session: {test_config.test_session_id}")