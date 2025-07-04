#!/bin/bash

# Claude Continuous Issue Fixer
# Simple script that continuously works on GitHub issues

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
    
    # Create prompt file
    cat > .claude_prompt.md << EOF
# Fix Issue #$ISSUE_NUM: $ISSUE_TITLE

## Issue Description
$ISSUE_BODY

## Instructions
1. Implement a complete fix for this issue
2. Run tests with: ./exec.sh local cicd
3. Fix any errors that come up
4. Make sure all tests pass
5. Don't ask questions - make reasonable decisions

Please fix this issue completely.
EOF
    
    log "${YELLOW}Starting Claude...${NC}"
    
    # Run Claude interactively in the background
    claude .claude_prompt.md &
    CLAUDE_PID=$!
    
    log "${GREEN}Claude is working (PID: $CLAUDE_PID)${NC}"
    log "${YELLOW}Waiting for Claude to finish...${NC}"
    
    # Wait for Claude with visual feedback
    SECONDS=0
    while kill -0 $CLAUDE_PID 2>/dev/null; do
        printf "\r${BLUE}⏱️  Claude working... %ds${NC} " $SECONDS
        sleep 5
        SECONDS=$((SECONDS + 5))
        
        # Check if Claude made changes
        if [ -n "$(git status --porcelain)" ] && [ $SECONDS -gt 30 ]; then
            log "\n${GREEN}Claude made changes!${NC}"
        fi
    done
    echo ""
    
    # Check if changes were made
    if [ -z "$(git status --porcelain)" ]; then
        log "${YELLOW}No changes made${NC}"
    else
        # Commit changes
        git add -A >/dev/null 2>&1
        git commit -m "Auto-fix #$ISSUE_NUM: $ISSUE_TITLE" >/dev/null 2>&1
        log "${GREEN}Changes committed${NC}"
        
        # Test
        log "${BLUE}Running tests...${NC}"
        if ./exec.sh local cicd >/dev/null 2>&1; then
            log "${GREEN}✅ Tests passed!${NC}"
            
            # Push and create PR
            git push -u origin "$BRANCH" >/dev/null 2>&1
            PR_URL=$(gh pr create \
                --repo "$REPO" \
                --base "pre-main" \
                --title "🤖 Fix #$ISSUE_NUM: $ISSUE_TITLE" \
                --body "Automated fix by Claude" \
                2>/dev/null)
            
            if [ -n "$PR_URL" ]; then
                log "${GREEN}✅ PR created: $PR_URL${NC}"
                
                # Try to merge
                if gh pr merge "$PR_URL" --repo "$REPO" --merge --delete-branch >/dev/null 2>&1; then
                    log "${GREEN}✅ PR merged!${NC}"
                    gh issue close "$ISSUE_NUM" --repo "$REPO" >/dev/null 2>&1
                fi
            fi
        else
            log "${RED}❌ Tests failed${NC}"
            
            # Create PR anyway for manual review
            git push -u origin "$BRANCH" >/dev/null 2>&1
            gh pr create \
                --repo "$REPO" \
                --base "pre-main" \
                --title "🤖 [TESTS FAILING] Fix #$ISSUE_NUM: $ISSUE_TITLE" \
                --body "Automated fix attempt by Claude. Tests are failing - manual review needed." \
                >/dev/null 2>&1
        fi
    fi
    
    # Cleanup
    rm -f .claude_prompt.md
    git checkout main >/dev/null 2>&1
    
    log "${BLUE}Waiting 10s before next issue...${NC}"
    sleep 10
done