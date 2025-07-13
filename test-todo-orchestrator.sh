#!/bin/bash

# Test script for todo orchestrator with mock CI/CD
# This is a simplified version for testing the workflow

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

TODO_FILE="$SCRIPT_DIR/test-todo.txt"
LOG_FILE="$SCRIPT_DIR/test-todo-orchestrator.log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to log messages
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# Check if todo file exists
check_todo_file() {
    if [ ! -f "$TODO_FILE" ]; then
        echo -e "${RED}Error: test-todo.txt not found${NC}"
        exit 1
    fi
}

# Get unfinished tasks
get_unfinished_tasks() {
    grep -n "^\[ \]" "$TODO_FILE" 2>/dev/null || true
}

# Mark task as completed
mark_task_completed() {
    local line_number=$1
    local task_description="$2"
    
    # Use sed to replace [ ] with [x] on the specific line
    sed -i "${line_number}s/^\[ \]/[x]/" "$TODO_FILE"
    
    if [ $? -eq 0 ]; then
        log_message "✅ Marked task as completed: $task_description"
        return 0
    else
        log_message "❌ Failed to mark task as completed: $task_description"
        return 1
    fi
}

# Mock CI/CD (always succeeds)
run_mock_cicd() {
    local task="$1"
    
    echo -e "${BLUE}🔄 Running mock CI/CD for: $task${NC}"
    echo "Mock CI/CD: Simulating successful run..."
    sleep 2
    echo -e "${GREEN}✅ Mock CI/CD completed successfully${NC}"
    log_message "Mock CI/CD succeeded for task: $task"
    return 0
}

# Call Claude (mock)
call_claude() {
    local task="$1"
    
    echo -e "${BLUE}🤖 Claude processing task:${NC}"
    echo -e "${YELLOW}Task: $task${NC}"
    log_message "Claude task: $task"
    echo "Claude: Task received and will be processed"
}

# Process a single task
process_task() {
    local line_info="$1"
    local line_number=$(echo "$line_info" | cut -d: -f1)
    local task_line=$(echo "$line_info" | cut -d: -f2-)
    local task_description=$(echo "$task_line" | sed 's/^\[ \] *//')
    
    echo ""
    echo -e "${BLUE}📋 Processing Task:${NC}"
    echo -e "${YELLOW}Line $line_number: $task_description${NC}"
    echo ""
    
    # Step 1: Call Claude
    call_claude "$task_description"
    echo ""
    
    # Step 2: Run mock CI/CD
    if run_mock_cicd "$task_description"; then
        # Step 3: Mark as completed
        if mark_task_completed "$line_number" "$task_description"; then
            echo -e "${GREEN}🎉 Task completed successfully!${NC}"
            return 0
        else
            echo -e "${RED}❌ Failed to mark task as completed${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Mock CI/CD failed${NC}"
        return 1
    fi
}

# Main function
main() {
    echo -e "${BLUE}🚀 Test Todo Orchestrator Starting...${NC}"
    log_message "Test orchestrator started"
    
    check_todo_file
    
    local unfinished_tasks=$(get_unfinished_tasks)
    
    if [ -z "$unfinished_tasks" ]; then
        echo -e "${GREEN}🎉 All tasks completed!${NC}"
        log_message "All tasks completed"
        return 0
    fi
    
    echo -e "${YELLOW}📝 Found unfinished tasks:${NC}"
    echo "$unfinished_tasks" | while read -r line; do
        local task_desc=$(echo "$line" | cut -d: -f2- | sed 's/^\[ \] *//')
        echo "  - $task_desc"
    done
    echo ""
    
    # Process first task
    local first_task=$(echo "$unfinished_tasks" | head -n 1)
    process_task "$first_task"
    
    echo -e "${GREEN}🏆 Test completed!${NC}"
    log_message "Test orchestrator completed"
}

main "$@"