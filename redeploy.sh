#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

checkout_ref() {
    local ref="$1"

    if git ls-remote --exit-code --tags origin "refs/tags/$ref" >/dev/null 2>&1; then
        echo "Detected tag: $ref"
        git fetch origin "refs/tags/$ref:refs/tags/$ref"
        git checkout --detach "refs/tags/$ref"
        return 0
    fi

    echo "Detected branch: $ref"
    git fetch origin "$ref"
    if git show-ref --verify --quiet "refs/heads/$ref"; then
        git checkout "$ref"
    else
        git checkout -b "$ref" "origin/$ref"
    fi
    git pull --ff-only origin "$ref"
}

# Get current branch as default
CURRENT_BRANCH=$(git branch --show-current)

# Get the branch name from command line argument or use current branch as default
BRANCH=${1:-$CURRENT_BRANCH}

echo "Redeploying from branch: $BRANCH"

# Fetch the latest changes and checkout the specified branch or tag
checkout_ref "$BRANCH"

# Determine which Docker Compose command format to use
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' found"
    exit 1
fi

# Restart Docker containers
$DOCKER_COMPOSE down
docker volume rm searchable_frontend_build || true
$DOCKER_COMPOSE build
$DOCKER_COMPOSE up -d

echo "Redeployment complete!"
