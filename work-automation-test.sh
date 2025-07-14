#!/bin/bash

# Test version of work automation script
# This simulates the workflow without actually calling claude

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TODO_FILE="todo-list-test.txt"
TODO_BACKUP="todo-list-test.backup.txt"
LOG_FILE="work-automation-test.log"
EXEC_CMD="./exec.sh"
SIMULATE_MODE=true  # Set to false to run actual CI/CD

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

# Create test todo file
create_test_todo() {
    cat > "$TODO_FILE" << 'EOF'
# Test Todo List
[ ] Fix authentication bug
[ ] Add user profile feature
[ ] Optimize database queries
[ ] Write documentation
EOF
    print_colored "$GREEN" "Created test todo file: $TODO_FILE"
}

# Function to get next unfinished task
get_next_task() {
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
    sed -i.tmp "${line_num}s/^\[\*\]/[x] (completed: ${timestamp})/" "$TODO_FILE"
    rm -f "${TODO_FILE}.tmp"
}

# Function to count remaining tasks
count_remaining_tasks() {
    grep -c "^\[ \]" "$TODO_FILE" 2>/dev/null || echo 0
}

# Function to simulate CI/CD
simulate_cicd() {
    if [ "$SIMULATE_MODE" = true ]; then
        # Simulate success 70% of the time
        if [ $((RANDOM % 10)) -lt 7 ]; then
            print_colored "$GREEN" "✅ [SIMULATED] CI/CD tests passed!"
            return 0
        else
            print_colored "$RED" "❌ [SIMULATED] CI/CD tests failed!"
            return 1
        fi
    else
        # Run actual CI/CD
        $EXEC_CMD local cicd
        return $?
    fi
}

# Function to display current todo list
display_todo_list() {
    print_colored "$BLUE" "\n📝 Current Todo List:"
    cat "$TODO_FILE"
    echo
}

# Main test function
main() {
    print_colored "$BLUE" "🧪 Testing Work Automation Script"
    
    # Create test todo file
    create_test_todo
    display_todo_list
    
    # Process some tasks
    local task_count=0
    while [ $task_count -lt 2 ] && [ $(count_remaining_tasks) -gt 0 ]; do
        # Get next task
        task_info=$(get_next_task)
        if [ -z "$task_info" ]; then
            break
        fi
        
        # Extract line number and task description
        line_num=$(echo "$task_info" | cut -d: -f1)
        task_desc=$(echo "$task_info" | cut -d: -f2- | sed 's/^\[ \] //')
        
        print_colored "$YELLOW" "\n📋 Working on task: $task_desc"
        mark_in_progress "$line_num"
        
        # Simulate work
        print_colored "$BLUE" "[SIMULATED] Claude working on: $task_desc"
        sleep 1
        
        # Try CI/CD
        local retry_count=0
        local success=false
        while [ $retry_count -lt 3 ]; do
            if simulate_cicd; then
                success=true
                break
            else
                retry_count=$((retry_count + 1))
                if [ $retry_count -lt 3 ]; then
                    print_colored "$YELLOW" "[SIMULATED] Claude fixing issues (attempt $retry_count)..."
                    sleep 1
                fi
            fi
        done
        
        if [ "$success" = true ]; then
            mark_done "$line_num"
            print_colored "$GREEN" "✅ Task completed!"
        else
            print_colored "$RED" "❌ Task failed after retries"
        fi
        
        task_count=$((task_count + 1))
    done
    
    # Show final state
    display_todo_list
    
    print_colored "$GREEN" "\n✅ Test completed! Check $TODO_FILE to see the results."
    print_colored "$YELLOW" "To run the real script, use: ./work-automation.sh"
}

# Run test
main "$@"