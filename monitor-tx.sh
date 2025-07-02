#!/bin/bash

# Transaction Monitoring Script
# Usage: ./monitor-tx.sh <txHash> [interval]

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if tx hash is provided
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Transaction hash required${NC}"
    echo "Usage: ./monitor-tx.sh <txHash> [interval_seconds]"
    echo "Example: ./monitor-tx.sh 0xabc123... 5"
    exit 1
fi

TX_HASH=$1
INTERVAL=${2:-10}  # Default 10 seconds

# Validate transaction hash format
if ! [[ $TX_HASH =~ ^0x[a-fA-F0-9]{64}$ ]]; then
    echo -e "${RED}Error: Invalid transaction hash format${NC}"
    echo "Transaction hash must start with '0x' followed by 64 hexadecimal characters"
    exit 1
fi

# Get USDT service URL from environment or use default
USDT_SERVICE_URL=${USDT_SERVICE_URL:-"http://localhost:3100"}

echo -e "${BLUE}=== Transaction Monitor ===${NC}"
echo "Transaction: $TX_HASH"
echo "Service: $USDT_SERVICE_URL"
echo "Check interval: ${INTERVAL}s"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Counter for attempts
ATTEMPT=0
LAST_STATUS=""

while true; do
    ATTEMPT=$((ATTEMPT + 1))
    
    # Get transaction status
    RESPONSE=$(curl -s "$USDT_SERVICE_URL/tx-status/$TX_HASH" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}[Attempt $ATTEMPT] Failed to connect to USDT service${NC}"
    else
        STATUS=$(echo "$RESPONSE" | jq -r '.status' 2>/dev/null)
        BLOCK_NUMBER=$(echo "$RESPONSE" | jq -r '.blockNumber' 2>/dev/null)
        CONFIRMATIONS=$(echo "$RESPONSE" | jq -r '.confirmations' 2>/dev/null)
        
        # Only print if status changed or first attempt
        if [ "$STATUS" != "$LAST_STATUS" ] || [ $ATTEMPT -eq 1 ]; then
            TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
            
            case "$STATUS" in
                "complete")
                    echo -e "${GREEN}[$TIMESTAMP] ✅ Transaction CONFIRMED${NC}"
                    echo "  Block: $BLOCK_NUMBER"
                    if [ "$CONFIRMATIONS" != "null" ] && [ -n "$CONFIRMATIONS" ]; then
                        echo "  Confirmations: $CONFIRMATIONS"
                    fi
                    echo ""
                    echo "Transaction successfully mined!"
                    exit 0
                    ;;
                "failed")
                    echo -e "${RED}[$TIMESTAMP] ❌ Transaction FAILED${NC}"
                    echo "  The transaction was reverted or failed"
                    echo ""
                    exit 1
                    ;;
                "pending")
                    echo -e "${YELLOW}[$TIMESTAMP] ⏳ Transaction PENDING${NC}"
                    echo "  Waiting for blockchain confirmation..."
                    ;;
                "not_found")
                    echo -e "${YELLOW}[$TIMESTAMP] 🔍 Transaction NOT FOUND${NC}"
                    echo "  Transaction may still be in mempool"
                    ;;
                *)
                    echo -e "[$TIMESTAMP] Status: $STATUS"
                    ;;
            esac
            
            LAST_STATUS="$STATUS"
        else
            # Show a simple progress indicator
            printf "."
        fi
    fi
    
    # Wait before next check
    sleep $INTERVAL
done