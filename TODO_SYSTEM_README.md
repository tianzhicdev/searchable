# Todo List System for Claude Integration

This system provides an automated way to manage todo lists and integrate them with CI/CD workflows and Claude AI assistance.

## Quick Start

```bash
# 1. See the system in action with a demo
./demo-orchestrator.sh

# 2. Test with dry-run mode
./todo-orchestrator.sh --dry-run

# 3. Run the actual orchestrator
./todo-orchestrator.sh
```

## Files

### Core Files
- **`todo-list.txt`** - Main todo list file with tasks marked as `[ ]` (unfinished) or `[x]` (completed)
- **`todo-orchestrator.sh`** - Main orchestration script that manages the entire workflow

### Demo & Testing
- **`demo-orchestrator.sh`** - Full working demonstration with mock CI/CD
- **`demo-todo.txt`** - Sample todo file for demonstration
- **`test-todo-orchestrator.sh`** - Test version for safe testing
- **`test-todo.txt`** - Sample todo file for testing

### Documentation
- **`TODO_SYSTEM_README.md`** - This comprehensive guide

### Log Files (Generated)
- **`todo-orchestrator.log`** - Main orchestrator log file
- **`demo-orchestrator.log`** - Demo orchestrator log file
- **`test-todo-orchestrator.log`** - Test orchestrator log file

## Usage

### Basic Usage

```bash
# Run the orchestrator (processes all unfinished tasks)
./todo-orchestrator.sh

# Dry run mode (shows what would be done without executing)
./todo-orchestrator.sh --dry-run

# Verbose mode (detailed logging)
./todo-orchestrator.sh --verbose

# Combined modes
./todo-orchestrator.sh --dry-run --verbose
```

### Testing

```bash
# Test the workflow with mock CI/CD
./test-todo-orchestrator.sh
```

## How It Works

### Workflow Overview

1. **Parse todo-list.txt** - Identifies unfinished tasks marked with `[ ]`
2. **Pick Task** - Selects the first unfinished task
3. **Call Claude** - Notifies Claude about the task (placeholder for future AI integration)
4. **Run CI/CD** - Executes `./exec.sh local cicd` until it succeeds (with retry logic)
5. **Mark Complete** - Changes `[ ]` to `[x]` when task is successfully processed
6. **Repeat** - Continues until all tasks are completed

### Task Format

Tasks in `todo-list.txt` should follow this format:

```
# Comments start with # and are ignored
# Empty lines are ignored

[ ] This is an unfinished task
[x] This is a completed task
```

### Exit Codes

The script follows proper exit code conventions:
- **0** - Success (all tasks completed)
- **1** - Failure (task failed, file not found, permission issues, etc.)

### CI/CD Integration

The script runs `./exec.sh local cicd` which:
- Stops and removes all Docker containers
- Rebuilds all images from scratch
- Starts all services
- Runs comprehensive integration tests

The script will retry CI/CD up to 3 times per task before giving up.

### Error Handling

- If CI/CD fails after maximum retries, the script stops and reports the failure
- If a task cannot be marked as completed, the script reports the error
- All errors are logged to the log file with timestamps

### Claude Integration

Currently, the Claude integration is a placeholder that logs the task. In the future, this could be enhanced to:
- Send tasks to Claude API
- Get automated fixes from Claude
- Apply Claude suggestions automatically

## Examples

### Basic Todo List

```
# Searchable Project Todo List

[ ] Fix database connection timeout issues
[ ] Update API rate limiting configuration
[ ] Implement user authentication improvements
[x] Add comprehensive error handling
[ ] Optimize search performance
```

### Running the Orchestrator

```bash
# Start processing all unfinished tasks
./todo-orchestrator.sh

# Output:
# 🚀 Todo List Orchestrator Starting...
# 📊 Progress Summary:
#   Total tasks: 5
#   Completed: 1
#   Remaining: 4
#   Progress: 20%
# 
# 🔄 Iteration 1
# 📝 Found unfinished tasks:
#   - Fix database connection timeout issues
#   - Update API rate limiting configuration  
#   - Implement user authentication improvements
#   - Optimize search performance
# 
# 🎯 Processing first unfinished task...
# 📋 Processing Task:
# Line 3: Fix database connection timeout issues
# 
# 🤖 Claude processing task:
# Task: Fix database connection timeout issues
# 
# 🔄 CI/CD Attempt 1/3 for task: Fix database connection timeout issues
# [CI/CD output...]
# ✅ CI/CD succeeded on attempt 1
# ✅ Marked task as completed: Fix database connection timeout issues
# 🎉 Task completed successfully!
```

## Features

### Progress Tracking
- Shows total tasks, completed tasks, remaining tasks, and completion percentage
- Updates after each task completion

### Retry Logic
- Automatically retries CI/CD up to 3 times per task
- Waits 30 seconds between retry attempts
- Logs all attempts and results

### Logging
- Comprehensive logging to timestamped log files
- Verbose mode for detailed debugging
- Separate logs for test runs

### Safety Features
- Dry run mode for testing workflow without making changes
- File validation before processing
- Error handling for missing files or permissions
- Graceful handling of interrupts (Ctrl+C)

## Configuration

You can modify these settings in the script:

```bash
TODO_FILE="$SCRIPT_DIR/todo-list.txt"       # Path to todo file
LOG_FILE="$SCRIPT_DIR/todo-orchestrator.log" # Path to log file
MAX_CICD_RETRIES=3                           # Maximum CI/CD retry attempts
```

## Integration with Existing Workflow

This system is designed to work with the existing `exec.sh` script and integrates seamlessly with:
- Local Docker Compose setup
- CI/CD pipeline via `./exec.sh local cicd`
- Integration test suite
- Error reporting and logging systems

The orchestrator ensures that `./exec.sh local cicd` returns non-zero exit codes on failure, which is essential for proper error handling and retry logic.