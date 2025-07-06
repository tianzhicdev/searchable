#!/bin/bash
# Script to insert random invite codes for promoters directly using psql

echo "Invite Code Generator for Promoters"
echo "===================================="

# Database connection parameters - adjust as needed
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-searchable}"
DB_USER="${DB_USER:-searchable}"

# If running in Docker, use this instead:
# PSQL_CMD="docker exec -i searchable-db-1 psql -U searchable -d searchable"
PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

# Function to generate random 6-letter code
generate_code() {
    # Generate random 6 uppercase letters (macOS compatible)
    LC_ALL=C tr -dc 'A-Z' < /dev/urandom | head -c 6
}

# Function to check if code exists
code_exists() {
    local code=$1
    result=$($PSQL_CMD -t -c "SELECT COUNT(*) FROM invite_code WHERE code = '$code';" 2>/dev/null)
    [ "$result" -gt 0 ] && return 0 || return 1
}

# Function to insert code
insert_code() {
    local code=$1
    local promoter=$2
    local description=$3
    local created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Create JSON metadata
    local metadata=$(cat <<EOF
{
    "promoter": "$promoter",
    "description": "$description",
    "created_at": "$created_at",
    "created_by": "promoter_script"
}
EOF
)
    
    # Escape single quotes in JSON for SQL
    metadata=$(echo "$metadata" | sed "s/'/''/g")
    
    # Insert into database
    $PSQL_CMD -c "INSERT INTO invite_code (code, active, metadata) VALUES ('$code', true, '$metadata'::jsonb) ON CONFLICT (code) DO NOTHING;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Created code: $code"
        return 0
    else
        echo "  ❌ Failed to create code: $code"
        return 1
    fi
}

# Promoters configuration
declare -A PROMOTERS=(
    ["marcus"]="Marcus promotion - Get 5 USDT signup bonus"
    ["tyler"]="Tyler promotion - Get 5 USDT signup bonus"
    ["sajan"]="Sajan promotion - Get 5 USDT signup bonus"
)

CODES_PER_PROMOTER=10

# Track all generated codes
declare -a ALL_CODES=()
declare -A PROMOTER_CODES

# Generate codes for each promoter
for promoter in "${!PROMOTERS[@]}"; do
    description="${PROMOTERS[$promoter]}"
    echo -e "\n🎯 Generating codes for $promoter..."
    
    codes_generated=0
    attempts=0
    max_attempts=$((CODES_PER_PROMOTER * 100))
    
    while [ $codes_generated -lt $CODES_PER_PROMOTER ] && [ $attempts -lt $max_attempts ]; do
        attempts=$((attempts + 1))
        
        # Generate unique code
        code=$(generate_code)
        
        # Check if code already exists in our list
        if [[ " ${ALL_CODES[@]} " =~ " ${code} " ]]; then
            continue
        fi
        
        # Check if code exists in database
        if code_exists "$code"; then
            continue
        fi
        
        # Insert the code
        if insert_code "$code" "$promoter" "$description"; then
            ALL_CODES+=("$code")
            PROMOTER_CODES[$promoter]+="$code "
            codes_generated=$((codes_generated + 1))
        fi
    done
    
    echo "  Generated $codes_generated codes for $promoter"
done

# Print summary
echo -e "\n===================================="
echo "Summary of Generated Codes"
echo "===================================="

# Save to file
output_file="promoter_codes_$(date +%Y%m%d_%H%M%S).txt"
{
    echo "Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "===================================="
    
    for promoter in "${!PROMOTERS[@]}"; do
        codes=(${PROMOTER_CODES[$promoter]})
        echo -e "\n${promoter^^} (${#codes[@]} codes):"
        for code in "${codes[@]}"; do
            echo "  - $code"
        done
    done
} | tee "$output_file"

echo -e "\n📄 Codes saved to: $output_file"
echo "✅ Done!"

# Example usage URLs
echo -e "\n📌 Example usage:"
echo "  - Random code: curl http://your-domain.com/invite"
echo "  - Marcus code: curl http://your-domain.com/invite?promoter=marcus"
echo "  - Tyler code:  curl http://your-domain.com/invite?promoter=tyler"
echo "  - Sajan code:  curl http://your-domain.com/invite?promoter=sajan"