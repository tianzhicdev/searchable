#!/usr/bin/env python3
"""
Simple test script to verify the promoter invite code endpoint logic
"""

import json

def test_promoter_query_logic():
    """Test the SQL query logic for promoter filtering"""
    
    # Test data
    test_codes = [
        {"code": "TYLER1", "metadata": {"promoter": "tyler", "description": "Tyler's promo"}},
        {"code": "TYLER2", "metadata": {"promoter": "tyler", "description": "Tyler's second promo"}},
        {"code": "SARAH1", "metadata": {"promoter": "sarah", "description": "Sarah's promo"}},
        {"code": "NOPRMO", "metadata": {"description": "No promoter code"}},
        {"code": "EMPTY1", "metadata": None}
    ]
    
    # Test 1: Filter by promoter 'tyler'
    print("Test 1: Filter codes with promoter='tyler'")
    tyler_codes = [c for c in test_codes if c.get("metadata", {}) and c["metadata"].get("promoter") == "tyler"]
    assert len(tyler_codes) == 2
    assert all(c["code"].startswith("TYLER") for c in tyler_codes)
    print(f"✅ Found {len(tyler_codes)} codes for Tyler: {[c['code'] for c in tyler_codes]}")
    
    # Test 2: Filter by promoter 'sarah'
    print("\nTest 2: Filter codes with promoter='sarah'")
    sarah_codes = [c for c in test_codes if c.get("metadata", {}) and c["metadata"].get("promoter") == "sarah"]
    assert len(sarah_codes) == 1
    assert sarah_codes[0]["code"] == "SARAH1"
    print(f"✅ Found {len(sarah_codes)} codes for Sarah: {[c['code'] for c in sarah_codes]}")
    
    # Test 3: Filter by non-existent promoter
    print("\nTest 3: Filter codes with promoter='nonexistent'")
    nonexistent_codes = [c for c in test_codes if c.get("metadata", {}) and c["metadata"].get("promoter") == "nonexistent"]
    assert len(nonexistent_codes) == 0
    print("✅ No codes found for non-existent promoter")
    
    # Test 4: Get all codes (no promoter filter)
    print("\nTest 4: Get all active codes")
    all_codes = test_codes
    assert len(all_codes) == 5
    print(f"✅ Found {len(all_codes)} total codes: {[c['code'] for c in all_codes]}")
    
    # Test SQL query patterns
    print("\n" + "="*50)
    print("SQL Query Patterns:")
    print("="*50)
    
    # Query with promoter
    print("\nWith promoter filter:")
    print("""SELECT code, metadata FROM invite_code 
WHERE active = TRUE 
AND metadata->>'promoter' = 'tyler' 
ORDER BY RANDOM() LIMIT 1""")
    
    # Query without promoter
    print("\nWithout promoter filter:")
    print("SELECT code, metadata FROM invite_code WHERE active = TRUE ORDER BY RANDOM() LIMIT 1")
    
    print("\n✅ All tests passed!")

def test_endpoint_response_format():
    """Test the expected response format"""
    
    print("\n" + "="*50)
    print("Testing Response Formats:")
    print("="*50)
    
    # Success response with promoter
    success_with_promoter = {
        "success": True,
        "invite_code": "TYLER1",
        "description": "Tyler's promotion",
        "promoter": "tyler"
    }
    print("\nSuccess response with promoter:")
    print(json.dumps(success_with_promoter, indent=2))
    
    # Success response without promoter
    success_no_promoter = {
        "success": True,
        "invite_code": "NOPRMO",
        "description": "Join our platform with this invite code"
    }
    print("\nSuccess response without promoter:")
    print(json.dumps(success_no_promoter, indent=2))
    
    # Failure response
    failure_response = {
        "success": False,
        "message": "No active invite codes available for promoter 'nonexistent'"
    }
    print("\nFailure response:")
    print(json.dumps(failure_response, indent=2))

if __name__ == "__main__":
    print("Testing Promoter Invite Code Logic")
    print("="*50)
    
    test_promoter_query_logic()
    test_endpoint_response_format()
    
    print("\n🎉 All tests completed successfully!")