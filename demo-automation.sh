#!/bin/bash

# Demo version that shows how the automation works
# This uses a simple test case that will pass

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TODO_FILE="demo-todo-list.txt"
LOG_FILE="demo-automation.log"

# Function to display colored output
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
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

# Main demo
print_colored "$BLUE" "🎬 Demo: Work Automation Script"
print_colored "$YELLOW" "\nThis demonstrates how the automation works:"
print_colored "$YELLOW" "1. Reads tasks from todo-list.txt"
print_colored "$YELLOW" "2. Marks task as in-progress [*]"
print_colored "$YELLOW" "3. Simulates calling Claude to work on it"
print_colored "$YELLOW" "4. Runs CI/CD tests"
print_colored "$YELLOW" "5. Marks task as done [x] when tests pass"

echo -e "\n📝 Initial todo list:"
cat "$TODO_FILE"

# Get first task
task_info=$(get_next_task)
if [ -n "$task_info" ]; then
    line_num=$(echo "$task_info" | cut -d: -f1)
    task_desc=$(echo "$task_info" | cut -d: -f2- | sed 's/^\[ \] //')
    
    print_colored "$YELLOW" "\n\n🚀 Processing: $task_desc"
    mark_in_progress "$line_num"
    
    echo -e "\n📝 Todo list (task in progress):"
    cat "$TODO_FILE"
    
    print_colored "$BLUE" "\n💭 [SIMULATED] Claude is working on: $task_desc"
    sleep 1
    
    print_colored "$BLUE" "\n🧪 Running CI/CD tests..."
    # Run a simple test that will pass
    if ./exec.sh local test --t ai_content >/dev/null 2>&1; then
        print_colored "$GREEN" "✅ Tests passed!"
        mark_done "$line_num"
    else
        print_colored "$RED" "❌ Tests failed (this shouldn't happen in demo)"
    fi
    
    echo -e "\n📝 Final todo list:"
    cat "$TODO_FILE"
    
    remaining=$(count_remaining_tasks)
    print_colored "$GREEN" "\n✨ Task completed! $remaining tasks remaining."
fi

print_colored "$BLUE" "\n\n📌 To use the real automation script:"
print_colored "$YELLOW" "1. Edit todo-list.txt with your tasks"
print_colored "$YELLOW" "2. Run: ./work-automation.sh"
print_colored "$YELLOW" "3. The script will process each task until CI/CD passes"