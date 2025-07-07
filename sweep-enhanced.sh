#!/bin/bash

# Enhanced USDT Sweep Script with Database Updates
# Collects all USDT from deposit addresses and sends to a specified address
# Updates database with sweep information
# Usage: ./sweep-enhanced.sh <destination_address> [options]

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
LOG_FILE="sweep_$(date +%Y%m%d_%H%M%S).log"

# Parse command line arguments
DESTINATION=""
DRY_RUN=false
BATCH_SIZE=10
UPDATE_DB=true

usage() {
    echo "Usage: $0 <destination_address> [options]"
    echo ""
    echo "Options:"
    echo "  --dry-run         Preview operations without executing"
    echo "  --batch-size N    Process N addresses at a time (default: 10)"
    echo "  --no-db-update    Don't update database after sweep"
    echo "  --min-balance N   Minimum balance in wei to sweep (default: 1000000)"
    echo ""
    echo "Example:"
    echo "  $0 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e"
    echo "  $0 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e --dry-run"
    echo "  $0 0x742d35cc6634c0532925a3b844bc9e7595ed5e6e --batch-size 5"
}

# Parse arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Missing destination address${NC}"
    usage
    exit 1
fi

DESTINATION=$1
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --no-db-update)
            UPDATE_DB=false
            shift
            ;;
        --min-balance)
            MIN_BALANCE_WEI="$2"
            shift 2
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Validate Ethereum address format
if ! [[ $DESTINATION =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}Error: Invalid Ethereum address format${NC}"
    echo "Address must start with '0x' followed by 40 hexadecimal characters"
    exit 1
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Start logging
log "=== USDT Sweep Started ==="
log "Destination: $DESTINATION"
log "Dry Run: $DRY_RUN"
log "Batch Size: $BATCH_SIZE"
log "Min Balance: $MIN_BALANCE_WEI wei"
log "Update DB: $UPDATE_DB"

echo -e "${BLUE}🧹 Enhanced USDT Sweep Tool${NC}"
echo "Log file: $LOG_FILE"
echo ""

# Function to query database
query_db() {
    docker exec -i $DB_CONTAINER psql -U searchable -d searchable -t -c "$1"
}

# Function to update database
update_db() {
    if [ "$UPDATE_DB" = true ] && [ "$DRY_RUN" = false ]; then
        docker exec -i $DB_CONTAINER psql -U searchable -d searchable -c "$1" >/dev/null
    fi
}

# Function to check USDT balance with retry
check_balance() {
    local address=$1
    local retries=3
    local delay=2
    
    for i in $(seq 1 $retries); do
        local response=$(curl -s "$USDT_SERVICE_URL/balance/$address" 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            local balance=$(echo "$response" | jq -r '.balance // "0"' 2>/dev/null || echo "0")
            if [ "$balance" != "0" ]; then
                echo "$balance"
                return 0
            fi
        fi
        
        if [ $i -lt $retries ]; then
            sleep $delay
        fi
    done
    
    echo "0"
}

# Function to generate deposit address
generate_address() {
    local deposit_id=$1
    local response=$(curl -s -X POST "$USDT_SERVICE_URL/receive" \
        -H "Content-Type: application/json" \
        -d "{\"deposit_id\": $deposit_id}" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "$response" | jq -r '.address // ""' 2>/dev/null || echo ""
    else
        echo ""
    fi
}

# Function to sweep funds with enhanced error handling
sweep_address() {
    local from_address=$1
    local deposit_id=$2
    local amount=$3
    
    log "Sweeping deposit #$deposit_id: $amount wei from $from_address"
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY RUN] Would sweep $amount wei from $from_address"
        return 0
    fi
    
    local response=$(curl -s -X POST "$USDT_SERVICE_URL/sweep" \
        -H "Content-Type: application/json" \
        -d "{
            \"from_address\": \"$from_address\",
            \"deposit_id\": $deposit_id,
            \"amount\": \"$amount\",
            \"to\": \"$DESTINATION\"
        }" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        log "ERROR: Failed to execute sweep for deposit #$deposit_id"
        return 1
    fi
    
    local success=$(echo "$response" | jq -r '.success // false' 2>/dev/null)
    local tx_hash=$(echo "$response" | jq -r '.txHash // ""' 2>/dev/null)
    
    if [ "$success" = "true" ]; then
        log "SUCCESS: Sweep completed for deposit #$deposit_id, TxHash: $tx_hash"
        
        # Update database with sweep information
        if [ "$UPDATE_DB" = true ]; then
            local update_query="UPDATE deposit 
                SET metadata = jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{sweep}',
                    jsonb_build_object(
                        'swept_at', to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'),
                        'sweep_tx_hash', '$tx_hash',
                        'swept_amount', '$amount',
                        'destination', '$DESTINATION'
                    )
                )
                WHERE id = $deposit_id;"
            
            update_db "$update_query"
            log "Database updated for deposit #$deposit_id"
        fi
        
        return 0
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"' 2>/dev/null)
        log "ERROR: Sweep failed for deposit #$deposit_id: $error"
        return 1
    fi
}

# Step 1: Get deposit statistics
echo -e "${YELLOW}Step 1: Analyzing deposits...${NC}"

STATS_QUERY="SELECT 
    COUNT(*) as total_deposits,
    COUNT(CASE WHEN metadata->>'sweep' IS NOT NULL THEN 1 END) as already_swept,
    COUNT(CASE WHEN metadata->>'sweep' IS NULL THEN 1 END) as not_swept
FROM deposit 
WHERE type = 'usdt' 
AND status = 'complete';"

STATS=$(query_db "$STATS_QUERY")
echo "$STATS"

# Step 2: Get unswept deposits
echo -e "${YELLOW}Step 2: Fetching unswept USDT deposits...${NC}"

DEPOSIT_QUERY="SELECT id, user_id, amount, status, created_at,
    COALESCE(metadata->>'sweep_tx_hash', '') as sweep_tx_hash
FROM deposit 
WHERE type = 'usdt' 
AND status = 'complete'
AND (metadata->>'sweep' IS NULL OR metadata->>'sweep_tx_hash' IS NULL)
ORDER BY id;"

DEPOSITS=$(query_db "$DEPOSIT_QUERY")

if [ -z "$DEPOSITS" ] || [ "$DEPOSITS" = " " ]; then
    echo -e "${GREEN}No unswept USDT deposits found${NC}"
    log "No unswept deposits found"
    exit 0
fi

# Process deposits in batches
TOTAL_BALANCE=0
SWEEP_COUNT=0
SUCCESS_COUNT=0
FAILED_COUNT=0
BATCH_NUM=0

# Create temporary file for batch processing
TEMP_FILE=$(mktemp)
echo "$DEPOSITS" > "$TEMP_FILE"

# Count total deposits
TOTAL_DEPOSITS=$(grep -c '^[[:space:]]*[0-9]' "$TEMP_FILE" || echo "0")
echo -e "${GREEN}Found $TOTAL_DEPOSITS unswept USDT deposits${NC}"
log "Found $TOTAL_DEPOSITS unswept deposits"

# Process in batches
while IFS= read -r line; do
    # Skip empty lines
    if [ -z "$(echo "$line" | xargs)" ]; then
        continue
    fi
    
    # Parse deposit data
    IFS='|' read -r id user_id amount status created_at sweep_tx_hash <<< "$line"
    
    # Trim whitespace
    id=$(echo "$id" | xargs)
    
    if [ -z "$id" ] || ! [[ "$id" =~ ^[0-9]+$ ]]; then
        continue
    fi
    
    # Start new batch if needed
    if [ $((SWEEP_COUNT % BATCH_SIZE)) -eq 0 ] && [ $SWEEP_COUNT -gt 0 ]; then
        echo -e "${PURPLE}Completed batch $BATCH_NUM ($BATCH_SIZE addresses)${NC}"
        echo -e "${YELLOW}Waiting 5 seconds before next batch...${NC}"
        sleep 5
    fi
    
    if [ $((SWEEP_COUNT % BATCH_SIZE)) -eq 0 ]; then
        BATCH_NUM=$((BATCH_NUM + 1))
        echo -e "${PURPLE}Starting batch $BATCH_NUM${NC}"
    fi
    
    # Generate address
    address=$(generate_address "$id")
    
    if [ -z "$address" ]; then
        log "ERROR: Failed to generate address for deposit #$id"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        continue
    fi
    
    # Check balance
    balance=$(check_balance "$address")
    
    if [ "$balance" = "0" ] || [ "$balance" -lt "$MIN_BALANCE_WEI" ]; then
        continue
    fi
    
    SWEEP_COUNT=$((SWEEP_COUNT + 1))
    TOTAL_BALANCE=$((TOTAL_BALANCE + balance))
    
    balance_usdt=$(echo "scale=6; $balance / 1000000" | bc)
    echo -e "${BLUE}[$SWEEP_COUNT] Deposit #$id: $balance_usdt USDT${NC}"
    
    # Execute sweep
    if sweep_address "$address" "$id" "$balance"; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo -e "${GREEN}  ✅ Success${NC}"
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
        echo -e "${RED}  ❌ Failed${NC}"
    fi
    
    # Rate limiting
    if [ "$DRY_RUN" = false ]; then
        sleep 1
    fi
    
done < "$TEMP_FILE"

# Cleanup
rm -f "$TEMP_FILE"

# Final summary
TOTAL_USDT=$(echo "scale=6; $TOTAL_BALANCE / 1000000" | bc)

echo ""
echo -e "${YELLOW}=== Sweep Summary ===${NC}"
echo "Total deposits checked: $TOTAL_DEPOSITS"
echo "Addresses with balance: $SWEEP_COUNT"
echo "Successful sweeps: $SUCCESS_COUNT"
echo "Failed sweeps: $FAILED_COUNT"
echo "Total USDT swept: $TOTAL_USDT USDT"
echo ""

log "=== Sweep Summary ==="
log "Total deposits: $TOTAL_DEPOSITS"
log "Swept: $SUCCESS_COUNT"
log "Failed: $FAILED_COUNT"
log "Total USDT: $TOTAL_USDT"

if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${RED}⚠️  Some sweeps failed. Check $LOG_FILE for details.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All sweeps completed successfully!${NC}"
fi

# Show recently swept deposits
if [ "$UPDATE_DB" = true ] && [ "$DRY_RUN" = false ] && [ $SUCCESS_COUNT -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Recently swept deposits:${NC}"
    
    RECENT_QUERY="SELECT 
        id,
        amount,
        metadata->>'sweep'->>'swept_at' as swept_at,
        metadata->>'sweep'->>'sweep_tx_hash' as tx_hash
    FROM deposit 
    WHERE type = 'usdt' 
    AND metadata->>'sweep'->>'swept_at' IS NOT NULL
    ORDER BY (metadata->>'sweep'->>'swept_at')::timestamp DESC
    LIMIT 5;"
    
    query_db "$RECENT_QUERY"
fi

log "=== Sweep Completed ==="