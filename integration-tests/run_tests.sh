#!/bin/bash

# Integration Test Runner for Searchable Platform
echo "Starting Integration Tests for Searchable Platform..."
echo "Target: $(grep BASE_URL .env | cut -d'=' -f2)"
echo "================================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run tests
echo "Running integration tests..."
python test_integration.py

# Generate HTML report
echo "Generating HTML test report..."
pytest test_integration.py --html=test_report.html --self-contained-html

echo "================================================"
echo "Integration tests completed!"
echo "HTML report available: test_report.html"