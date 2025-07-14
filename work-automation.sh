#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TODO_FILE="todo-list.txt"
TODO_BACKUP="todo-list.backup.txt"
LOG_FILE="work-automation.log"
CLAUDE_CMD="claude"
EXEC_CMD="./exec.sh"
MAX_RETRIES=5

# Function to log messages
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] ${message}" | tee -a "$LOG_FILE"
}

# Function to display colored output
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if todo file exists
check_todo_file() {
    if [ ! -f "$TODO_FILE" ]; then
        print_colored "$RED" "Error: $TODO_FILE not found!"
        exit 1
    fi
}

# Function to backup todo file
backup_todo() {
    cp "$TODO_FILE" "$TODO_BACKUP"
    log_message "Backed up todo list to $TODO_BACKUP"
}

# Function to get next unfinished task
get_next_task() {
    # Find first line with [ ] status that's not a comment
    grep -n "^\[ \]" "$TODO_FILE" | head -1
}

# Function to mark task as in progress
mark_in_progress() {
    local line_num=$1
    sed -i.tmp "${line_num}s/^\[ \]/[*]/" "$TODO_FILE"
    rm -f "${TODO_FILE}.tmp"
}

# Function to mark task as done
mark_done() {
    local line_num=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    # Mark as done and add completion timestamp
    sed -i.tmp "${line_num}s/^\[\*\]/[x] (completed: ${timestamp})/" "$TODO_FILE"
    rm -f "${TODO_FILE}.tmp"
}

# Function to mark task as failed and move back to unfinished
mark_failed() {
    local line_num=$1
    sed -i.tmp "${line_num}s/^\[\*\]/[ ]/" "$TODO_FILE"
    rm -f "${TODO_FILE}.tmp"
}

# Function to count remaining tasks
count_remaining_tasks() {
    grep -c "^\[ \]" "$TODO_FILE" 2>/dev/null || echo 0
}

# Function to run CI/CD until it passes
run_cicd_until_pass() {
    local retry_count=0
    local task="$1"
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        print_colored "$BLUE" "Running CI/CD tests (attempt $((retry_count + 1))/$MAX_RETRIES)..."
        
        # Run CI/CD with proper exit code handling
        if $EXEC_CMD local cicd; then
            print_colored "$GREEN" "✅ CI/CD tests passed!"
            return 0
        else
            print_colored "$RED" "❌ CI/CD tests failed!"
            log_message "CI/CD failed for task: $task (attempt $((retry_count + 1)))"
            
            # Don't call Claude on the last retry
            if [ $retry_count -lt $((MAX_RETRIES - 1)) ]; then
                print_colored "$YELLOW" "🔧 Asking Claude to fix the issues..."
                
                # Call Claude to fix issues
                if command -v $CLAUDE_CMD >/dev/null 2>&1; then
                    print_colored "$YELLOW" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    print_colored "$YELLOW" "Claude is analyzing and fixing CI/CD failures..."
                    print_colored "$YELLOW" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo
                    $CLAUDE_CMD --print "The CI/CD tests failed. Please analyze and fix the issues. The current task is: $task"
                    echo
                    print_colored "$YELLOW" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    print_colored "$GREEN" "✅ Claude has finished fixing the issues"
                    print_colored "$YELLOW" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                else
                    print_colored "$RED" "Claude command not found. Please fix the issues manually."
                    read -p "Press Enter when you've fixed the issues..."
                fi
            fi
        fi
        
        retry_count=$((retry_count + 1))
    done
    
    print_colored "$RED" "Failed to fix issues after $MAX_RETRIES attempts"
    return 1
}

# Function to display progress
display_progress() {
    local total=$(grep -c "^\[.\]" "$TODO_FILE" 2>/dev/null || echo 0)
    local done=$(grep -c "^\[x\]" "$TODO_FILE" 2>/dev/null || echo 0)
    local remaining=$(count_remaining_tasks)
    
    print_colored "$GREEN" "\n📊 Progress: $done/$total tasks completed ($remaining remaining)\n"
}

# Main automation loop
main() {
    print_colored "$BLUE" "🤖 Starting Work Automation Script"
    log_message "Starting work automation"
    
    # Check prerequisites
    check_todo_file
    backup_todo
    
    # Display initial progress
    display_progress
    
    # Main loop
    while true; do
        # Check if there are any unfinished tasks
        remaining=$(count_remaining_tasks)
        if [ $remaining -eq 0 ]; then
            print_colored "$GREEN" "🎉 All tasks completed!"
            log_message "All tasks completed"
            break
        fi
        
        # Get next task
        task_info=$(get_next_task)
        if [ -z "$task_info" ]; then
            print_colored "$GREEN" "No more unfinished tasks!"
            break
        fi
        
        # Extract line number and task description
        line_num=$(echo "$task_info" | cut -d: -f1)
        task_desc=$(echo "$task_info" | cut -d: -f2- | sed 's/^\[ \] //')
        
        print_colored "$YELLOW" "\n📋 Working on task: $task_desc"
        log_message "Starting task: $task_desc"
        
        # Mark as in progress
        mark_in_progress "$line_num"
        
        # Call Claude to work on the task
        if command -v $CLAUDE_CMD >/dev/null 2>&1; then
            print_colored "$BLUE" "🤖 Calling Claude to work on the task..."
            print_colored "$YELLOW" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            print_colored "$YELLOW" "Claude is now working on: $task_desc"
            print_colored "$YELLOW" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo
            # Show Claude's output in real-time
            $CLAUDE_CMD --print "$task_desc"
            echo
            print_colored "$YELLOW" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            print_colored "$GREEN" "✅ Claude has finished working on the task"
            print_colored "$YELLOW" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        else
            print_colored "$RED" "Claude command not found. Please complete the task manually."
            read -p "Press Enter when you've completed the task..."
        fi
        
        # Run CI/CD until it passes
        if run_cicd_until_pass "$task_desc"; then
            mark_done "$line_num"
            print_colored "$GREEN" "✅ Task completed successfully!"
            log_message "Task completed: $task_desc"
        else
            mark_failed "$line_num"
            print_colored "$RED" "❌ Task failed after $MAX_RETRIES attempts"
            log_message "Task failed: $task_desc"
            
            # Ask if user wants to continue
            read -p "Continue with next task? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_colored "$YELLOW" "Stopping automation"
                break
            fi
        fi
        
        # Display progress
        display_progress
        
        # Small delay between tasks
        sleep 2
    done
    
    print_colored "$BLUE" "🏁 Work automation completed"
    log_message "Work automation ended"
}

# Handle script interruption
trap 'print_colored "$YELLOW" "\n⚠️  Script interrupted! Current task may be marked as in progress."; exit 1' INT TERM

# Run main function
main "$@"