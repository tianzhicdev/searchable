#!/bin/bash

# Auto-fix CI/CD Script
# Continuously runs "./exec.sh local cicd" and fixes failures automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_ATTEMPTS=${MAX_ATTEMPTS:-10}
SLEEP_BETWEEN_ATTEMPTS=${SLEEP_BETWEEN_ATTEMPTS:-30}
LOG_DIR="./integration-tests/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Main log file
MAIN_LOG="${LOG_DIR}/auto_fix_cicd_${TIMESTAMP}.log"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}" | tee -a "$MAIN_LOG"
}

# Function to run CI/CD and capture output
run_cicd() {
    local attempt=$1
    local cicd_log="${LOG_DIR}/cicd_attempt_${attempt}_${TIMESTAMP}.log"
    
    print_color $BLUE "🔄 Attempt $attempt: Running CI/CD pipeline..."
    
    # Run CI/CD and capture both exit code and output
    if ./exec.sh local cicd > "$cicd_log" 2>&1; then
        print_color $GREEN "✅ CI/CD passed on attempt $attempt"
        return 0
    else
        print_color $RED "❌ CI/CD failed on attempt $attempt"
        print_color $YELLOW "📄 Log file: $cicd_log"
        
        # Show last 20 lines of the failure for immediate context
        print_color $YELLOW "Last 20 lines of CI/CD output:"
        tail -20 "$cicd_log" | tee -a "$MAIN_LOG"
        
        return 1
    fi
}

# Function to analyze failure and attempt fix
analyze_and_fix() {
    local attempt=$1
    local cicd_log="${LOG_DIR}/cicd_attempt_${attempt}_${TIMESTAMP}.log"
    
    print_color $YELLOW "🔍 Analyzing failure and attempting automated fix..."
    
    # Check if log file exists
    if [ ! -f "$cicd_log" ]; then
        print_color $RED "❌ CI/CD log file not found: $cicd_log"
        return 1
    fi
    
    # Extract the failure information
    local failure_output=$(cat "$cicd_log")
    
    # Create a prompt for Claude to analyze and fix
    local claude_prompt="I'm running an automated CI/CD fixing script. The CI/CD pipeline failed with the following output:

\`\`\`
$failure_output
\`\`\`

Please analyze this failure and provide specific fixes. Focus on:
1. Identifying the root cause of the failure
2. Making the necessary code changes to fix the issue
3. Being concise and direct - just fix the problem

This is an automated script, so please make the changes immediately without asking for confirmation."
    
    # Try different Claude CLI command formats
    local claude_commands=(
        "claude '$claude_prompt'"
        "claude-cli '$claude_prompt'" 
        "npx claude '$claude_prompt'"
    )
    
    for cmd in "${claude_commands[@]}"; do
        print_color $BLUE "🤖 Trying Claude command: $cmd"
        if eval "$cmd" 2>/dev/null; then
            print_color $GREEN "✅ Claude command executed successfully"
            return 0
        else
            print_color $YELLOW "⚠️  Claude command failed, trying next format..."
        fi
    done
    
    # If all Claude commands fail, try manual prompting
    print_color $YELLOW "🤖 All automated Claude commands failed. Manual intervention may be needed."
    print_color $YELLOW "Failure summary:"
    
    # Extract key failure information
    if echo "$failure_output" | grep -q "FAILED"; then
        echo "$failure_output" | grep -A 5 -B 5 "FAILED" | tee -a "$MAIN_LOG"
    fi
    
    if echo "$failure_output" | grep -q "Error"; then
        echo "$failure_output" | grep -A 3 -B 3 "Error" | tee -a "$MAIN_LOG"
    fi
    
    return 1
}

# Main execution loop
print_color $BLUE "🚀 Starting Auto-Fix CI/CD Script"
print_color $BLUE "Configuration:"
print_color $BLUE "  Max attempts: $MAX_ATTEMPTS"
print_color $BLUE "  Sleep between attempts: ${SLEEP_BETWEEN_ATTEMPTS}s"
print_color $BLUE "  Main log: $MAIN_LOG"
print_color $BLUE "  Log directory: $LOG_DIR"
echo ""

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    print_color $BLUE "📋 Starting attempt $attempt of $MAX_ATTEMPTS"
    
    if run_cicd $attempt; then
        print_color $GREEN "🎉 CI/CD pipeline succeeded! Auto-fix completed successfully."
        exit 0
    else
        print_color $RED "💥 CI/CD failed on attempt $attempt"
        
        # Try to fix the issue
        if analyze_and_fix $attempt; then
            print_color $GREEN "🔧 Automated fix applied, will retry CI/CD..."
        else
            print_color $YELLOW "⚠️  Could not apply automated fix"
        fi
        
        # Check if this was the last attempt
        if [ $attempt -eq $MAX_ATTEMPTS ]; then
            print_color $RED "❌ Maximum attempts ($MAX_ATTEMPTS) reached. Auto-fix failed."
            print_color $RED "Manual intervention required."
            exit 1
        fi
        
        # Wait before next attempt
        print_color $YELLOW "⏳ Waiting ${SLEEP_BETWEEN_ATTEMPTS}s before next attempt..."
        sleep $SLEEP_BETWEEN_ATTEMPTS
    fi
    
    attempt=$((attempt + 1))
done

print_color $RED "❌ Auto-fix script completed without success"
exit 1