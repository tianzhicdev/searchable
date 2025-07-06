#!/bin/bash
# Script to insert random invite codes for promoters using Docker

echo "Invite Code Generator for Promoters (Docker Version)"
echo "==================================================="

# Docker container name - adjust if different
DB_CONTAINER="${DB_CONTAINER:-searchable-db-1}"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Error: Database container '${DB_CONTAINER}' is not running"
    echo "Please start the container or adjust DB_CONTAINER variable"
    exit 1
fi

# Function to execute SQL in docker
exec_sql() {
    docker exec -i "$DB_CONTAINER" psql -U searchable -d searchable -t -c "$1" 2>/dev/null
}

# Function to generate random 6-letter code
generate_code() {
    # Generate random 6 uppercase letters (macOS compatible)
    LC_ALL=C tr -dc 'A-Z' < /dev/urandom | head -c 6
}

# Function to insert code
insert_code() {
    local code=$1
    local promoter=$2
    local description=$3
    local created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Create SQL with inline JSON
    local sql="INSERT INTO invite_code (code, active, metadata) VALUES ('$code', true, '{\"promoter\": \"$promoter\", \"description\": \"$description\", \"created_at\": \"$created_at\", \"created_by\": \"promoter_script\"}'::jsonb) ON CONFLICT (code) DO NOTHING RETURNING code;"
    
    # Execute insert
    result=$(exec_sql "$sql")
    
    if [ -n "$result" ]; then
        echo "  ✅ Created code: $code"
        return 0
    else
        return 1
    fi
}

# Promoters configuration
CODES_PER_PROMOTER=10

echo "📊 Checking existing codes..."
existing_count=$(exec_sql "SELECT COUNT(*) FROM invite_code;" | tr -d ' ')
echo "Found $existing_count existing codes in database"

# Generate codes for each promoter
for promoter in marcus tyler sajan; do
    case $promoter in
        marcus) description="Marcus promotion - Get 5 USDT signup bonus" ;;
        tyler)  description="Tyler promotion - Get 5 USDT signup bonus" ;;
        sajan)  description="Sajan promotion - Get 5 USDT signup bonus" ;;
    esac
    
    echo -e "\n🎯 Generating codes for $promoter..."
    
    codes_generated=0
    generated_codes=""
    attempts=0
    max_attempts=1000
    
    while [ $codes_generated -lt $CODES_PER_PROMOTER ] && [ $attempts -lt $max_attempts ]; do
        attempts=$((attempts + 1))
        
        # Generate unique code
        code=$(generate_code)
        
        # Skip if already generated in this session
        if [[ " $generated_codes " =~ " $code " ]]; then
            continue
        fi
        
        # Try to insert
        if insert_code "$code" "$promoter" "$description"; then
            generated_codes="$generated_codes $code"
            codes_generated=$((codes_generated + 1))
        fi
    done
    
    # Store codes for summary
    eval "${promoter}_codes=\"$generated_codes\""
    echo "  Generated $codes_generated codes for $promoter"
done

# Print summary
echo -e "\n==================================================="
echo "Summary of Generated Codes"
echo "==================================================="

# Save to file
output_file="promoter_codes_$(date +%Y%m%d_%H%M%S).txt"
{
    echo "Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "Database: $DB_CONTAINER"
    echo "==================================================="
    
    for promoter in marcus tyler sajan; do
        eval "codes=\$${promoter}_codes"
        code_array=($codes)
        echo ""
        echo "${promoter^^} (${#code_array[@]} codes):"
        for code in ${code_array[@]}; do
            echo "  - $code"
        done
    done
} | tee "$output_file"

echo -e "\n📄 Codes saved to: $output_file"

# Verify codes in database
echo -e "\n📊 Verification:"
for promoter in marcus tyler sajan; do
    count=$(exec_sql "SELECT COUNT(*) FROM invite_code WHERE metadata->>'promoter' = '$promoter' AND active = true;" | tr -d ' ')
    echo "  - $promoter: $count active codes in database"
done

echo -e "\n✅ Done!"

# Example usage URLs
echo -e "\n📌 Example usage:"
echo "  - Random code: curl http://localhost:5005/api/invite"
echo "  - Marcus code: curl http://localhost:5005/api/invite?promoter=marcus"
echo "  - Tyler code:  curl http://localhost:5005/api/invite?promoter=tyler"
echo "  - Sajan code:  curl http://localhost:5005/api/invite?promoter=sajan"