# Claude Continuous Issue Fixer

This script automatically works on GitHub issues using Claude Code.

## Setup

1. Make sure you have the required tools installed:
   - `gh` (GitHub CLI) - authenticated with `gh auth login`
   - `claude` (Claude Code CLI)
   - `jq` (JSON processor)
   - `git`

2. Make sure you're in the searchable project directory

## Usage

```bash
./claude_continuous.sh
```

## What it does

1. **Fetches Issues**: Gets the first open issue from the repository
2. **Creates Branch**: Makes a new branch for the fix
3. **Runs Claude**: Opens Claude Code with the issue details
4. **Waits**: Shows progress while Claude works
5. **Tests**: Runs CI/CD tests when Claude finishes
6. **Creates PR**: If tests pass, creates and merges a PR
7. **Repeats**: Moves to the next issue

## Features

- Shows real-time progress
- Automatically commits changes
- Runs tests before creating PR
- Merges PR if tests pass
- Handles test failures gracefully
- Logs all activity

## Logs

Check `claude_continuous_*.log` files for detailed logs of each run.

## Stop

Press `Ctrl+C` to stop the script.