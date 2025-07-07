#!/bin/bash

# AI Content Download Script
# Downloads AI content submissions and their associated files
# Usage: ./download-ai-content.sh [options]

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Default configuration
API_URL=${API_URL:-"http://localhost:5005"}
FILE_SERVER_URL=${FILE_SERVER_URL:-"http://localhost:5006"}
OUTPUT_DIR=${OUTPUT_DIR:-"./ai_content_downloads"}
STATUS_FILTER="submitted"
INCLUDE_PROCESSED=false
SPECIFIC_ID=""

# Function to display usage
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --id <id>           Download specific AI content by ID"
    echo "  --status <status>   Filter by status (submitted/processed) [default: submitted]"
    echo "  --all               Download all AI content regardless of status"
    echo "  --output <dir>      Output directory [default: ./ai_content_downloads]"
    echo "  --api-url <url>     API server URL [default: http://localhost:5005]"
    echo "  --file-url <url>    File server URL [default: http://localhost:5006]"
    echo "  --update-status     Update status to 'processed' after download"
    echo "  --help              Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0                              # Download all submitted AI content"
    echo "  $0 --id 123                     # Download specific AI content #123"
    echo "  $0 --status processed           # Download processed AI content"
    echo "  $0 --all --output ./exports     # Download all to ./exports directory"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --id)
            SPECIFIC_ID="$2"
            shift 2
            ;;
        --status)
            STATUS_FILTER="$2"
            shift 2
            ;;
        --all)
            STATUS_FILTER=""
            shift
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --file-url)
            FILE_SERVER_URL="$2"
            shift 2
            ;;
        --update-status)
            UPDATE_STATUS=true
            shift
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

echo -e "${BLUE}🤖 AI Content Download Tool${NC}"
echo "API URL: $API_URL"
echo "File Server URL: $FILE_SERVER_URL"
echo "Output Directory: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to download a file
download_file() {
    local file_id=$1
    local file_name=$2
    local output_path=$3
    
    echo -e "${YELLOW}  Downloading: $file_name${NC}"
    
    # Download from file server
    local download_url="$FILE_SERVER_URL/v1/files/download/$file_id"
    
    if curl -s -f -o "$output_path/$file_name" "$download_url"; then
        echo -e "${GREEN}  ✓ Downloaded: $file_name${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Failed to download: $file_name${NC}"
        return 1
    fi
}

# Function to process AI content
process_ai_content() {
    local content=$1
    local id=$(echo "$content" | jq -r '.id')
    local title=$(echo "$content" | jq -r '.title')
    local status=$(echo "$content" | jq -r '.status')
    local username=$(echo "$content" | jq -r '.username')
    local instructions=$(echo "$content" | jq -r '.instructions')
    local files=$(echo "$content" | jq -c '.files')
    
    echo -e "${BLUE}Processing AI Content #$id: $title${NC}"
    echo "  User: $username"
    echo "  Status: $status"
    
    # Create directory for this AI content
    local content_dir="$OUTPUT_DIR/ai_content_${id}_$(echo "$title" | tr ' ' '_' | tr -cd '[:alnum:]_-')"
    mkdir -p "$content_dir"
    
    # Save metadata
    cat > "$content_dir/metadata.json" << EOF
{
    "id": $id,
    "title": "$title",
    "username": "$username",
    "status": "$status",
    "downloaded_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    
    # Save instructions
    echo "$instructions" > "$content_dir/instructions.txt"
    echo -e "${GREEN}  ✓ Saved metadata and instructions${NC}"
    
    # Download files
    local file_count=$(echo "$files" | jq 'length')
    echo "  Files to download: $file_count"
    
    if [ "$file_count" -gt 0 ]; then
        mkdir -p "$content_dir/files"
        
        local success_count=0
        for i in $(seq 0 $((file_count - 1))); do
            local file=$(echo "$files" | jq -r ".[$i]")
            local file_id=$(echo "$file" | jq -r '.fileId')
            local file_name=$(echo "$file" | jq -r '.fileName')
            
            if download_file "$file_id" "$file_name" "$content_dir/files"; then
                ((success_count++))
            fi
        done
        
        echo -e "${GREEN}  Downloaded $success_count/$file_count files${NC}"
    fi
    
    # Update status if requested
    if [ "$UPDATE_STATUS" = true ] && [ "$status" = "submitted" ]; then
        echo -e "${YELLOW}  Updating status to 'processed'...${NC}"
        
        local update_response=$(curl -s -X PUT "$API_URL/v1/employee/ai-content/$id" \
            -H "Content-Type: application/json" \
            -d '{"status": "processed", "notes": "Downloaded by script", "processed_by": "download-script"}')
        
        if echo "$update_response" | jq -e '.success' > /dev/null; then
            echo -e "${GREEN}  ✓ Status updated to 'processed'${NC}"
        else
            echo -e "${RED}  ✗ Failed to update status${NC}"
        fi
    fi
    
    echo ""
}

# Main download logic
if [ -n "$SPECIFIC_ID" ]; then
    # Download specific AI content
    echo -e "${YELLOW}Fetching AI Content #$SPECIFIC_ID...${NC}"
    
    response=$(curl -s "$API_URL/v1/employee/ai-content/$SPECIFIC_ID")
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        content=$(echo "$response" | jq '.data')
        process_ai_content "$content"
    else
        echo -e "${RED}Failed to fetch AI Content #$SPECIFIC_ID${NC}"
        exit 1
    fi
else
    # Download multiple AI contents
    echo -e "${YELLOW}Fetching AI content list...${NC}"
    
    # Build query parameters
    query_params="include_files=true"
    if [ -n "$STATUS_FILTER" ]; then
        query_params="$query_params&status=$STATUS_FILTER"
    fi
    
    response=$(curl -s "$API_URL/v1/employee/ai-content/export?$query_params")
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        contents=$(echo "$response" | jq -c '.data.ai_contents[]')
        total=$(echo "$response" | jq '.data.total')
        
        echo -e "${GREEN}Found $total AI content items${NC}"
        echo ""
        
        if [ "$total" -eq 0 ]; then
            echo "No AI content to download"
            exit 0
        fi
        
        # Process each AI content
        count=0
        while IFS= read -r content; do
            ((count++))
            echo -e "${BLUE}[$count/$total]${NC}"
            process_ai_content "$content"
        done <<< "$contents"
        
        echo -e "${GREEN}✅ Download complete!${NC}"
        echo "Downloaded $count AI content items to: $OUTPUT_DIR"
    else
        echo -e "${RED}Failed to fetch AI content list${NC}"
        exit 1
    fi
fi

# Summary
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "Output directory: $OUTPUT_DIR"
find "$OUTPUT_DIR" -type d -name "ai_content_*" | wc -l | xargs echo "Total AI content folders:"
find "$OUTPUT_DIR" -type f -name "*" | wc -l | xargs echo "Total files downloaded:"