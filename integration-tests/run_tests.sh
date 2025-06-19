#!/bin/bash

# Integration Test Runner for Searchable Platform
echo "Starting Integration Tests for Searchable Platform..."
echo "Target: ${BASE_URL:-'http://localhost:5005'}"
echo "================================================"

# Exit on any error
set -e

# Function to handle cleanup
cleanup() {
    echo "Cleaning up..."
    # Deactivate virtual environment if active
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        deactivate 2>/dev/null || true
    fi
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed or not in PATH"
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
    echo "✓ Virtual environment created successfully"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "❌ Failed to activate virtual environment"
    exit 1
fi
echo "✓ Virtual environment activated"

# Upgrade pip in virtual environment
echo "Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✓ Dependencies installed successfully"

# Check if test files exist
if [ ! -f "test_integration.py" ]; then
    echo "❌ test_integration.py not found"
    exit 1
fi

# Run tests with pytest for better output and reporting
echo "Running integration tests..."
pytest test_integration.py -v --tb=short
TEST_EXIT_CODE=$?

# Generate HTML report regardless of test results
echo "Generating HTML test report..."
pytest test_integration.py --html=test_report.html --self-contained-html --quiet || true

echo "================================================"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✓ All integration tests passed!"
else
    echo "⚠ Some integration tests failed (exit code: $TEST_EXIT_CODE)"
fi
echo "HTML report available: test_report.html"
echo "Virtual environment location: $(pwd)/venv"
echo "Python version: $(python --version)"
echo "================================================"

exit $TEST_EXIT_CODE