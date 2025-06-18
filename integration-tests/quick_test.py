#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(__file__))

import requests
from config import BASE_URL

def test_backend_connectivity():
    """Test if backend is accessible"""
    try:
        response = requests.get(f'{BASE_URL}/api/health', timeout=5)
        print(f"Backend health check: {response.status_code}")
        if response.status_code == 200:
            print("✓ Backend is running and accessible")
            return True
        else:
            print(f"✗ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Backend not accessible: {e}")
        return False

def test_rating_api_existence():
    """Test if rating APIs exist (should return auth error, not 404)"""
    try:
        # Test rating eligibility endpoint
        response = requests.get(f'{BASE_URL}/api/v1/rating/can-rate/test-invoice-id', timeout=5)
        print(f"Rating eligibility API: {response.status_code}")
        if response.status_code == 404:
            print("✗ Rating eligibility API not found (404)")
        elif response.status_code == 401:
            print("✓ Rating eligibility API exists (401 - needs auth)")
        else:
            print(f"✓ Rating eligibility API responded: {response.status_code}")
            
        # Test rating submission endpoint
        response = requests.post(f'{BASE_URL}/api/v1/rating/submit', 
                               json={'test': 'data'}, timeout=5)
        print(f"Rating submission API: {response.status_code}")
        if response.status_code == 404:
            print("✗ Rating submission API not found (404)")
        elif response.status_code == 401:
            print("✓ Rating submission API exists (401 - needs auth)")
        else:
            print(f"✓ Rating submission API responded: {response.status_code}")
            
    except Exception as e:
        print(f"✗ Error testing rating APIs: {e}")

if __name__ == "__main__":
    print("=== Quick Backend Test ===")
    print(f"Testing backend at: {BASE_URL}")
    
    if test_backend_connectivity():
        test_rating_api_existence()
    else:
        print("Backend not accessible - cannot test rating APIs")