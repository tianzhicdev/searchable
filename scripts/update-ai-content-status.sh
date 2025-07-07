#!/bin/bash

# AI Content Status Update Script
# Updates the status of AI content items
# Usage: ./update-ai-content-status.sh <id> <status> [notes]

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
API_URL=${API_URL:-"http://localhost:5005"}

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo "Usage: $0 <id> <status> [notes]"
    echo ""
    echo "Arguments:"
    echo "  id      - AI content ID"
    echo "  status  - New status (submitted/processed)"
    echo "  notes   - Optional notes"
    echo ""
    echo "Example:"
    echo "  $0 123 processed \"Completed processing\""
    exit 1
fi

ID=$1
STATUS=$2
NOTES=${3:-""}

# Validate status
if [ "$STATUS" != "submitted" ] && [ "$STATUS" != "processed" ]; then
    echo -e "${RED}Error: Invalid status '$STATUS'${NC}"
    echo "Status must be 'submitted' or 'processed'"
    exit 1
fi

echo -e "${BLUE}Updating AI Content #$ID${NC}"
echo "New status: $STATUS"

# Build JSON payload
if [ -n "$NOTES" ]; then
    PAYLOAD=$(jq -n \
        --arg status "$STATUS" \
        --arg notes "$NOTES" \
        --arg processed_by "$USER" \
        '{status: $status, notes: $notes, processed_by: $processed_by}')
else
    PAYLOAD=$(jq -n \
        --arg status "$STATUS" \
        --arg processed_by "$USER" \
        '{status: $status, processed_by: $processed_by}')
fi

# Send update request
response=$(curl -s -X PUT "$API_URL/v1/employee/ai-content/$ID" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

# Check response
if echo "$response" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Successfully updated AI Content #$ID to status: $STATUS${NC}"
else
    echo -e "${RED}❌ Failed to update AI Content #$ID${NC}"
    echo "Response: $response"
    exit 1
fi