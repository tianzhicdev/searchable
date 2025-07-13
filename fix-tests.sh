#!/bin/bash

# Script to automatically fix npm tests using Claude
# Runs npm test in a loop and asks Claude to fix any failures

# Don't exit on error immediately - we need to handle failures
set +e

MAX_ATTEMPTS=10
ATTEMPT=0

echo "Starting automated test fixing process..."
echo "Working directory: $(pwd)"

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo "Attempt $ATTEMPT of $MAX_ATTEMPTS"
    
    # Run npm test in frontend directory and capture both output and exit code
    # CI=true runs tests once and exits instead of watch mode
    cd frontend && CI=true npm test > ../test-output.log 2>&1
    TEST_EXIT_CODE=$?
    cd ..
    
    # Display the output
    cat test-output.log
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo "✅ All tests passing! Success!"
        rm -f test-output.log
        exit 0
    else
        echo "❌ Tests failed. Asking Claude to fix them..."
        
        # Save the prompt to a file to avoid argument length issues
        cat > claude-prompt.txt << 'EOF'
The npm tests are failing in the frontend directory. The test output has been saved to test-output.log.

Please analyze the test failures and fix all the issues. Make sure to:
1. Fix all failing tests, not just some of them
2. Address the root causes of the failures
3. Ensure the fixes don't break other tests
4. After making changes, verify they work by running: cd frontend && CI=true npm test

Key failures from the test output:
EOF
        
        # Extract key error information (first 50 lines of failures)
        grep -A 5 -E "(FAIL|Error:|ReferenceError:|TypeError:)" test-output.log | head -50 >> claude-prompt.txt
        
        # Use Claude in non-interactive mode to fix the tests
        # The --print flag prevents entering REPL mode
        claude --print "$(cat claude-prompt.txt)"
        
        # Clean up temporary file
        rm claude-prompt.txt
        
        echo "Claude has attempted to fix the tests. Re-running..."
        sleep 2
    fi
done

echo "❌ Maximum attempts ($MAX_ATTEMPTS) reached. Manual intervention required."
rm -f test-output.log
exit 1