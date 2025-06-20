#!/bin/bash

# Test to see what response code nginx returns when rate limited
BASE_URL="https://silkroadonlightning.com"
EMAIL="burgesschen1990@gmail.com"
PASSWORD="12345"

# Get token
echo "Getting auth token..."
token=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | \
  sed -n 's/.*"token": *"\([^"]*\)".*/\1/p')

echo "Token: ${token:0:20}..."

# Test with a very fast burst to trigger rate limiting
URL="$BASE_URL/api/v1/searchable/search?page=1&page_size=1"
echo "Testing rapid requests to: $URL"

# Make 100 requests as fast as possible
for i in {1..100}; do
    response=$(curl -s -w "%{http_code}|%{time_total}" \
               -H "Authorization: Bearer $token" \
               "$URL")
    code=$(echo "$response" | cut -d'|' -f1)
    time=$(echo "$response" | cut -d'|' -f2)
    echo "Request $i: $code (${time}s)"
    
    # If we see anything other than 200, print more details
    if [ "$code" != "200" ]; then
        full_response=$(curl -s -H "Authorization: Bearer $token" "$URL")
        echo "  Response body: $full_response"
    fi
    
    # Small delay to see pattern
    sleep 0.01
done