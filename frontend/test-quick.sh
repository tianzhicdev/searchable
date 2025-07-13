#!/bin/bash

# Quick test runner for development
# Runs tests in watch mode with interactive menu

echo "🧪 Searchable Frontend - Quick Test Runner"
echo "=========================================="
echo ""
echo "Choose which tests to run:"
echo ""
echo "1) All tests (watch mode)"
echo "2) Search page"
echo "3) Dashboard" 
echo "4) Publish pages (all)"
echo "5) Item detail pages (all)"
echo "6) Specific test file"
echo "7) Run with coverage"
echo "0) Exit"
echo ""

read -p "Enter your choice: " choice

case $choice in
    1)
        echo "Running all tests in watch mode..."
        npm test
        ;;
    2)
        echo "Running Search page tests..."
        npm test -- --testPathPattern=Search.test.js
        ;;
    3)
        echo "Running Dashboard tests..."
        npm test -- --testPathPattern=Dashboard.test.js
        ;;
    4)
        echo "Running all Publish page tests..."
        npm test -- --testPathPattern=Publish
        ;;
    5)
        echo "Running all Item detail tests..."
        npm test -- --testPathPattern=SearchableDetails.test.js
        ;;
    6)
        read -p "Enter test file pattern: " pattern
        echo "Running tests matching: $pattern"
        npm test -- --testPathPattern=$pattern
        ;;
    7)
        echo "Running all tests with coverage..."
        npm test -- --coverage --watchAll=false
        ;;
    0)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac