#!/bin/bash

# Local Redeploy Script
# This script redeploys the application locally using docker-compose.local.yml

set -e

# Get current branch as default
CURRENT_BRANCH=$(git branch --show-current)

# Get the branch name from command line argument or use current branch as default
BRANCH=${1:-$CURRENT_BRANCH}

echo "Redeploying locally from branch: $BRANCH"
echo ""


# Determine which Docker Compose command format to use
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' found"
    exit 1
fi

echo ""
echo "Stopping existing containers..."
$DOCKER_COMPOSE -f docker-compose.local.yml down

# Remove the frontend build volume to ensure fresh build
echo "Removing frontend build volume..."
docker volume rm searchable_frontend_build || true

echo ""
echo "Building containers..."
$DOCKER_COMPOSE -f docker-compose.local.yml build

echo ""
echo "Starting containers..."
$DOCKER_COMPOSE -f docker-compose.local.yml up -d

echo ""
echo "Local redeployment complete!"
echo "You can access the application at:"
echo "  - http://localhost"
echo "  - http://localhost:443 (no SSL)"
echo "  - http://localhost:5005 (Flask API directly)"
echo ""
echo "To view logs: $DOCKER_COMPOSE -f docker-compose.local.yml logs -f"