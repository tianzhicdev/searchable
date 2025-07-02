#!/bin/bash

# Test Deposit Flow Script
# This script demonstrates the full deposit flow for testing

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL=${API_URL:-"http://localhost:5005"}
USDT_SERVICE_URL=${USDT_SERVICE_URL:-"http://localhost:3100"}

echo -e "${BLUE}=== USDT Deposit Flow Test ===${NC}\n"

# Step 1: Create a test user
echo -e "${YELLOW}Step 1: Creating test user...${NC}"
USERNAME="dep$(date +%s)"
EMAIL="${USERNAME}@test.com"
PASSWORD="testpass123"

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/users/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

if ! echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo -e "${RED}Failed to register user${NC}"
    echo "$REGISTER_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ User registered: $USERNAME${NC}\n"

# Step 2: Login
echo -e "${YELLOW}Step 2: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user._id // .user.id // .id' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Failed to login${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Logged in successfully${NC}\n"

# Step 3: Check initial balance
echo -e "${YELLOW}Step 3: Checking initial balance...${NC}"
BALANCE_RESPONSE=$(curl -s -X GET "$API_URL/api/balance" \
  -H "Authorization: $TOKEN")

INITIAL_BALANCE=$(echo "$BALANCE_RESPONSE" | jq -r '.balance.usd // .usd // 0' 2>/dev/null || echo "0")
echo -e "${GREEN}Initial balance: \$${INITIAL_BALANCE} USDT${NC}\n"

# Step 4: Create a deposit
echo -e "${YELLOW}Step 4: Creating deposit request...${NC}"

DEPOSIT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/deposit/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{"amount": "0.01"}')

DEPOSIT_ID=$(echo "$DEPOSIT_RESPONSE" | jq -r '.deposit_id' 2>/dev/null)
DEPOSIT_ADDRESS=$(echo "$DEPOSIT_RESPONSE" | jq -r '.address' 2>/dev/null)
EXPIRES_AT=$(echo "$DEPOSIT_RESPONSE" | jq -r '.expires_at' 2>/dev/null)

if [ -z "$DEPOSIT_ADDRESS" ] || [ "$DEPOSIT_ADDRESS" = "null" ]; then
    echo -e "${RED}Failed to create deposit${NC}"
    echo "$DEPOSIT_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Deposit created!${NC}"
echo "  Deposit ID: $DEPOSIT_ID"
echo "  Address: $DEPOSIT_ADDRESS"
echo "  Expires: $EXPIRES_AT"
echo ""

# Step 5: Check deposit status
echo -e "${YELLOW}Step 5: Checking deposit status...${NC}"
STATUS_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/deposit/status/$DEPOSIT_ID" \
  -H "Authorization: $TOKEN")

STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null)
echo -e "${GREEN}Deposit status: $STATUS${NC}\n"

# Step 6: Send USDT to the deposit address
echo -e "${YELLOW}Step 6: Sending USDT to deposit address...${NC}"
echo -e "${BLUE}To complete the deposit, send any amount of USDT (minimum $10):${NC}"
echo ""
echo "  ./send.sh $DEPOSIT_ADDRESS 25.00"
echo ""
echo -e "${YELLOW}Or check the balance of the deposit address:${NC}"
echo ""
echo "  ./check-balance.sh $DEPOSIT_ADDRESS"
echo ""

# Step 7: List all deposits
echo -e "${YELLOW}Step 7: Listing user deposits...${NC}"
DEPOSITS_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/deposits" \
  -H "Authorization: $TOKEN")

DEPOSIT_COUNT=$(echo "$DEPOSITS_RESPONSE" | jq '.deposits | length' 2>/dev/null || echo "0")
echo -e "${GREEN}Found $DEPOSIT_COUNT deposit(s)${NC}"

if [ "$DEPOSIT_COUNT" -gt 0 ]; then
    echo -e "\nDeposit history:"
    echo "$DEPOSITS_RESPONSE" | jq -r '.deposits[] | "  - ID: \(.deposit_id) | Amount: $\(.amount) | Status: \(.status) | Created: \(.created_at)"' 2>/dev/null
fi

echo -e "\n${BLUE}=== Test Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Send USDT to the deposit address using ./send.sh"
echo "2. Wait for the background job to process (checks every 5 minutes)"
echo "3. Check updated balance with: curl -H \"Authorization: $TOKEN\" $API_URL/api/balance | jq ."
echo ""
echo "Monitor deposit status with:"
echo "curl -H \"Authorization: $TOKEN\" $API_URL/api/v1/deposit/status/$DEPOSIT_ID | jq ."