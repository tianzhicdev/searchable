#!/bin/bash

# Rate Limit Test with Authentication
BASE_URL="https://silkroadonlightning.com"
EMAIL="burgesschen1990@gmail.com"
PASSWORD="12345"

echo "🚀 Testing Rate Limiting with Authentication"
echo "============================================="

# Step 1: Login to get auth token
echo "🔐 Logging in to get auth token..."
login_response=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Extract token from response
token=$(echo "$login_response" | sed -n 's/.*"token": *"\([^"]*\)".*/\1/p')

if [ -z "$token" ]; then
    echo "❌ Failed to get auth token"
    echo "Login response: $login_response"
    exit 1
fi

echo "✅ Got auth token: ${token:0:20}..."

# Step 2: Test rate limiting with authenticated requests
URL="$BASE_URL/api/v1/searchable/search?page=1&page_size=10&q=&filters=%7B%7D"

echo "📊 Testing rate limit on: $URL"
echo "Rate limit: 2 req/sec + 5 burst = ~7 requests should succeed"
echo "================================================================"

# Send 50 parallel authenticated requests
echo "Sending 50 parallel authenticated requests..."
temp_file=$(mktemp)

for i in {1..50}; do
    (curl -s -o /dev/null -w "%{http_code}\n" \
     -H "Authorization: $token" \
     "$URL" >> "$temp_file") &
done

wait

# Count results
success=$(grep -c "200" "$temp_file" 2>/dev/null || echo "0")
rate_limited_503=$(grep -c "503" "$temp_file" 2>/dev/null || echo "0")
rate_limited_429=$(grep -c "429" "$temp_file" 2>/dev/null || echo "0")
not_found_404=$(grep -c "404" "$temp_file" 2>/dev/null || echo "0")
other=$(grep -cv -E "(200|503|429|404)" "$temp_file" 2>/dev/null || echo "0")

echo "Results:"
echo "✅ Success (200): $success"
echo "🚫 Rate Limited (503): $rate_limited_503"
echo "🚫 Rate Limited (429): $rate_limited_429"
echo "❓ Not Found (404): $not_found_404"
echo "❓ Other: $other"
echo
echo "All responses grouped by status code:"
sort "$temp_file" | uniq -c | sort -nr

rm "$temp_file"

# Check if rate limiting is working
total_rate_limited=$((rate_limited_503 + rate_limited_429))
if [ "$total_rate_limited" -gt 0 ]; then
    echo "✅ Rate limiting is working! ($total_rate_limited rate-limited responses)"
elif [ "$success" -gt 0 ] && [ "$not_found_404" -gt 0 ]; then
    echo "🤔 Seeing mix of 200 and 404 for same endpoint - this could indicate rate limiting"
    echo "   Some nginx configurations may return 404 instead of 503/429 for rate limits"
else
    echo "❌ No clear rate limiting detected"
fi