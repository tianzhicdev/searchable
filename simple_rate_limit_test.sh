#!/bin/bash

# Simple Rate Limit Test
URL="https://silkroadonlightning.com/api/v1/searchable/search?page=3&page_size=10&q=&filters=%7B%7D"

echo "🚀 Testing Rate Limiting on: $URL"
echo "Rate limit: 10 req/sec + 20 burst = ~30 requests should succeed"
echo "================================================================"

# Send 50 parallel requests
echo "Sending 50 parallel requests..."
temp_file=$(mktemp)

for i in {1..50}; do
    (curl -s -o /dev/null -w "%{http_code}\n" "$URL" >> "$temp_file") &
done

wait

# Count results
success=$(grep -c "200" "$temp_file" 2>/dev/null || echo "0")
rate_limited=$(grep -c "503" "$temp_file" 2>/dev/null || echo "0")
other=$(grep -cv -E "(200|503)" "$temp_file" 2>/dev/null || echo "0")

echo "Results:"
echo "✅ Success (200): $success"
echo "🚫 Rate Limited (503): $rate_limited"  
echo "❓ Other: $other"
echo
echo "All responses grouped by status code:"
sort "$temp_file" | uniq -c | sort -nr

rm "$temp_file"

if [ "$rate_limited" -gt 0 ]; then
    echo "✅ Rate limiting is working!"
else
    echo "❌ Rate limiting may not be working - no 503 responses"
fi