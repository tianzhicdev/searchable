#!/bin/bash

# Demo script showing the todo system in action
# This uses a demo todo file and mock CI/CD for demonstration

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

TODO_FILE="$SCRIPT_DIR/demo-todo.txt"
LOG_FILE="$SCRIPT_DIR/demo-orchestrator.log"
MAX_CICD_RETRIES=3

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions (simplified versions from main script)
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

check_todo_file() {
    if [ ! -f "$TODO_FILE" ]; then
        echo -e "${RED}Error: demo-todo.txt not found${NC}"
        exit 1
    fi
}

get_unfinished_tasks() {
    grep -n "^\[ \]" "$TODO_FILE" 2>/dev/null || true
}

get_total_tasks() {
    grep "^\[\(x\| \)\]" "$TODO_FILE" 2>/dev/null | wc -l
}

get_completed_tasks() {
    grep "^\[x\]" "$TODO_FILE" 2>/dev/null | wc -l
}

mark_task_completed() {
    local line_number=$1
    local task_description="$2"
    
    sed -i "${line_number}s/^\[ \]/[x]/" "$TODO_FILE"
    
    if [ $? -eq 0 ]; then
        log_message "✅ Marked task as completed: $task_description"
        return 0
    else
        log_message "❌ Failed to mark task as completed: $task_description"
        return 1
    fi
}

call_claude() {
    local task="$1"
    
    echo -e "${BLUE}🤖 Claude processing task:${NC}"
    echo -e "${YELLOW}Task: $task${NC}"
    log_message "Claude task: $task"
    echo "Claude: I will help process this task"
    sleep 1
}

run_demo_cicd() {
    local task="$1"
    local attempt=1
    
    while [ $attempt -le $MAX_CICD_RETRIES ]; do
        echo -e "${BLUE}🔄 CI/CD Attempt $attempt/$MAX_CICD_RETRIES for task: $task${NC}"
        
        log_message "Running CI/CD simulation (attempt $attempt)"
        
        # Simulate CI/CD work
        echo "  📦 Building containers..."
        sleep 1
        echo "  🔄 Starting services..."
        sleep 1
        echo "  🧪 Running tests..."
        sleep 2
        
        # Demo: succeed on first attempt
        echo -e "${GREEN}✅ CI/CD succeeded on attempt $attempt${NC}"
        log_message "CI/CD succeeded for task: $task (attempt $attempt)"
        return 0
    done
    
    return 1
}

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
    
    # Step 2: Run CI/CD until success
    if run_demo_cicd "$task_description"; then
        # Step 3: Mark as completed
        if mark_task_completed "$line_number" "$task_description"; then
            echo -e "${GREEN}🎉 Task completed successfully!${NC}"
            return 0
        else
            echo -e "${RED}❌ Failed to mark task as completed${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Task failed after all retry attempts${NC}"
        return 1
    fi
}

show_progress() {
    local total=$(get_total_tasks)
    local completed=$(get_completed_tasks)
    local remaining=$((total - completed))
    
    echo ""
    echo -e "${BLUE}📊 Progress Summary:${NC}"
    echo "  Total tasks: $total"
    echo "  Completed: $completed"
    echo "  Remaining: $remaining"
    
    if [ "$total" -gt 0 ]; then
        local percentage=$((completed * 100 / total))
        echo "  Progress: $percentage%"
    fi
    echo ""
}

main() {
    echo -e "${BLUE}🚀 Demo Todo Orchestrator Starting...${NC}"
    echo -e "${YELLOW}This demo shows the complete workflow with mock CI/CD${NC}"
    echo ""
    log_message "Demo orchestrator started"
    
    check_todo_file
    show_progress
    
    local iteration=1
    while true; do
        echo -e "${BLUE}🔄 Iteration $iteration${NC}"
        
        local unfinished_tasks=$(get_unfinished_tasks)
        
        if [ -z "$unfinished_tasks" ]; then
            echo -e "${GREEN}🎉 All tasks completed!${NC}"
            log_message "All tasks completed successfully"
            show_progress
            break
        fi
        
        # Pick first task
        local first_task=$(echo "$unfinished_tasks" | head -n 1)
        
        echo -e "${BLUE}📝 Found unfinished tasks:${NC}"
        echo "$unfinished_tasks" | while read -r line; do
            local task_desc=$(echo "$line" | cut -d: -f2- | sed 's/^\[ \] *//')
            echo "  - $task_desc"
        done
        echo ""
        
        echo -e "${YELLOW}🎯 Processing first unfinished task...${NC}"
        
        # Process the task
        if process_task "$first_task"; then
            echo -e "${GREEN}✅ Task completed successfully${NC}"
            show_progress
        else
            echo -e "${RED}❌ Task failed - stopping orchestrator${NC}"
            log_message "Task failed - orchestrator stopped"
            exit 1
        fi
        
        ((iteration++))
        
        # Brief pause between tasks
        echo -e "${YELLOW}⏳ Brief pause before next task...${NC}"
        sleep 2
    done
    
    echo -e "${GREEN}🏆 Demo orchestrator completed successfully!${NC}"
    echo -e "${BLUE}📝 Check demo-orchestrator.log for detailed logs${NC}"
    echo -e "${BLUE}📋 Check demo-todo.txt to see completed tasks marked with [x]${NC}"
    log_message "Demo orchestrator completed successfully"
}

# Run main function
main "$@"