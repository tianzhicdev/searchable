#!/bin/bash

# Integration Test Runner for Searchable Platform
echo "Starting Integration Tests for Searchable Platform..."
echo "Target: $(grep BASE_URL .env | cut -d'=' -f2)"
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
echo "1. Core integration tests..."
pytest test_integration.py -v --tb=short
CORE_TEST_EXIT_CODE=$?

echo "2. Guest access tests..."
pytest test_guest_access.py -v --tb=short
GUEST_TEST_EXIT_CODE=$?

# Calculate overall exit code
if [ $CORE_TEST_EXIT_CODE -eq 0 ] && [ $GUEST_TEST_EXIT_CODE -eq 0 ]; then
    TEST_EXIT_CODE=0
else
    TEST_EXIT_CODE=1
fi

# Generate HTML report regardless of test results
echo "Generating HTML test reports..."
pytest test_integration.py --html=test_report_core.html --self-contained-html --quiet || true
pytest test_guest_access.py --html=test_report_guest.html --self-contained-html --quiet || true

echo "================================================"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✓ All integration tests passed!"
else
    echo "⚠ Some integration tests failed (exit code: $TEST_EXIT_CODE)"
fi
echo "HTML reports available: test_report_core.html, test_report_guest.html"
echo "Virtual environment location: $(pwd)/venv"
echo "Python version: $(python --version)"
echo "================================================"

exit $TEST_EXIT_CODE