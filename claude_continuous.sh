#!/bin/bash

# Claude Continuous Issue Fixer
# Non-interactive script that continuously works on GitHub issues

set +e  # Continue on errors

# Config
REPO="${GITHUB_REPO:-tianzhicdev/searchable}"
MAX_ATTEMPTS=10
LOG_FILE="claude_continuous_$(date +%Y%m%d_%H%M%S).log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Log function
log() {
    echo -e "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Main loop
log "${GREEN}🤖 Claude Continuous Started${NC}"
log "Repository: $REPO"
log "================================="

while true; do
    # Get first open issue
    ISSUE=$(gh issue list --repo "$REPO" --state open --limit 1 --json number,title,body | jq -r '.[0]')
    
    if [ "$ISSUE" = "null" ] || [ -z "$ISSUE" ]; then
        log "${YELLOW}No open issues. Waiting 60s...${NC}"
        sleep 60
        continue
    fi
    
    ISSUE_NUM=$(echo "$ISSUE" | jq -r '.number')
    ISSUE_TITLE=$(echo "$ISSUE" | jq -r '.title')
    ISSUE_BODY=$(echo "$ISSUE" | jq -r '.body // "No description"')
    
    log "${BLUE}📋 Working on Issue #$ISSUE_NUM: $ISSUE_TITLE${NC}"
    
    # Create branch
    BRANCH="auto-fix-$ISSUE_NUM"
    git checkout main >/dev/null 2>&1
    git pull >/dev/null 2>&1
    git branch -D "$BRANCH" >/dev/null 2>&1 || true
    git checkout -b "$BRANCH" >/dev/null 2>&1
    
    # Fix loop - keep trying until CI/CD passes
    ATTEMPT=0
    FIXED=false
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ "$FIXED" = false ]; do
        ((ATTEMPT++))
        log "${YELLOW}Attempt $ATTEMPT/$MAX_ATTEMPTS${NC}"
        
        # Create prompt based on current state
        if [ $ATTEMPT -eq 1 ]; then
            # First attempt - implement the feature
            cat > .claude_prompt.md << EOF
# Fix Issue #$ISSUE_NUM: $ISSUE_TITLE

## Issue Description
$ISSUE_BODY

## Instructions
Please implement a complete solution for this issue. Make sure to:
1. Add all necessary code
2. Follow existing patterns in the codebase
3. Add any required imports
4. Don't ask questions - make reasonable decisions

Implement the solution now.
EOF
        else
            # Subsequent attempts - fix CI/CD errors
            log "${BLUE}Running CI/CD tests...${NC}"
            ./exec.sh local cicd > cicd_output.log 2>&1 || true
            
            # Check if tests pass
            if [ ${PIPESTATUS[0]} -eq 0 ]; then
                log "${GREEN}✅ All tests pass!${NC}"
                FIXED=true
                break
            fi
            
            # Extract errors
            tail -100 cicd_output.log > cicd_errors.txt
            
            cat > .claude_prompt.md << EOF
# Fix CI/CD Errors - Attempt $ATTEMPT

The CI/CD tests are failing. Here are the errors:

\`\`\`
$(cat cicd_errors.txt)
\`\`\`

Please fix these errors. Focus on:
1. Fixing syntax errors
2. Resolving import issues
3. Fixing test failures
4. Making sure all code compiles

Fix only what's broken - don't add new features.
EOF
        fi
        
        # Run Claude in non-interactive mode
        log "${BLUE}Running Claude...${NC}"
        claude --print --yes .claude_prompt.md 2>&1 | while IFS= read -r line; do
            # Show key actions only
            if [[ "$line" == *"Creating"* ]] || [[ "$line" == *"Writing"* ]] || [[ "$line" == *"Fixed"* ]] || [[ "$line" == *"Error"* ]]; then
                echo "  Claude: $line"
            fi
        done
        
        # Check if changes were made
        if [ -n "$(git status --porcelain)" ]; then
            git add -A >/dev/null 2>&1
            git commit -m "Attempt $ATTEMPT to fix #$ISSUE_NUM" >/dev/null 2>&1
            log "${GREEN}Changes committed${NC}"
        else
            log "${YELLOW}No changes made${NC}"
        fi
        
        # Small delay
        sleep 2
    done
    
    # Handle results
    if [ "$FIXED" = true ]; then
        log "${GREEN}✅ Issue fixed! Creating PR...${NC}"
        
        # Push and create PR
        git push -u origin "$BRANCH" >/dev/null 2>&1
        PR_URL=$(gh pr create \
            --repo "$REPO" \
            --base "pre-main" \
            --title "🤖 Fix #$ISSUE_NUM: $ISSUE_TITLE" \
            --body "Automated fix by Claude. All tests passing." \
            2>/dev/null)
        
        if [ -n "$PR_URL" ]; then
            log "${GREEN}PR created: $PR_URL${NC}"
            
            # Try to merge
            if gh pr merge "$PR_URL" --repo "$REPO" --merge --delete-branch >/dev/null 2>&1; then
                log "${GREEN}✅ PR merged!${NC}"
                gh issue close "$ISSUE_NUM" --repo "$REPO" --comment "✅ Fixed by Claude" >/dev/null 2>&1
            else
                log "${YELLOW}PR created but not merged${NC}"
            fi
        fi
    else
        log "${RED}❌ Failed after $MAX_ATTEMPTS attempts${NC}"
        
        # Create PR for manual review
        if [ -n "$(git status --porcelain)" ]; then
            git push -u origin "$BRANCH" >/dev/null 2>&1
            gh pr create \
                --repo "$REPO" \
                --base "pre-main" \
                --title "🤖 [NEEDS HELP] Fix #$ISSUE_NUM: $ISSUE_TITLE" \
                --body "Claude attempted $MAX_ATTEMPTS times but couldn't fix all issues. Manual intervention needed." \
                >/dev/null 2>&1
        fi
        
        # Comment on issue
        gh issue comment "$ISSUE_NUM" --repo "$REPO" \
            --body "🤖 Claude attempted to fix but needs human help after $MAX_ATTEMPTS attempts." \
            >/dev/null 2>&1
    fi
    
    # Cleanup
    rm -f .claude_prompt.md cicd_output.log cicd_errors.txt
    git checkout main >/dev/null 2>&1
    
    log "${BLUE}Moving to next issue in 10s...${NC}"
    sleep 10
done