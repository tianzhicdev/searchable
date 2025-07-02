#!/bin/bash

# USDT Balance Check Script
# Usage: ./check-balance.sh <address>

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if address is provided
if [ $# -ne 1 ]; then
    echo -e "${RED}Error: Address required${NC}"
    echo "Usage: ./check-balance.sh <address>"
    echo "Example: ./check-balance.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e"
    exit 1
fi

ADDRESS=$1

# Validate Ethereum address format
if ! [[ $ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}Error: Invalid Ethereum address format${NC}"
    echo "Address must start with '0x' followed by 40 hexadecimal characters"
    exit 1
fi

# Get USDT service URL from environment or use default
USDT_SERVICE_URL=${USDT_SERVICE_URL:-"http://localhost:3100"}

echo -e "${YELLOW}Checking USDT balance...${NC}"
echo "Address: $ADDRESS"
echo "Service: $USDT_SERVICE_URL"
echo ""

# Check balance
RESPONSE=$(curl -s "$USDT_SERVICE_URL/balance/$ADDRESS")

# Check if curl succeeded
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to connect to USDT service${NC}"
    echo "Make sure the USDT service is running at $USDT_SERVICE_URL"
    exit 1
fi

# Parse and display response
BALANCE=$(echo "$RESPONSE" | jq -r '.balance' 2>/dev/null)
FORMATTED=$(echo "$RESPONSE" | jq -r '.formatted' 2>/dev/null)

if [ "$BALANCE" != "null" ] && [ -n "$BALANCE" ]; then
    echo -e "${GREEN}Balance Information:${NC}"
    echo "Raw balance: $BALANCE wei"
    
    if [ "$FORMATTED" != "null" ] && [ -n "$FORMATTED" ]; then
        echo "Formatted: $FORMATTED USDT"
    else
        # Calculate USDT amount (6 decimals)
        USDT_AMOUNT=$(echo "scale=6; $BALANCE / 1000000" | bc)
        echo "Calculated: $USDT_AMOUNT USDT"
    fi
    
    # Check recent transactions
    echo -e "\n${YELLOW}Checking recent transactions...${NC}"
    TX_RESPONSE=$(curl -s "$USDT_SERVICE_URL/transactions/$ADDRESS" 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$TX_RESPONSE" | jq -e '.transactions' >/dev/null 2>&1; then
        TX_COUNT=$(echo "$TX_RESPONSE" | jq '.transactions | length')
        echo "Found $TX_COUNT transaction(s)"
        
        if [ "$TX_COUNT" -gt 0 ]; then
            echo -e "\nRecent transactions:"
            echo "$TX_RESPONSE" | jq -r '.transactions[] | "  - \(.hash) | \(.from) → \(.to) | \(.value) wei"' 2>/dev/null
        fi
    else
        echo "Unable to fetch transaction history"
    fi
else
    echo -e "${RED}Error: Unable to fetch balance${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi