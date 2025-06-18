#!/bin/bash

# Searchable Project Execution Script
# Unified interface for local and remote operations
# Usage: ./exec.sh <environment> <action> [container_name]

set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
REMOTE_HOST="cherry-interest.metalseed.net"
REMOTE_USER="searchable"
REMOTE_PATH="/home/searchable/searchable"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
show_usage() {
    echo -e "${BLUE}Searchable Execution Script${NC}"
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./exec.sh remote deploy <container_name>    - Deploy specific container remotely"
    echo "  ./exec.sh remote deploy-all                 - Deploy all containers remotely"
    echo "  ./exec.sh remote logs <container_name>      - Show logs for remote container"
    echo "  ./exec.sh remote status                     - Show status of remote containers"
    echo ""
    echo "  ./exec.sh local react                       - Start React development server locally"
    echo "  ./exec.sh local deploy <container_name>     - Deploy specific container locally"
    echo "  ./exec.sh local deploy-all                  - Deploy all containers locally"
    echo "  ./exec.sh local logs <container_name>       - Show logs for local container"
    echo "  ./exec.sh local status                      - Show status of local containers"
    echo "  ./exec.sh local it                          - Run comprehensive integration tests"
    echo "  ./exec.sh local mock                        - Start React in mock mode"
    echo ""
    echo "  ./exec.sh release                           - Release new version (merge to main, bump version, deploy)"
    echo ""
    echo -e "${YELLOW}Available containers:${NC}"
    echo "  - frontend"
    echo "  - flask_api"
    echo "  - file_server"
    echo "  - background"
    echo "  - db"
    echo "  - nginx"
    echo "  - usdt-api"
    echo "  - metrics"
    echo "  - grafana"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./exec.sh remote deploy flask_api"
    echo "  ./exec.sh remote logs flask_api"
    echo "  ./exec.sh local react"
    echo "  ./exec.sh local deploy-all"
    echo "  ./exec.sh local status"
    echo "  ./exec.sh local it"
    echo "  ./exec.sh local mock"
    echo "  ./exec.sh release"
}

# Function to check if container name is valid
validate_container() {
    local container=$1
    local valid_containers=("frontend" "flask_api" "file_server" "background" "db" "nginx" "usdt-api" "metrics" "grafana")
    
    for valid in "${valid_containers[@]}"; do
        if [ "$container" = "$valid" ]; then
            return 0
        fi
    done
    
    echo -e "${RED}Error: Invalid container name '$container'${NC}"
    echo "Valid containers are: ${valid_containers[*]}"
    exit 1
}

# Function to determine Docker Compose command
get_docker_compose_cmd() {
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' found${NC}"
        exit 1
    fi
}

# Remote deploy single container
remote_deploy_container() {
    local container=$1
    validate_container "$container"
    
    echo -e "${BLUE}🚀 Deploying $container to remote server...${NC}"
    echo "Remote: $REMOTE_USER@$REMOTE_HOST"
    
    ssh $REMOTE_USER@$REMOTE_HOST << EOF
        cd $REMOTE_PATH
        echo "📦 Building and deploying $container..."
        
        # Get current branch
        BRANCH=\$(git branch --show-current)
        echo "Branch: \$BRANCH"
        
        # Pull latest changes
        git pull origin \$BRANCH
        
        # Determine Docker Compose command
        if command -v docker &> /dev/null && docker compose version &> /dev/null; then
            DOCKER_COMPOSE="docker compose"
        else
            DOCKER_COMPOSE="docker-compose"
        fi
        
        # Build and restart specific container
        \$DOCKER_COMPOSE build $container
        \$DOCKER_COMPOSE up -d $container
        
        echo "✅ Container $container deployed successfully!"
EOF
    
    echo -e "${GREEN}✅ Remote deployment of $container completed!${NC}"
}

# Remote deploy all containers
remote_deploy_all() {
    echo -e "${BLUE}🚀 Deploying all containers to remote server...${NC}"
    echo "Remote: $REMOTE_USER@$REMOTE_HOST"
    
    ssh $REMOTE_USER@$REMOTE_HOST << EOF
        cd $REMOTE_PATH
        echo "📦 Running full deployment..."
        
        # Run the existing redeploy script
        ./redeploy.sh
EOF
    
    echo -e "${GREEN}✅ Remote deployment completed!${NC}"
}

# Remote container logs
remote_logs() {
    local container=$1
    validate_container "$container"
    
    echo -e "${BLUE}📋 Fetching logs for $container from remote server...${NC}"
    echo "Remote: $REMOTE_USER@$REMOTE_HOST"
    
    ssh $REMOTE_USER@$REMOTE_HOST << EOF
        cd $REMOTE_PATH
        
        # Map service names to container names
        case "$container" in
            "flask_api"|"file_server")
                CONTAINER_NAME="$container"
                ;;
            *)
                CONTAINER_NAME="searchable-$container-1"
                ;;
        esac
        
        echo "Container: \$CONTAINER_NAME"
        echo "================================"
        docker logs --tail 100 -f \$CONTAINER_NAME
EOF
}

# Remote container status
remote_status() {
    echo -e "${BLUE}📊 Checking status of remote containers...${NC}"
    echo "Remote: $REMOTE_USER@$REMOTE_HOST"
    
    ssh $REMOTE_USER@$REMOTE_HOST << EOF
        cd $REMOTE_PATH
        echo ""
        echo "🐳 Docker containers status:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(searchable|flask_api|file_server)" || true
        echo ""
        echo "💾 Docker images:"
        docker images | grep searchable || true
EOF
}

# Local React development server
local_react() {
    echo -e "${BLUE}🚀 Starting React development server...${NC}"
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install --legacy-peer-deps
    fi
    
    echo -e "${YELLOW}Starting React app in development mode...${NC}"
    echo "Access the app at: http://localhost:3000"
    echo ""
    
    # Start React development server
    REACT_APP_ENV=local \
    REACT_APP_BRANDING=silkroadonlightning \
    REACT_APP_LOGO=camel_logo.jpg \
    REACT_APP_DESCRIPTION='Silk Road on Lightning' \
    NODE_OPTIONS=--openssl-legacy-provider \
    npm start
}

# Local integration tests
local_it() {
    echo -e "${BLUE}🧪 Running comprehensive integration tests...${NC}"
    
    if [ ! -d "integration-tests" ]; then
        echo -e "${RED}Error: integration-tests directory not found${NC}"
        exit 1
    fi
    
    cd integration-tests
    
    echo -e "${YELLOW}Starting integration test suite...${NC}"
    echo ""
    
    # Run the comprehensive tests
    ./run_comprehensive_tests.sh
}

# Local React development server in mock mode
local_mock() {
    echo -e "${BLUE}🚀 Starting React development server in mock mode...${NC}"
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install --legacy-peer-deps
    fi
    
    echo -e "${YELLOW}Starting React app in mock mode...${NC}"
    echo "Access the app at: http://localhost:3001"
    echo ""
    
    # Start React development server with mock mode enabled on port 3001
    PORT=3001 \
    REACT_APP_MOCK_MODE=true \
    REACT_APP_ENV=local \
    REACT_APP_BRANDING=silkroadonlightning \
    REACT_APP_LOGO=camel_logo.jpg \
    REACT_APP_DESCRIPTION='Silk Road on Lightning' \
    NODE_OPTIONS=--openssl-legacy-provider \
    npm start
}

# Release workflow - merge to main, bump version, and deploy
release() {
    echo -e "${BLUE}🚀 Starting release workflow...${NC}"
    
    # Check if we have uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
        exit 1
    fi
    
    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo "Current branch: $CURRENT_BRANCH"
    
    if [ "$CURRENT_BRANCH" = "main" ]; then
        echo -e "${RED}Error: You are already on main branch. Please run this from a feature branch.${NC}"
        exit 1
    fi
    
    # Get current version
    CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
    echo "Current version: $CURRENT_VERSION"
    
    # Bump patch version (increment the last number)
    MAJOR=$(echo $CURRENT_VERSION | cut -d. -f1)
    MINOR=$(echo $CURRENT_VERSION | cut -d. -f2)
    PATCH=$(echo $CURRENT_VERSION | cut -d. -f3)
    NEW_PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
    
    echo -e "${YELLOW}Bumping version from $CURRENT_VERSION to $NEW_VERSION${NC}"
    
    # Update root package.json
    sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
    rm package.json.bak
    
    # Update frontend package.json if it exists
    if [ -f "frontend/package.json" ]; then
        sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json
        rm frontend/package.json.bak
    fi
    
    # Update frontend version.js
    echo "// Auto-generated version file" > frontend/src/version.js
    echo "// This file is updated by the release script" >> frontend/src/version.js
    echo "export const APP_VERSION = '$NEW_VERSION';" >> frontend/src/version.js
    
    # Commit version changes
    git add package.json frontend/package.json frontend/src/version.js
    git commit -m "Bump version to $NEW_VERSION"
    
    echo -e "${YELLOW}Switching to main branch...${NC}"
    git checkout main
    
    echo -e "${YELLOW}Pulling latest changes from main...${NC}"
    git pull origin main
    
    echo -e "${YELLOW}Merging $CURRENT_BRANCH into main...${NC}"
    git merge "$CURRENT_BRANCH" --no-ff -m "Merge branch '$CURRENT_BRANCH' - Release $NEW_VERSION"
    
    echo -e "${YELLOW}Pushing to remote main...${NC}"
    git push origin main
    
    echo -e "${YELLOW}Creating version tag...${NC}"
    git tag "v$NEW_VERSION"
    git push origin "v$NEW_VERSION"
    
    echo -e "${YELLOW}Deploying to remote...${NC}"
    remote_deploy_all
    
    echo -e "${GREEN}✅ Release $NEW_VERSION completed successfully!${NC}"
    echo -e "${BLUE}📝 Summary:${NC}"
    echo "  - Version bumped: $CURRENT_VERSION → $NEW_VERSION"
    echo "  - Branch merged: $CURRENT_BRANCH → main"
    echo "  - Tag created: v$NEW_VERSION"
    echo "  - Remote deployment completed"
    echo ""
    echo -e "${YELLOW}You can now switch back to your feature branch:${NC}"
    echo "  git checkout $CURRENT_BRANCH"
}

# Local deploy single container
local_deploy_container() {
    local container=$1
    validate_container "$container"
    
    echo -e "${BLUE}🚀 Deploying $container locally...${NC}"
    
    DOCKER_COMPOSE=$(get_docker_compose_cmd)
    
    # Build and restart specific container
    echo "📦 Building $container..."
    $DOCKER_COMPOSE -f docker-compose.local.yml build $container
    
    echo "🔄 Restarting $container..."
    $DOCKER_COMPOSE -f docker-compose.local.yml up -d $container
    
    echo -e "${GREEN}✅ Local deployment of $container completed!${NC}"
    echo "Container logs: $DOCKER_COMPOSE -f docker-compose.local.yml logs -f $container"
}

# Local deploy all containers
local_deploy_all() {
    echo -e "${BLUE}🚀 Deploying all containers locally...${NC}"
    
    # Use the existing local_redeploy.sh script
    ./local_redeploy.sh
    
    echo -e "${GREEN}✅ Local deployment completed!${NC}"
}

# Local container logs
local_logs() {
    local container=$1
    validate_container "$container"
    
    echo -e "${BLUE}📋 Fetching logs for $container locally...${NC}"
    
    DOCKER_COMPOSE=$(get_docker_compose_cmd)
    
    # Map service names to container names
    case "$container" in
        "flask_api"|"file_server")
            CONTAINER_NAME="$container"
            ;;
        *)
            CONTAINER_NAME="searchable-$container-1"
            ;;
    esac
    
    echo "Container: $CONTAINER_NAME"
    echo "================================"
    $DOCKER_COMPOSE -f docker-compose.local.yml logs --tail 100 -f $container
}

# Local container status
local_status() {
    echo -e "${BLUE}📊 Checking status of local containers...${NC}"
    
    DOCKER_COMPOSE=$(get_docker_compose_cmd)
    
    echo ""
    echo "🐳 Docker containers status:"
    $DOCKER_COMPOSE -f docker-compose.local.yml ps
    
    echo ""
    echo "💾 Docker images:"
    docker images | grep searchable || true
}

# Main script logic
if [ $# -lt 1 ]; then
    show_usage
    exit 1
fi

# Special case for release command
if [ "$1" = "release" ]; then
    ENVIRONMENT="release"
    ACTION=""
    CONTAINER=""
elif [ $# -lt 2 ]; then
    show_usage
    exit 1
else
    ENVIRONMENT=$1
    ACTION=$2
    CONTAINER=$3
fi

case "$ENVIRONMENT" in
    "remote")
        case "$ACTION" in
            "deploy")
                if [ -z "$CONTAINER" ]; then
                    echo -e "${RED}Error: Container name required for deploy action${NC}"
                    show_usage
                    exit 1
                fi
                remote_deploy_container "$CONTAINER"
                ;;
            "deploy-all")
                remote_deploy_all
                ;;
            "logs")
                if [ -z "$CONTAINER" ]; then
                    echo -e "${RED}Error: Container name required for logs action${NC}"
                    show_usage
                    exit 1
                fi
                remote_logs "$CONTAINER"
                ;;
            "status")
                remote_status
                ;;
            *)
                echo -e "${RED}Error: Invalid action '$ACTION' for remote environment${NC}"
                show_usage
                exit 1
                ;;
        esac
        ;;
    
    "local")
        case "$ACTION" in
            "react")
                local_react
                ;;
            "deploy")
                if [ -z "$CONTAINER" ]; then
                    echo -e "${RED}Error: Container name required for deploy action${NC}"
                    show_usage
                    exit 1
                fi
                local_deploy_container "$CONTAINER"
                ;;
            "deploy-all")
                local_deploy_all
                ;;
            "logs")
                if [ -z "$CONTAINER" ]; then
                    echo -e "${RED}Error: Container name required for logs action${NC}"
                    show_usage
                    exit 1
                fi
                local_logs "$CONTAINER"
                ;;
            "status")
                local_status
                ;;
            "it")
                local_it
                ;;
            "mock")
                local_mock
                ;;
            *)
                echo -e "${RED}Error: Invalid action '$ACTION' for local environment${NC}"
                show_usage
                exit 1
                ;;
        esac
        ;;
    
    "release")
        release
        ;;
    
    *)
        echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'${NC}"
        show_usage
        exit 1
        ;;
esac
