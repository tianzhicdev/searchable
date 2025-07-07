#!/bin/bash

# AI Content Integration Test Script
# Tests the AI content management functionality

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost:5005}"
AUTH_TOKEN=""

echo -e "${YELLOW}AI Content Manager Integration Tests${NC}"
echo "Base URL: $BASE_URL"
echo ""

# Function to make authenticated requests
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$AUTH_TOKEN" ]; then
        if [ "$method" = "GET" ]; then
            curl -s -X GET "${BASE_URL}${endpoint}" \
                -H "authorization: $AUTH_TOKEN" \
                -H "Content-Type: application/json"
        elif [ "$method" = "POST" ]; then
            curl -s -X POST "${BASE_URL}${endpoint}" \
                -H "authorization: $AUTH_TOKEN" \
                -H "Content-Type: application/json" \
                -d "$data"
        elif [ "$method" = "PUT" ]; then
            curl -s -X PUT "${BASE_URL}${endpoint}" \
                -H "authorization: $AUTH_TOKEN" \
                -H "Content-Type: application/json" \
                -d "$data"
        fi
    else
        curl -s -X $method "${BASE_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            ${data:+-d "$data"}
    fi
}

# Test 0: Register test user
echo -e "${YELLOW}Test 0: Register Test User${NC}"
REGISTER_DATA='{"username":"testuser1","email":"test1@example.com","password":"Test123!"}'
REGISTER_RESPONSE=$(api_call POST "/api/users/register" "$REGISTER_DATA")

if echo "$REGISTER_RESPONSE" | jq -e '.success' > /dev/null 2>&1 || echo "$REGISTER_RESPONSE" | grep -q "already exists"; then
    echo -e "${GREEN}✓ User ready${NC}"
else
    echo -e "${RED}✗ Registration failed${NC}"
    echo "$REGISTER_RESPONSE"
fi

# Test 1: Login to get auth token
echo -e "\n${YELLOW}Test 1: User Authentication${NC}"
LOGIN_RESPONSE=$(api_call POST "/api/users/login" '{"email":"test1@example.com","password":"Test123!"}')

if echo "$LOGIN_RESPONSE" | jq -e '.token' > /dev/null; then
    AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
    echo -e "${GREEN}✓ Login successful${NC}"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

# Test 2: Create AI Content
echo -e "\n${YELLOW}Test 2: Create AI Content${NC}"
CREATE_DATA='{
    "title": "Test AI Content",
    "instructions": "Please process these test files",
    "files": [
        {
            "fileId": "test-file-1",
            "fileName": "test_document.pdf",
            "fileSize": 1024000,
            "mimeType": "application/pdf"
        }
    ]
}'

CREATE_RESPONSE=$(api_call POST "/api/v1/ai-content" "$CREATE_DATA")

if echo "$CREATE_RESPONSE" | jq -e '.success' > /dev/null; then
    AI_CONTENT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
    echo -e "${GREEN}✓ AI Content created with ID: $AI_CONTENT_ID${NC}"
else
    echo -e "${RED}✗ Failed to create AI content${NC}"
    echo "$CREATE_RESPONSE"
fi

# Test 3: Get User's AI Contents
echo -e "\n${YELLOW}Test 3: Get User's AI Contents${NC}"
LIST_RESPONSE=$(api_call GET "/api/v1/ai-content")

if echo "$LIST_RESPONSE" | jq -e '.success' > /dev/null; then
    COUNT=$(echo "$LIST_RESPONSE" | jq -r '.data.total')
    echo -e "${GREEN}✓ Retrieved $COUNT AI content items${NC}"
    echo "$LIST_RESPONSE" | jq '.data.ai_contents[] | {id, title, status, file_count}'
else
    echo -e "${RED}✗ Failed to retrieve AI contents${NC}"
    echo "$LIST_RESPONSE"
fi

# Test 4: Get Specific AI Content
if [ -n "$AI_CONTENT_ID" ]; then
    echo -e "\n${YELLOW}Test 4: Get Specific AI Content${NC}"
    GET_RESPONSE=$(api_call GET "/api/v1/ai-content/$AI_CONTENT_ID")
    
    if echo "$GET_RESPONSE" | jq -e '.success' > /dev/null; then
        echo -e "${GREEN}✓ Retrieved AI content details${NC}"
        echo "$GET_RESPONSE" | jq '.data | {id, title, status, instructions}'
    else
        echo -e "${RED}✗ Failed to retrieve AI content${NC}"
        echo "$GET_RESPONSE"
    fi
fi

# Test 5: Employee Endpoints (No Auth)
echo -e "\n${YELLOW}Test 5: Employee Endpoints${NC}"

# Clear auth token for employee endpoints
AUTH_TOKEN=""

# Get all AI contents
echo "Getting all AI contents (employee view)..."
EMPLOYEE_LIST=$(api_call GET "/api/v1/employee/ai-content")

if echo "$EMPLOYEE_LIST" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ Employee can view all AI contents${NC}"
    echo "$EMPLOYEE_LIST" | jq '.data.ai_contents[] | {id, user_id, title, status}'
else
    echo -e "${RED}✗ Failed to get employee view${NC}"
    echo "$EMPLOYEE_LIST"
fi

# Update status
if [ -n "$AI_CONTENT_ID" ]; then
    echo -e "\nUpdating AI content status..."
    UPDATE_DATA='{
        "status": "processed",
        "notes": "Test processing completed",
        "processed_by": "test-employee"
    }'
    
    UPDATE_RESPONSE=$(api_call PUT "/api/v1/employee/ai-content/$AI_CONTENT_ID" "$UPDATE_DATA")
    
    if echo "$UPDATE_RESPONSE" | jq -e '.success' > /dev/null; then
        echo -e "${GREEN}✓ Status updated successfully${NC}"
    else
        echo -e "${RED}✗ Failed to update status${NC}"
        echo "$UPDATE_RESPONSE"
    fi
fi

# Test 6: Export Endpoint
echo -e "\n${YELLOW}Test 6: Export Endpoint${NC}"
EXPORT_RESPONSE=$(api_call GET "/api/v1/employee/ai-content/export?status=submitted")

if echo "$EXPORT_RESPONSE" | jq -e '.success' > /dev/null; then
    EXPORT_COUNT=$(echo "$EXPORT_RESPONSE" | jq -r '.data.total')
    echo -e "${GREEN}✓ Export endpoint returned $EXPORT_COUNT items${NC}"
else
    echo -e "${RED}✗ Export endpoint failed${NC}"
    echo "$EXPORT_RESPONSE"
fi

echo -e "\n${GREEN}AI Content Integration Tests Complete!${NC}"