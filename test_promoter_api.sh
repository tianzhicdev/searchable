#!/bin/bash
# Test script for the promoter invite code API

echo "Testing Promoter Invite Code API"
echo "================================"

# Base URL - adjust as needed
BASE_URL="http://localhost:5005/api"

echo -e "\n1. Test /invite without promoter parameter:"
curl -s "$BASE_URL/invite" | jq '.'

echo -e "\n2. Test /invite with promoter=tyler:"
curl -s "$BASE_URL/invite?promoter=tyler" | jq '.'

echo -e "\n3. Test /invite with promoter=sarah:"
curl -s "$BASE_URL/invite?promoter=sarah" | jq '.'

echo -e "\n4. Test /invite with non-existent promoter:"
curl -s "$BASE_URL/invite?promoter=nonexistent" | jq '.'

echo -e "\n5. Test original endpoint still works:"
curl -s "$BASE_URL/api/v1/get-active-invite-code" | jq '.'

echo -e "\nDone!"