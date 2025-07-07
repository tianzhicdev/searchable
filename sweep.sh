#!/bin/bash

# USDT Sweep Script with Auto Gas Funding
# Collects all USDT from deposit addresses and sends to a specified address
# Automatically funds addresses that need gas before sweeping
# Usage: ./sweep.sh <destination_address> [--dry-run]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
USDT_SERVICE_URL=${USDT_SERVICE_URL:-"http://localhost:3100"}
DB_CONTAINER=${DB_CONTAINER:-"searchable-db-1"}
MIN_BALANCE_WEI=${MIN_BALANCE_WEI:-1000000} # 1 USDT minimum
GAS_FUNDING_AMOUNT=${GAS_FUNDING_AMOUNT:-2000000000000000} # 0.002 ETH default

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Missing destination address${NC}"
    echo "Usage: ./sweep.sh <destination_address> [--dry-run]"
    echo "Example: ./sweep.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e"
    echo "         ./sweep.sh 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e --dry-run"
    exit 1
fi

DESTINATION=$1
DRY_RUN=false

# Check for dry-run flag
if [ "$2" = "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${BLUE}🔍 Running in DRY RUN mode - no transactions will be executed${NC}"
fi

# Validate Ethereum address format
if ! [[ $DESTINATION =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}Error: Invalid Ethereum address format${NC}"
    echo "Address must start with '0x' followed by 40 hexadecimal characters"
    exit 1
fi

echo -e "${BLUE}🧹 USDT Sweep Tool with Auto Gas Funding${NC}"
echo "Destination: $DESTINATION"
echo "USDT Service: $USDT_SERVICE_URL"
echo "Database: $DB_CONTAINER"
GAS_ETH=$(echo "scale=6; $GAS_FUNDING_AMOUNT / 1000000000000000000" | bc 2>/dev/null || echo "0.002")
echo "Gas funding amount: $GAS_ETH ETH"
echo ""

# Function to query database
query_db() {
    docker exec -i $DB_CONTAINER psql -U searchable -d searchable -t -c "$1"
}

# Function to check USDT balance
check_usdt_balance() {
    local address=$1
    local response=$(curl -s "$USDT_SERVICE_URL/balance/$address")
    
    if [ $? -ne 0 ]; then
        echo "0"
        return
    fi
    
    echo "$response" | jq -r '.balance // "0"' 2>/dev/null || echo "0"
}

# Function to check ETH balance
check_eth_balance() {
    local address=$1
    local response=$(curl -s "$USDT_SERVICE_URL/eth-balance/$address")
    
    if [ $? -ne 0 ]; then
        echo "0"
        return
    fi
    
    echo "$response" | jq -r '.balance // "0"' 2>/dev/null || echo "0"
}

# Function to fund address with ETH for gas
fund_address() {
    local address=$1
    local amount=$2
    
    local eth_amount=$(echo "scale=6; $amount / 1000000000000000000" | bc 2>/dev/null || echo "0.002")
    echo -e "${PURPLE}  Funding $address with $eth_amount ETH for gas${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${BLUE}  [DRY RUN] Would fund with $amount wei${NC}"
        return 0
    fi
    
    local response=$(curl -s -X POST "$USDT_SERVICE_URL/fund-gas" \
        -H "Content-Type: application/json" \
        -d "{
            \"to\": \"$address\",
            \"amount\": \"$amount\"
        }")
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}  Failed to fund address${NC}"
        return 1
    fi
    
    local success=$(echo "$response" | jq -r '.success // false' 2>/dev/null)
    local tx_hash=$(echo "$response" | jq -r '.txHash // ""' 2>/dev/null)
    
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}  ✅ Gas funding successful! TxHash: $tx_hash${NC}"
        # Wait a bit for the transaction to be processed
        sleep 5
        return 0
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"' 2>/dev/null)
        echo -e "${RED}  ❌ Gas funding failed: $error${NC}"
        return 1
    fi
}

# Function to generate deposit address
generate_address() {
    local deposit_id=$1
    local response=$(curl -s -X POST "$USDT_SERVICE_URL/receive" \
        -H "Content-Type: application/json" \
        -d "{\"deposit_id\": $deposit_id}")
    
    if [ $? -ne 0 ]; then
        echo ""
        return
    fi
    
    echo "$response" | jq -r '.address // ""' 2>/dev/null || echo ""
}

# Function to sweep funds from an address
sweep_address() {
    local from_address=$1
    local deposit_id=$2
    local amount=$3
    
    echo -e "${YELLOW}  Sweeping $amount wei from $from_address${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${BLUE}  [DRY RUN] Would sweep $amount wei${NC}"
        return 0
    fi
    
    local response=$(curl -s -X POST "$USDT_SERVICE_URL/sweep" \
        -H "Content-Type: application/json" \
        -d "{
            \"from_address\": \"$from_address\",
            \"deposit_id\": $deposit_id,
            \"amount\": \"$amount\",
            \"to\": \"$DESTINATION\"
        }")
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}  Failed to execute sweep${NC}"
        return 1
    fi
    
    local success=$(echo "$response" | jq -r '.success // false' 2>/dev/null)
    local tx_hash=$(echo "$response" | jq -r '.txHash // ""' 2>/dev/null)
    
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}  ✅ Sweep successful! TxHash: $tx_hash${NC}"
        return 0
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"' 2>/dev/null)
        echo -e "${RED}  ❌ Sweep failed: $error${NC}"
        return 1
    fi
}

# Check master wallet status
echo -e "${YELLOW}Checking master wallet status...${NC}"
MASTER_INFO=$(curl -s "$USDT_SERVICE_URL/master-wallet")

if [ $? -eq 0 ]; then
    MASTER_ADDRESS=$(echo "$MASTER_INFO" | jq -r '.address // ""' 2>/dev/null)
    MASTER_ETH=$(echo "$MASTER_INFO" | jq -r '.ethBalanceEth // "0"' 2>/dev/null)
    MASTER_USDT=$(echo "$MASTER_INFO" | jq -r '.usdtBalanceUsdt // "0"' 2>/dev/null)
    
    echo "Master wallet: $MASTER_ADDRESS"
    echo "ETH balance: $MASTER_ETH ETH"
    echo "USDT balance: $MASTER_USDT USDT"
    echo ""
else
    echo -e "${RED}Failed to check master wallet${NC}"
fi

# Step 1: Get all USDT deposits from database
echo -e "${YELLOW}Step 1: Fetching USDT deposits from database...${NC}"

DEPOSIT_QUERY="SELECT id, user_id, amount, status, created_at,
    COALESCE(metadata->>'sweep_tx_hash', '') as sweep_tx_hash
FROM deposit 
WHERE type = 'usdt' 
AND status = 'complete'
AND (metadata->>'sweep' IS NULL OR metadata->>'sweep_tx_hash' IS NULL)
ORDER BY amount DESC;"

DEPOSITS=$(query_db "$DEPOSIT_QUERY")

if [ -z "$DEPOSITS" ] || [ "$DEPOSITS" = " " ]; then
    echo -e "${YELLOW}No unswept USDT deposits found${NC}"
    exit 0
fi

# Count deposits
DEPOSIT_COUNT=$(echo "$DEPOSITS" | grep -c '^[[:space:]]*[0-9]' || true)
echo -e "${GREEN}Found $DEPOSIT_COUNT unswept USDT deposits${NC}"
echo ""

# Step 2: Check balances and prepare sweeps
echo -e "${YELLOW}Step 2: Checking balances and gas requirements...${NC}"

TOTAL_BALANCE=0
SWEEP_COUNT=0
FUND_COUNT=0
SWEEP_TARGETS=""

while IFS='|' read -r id user_id amount status created_at sweep_tx_hash; do
    # Trim whitespace
    id=$(echo "$id" | xargs)
    
    if [ -z "$id" ] || ! [[ "$id" =~ ^[0-9]+$ ]]; then
        continue
    fi
    
    echo -e "${BLUE}Deposit #$id${NC}"
    
    # Generate address for this deposit
    address=$(generate_address "$id")
    
    if [ -z "$address" ]; then
        echo -e "${RED}  Failed to generate address${NC}"
        continue
    fi
    
    echo "  Address: $address"
    
    # Check USDT balance
    usdt_balance=$(check_usdt_balance "$address")
    
    if [ "$usdt_balance" = "0" ] || [ "$usdt_balance" -lt "$MIN_BALANCE_WEI" ]; then
        echo "  USDT: 0 or below minimum"
        echo ""
        continue
    fi
    
    usdt_amount=$(echo "scale=6; $usdt_balance / 1000000" | bc)
    echo -e "${GREEN}  USDT: $usdt_amount USDT ($usdt_balance wei)${NC}"
    
    # Check ETH balance
    eth_balance=$(check_eth_balance "$address")
    if [ "$eth_balance" = "0" ] || [ -z "$eth_balance" ]; then
        eth_amount="0"
    else
        eth_amount=$(echo "scale=6; $eth_balance / 1000000000000000000" | bc 2>/dev/null || echo "0")
    fi
    echo "  ETH: $eth_amount ETH ($eth_balance wei)"
    
    # Check if needs gas funding
    if [ "$eth_balance" -lt "$GAS_FUNDING_AMOUNT" ]; then
        echo -e "${YELLOW}  Needs gas funding${NC}"
        
        # Fund the address
        if fund_address "$address" "$GAS_FUNDING_AMOUNT"; then
            FUND_COUNT=$((FUND_COUNT + 1))
            echo -e "${GREEN}  Gas funded successfully${NC}"
        else
            echo -e "${RED}  Failed to fund gas, skipping this address${NC}"
            echo ""
            continue
        fi
    else
        echo -e "${GREEN}  Has sufficient gas${NC}"
    fi
    
    # Add to sweep targets
    SWEEP_TARGETS="$SWEEP_TARGETS$address|$id|$usdt_balance\n"
    SWEEP_COUNT=$((SWEEP_COUNT + 1))
    TOTAL_BALANCE=$((TOTAL_BALANCE + usdt_balance))
    
    echo ""
done <<< "$DEPOSITS"

# Step 3: Summary
echo -e "${YELLOW}Step 3: Summary${NC}"
echo "Total deposits checked: $DEPOSIT_COUNT"
echo "Addresses funded with gas: $FUND_COUNT"
echo "Addresses ready to sweep: $SWEEP_COUNT"
TOTAL_USDT=$(echo "scale=6; $TOTAL_BALANCE / 1000000" | bc)
echo "Total USDT to sweep: $TOTAL_USDT USDT"
echo ""

if [ $SWEEP_COUNT -eq 0 ]; then
    echo -e "${YELLOW}No addresses ready to sweep${NC}"
    exit 0
fi

# Step 4: Execute sweeps
echo -e "${YELLOW}Step 4: Executing sweeps...${NC}"

SUCCESS_COUNT=0
FAILED_COUNT=0

while IFS='|' read -r address deposit_id balance; do
    if [ -z "$address" ]; then
        continue
    fi
    
    echo -e "${BLUE}Sweeping Deposit #$deposit_id${NC}"
    
    if sweep_address "$address" "$deposit_id" "$balance"; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
    
    # Add delay between sweeps to avoid rate limiting
    if [ "$DRY_RUN" = false ]; then
        sleep 2
    fi
    
    echo ""
done <<< "$(echo -e "$SWEEP_TARGETS")"

# Final summary
echo -e "${YELLOW}===== Sweep Complete! =====${NC}"
echo "Gas funding operations: $FUND_COUNT"
echo "Successful sweeps: $SUCCESS_COUNT"
echo "Failed sweeps: $FAILED_COUNT"
echo "Total USDT swept: $TOTAL_USDT USDT"
echo "Destination: $DESTINATION"

if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${RED}⚠️  Warning: Some sweeps failed. Check logs for details.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All operations completed successfully!${NC}"