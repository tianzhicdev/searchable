#!/bin/bash

# Fast Rate Limiting Test - Parallel requests
# URL: https://silkroadonlightning.com

echo "🚀 Fast Rate Limiting Test on Beta Server: https://silkroadonlightning.com"
echo "=========================================================================="

# Function to make parallel requests
test_parallel() {
    local url=$1
    local count=$2
    local description=$3
    
    echo "📊 $description"
    echo "Sending $count parallel requests to $url..."
    
    # Create temp file for results
    temp_file=$(mktemp)
    
    # Launch all requests in parallel
    for i in $(seq 1 $count); do
        (curl -s -o /dev/null -w "%{http_code}\n" "$url" >> "$temp_file") &
    done
    
    # Wait for all requests to complete
    wait
    
    # Count responses
    success_count=$(grep -c "200" "$temp_file" 2>/dev/null || echo "0")
    rate_limited_count=$(grep -c "503" "$temp_file" 2>/dev/null || echo "0") 
    other_count=$(grep -cv -E "(200|503)" "$temp_file" 2>/dev/null || echo "0")
    
    echo "Results: ✅ $success_count success | 🚫 $rate_limited_count rate-limited | ❓ $other_count other"
    
    # Show sample responses
    echo "Sample responses: $(head -20 "$temp_file" | tr '\n' ' ')"
    echo
    
    rm "$temp_file"
}

# Test 1: General frontend (20/sec + burst 50 = ~70 total)
test_parallel "https://silkroadonlightning.com/" 100 "Frontend Rate Limit (expect ~70 success, ~30 rate-limited)"

# Small delay to let rate limits reset slightly  
sleep 2

# Test 2: API endpoints (10/sec + burst 20 = ~30 total)
test_parallel "https://silkroadonlightning.com/api/searchables" 50 "API Rate Limit (expect ~30 success, ~20 rate-limited)"

# Small delay
sleep 2

# Test 3: File API (2/sec + burst 10 = ~12 total)
test_parallel "https://silkroadonlightning.com/api/file/nonexistent" 25 "File API Rate Limit (expect ~12 success/404, ~13 rate-limited)"

echo "✅ Fast rate limiting test complete!"
echo "🔧 Rate limiting is working if you see 503 responses in the results above."