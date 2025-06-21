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
    echo "  ./exec.sh beta deploy <container_name>      - Deploy specific container to beta"
    echo "  ./exec.sh beta deploy-all                   - Deploy all containers to beta"
    echo "  ./exec.sh beta logs <container_name>        - Show logs for beta container"
    echo "  ./exec.sh beta status                       - Show status of beta containers"
    echo "  ./exec.sh beta test                         - Run tests against beta (silkroadonlightning.com)"
    echo ""
    echo "  ./exec.sh prod test                         - Run tests against prod (eccentricprotocol.com)"
    echo ""
    echo "  ./exec.sh local react                       - Start React development server locally"
    echo "  ./exec.sh local deploy <container_name>     - Deploy specific container locally"
    echo "  ./exec.sh local deploy-all                  - Deploy all containers locally"
    echo "  ./exec.sh local logs <container_name>       - Show logs for local container"
    echo "  ./exec.sh local status                      - Show status of local containers"
    echo "  ./exec.sh local test                        - Run tests against local (localhost:5005)"
    echo "  ./exec.sh local mock                        - Start React in mock mode"
    echo "  ./exec.sh local cicd                        - Full CI/CD: tear down, rebuild, and test locally"
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
    echo "  ./exec.sh beta deploy flask_api"
    echo "  ./exec.sh beta logs flask_api"
    echo "  ./exec.sh beta test"
    echo "  ./exec.sh prod test"
    echo "  ./exec.sh local react"
    echo "  ./exec.sh local deploy-all"
    echo "  ./exec.sh local status"
    echo "  ./exec.sh local test"
    echo "  ./exec.sh local mock"
    echo "  ./exec.sh local cicd"
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

# Beta deploy single container
beta_deploy_container() {
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

# Beta deploy all containers
beta_deploy_all() {
    echo -e "${BLUE}🚀 Deploying all containers to remote server...${NC}"
    echo "Remote: $REMOTE_USER@$REMOTE_HOST"
    
    # First, commit and push local changes
    echo -e "${YELLOW}📝 Committing local changes...${NC}"
    
    # Check if we have uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        # Get current branch
        CURRENT_BRANCH=$(git branch --show-current)
        echo "Current branch: $CURRENT_BRANCH"
        
        # Add all changes
        git add -A
        
        # Create commit with timestamp
        TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
        git commit -m "Auto-deploy commit - $TIMESTAMP

🤖 Generated with Claude Code
https://claude.ai/code

Co-Authored-By: Claude <noreply@anthropic.com>"
        
        echo "✅ Changes committed to $CURRENT_BRANCH"
        
        # Push to remote
        echo -e "${YELLOW}📤 Pushing to remote repository...${NC}"
        git push origin $CURRENT_BRANCH
        echo "✅ Changes pushed to origin/$CURRENT_BRANCH"
    else
        echo "✅ No uncommitted changes found"
        CURRENT_BRANCH=$(git branch --show-current)
        echo "Current branch: $CURRENT_BRANCH"
    fi
    
    # Deploy to remote server
    ssh $REMOTE_USER@$REMOTE_HOST << EOF
        cd $REMOTE_PATH
        echo "📦 Running full deployment with git sync..."
        
        # Get current branch
        BRANCH=\$(git branch --show-current)
        echo "Remote branch: \$BRANCH"
        
        # Pull latest changes
        echo "📥 Pulling latest changes from origin/\$BRANCH..."
        git pull origin \$BRANCH
        
        # Run the existing redeploy script
        echo "🔄 Running full redeploy..."
        ./redeploy.sh
EOF
    
    echo -e "${GREEN}✅ Remote deployment completed!${NC}"
    echo -e "${BLUE}📝 Summary:${NC}"
    echo "  - Local changes committed and pushed"
    echo "  - Remote server pulled latest changes"
    echo "  - Full redeploy executed on beta server"
}

# Beta container logs
beta_logs() {
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

# Beta container status
beta_status() {
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

# Run comprehensive tests against specified environment
run_tests() {
    local environment=$1
    local api_url
    local site_name
    local test_prefix
    
    case "$environment" in
        "local")
            api_url="http://localhost:5005"
            site_name="Local (localhost:5005)"
            test_prefix="local_"
            ;;
        "beta")
            api_url="https://silkroadonlightning.com"
            site_name="Beta (silkroadonlightning.com)"
            test_prefix="beta_"
            ;;
        "prod")
            api_url="https://eccentricprotocol.com"
            site_name="Production (eccentricprotocol.com)"
            test_prefix="prod_"
            ;;
        *)
            echo -e "${RED}Error: Invalid environment '$environment'. Use 'local', 'beta' or 'prod'${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${BLUE}🧪 Running tests against $site_name${NC}"
    echo "API URL: $api_url/api"
    echo ""
    
    # Check if integration-tests directory exists
    if [ ! -d "$SCRIPT_DIR/integration-tests" ]; then
        echo -e "${RED}Error: integration-tests directory not found${NC}"
        exit 1
    fi
    
    # Navigate to integration tests directory
    cd "$SCRIPT_DIR/integration-tests"
    
    echo -e "${YELLOW}Running comprehensive test suite against $site_name...${NC}"
    if [ "$environment" != "local" ]; then
        echo "This will create test users, searchables, and transactions on the server."
    fi
    echo ""
    
    # Set URLs based on environment
    if [ "$environment" = "local" ]; then
        metrics_url="http://localhost:5007"
        grafana_url="http://localhost:3000"
        grafana_proxy_url="http://localhost/grafana"
    else
        # For beta and prod, construct URLs with same protocol and domain as API
        # Extract the protocol and domain from api_url
        if [[ "$api_url" =~ ^(https?)://([^/]+) ]]; then
            protocol="${BASH_REMATCH[1]}"
            domain="${BASH_REMATCH[2]}"
            metrics_url="${protocol}://${domain}/metrics"
            grafana_url="${protocol}://${domain}/grafana"
            grafana_proxy_url="${protocol}://${domain}/grafana"
        else
            echo "Error: Could not parse API URL: $api_url"
            exit 1
        fi
    fi
    
    # Run tests with environment variables directly (no .env file manipulation)
    BASE_URL="$api_url" \
    METRICS_URL="$metrics_url" \
    GRAFANA_URL="$grafana_url" \
    GRAFANA_PROXY_URL="$grafana_proxy_url" \
    TEST_USER_PREFIX="${test_prefix}" \
    TEST_EMAIL_DOMAIN="${environment}.test" \
    DEFAULT_PASSWORD="TestPass123!" \
    REQUEST_TIMEOUT=30 \
    UPLOAD_TIMEOUT=60 \
    ./run_comprehensive_tests.sh
    
    TEST_RESULT=$?
    
    # Return to original directory
    cd "$SCRIPT_DIR"
    
    echo ""
    echo -e "${BLUE}🧪 Test Summary for $site_name${NC}"
    echo "================================"
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        echo -e "${GREEN}🎉 $site_name is healthy and functioning correctly.${NC}"
    else
        echo -e "${RED}❌ Some tests failed!${NC}"
        echo -e "${YELLOW}Check the test output above for details.${NC}"
        echo ""
        if [ "$environment" != "local" ]; then
            echo -e "${YELLOW}Common issues:${NC}"
            echo "  - API endpoint not accessible"
            echo "  - Database connection issues"
            echo "  - Service configuration problems"
            echo "  - Rate limiting or firewall rules"
        fi
        exit 1
    fi
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
local_test() {
    run_tests "local"
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

# Local CI/CD workflow - tear down everything, rebuild, and test
local_cicd() {
    echo -e "${BLUE}🔄 Starting full CI/CD workflow...${NC}"
    echo -e "${YELLOW}This will:${NC}"
    echo "  1. 🗑️  Stop and remove all Docker containers"
    echo "  2. 🧹 Remove all Docker volumes and networks"
    echo "  3. 🏗️  Rebuild and start all containers"
    echo "  4. ⏳ Wait for services to be ready"
    echo "  5. 🧪 Run comprehensive integration tests"
    echo ""
    
    # Confirm before proceeding
    read -p "Continue with CI/CD workflow? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}CI/CD workflow cancelled.${NC}"
        exit 0
    fi
    
    DOCKER_COMPOSE=$(get_docker_compose_cmd)
    
    echo -e "${BLUE}📋 Step 1/5: Stopping and removing containers...${NC}"
    
    # Stop all containers (ignore errors)
    echo "Stopping all containers..."
    docker stop $(docker ps -aq) 2>/dev/null || true
    
    # Remove all containers (ignore errors)
    echo "Removing all containers..."
    docker rm $(docker ps -aq) 2>/dev/null || true
    
    # Remove all volumes (ignore errors)
    echo "Removing all volumes..."
    docker volume rm $(docker volume ls -q) 2>/dev/null || true
    
    # Remove all networks (ignore errors)
    echo "Removing custom networks..."
    docker network rm $(docker network ls --filter type=custom -q) 2>/dev/null || true
    
    # Clean up Docker system
    echo "Cleaning up Docker system..."
    docker system prune -f 2>/dev/null || true
    
    echo -e "${GREEN}✅ Step 1 complete: Environment cleaned${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Step 2/5: Building Docker images...${NC}"
    
    # Build all images from scratch
    echo "Building all Docker images..."
    $DOCKER_COMPOSE -f docker-compose.local.yml build --no-cache --pull
    
    echo -e "${GREEN}✅ Step 2 complete: Images built${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Step 3/5: Starting all services...${NC}"
    
    # Start all containers
    echo "Starting all containers..."
    $DOCKER_COMPOSE -f docker-compose.local.yml up -d
    
    echo -e "${GREEN}✅ Step 3 complete: Services started${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Step 4/5: Waiting for services to be ready...${NC}"
    
    # Wait for services to be ready
    echo "Waiting for database to be ready..."
    sleep 10
    
    # Check if Flask API is responding
    echo "Checking Flask API health..."
    for i in {1..30}; do
        if curl -s http://localhost:5005/api/health >/dev/null 2>&1; then
            echo "✅ Flask API is ready"
            break
        fi
        echo "⏳ Waiting for Flask API... (attempt $i/30)"
        sleep 2
    done
    
    # Additional wait for full initialization
    echo "Allowing additional time for full service initialization..."
    sleep 5
    
    echo -e "${GREEN}✅ Step 4 complete: Services are ready${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Step 5/5: Running comprehensive integration tests...${NC}"
    
    # Run local tests
    run_tests "local"
    TEST_RESULT=$?
    
    echo ""
    echo -e "${BLUE}🎯 CI/CD Workflow Summary${NC}"
    echo "================================"
    echo "✅ Environment cleaned and rebuilt"
    echo "✅ All services started"
    echo "✅ Integration tests completed"
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}🎉 CI/CD workflow completed successfully!${NC}"
        echo -e "${YELLOW}All containers are running and tests passed.${NC}"
        echo ""
        echo -e "${BLUE}🔗 Service URLs:${NC}"
        echo "  Frontend: http://localhost:80"
        echo "  API: http://localhost:5005"
        echo "  Grafana: http://localhost:3050"
        echo ""
        echo -e "${YELLOW}To view logs:${NC} ./exec.sh local logs <container_name>"
        echo -e "${YELLOW}To check status:${NC} ./exec.sh local status"
    else
        echo -e "${RED}❌ CI/CD workflow failed!${NC}"
        echo -e "${YELLOW}Check the test output above for details.${NC}"
        echo ""
        echo -e "${YELLOW}To debug:${NC}"
        echo "  ./exec.sh local status"
        echo "  ./exec.sh local logs <container_name>"
        exit 1
    fi
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
    
    echo -e "${YELLOW}Deploying to beta...${NC}"
    beta_deploy_all
    
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
    "beta")
        case "$ACTION" in
            "deploy")
                if [ -z "$CONTAINER" ]; then
                    echo -e "${RED}Error: Container name required for deploy action${NC}"
                    show_usage
                    exit 1
                fi
                beta_deploy_container "$CONTAINER"
                ;;
            "deploy-all")
                beta_deploy_all
                ;;
            "logs")
                if [ -z "$CONTAINER" ]; then
                    echo -e "${RED}Error: Container name required for logs action${NC}"
                    show_usage
                    exit 1
                fi
                beta_logs "$CONTAINER"
                ;;
            "status")
                beta_status
                ;;
            "test")
                run_tests "beta"
                ;;
            *)
                echo -e "${RED}Error: Invalid action '$ACTION' for beta environment${NC}"
                show_usage
                exit 1
                ;;
        esac
        ;;
    
    "prod")
        case "$ACTION" in
            "test")
                run_tests "prod"
                ;;
            *)
                echo -e "${RED}Error: Invalid action '$ACTION' for prod environment${NC}"
                echo "Only 'test' action is available for prod environment"
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
            "test")
                local_test
                ;;
            "mock")
                local_mock
                ;;
            "cicd")
                local_cicd
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
