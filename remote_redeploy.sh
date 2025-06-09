#!/bin/bash

# Remote Redeploy Script
# This script connects to the remote server and redeploys the application

set -e

# Configuration
REMOTE_HOST="cherry-interest.metalseed.net"
REMOTE_USER="searchable"
REMOTE_PATH="/home/searchable/searchable"

# Get current branch as default
CURRENT_BRANCH=$(git branch --show-current)

# Get the branch name from command line argument or use current branch as default
BRANCH=${1:-$CURRENT_BRANCH}

echo "Deploying branch '$BRANCH' to remote server..."
echo "Remote: $REMOTE_USER@$REMOTE_HOST"
echo "Path: $REMOTE_PATH"
echo ""

# Connect to remote server and run redeploy
ssh $REMOTE_USER@$REMOTE_HOST << EOF
    echo "Connected to remote server"
    echo "Current directory: \$(pwd)"
    
    # Navigate to the codebase directory
    cd $REMOTE_PATH
    echo "Changed to: \$(pwd)"
    
    # Run the redeploy script with the specified branch
    echo "Running redeploy script for branch: $BRANCH"
    ./redeploy.sh $BRANCH
    
    echo "Remote deployment completed!"
EOF

echo ""
echo "Remote redeployment finished!"
echo "You can now run integration tests to verify the deployment."