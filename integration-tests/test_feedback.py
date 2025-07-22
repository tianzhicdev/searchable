#!/usr/bin/env python3
"""
Integration tests for feedback functionality
Tests the complete feedback submission flow from UI to database
"""

import os
import sys
import time
import json
import requests
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared_test_utils import (
    login_user, 
    create_test_user,
    cleanup_test_user,
    get_db_connection,
    check_api_health,
    API_BASE_URL,
    TEST_USER_EMAIL,
    TEST_USER_PASSWORD
)

def test_feedback_submission():
    """Test successful feedback submission"""
    print("\n[TEST] Testing feedback submission...")
    
    # Login to get token
    login_response = login_user(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    assert login_response['success'], f"Login failed: {login_response}"
    
    token = login_response['data']['token']
    user_id = login_response['data']['user']['_id']
    
    # Submit feedback
    feedback_text = f"Test feedback from integration test - {datetime.utcnow().isoformat()}"
    viewport = "1920x1080"
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Referer': f'{API_BASE_URL}/test-page'
    }
    
    feedback_data = {
        'feedback': feedback_text,
        'viewport': viewport
    }
    
    response = requests.post(
        f'{API_BASE_URL}/api/v1/feedback',
        json=feedback_data,
        headers=headers
    )
    
    assert response.status_code == 201, f"Feedback submission failed: {response.text}"
    result = response.json()
    assert result['success'] == True
    assert result['message'] == 'Thank you for your feedback!'
    
    # Verify in database
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT id, user_id, feedback, metadata
            FROM feedback
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))
        
        feedback_record = cur.fetchone()
        assert feedback_record is not None, "Feedback not found in database"
        assert feedback_record['feedback'] == feedback_text
        assert feedback_record['user_id'] == user_id
        
        # Check metadata
        metadata = feedback_record['metadata']
        assert metadata['viewport'] == viewport
        assert 'timestamp' in metadata
        assert 'userAgent' in metadata
        
        print(f"✓ Feedback submitted successfully with ID: {feedback_record['id']}")
        
    finally:
        cur.close()
        conn.close()

def test_feedback_validation():
    """Test feedback validation rules"""
    print("\n[TEST] Testing feedback validation...")
    
    # Login to get token
    login_response = login_user(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    token = login_response['data']['token']
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test empty feedback
    response = requests.post(
        f'{API_BASE_URL}/api/v1/feedback',
        json={'feedback': ''},
        headers=headers
    )
    assert response.status_code == 400
    assert 'Feedback text is required' in response.json()['error']
    print("✓ Empty feedback rejected")
    
    # Test feedback that's too long
    long_feedback = 'x' * 5001
    response = requests.post(
        f'{API_BASE_URL}/api/v1/feedback',
        json={'feedback': long_feedback},
        headers=headers
    )
    assert response.status_code == 400
    assert 'too long' in response.json()['error'].lower()
    print("✓ Overly long feedback rejected")
    
    # Test whitespace-only feedback
    response = requests.post(
        f'{API_BASE_URL}/api/v1/feedback',
        json={'feedback': '   \n\t   '},
        headers=headers
    )
    assert response.status_code == 400
    print("✓ Whitespace-only feedback rejected")

def test_feedback_rate_limiting():
    """Test feedback rate limiting"""
    print("\n[TEST] Testing feedback rate limiting...")
    
    # Login to get token
    login_response = login_user(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    token = login_response['data']['token']
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Submit feedback up to the limit (10 per day)
    submitted_count = 0
    max_attempts = 15  # Try to submit more than the limit
    
    for i in range(max_attempts):
        feedback_data = {
            'feedback': f'Rate limit test feedback #{i+1} - {datetime.utcnow().isoformat()}',
            'viewport': '1920x1080'
        }
        
        response = requests.post(
            f'{API_BASE_URL}/api/v1/feedback',
            json=feedback_data,
            headers=headers
        )
        
        if response.status_code == 201:
            submitted_count += 1
        elif response.status_code == 429:
            # Rate limit hit
            assert 'Too many feedback submissions' in response.json()['error']
            print(f"✓ Rate limit enforced after {submitted_count} submissions")
            break
        else:
            assert False, f"Unexpected response: {response.status_code} - {response.text}"
    
    # Ensure we hit the rate limit
    assert submitted_count < max_attempts, "Rate limit was not enforced"

def test_feedback_authentication():
    """Test that feedback requires authentication"""
    print("\n[TEST] Testing feedback authentication requirement...")
    
    # Try to submit without authentication
    feedback_data = {
        'feedback': 'Test feedback without auth',
        'viewport': '1920x1080'
    }
    
    response = requests.post(
        f'{API_BASE_URL}/api/v1/feedback',
        json=feedback_data
    )
    
    assert response.status_code == 401
    print("✓ Unauthenticated feedback submission rejected")

def cleanup_test_feedback(user_id):
    """Clean up test feedback from database"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("DELETE FROM feedback WHERE user_id = %s", (user_id,))
        conn.commit()
    finally:
        cur.close()
        conn.close()

def main():
    """Run all feedback tests"""
    print("\n" + "="*50)
    print("FEEDBACK INTEGRATION TESTS")
    print("="*50)
    
    # Check API health
    if not check_api_health():
        print("❌ API health check failed. Exiting.")
        return 1
    
    # Create test user
    user_data = create_test_user(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    if not user_data:
        print("❌ Failed to create test user")
        return 1
    
    user_id = user_data['id']
    
    try:
        # Run tests
        test_feedback_authentication()
        test_feedback_submission()
        test_feedback_validation()
        # Note: Rate limiting test commented out to avoid interference with other tests
        # test_feedback_rate_limiting()
        
        print("\n" + "="*50)
        print("✅ ALL FEEDBACK TESTS PASSED!")
        print("="*50)
        return 0
        
    except AssertionError as e:
        print(f"\n❌ Test assertion failed: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        # Cleanup
        cleanup_test_feedback(user_id)
        cleanup_test_user(user_id)

if __name__ == "__main__":
    exit(main())