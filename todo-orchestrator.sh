#!/bin/bash

# Todo List Orchestrator for Claude
# Manages todo-list.txt and integrates with CI/CD pipeline
# Usage: ./todo-orchestrator.sh [--dry-run] [--verbose]

set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
TODO_FILE="$SCRIPT_DIR/todo-list.txt"
LOG_FILE="$SCRIPT_DIR/todo-orchestrator.log"
MAX_CICD_RETRIES=3
VERBOSE=false
DRY_RUN=false

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --dry-run|-d)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [--verbose] [--help]"
            echo ""
            echo "Options:"
            echo "  --dry-run, -d    Show what would be done without executing"
            echo "  --verbose, -v    Enable verbose logging"
            echo "  --help, -h       Show this help message"
            echo ""
            echo "This script processes items from todo-list.txt:"
            echo "  - Picks unfinished items (marked with [ ])"
            echo "  - Calls Claude to print the task"
            echo "  - Runs './exec local cicd' until it succeeds"
            echo "  - Marks items as done (changes [ ] to [x])"
            echo "  - Continues until all items are finished"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to log messages
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# Function to log verbose messages
log_verbose() {
    if [ "$VERBOSE" = true ]; then
        log_message "[VERBOSE] $1"
    fi
}

# Function to check if todo-list.txt exists and is readable
check_todo_file() {
    if [ ! -f "$TODO_FILE" ]; then
        echo -e "${RED}Error: todo-list.txt not found at $TODO_FILE${NC}"
        echo "Please create a todo-list.txt file with tasks in the format:"
        echo "[ ] Unfinished task"
        echo "[x] Completed task"
        exit 1
    fi
    
    if [ ! -r "$TODO_FILE" ]; then
        echo -e "${RED}Error: Cannot read todo-list.txt at $TODO_FILE${NC}"
        exit 1
    fi
}

# Function to get unfinished tasks (lines starting with [ ])
get_unfinished_tasks() {
    # Skip comment lines and empty lines, only get lines with [ ]
    grep -n "^\[ \]" "$TODO_FILE" 2>/dev/null || true
}

# Function to get total task count
get_total_tasks() {
    # Count lines that start with either [ ] or [x] (ignore comments and empty lines)
    grep "^\[\(x\| \)\]" "$TODO_FILE" 2>/dev/null | wc -l
}

# Function to get completed task count  
get_completed_tasks() {
    grep "^\[x\]" "$TODO_FILE" 2>/dev/null | wc -l
}

# Function to mark a task as completed
mark_task_completed() {
    local line_number=$1
    local task_description="$2"
    
    if [ "$DRY_RUN" = true ]; then
        log_message "DRY_RUN: Would mark task at line $line_number as completed"
        return 0
    fi
    
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

# Function to call Claude (placeholder for now)
call_claude() {
    local task="$1"
    
    echo -e "${BLUE}🤖 Claude processing task:${NC}"
    echo -e "${YELLOW}Task: $task${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        log_message "DRY_RUN: Would call Claude with task: $task"
        return 0
    fi
    
    # For now, just log the task. In the future, this could integrate with Claude API
    log_message "Claude task: $task"
    echo "Claude has been notified of the task: $task"
}

# Function to run CI/CD until it succeeds
run_cicd_until_success() {
    local task="$1"
    local attempt=1
    
    while [ $attempt -le $MAX_CICD_RETRIES ]; do
        echo -e "${BLUE}🔄 CI/CD Attempt $attempt/$MAX_CICD_RETRIES for task: $task${NC}"
        
        if [ "$DRY_RUN" = true ]; then
            log_message "DRY_RUN: Would run './exec.sh local cicd' (attempt $attempt)"
            echo "DRY_RUN: Simulating CI/CD success"
            return 0
        fi
        
        log_verbose "Running './exec.sh local cicd' (attempt $attempt)"
        
        # Run the CI/CD pipeline
        if ./exec.sh local cicd --sequential; then
            echo -e "${GREEN}✅ CI/CD succeeded on attempt $attempt${NC}"
            log_message "CI/CD succeeded for task: $task (attempt $attempt)"
            return 0
        else
            echo -e "${RED}❌ CI/CD failed on attempt $attempt${NC}"
            log_message "CI/CD failed for task: $task (attempt $attempt)"
            
            if [ $attempt -eq $MAX_CICD_RETRIES ]; then
                echo -e "${RED}💥 CI/CD failed after $MAX_CICD_RETRIES attempts${NC}"
                log_message "CI/CD failed after $MAX_CICD_RETRIES attempts for task: $task"
                echo -e "${YELLOW}🔧 Claude, please fix issues with the task: $task${NC}"
                return 1
            else
                echo -e "${YELLOW}⏳ Waiting 30 seconds before next attempt...${NC}"
                sleep 30
            fi
        fi
        
        ((attempt++))
    done
    
    return 1
}

# Function to process a single task
process_task() {
    local line_info="$1"
    local line_number=$(echo "$line_info" | cut -d: -f1)
    local task_line=$(echo "$line_info" | cut -d: -f2-)
    
    # Extract task description (remove the [ ] prefix)
    local task_description=$(echo "$task_line" | sed 's/^\[ \] *//')
    
    echo ""
    echo -e "${BLUE}📋 Processing Task:${NC}"
    echo -e "${YELLOW}Line $line_number: $task_description${NC}"
    echo ""
    
    # Step 1: Call Claude with the task
    call_claude "$task_description"
    
    echo ""
    
    # Step 2: Run CI/CD until it succeeds
    if run_cicd_until_success "$task_description"; then
        # Step 3: Mark task as completed
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

# Function to show progress
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

# Main orchestration loop
main() {
    echo -e "${BLUE}🚀 Todo List Orchestrator Starting...${NC}"
    log_message "Todo orchestrator started"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}🔍 DRY RUN MODE - No actual changes will be made${NC}"
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo -e "${YELLOW}📝 Verbose logging enabled${NC}"
    fi
    
    # Check if todo file exists
    check_todo_file
    
    # Show initial progress
    show_progress
    
    # Main processing loop
    local iteration=1
    while true; do
        echo -e "${BLUE}🔄 Iteration $iteration${NC}"
        log_verbose "Starting iteration $iteration"
        
        # Get unfinished tasks
        local unfinished_tasks=$(get_unfinished_tasks)
        
        if [ -z "$unfinished_tasks" ]; then
            echo -e "${GREEN}🎉 All tasks completed!${NC}"
            log_message "All tasks completed successfully"
            show_progress
            break
        fi
        
        # Pick the first unfinished task
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
            
            # In dry run mode, we need to simulate completion by breaking after one task
            if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}🔍 DRY RUN: Stopping after processing one task${NC}"
                echo -e "${BLUE}ℹ️  In normal mode, this would continue with all remaining tasks${NC}"
                break
            fi
        else
            echo -e "${RED}❌ Task failed - stopping orchestrator${NC}"
            log_message "Task failed - orchestrator stopped"
            exit 1
        fi
        
        ((iteration++))
        
        # Add a small delay between iterations
        if [ "$DRY_RUN" != true ]; then
            echo -e "${YELLOW}⏳ Waiting 5 seconds before next iteration...${NC}"
            sleep 5
        fi
    done
    
    echo -e "${GREEN}🏆 Todo orchestrator completed successfully!${NC}"
    log_message "Todo orchestrator completed successfully"
}

# Trap to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Orchestrator interrupted${NC}"
    log_message "Orchestrator interrupted"
    exit 1
}

trap cleanup INT TERM

# Run main function
main "$@"