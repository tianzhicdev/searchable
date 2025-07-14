#!/bin/bash

echo "Debug: Testing claude command"
echo "============================="

# Test 1: Direct call
echo "Test 1: Direct call"
claude --print "Say hello" 

echo ""
echo "============================="
echo ""

# Test 2: With 2>&1
echo "Test 2: With 2>&1"  
claude --print "Say hello" 2>&1

echo ""
echo "============================="
echo ""

# Test 3: With tee
echo "Test 3: With tee"
claude --print "Say hello" | cat

echo ""
echo "Done!"