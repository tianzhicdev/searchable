#!/bin/bash

# Script to fund deposit addresses with ETH for gas fees
# Usage: ./fund-gas.sh [--amount wei] [--dry-run]

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
WEB3_PROVIDER=${WEB3_PROVIDER:-"http://localhost:8545"}

# Default gas parameters
# USDT transfer typically uses ~65,000 gas
# Adding 20% buffer = 78,000 gas
# At 20 gwei gas price = 78,000 * 20 * 10^9 = 1,560,000,000,000,000 wei = 0.00156 ETH
DEFAULT_GAS_FUNDING=2000000000000000  # 0.002 ETH (with extra buffer)
MIN_BALANCE_WEI=1000000  # 1 USDT minimum to sweep

# Parse arguments
DRY_RUN=false
GAS_FUNDING=$DEFAULT_GAS_FUNDING

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --amount)
            GAS_FUNDING="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--amount wei] [--dry-run]"
            echo ""
            echo "Options:"
            echo "  --amount wei   Amount of ETH to send in wei (default: $DEFAULT_GAS_FUNDING)"
            echo "  --dry-run      Preview operations without executing"
            echo ""
            echo "Default amount: $DEFAULT_GAS_FUNDING wei (0.002 ETH)"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}⛽ Gas Funding Tool for USDT Sweeps${NC}"
echo "Gas funding amount: $GAS_FUNDING wei ($(echo "scale=6; $GAS_FUNDING / 1000000000000000000" | bc) ETH)"
echo "Dry run: $DRY_RUN"
echo ""

# Function to query database
query_db() {
    docker exec -i $DB_CONTAINER psql -U searchable -d searchable -t -c "$1"
}

# Function to check ETH balance
check_eth_balance() {
    local address=$1
    # Using cast from foundry or eth-cli would be better, but using curl for compatibility
    local data='{"jsonrpc":"2.0","method":"eth_getBalance","params":["'$address'","latest"],"id":1}'
    local response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$WEB3_PROVIDER" 2>/dev/null || echo '{"error":"failed"}')
    
    if echo "$response" | grep -q "result"; then
        local hex_balance=$(echo "$response" | jq -r '.result' 2>/dev/null || echo "0x0")
        # Convert hex to decimal
        echo $((16#${hex_balance#0x}))
    else
        echo "0"
    fi
}

# Function to check USDT balance
check_usdt_balance() {
    local address=$1
    local response=$(curl -s "$USDT_SERVICE_URL/balance/$address" 2>/dev/null || echo '{"balance":"0"}')
    echo "$response" | jq -r '.balance // "0"' 2>/dev/null || echo "0"
}

# Function to generate deposit address
generate_address() {
    local deposit_id=$1
    local response=$(curl -s -X POST "$USDT_SERVICE_URL/receive" \
        -H "Content-Type: application/json" \
        -d "{\"deposit_id\": $deposit_id}" 2>/dev/null)
    
    echo "$response" | jq -r '.address // ""' 2>/dev/null || echo ""
}

# Get funding wallet info (this would need to be configured)
echo -e "${YELLOW}Note: This script requires a funded Ethereum wallet to send gas fees.${NC}"
echo -e "${YELLOW}The wallet should be configured in the environment or added to this script.${NC}"
echo ""

# Step 1: Get deposits that need gas
echo -e "${YELLOW}Step 1: Finding deposit addresses that need gas...${NC}"

DEPOSIT_QUERY="SELECT id, user_id, amount, status, created_at,
    COALESCE(metadata->>'sweep_tx_hash', '') as sweep_tx_hash
FROM deposit 
WHERE type = 'usdt' 
AND status = 'complete'
AND (metadata->>'sweep' IS NULL OR metadata->>'sweep_tx_hash' IS NULL)
ORDER BY amount DESC
LIMIT 100;"

DEPOSITS=$(query_db "$DEPOSIT_QUERY")

if [ -z "$DEPOSITS" ] || [ "$DEPOSITS" = " " ]; then
    echo -e "${GREEN}No unswept USDT deposits found${NC}"
    exit 0
fi

# Process deposits and check which need gas
ADDRESSES_NEED_GAS=""
TOTAL_ETH_NEEDED=0
COUNT_NEED_GAS=0

echo -e "${BLUE}Checking deposit addresses...${NC}"
echo ""

while IFS='|' read -r id user_id amount status created_at sweep_tx_hash; do
    # Trim whitespace
    id=$(echo "$id" | xargs)
    
    if [ -z "$id" ] || ! [[ "$id" =~ ^[0-9]+$ ]]; then
        continue
    fi
    
    # Generate address
    address=$(generate_address "$id")
    
    if [ -z "$address" ]; then
        continue
    fi
    
    # Check USDT balance
    usdt_balance=$(check_usdt_balance "$address")
    
    if [ "$usdt_balance" -lt "$MIN_BALANCE_WEI" ]; then
        continue
    fi
    
    # Check ETH balance
    eth_balance=$(check_eth_balance "$address")
    
    usdt_amount=$(echo "scale=6; $usdt_balance / 1000000" | bc)
    eth_amount=$(echo "scale=6; $eth_balance / 1000000000000000000" | bc)
    
    echo "Deposit #$id:"
    echo "  Address: $address"
    echo "  USDT: $usdt_amount USDT ($usdt_balance wei)"
    echo "  ETH: $eth_amount ETH ($eth_balance wei)"
    
    # Check if needs gas
    if [ "$eth_balance" -lt "$GAS_FUNDING" ]; then
        echo -e "  ${RED}Needs gas funding${NC}"
        ADDRESSES_NEED_GAS="$ADDRESSES_NEED_GAS$address|$id|$usdt_balance|$eth_balance\n"
        COUNT_NEED_GAS=$((COUNT_NEED_GAS + 1))
        TOTAL_ETH_NEEDED=$((TOTAL_ETH_NEEDED + GAS_FUNDING - eth_balance))
    else
        echo -e "  ${GREEN}Has sufficient gas${NC}"
    fi
    
    echo ""
done <<< "$DEPOSITS"

# Step 2: Summary
echo -e "${YELLOW}Step 2: Summary${NC}"
echo "Addresses that need gas: $COUNT_NEED_GAS"
TOTAL_ETH_NEEDED_DECIMAL=$(echo "scale=6; $TOTAL_ETH_NEEDED / 1000000000000000000" | bc)
echo "Total ETH needed: $TOTAL_ETH_NEEDED_DECIMAL ETH"
echo ""

if [ $COUNT_NEED_GAS -eq 0 ]; then
    echo -e "${GREEN}All addresses have sufficient gas!${NC}"
    exit 0
fi

# Step 3: Show funding commands
echo -e "${YELLOW}Step 3: Funding Commands${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}[DRY RUN MODE] Here are the addresses that need funding:${NC}"
else
    echo -e "${BLUE}To fund these addresses, you'll need to send ETH from a funded wallet.${NC}"
fi

echo ""
echo "Option 1: Manual funding using MetaMask or any wallet:"
echo "----------------------------------------"

FUNDING_COMMANDS=""
while IFS='|' read -r address deposit_id usdt_balance eth_balance; do
    if [ -z "$address" ]; then
        continue
    fi
    
    needed=$((GAS_FUNDING - eth_balance))
    if [ $needed -le 0 ]; then
        continue
    fi
    
    needed_eth=$(echo "scale=6; $needed / 1000000000000000000" | bc)
    usdt_decimal=$(echo "scale=2; $usdt_balance / 1000000" | bc)
    
    echo "Address: $address"
    echo "  Send: $needed_eth ETH"
    echo "  Reason: Has $usdt_decimal USDT to sweep"
    echo ""
    
    FUNDING_COMMANDS="${FUNDING_COMMANDS}cast send --private-key \$PRIVATE_KEY $address --value ${needed}wei\n"
done <<< "$(echo -e "$ADDRESSES_NEED_GAS")"

echo ""
echo "Option 2: Using cast (Foundry) commands:"
echo "----------------------------------------"
echo -e "${YELLOW}# Set your private key (be careful!)${NC}"
echo "export PRIVATE_KEY=your_private_key_here"
echo ""
echo -e "${YELLOW}# Fund each address:${NC}"
echo -e "$FUNDING_COMMANDS"

echo ""
echo "Option 3: Batch funding script (save as fund-addresses.sh):"
echo "----------------------------------------"
cat << 'EOF'
#!/bin/bash
# Check if private key is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY environment variable not set"
    exit 1
fi

# Fund addresses
EOF

while IFS='|' read -r address deposit_id usdt_balance eth_balance; do
    if [ -z "$address" ]; then
        continue
    fi
    
    needed=$((GAS_FUNDING - eth_balance))
    if [ $needed -le 0 ]; then
        continue
    fi
    
    echo "echo \"Funding $address...\""
    echo "cast send --private-key \$PRIVATE_KEY $address --value ${needed}wei"
    echo "sleep 2"
    echo ""
done <<< "$(echo -e "$ADDRESSES_NEED_GAS")"

echo ""
echo -e "${YELLOW}After funding the addresses, run the sweep script again:${NC}"
echo "./sweep.sh <destination_address>"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "- Current gas funding amount: $(echo "scale=6; $GAS_FUNDING / 1000000000000000000" | bc) ETH per address"
echo "- This should cover ~78,000 gas at 25 gwei"
echo "- Adjust with --amount flag if needed (in wei)"
echo "- Always fund addresses just before sweeping to minimize ETH exposure"