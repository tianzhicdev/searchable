#!/bin/bash

# USDT Send Script for Testing
# Usage: ./send.sh <address> <amount>

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required arguments are provided
if [ $# -ne 2 ]; then
    echo -e "${RED}Error: Invalid number of arguments${NC}"
    echo "Usage: ./send.sh <address> <amount>"
    echo "Example: ./send.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e 50.00"
    exit 1
fi

ADDRESS=$1
AMOUNT=$2

# Validate Ethereum address format
if ! [[ $ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}Error: Invalid Ethereum address format${NC}"
    echo "Address must start with '0x' followed by 40 hexadecimal characters"
    exit 1
fi

# Validate amount is a positive number
if ! [[ $AMOUNT =~ ^[0-9]+(\.[0-9]{1,2})?$ ]] || (( $(echo "$AMOUNT <= 0" | bc -l) )); then
    echo -e "${RED}Error: Invalid amount${NC}"
    echo "Amount must be a positive number with up to 2 decimal places"
    exit 1
fi

# Get USDT service URL from environment or use default
USDT_SERVICE_URL=${USDT_SERVICE_URL:-"http://localhost:3100"}

echo -e "${YELLOW}Sending USDT via test service...${NC}"
echo "To: $ADDRESS"
echo "Amount: $AMOUNT USDT"
echo "Service: $USDT_SERVICE_URL"
echo ""

# Convert amount to wei (USDT has 6 decimals)
AMOUNT_WEI=$(echo "$AMOUNT * 1000000" | bc | cut -d. -f1)

# Create request ID
REQUEST_ID="test_send_$(date +%s)"

# Send the USDT
echo -e "${YELLOW}Executing transaction...${NC}"
RESPONSE=$(curl -s -X POST "$USDT_SERVICE_URL/send" \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$ADDRESS\",
    \"amount\": $AMOUNT_WEI,
    \"request_id\": \"$REQUEST_ID\"
  }")

# Check if curl succeeded
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to connect to USDT service${NC}"
    echo "Make sure the USDT service is running at $USDT_SERVICE_URL"
    exit 1
fi

# Parse response
echo -e "\n${YELLOW}Response:${NC}"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Check if transaction was successful
if echo "$RESPONSE" | grep -q "txHash"; then
    TX_HASH=$(echo "$RESPONSE" | jq -r '.txHash' 2>/dev/null)
    STATUS=$(echo "$RESPONSE" | jq -r '.status' 2>/dev/null)
    MESSAGE=$(echo "$RESPONSE" | jq -r '.message' 2>/dev/null)
    
    if [ "$STATUS" = "complete" ]; then
        echo -e "\n${GREEN}✅ Transaction completed successfully!${NC}"
        echo "Transaction Hash: $TX_HASH"
        echo ""
        echo "You can check the transaction status with:"
        echo "curl $USDT_SERVICE_URL/tx-status/$TX_HASH | jq ."
    elif [ "$STATUS" = "pending" ]; then
        echo -e "\n${YELLOW}⏳ Transaction submitted and pending confirmation${NC}"
        echo "Transaction Hash: $TX_HASH"
        if [ "$MESSAGE" != "null" ] && [ -n "$MESSAGE" ]; then
            echo "Message: $MESSAGE"
        fi
        echo ""
        echo "This is normal - blockchain confirmations can take a few minutes."
        echo "Check status with:"
        echo "curl $USDT_SERVICE_URL/tx-status/$TX_HASH | jq ."
    else
        echo -e "\n${YELLOW}⏳ Transaction submitted${NC}"
        echo "Transaction Hash: $TX_HASH"
        echo "Status: $STATUS"
        echo ""
        echo "Check status with:"
        echo "curl $USDT_SERVICE_URL/tx-status/$TX_HASH | jq ."
    fi
    
    # Also check the balance of the address
    echo -e "\n${YELLOW}Checking recipient balance...${NC}"
    sleep 2
    BALANCE_RESPONSE=$(curl -s "$USDT_SERVICE_URL/balance/$ADDRESS")
    if [ $? -eq 0 ]; then
        echo "Balance: $(echo "$BALANCE_RESPONSE" | jq -r '.balance' 2>/dev/null || echo "Unknown") wei"
        FORMATTED=$(echo "$BALANCE_RESPONSE" | jq -r '.formatted' 2>/dev/null)
        if [ "$FORMATTED" != "null" ] && [ -n "$FORMATTED" ]; then
            echo "Formatted: $FORMATTED USDT"
        fi
    fi
else
    ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "Unknown error")
    echo -e "\n${RED}❌ Transaction failed${NC}"
    echo "Error: $ERROR"
    exit 1
fi