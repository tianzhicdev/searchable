#!/bin/bash

# Rate Limiting Verification Script for Beta Server
# URL: https://silkroadonlightning.com

echo "🔍 Testing Rate Limiting on Beta Server: https://silkroadonlightning.com"
echo "======================================================================="

# Test 1: General rate limit (20/sec + burst 50)
echo "📊 Test 1: General Frontend Rate Limit (20/sec + burst 50)"
echo "Sending 100 rapid requests to homepage..."
for i in {1..100}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" https://silkroadonlightning.com/)
    echo -n "$response "
    if [ $((i % 20)) -eq 0 ]; then echo; fi
done
echo -e "\nExpected: First ~70 should be 200, rest should be 503\n"

# Test 2: API rate limit (10/sec + burst 20) 
echo "📊 Test 2: API Rate Limit (10/sec + burst 20)"
echo "Sending 50 rapid requests to API..."
for i in {1..50}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" https://silkroadonlightning.com/api/health)
    echo -n "$response "
    if [ $((i % 20)) -eq 0 ]; then echo; fi
done
echo -e "\nExpected: First ~30 should be 200, rest should be 503\n"

# Test 3: File API rate limit (2/sec + burst 10)
echo "📊 Test 3: File API Rate Limit (2/sec + burst 10)"
echo "Sending 20 rapid requests to file API..."
for i in {1..20}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" https://silkroadonlightning.com/api/file/health)
    echo -n "$response "
    if [ $((i % 10)) -eq 0 ]; then echo; fi
done
echo -e "\nExpected: First ~12 should be 200, rest should be 503\n"

# Test 4: Verify rate limiting resets over time
echo "📊 Test 4: Rate Limit Reset Test"
echo "Waiting 5 seconds for rate limits to reset..."
sleep 5
echo "Testing single request after reset:"
response=$(curl -s -o /dev/null -w "%{http_code}" https://silkroadonlightning.com/)
echo "Homepage response: $response (should be 200)"

echo -e "\n✅ Rate limiting verification complete!"
echo "🔧 If all tests show expected behavior, rate limiting is working correctly."