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
    echo "  ./exec.sh beta lookup --user_id <user_id>   - Lookup all information about a user"
    echo "  ./exec.sh beta test                         - Run tests against beta (silkroadonlightning.com)"
    echo "  ./exec.sh beta test --ls                    - List all available individual tests"
    echo "  ./exec.sh beta test --t <test_name>         - Run specific test file against beta"
    echo "  ./exec.sh beta test --t <test_name> -n <num> - Run specific test with parameter against beta"
    echo "  ./exec.sh beta content-upload               - Upload music content to beta environment"
    echo "  ./exec.sh beta create-reviews               - Create test reviews and ratings"
    echo ""
    echo "  ./exec.sh prod test                         - Run tests against prod (eccentricprotocol.com)"
    echo "  ./exec.sh prod test --ls                    - List all available individual tests"
    echo "  ./exec.sh prod test --t <test_name>         - Run specific test file against prod"
    echo "  ./exec.sh prod lookup --user_id <id> --server <domain> - Lookup user info on prod server"
    echo "  ./exec.sh prod content-upload --server=<servername>  - Upload content to prod server"
    echo "  ./exec.sh prod create-reviews --server=<servername>  - Create reviews on prod server"
    echo "       (servername/domain: eccentricprotocol.com or abitchaotic.com)"
    echo ""
    echo "  ./exec.sh local react                       - Start React development server locally"
    echo "  ./exec.sh local deploy <container_name>     - Deploy specific container locally"
    echo "  ./exec.sh local deploy-all                  - Deploy all containers locally"
    echo "  ./exec.sh local logs <container_name>       - Show logs for local container"
    echo "  ./exec.sh local status                      - Show status of local containers"
    echo "  ./exec.sh local test                        - Run tests against local (localhost:5005)"
    echo "  ./exec.sh local test --ls                   - List all available individual tests"
    echo "  ./exec.sh local test --t <test_name>        - Run specific test file"
    echo "  ./exec.sh local test --t <test_name> -n <num> - Run specific test with parameter"
    echo "  ./exec.sh local content-upload              - Upload music content to local environment"
    echo "  ./exec.sh local create-reviews              - Create test reviews and ratings"
    echo "  ./exec.sh local test --parallel             - Run tests in parallel (4x faster)"
    echo "  ./exec.sh local unittests                   - Run unit tests for critical functions"
    echo "  ./exec.sh local mock                        - Start React in mock mode (default theme)"
    echo "  ./exec.sh local mock --ls                   - List all available themes"
    echo "  ./exec.sh local mock --theme=<themename>    - Start React in mock mode with specific theme"
    echo "  ./exec.sh local cicd                        - Full CI/CD with parallel tests (default)"
    echo "  ./exec.sh local cicd --sequential           - Full CI/CD with sequential tests"
    echo "  ./exec.sh local lookup --user_id <user_id>  - Lookup all information about a user"
    echo ""
    echo "  ./exec.sh release                           - Release new version (merge to main, bump version, deploy)"
    echo "  ./exec.sh email test                        - Send test email via Mailgun (eccentricprotocol)"
    echo "  ./exec.sh email test --abitchaotic          - Send test email via Mailgun (abitchaotic)"
    echo "  ./exec.sh email campaign --file <csv>       - Send campaign emails (eccentricprotocol)"
    echo "  ./exec.sh email campaign --abitchaotic --file <csv> - Send campaign emails (abitchaotic)"
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
    echo "  ./exec.sh local test --ls"
    echo "  ./exec.sh local test --t invite_codes"
    echo "  ./exec.sh beta test --t integration"
    echo "  ./exec.sh prod test --t invite_codes"
    echo "  ./exec.sh prod content-upload --server=eccentricprotocol.com"
    echo "  ./exec.sh prod content-upload --server=abitchaotic.com"
    echo "  ./exec.sh prod create-reviews --server=eccentricprotocol.com"
    echo "  ./exec.sh prod create-reviews --server=abitchaotic.com"
    echo "  ./exec.sh local test --t mass_withdrawals -n 10"
    echo "  ./exec.sh local test --parallel"
    echo "  ./exec.sh local unittests"
    echo "  ./exec.sh local mock"
    echo "  ./exec.sh local mock --ls"
    echo "  ./exec.sh local mock --theme=cyberpunk"
    echo "  ./exec.sh local mock --theme=lightMinimal"
    echo "  ./exec.sh local mock --theme=elegantGold"
    echo "  ./exec.sh local cicd"
    echo "  ./exec.sh local cicd --sequential"
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
    
    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo "Current branch: $CURRENT_BRANCH"
    
    # Check if we have uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        # Add all changes
        git add -A
        
        # Create commit with timestamp
        TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
        git commit -m "Auto-deploy commit - $TIMESTAMP

🤖 Generated with Claude Code
https://claude.ai/code

Co-Authored-By: Claude <noreply@anthropic.com>"
        
        echo "✅ Changes committed to $CURRENT_BRANCH"
    else
        echo "✅ No uncommitted changes found"
    fi
    
    # Always push to ensure remote branch is up to date
    echo -e "${YELLOW}📤 Pushing to remote repository...${NC}"
    git push origin $CURRENT_BRANCH
    echo "✅ Changes pushed to origin/$CURRENT_BRANCH"
    
    # Deploy to remote server with the current local branch
    ssh $REMOTE_USER@$REMOTE_HOST << EOF
        cd $REMOTE_PATH
        echo "📦 Running full deployment with git sync..."
        
        # Switch to the same branch as local (create if doesn't exist)
        echo "🔄 Switching to branch: $CURRENT_BRANCH"
        git fetch origin
        if git branch -r | grep -q "origin/$CURRENT_BRANCH"; then
            # Branch exists on remote, switch to it
            git checkout $CURRENT_BRANCH 2>/dev/null || git checkout -b $CURRENT_BRANCH origin/$CURRENT_BRANCH
        else
            echo "❌ Branch $CURRENT_BRANCH not found on remote. Please push it first."
            exit 1
        fi
        
        # Pull latest changes from the feature branch
        echo "📥 Pulling latest changes from origin/$CURRENT_BRANCH..."
        git pull origin $CURRENT_BRANCH
        
        # Run the existing redeploy script
        echo "🔄 Running full redeploy..."
        ./redeploy.sh
EOF
    
    echo -e "${GREEN}✅ Remote deployment completed!${NC}"
    echo -e "${BLUE}📝 Summary:${NC}"
    echo "  - Local changes committed and pushed to branch: $CURRENT_BRANCH"
    echo "  - Remote server switched to and pulled from branch: $CURRENT_BRANCH"
    if [ "$CURRENT_BRANCH" = "main" ]; then
        echo "  - Full redeploy executed on beta server from main branch"
    else
        echo "  - Full redeploy executed on beta server from feature branch: $CURRENT_BRANCH"
    fi
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

# Function to list all available tests
list_tests() {
    echo -e "${BLUE}📋 Available Individual Tests${NC}"
    echo "================================"
    echo ""
    
    # Navigate to integration tests directory
    cd "$SCRIPT_DIR/integration-tests"
    
    # Find all test files and extract test names
    local test_files=($(find . -name "test_*.py" -type f | sort))
    
    if [ ${#test_files[@]} -eq 0 ]; then
        echo -e "${RED}No test files found in integration-tests directory${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Test files (use the name after 'test_' without .py):${NC}"
    echo ""
    
    for file in "${test_files[@]}"; do
        # Extract test name (remove ./test_ prefix and .py suffix)
        test_name=$(basename "$file" .py | sed 's/^test_//')
        file_path=$(basename "$file")
        
        # Get brief description from the file if available
        description=""
        if [ -f "$file" ]; then
            # Look for class docstring or module docstring
            description=$(head -20 "$file" | grep -E "Test|test.*for|functionality" | head -1 | sed 's/.*["'"'"']\(.*\)["'"'"'].*/\1/' | sed 's/.*#\s*//')
        fi
        
        if [ -n "$description" ] && [ "$description" != "$file" ]; then
            echo -e "  ${GREEN}$test_name${NC} - $description"
        else
            echo -e "  ${GREEN}$test_name${NC}"
        fi
    done
    
    echo ""
    echo -e "${YELLOW}Usage examples:${NC}"
    echo "  ./exec.sh local test --t invite_codes"
    echo "  ./exec.sh beta test --t integration"
    echo "  ./exec.sh local test --t comprehensive_scenarios"
    
    # Return to original directory
    cd "$SCRIPT_DIR"
}

# Function to run a specific test
run_single_test() {
    local environment=$1
    local test_name=$2
    local test_parameter=$3  # Optional parameter (e.g., number for mass tests)
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
    
    # Check if integration-tests directory exists
    if [ ! -d "$SCRIPT_DIR/integration-tests" ]; then
        echo -e "${RED}Error: integration-tests directory not found${NC}"
        exit 1
    fi
    
    # Navigate to integration tests directory
    cd "$SCRIPT_DIR/integration-tests"
    
    # Construct test file name
    test_file="test_${test_name}.py"
    
    # Check if test file exists
    if [ ! -f "$test_file" ]; then
        echo -e "${RED}Error: Test file '$test_file' not found${NC}"
        echo ""
        echo -e "${YELLOW}Available tests:${NC}"
        list_tests
        exit 1
    fi
    
    echo -e "${BLUE}🧪 Running test '$test_name' against $site_name${NC}"
    echo "API URL: $api_url/api"
    echo "Test file: $test_file"
    if [ -n "$test_parameter" ]; then
        echo "Test parameter: $test_parameter"
    fi
    echo ""
    
    # Set URLs based on environment
    if [ "$environment" = "local" ]; then
        metrics_url="http://localhost:5007"
        grafana_url="http://localhost:3000"
        grafana_proxy_url="http://localhost/grafana"
    else
        # For beta and prod, construct URLs with same base as API but different paths
        base_url=$(echo "$api_url" | sed 's|/api$||')
        metrics_url="${base_url}/metrics"
        grafana_url="${base_url}/grafana"
        grafana_proxy_url="${base_url}/grafana"
    fi
    
    # Run specific test with environment variables
    echo -e "${YELLOW}Running $test_file...${NC}"
    
    # Build environment variables
    test_env="BASE_URL=\"$api_url\" \
METRICS_URL=\"$metrics_url\" \
GRAFANA_URL=\"$grafana_url\" \
GRAFANA_PROXY_URL=\"$grafana_proxy_url\" \
TEST_USER_PREFIX=\"${test_prefix}\" \
TEST_EMAIL_DOMAIN=\"${environment}.test\" \
DEFAULT_PASSWORD=\"TestPass123!\" \
REQUEST_TIMEOUT=30 \
UPLOAD_TIMEOUT=60"
    
    # Add test-specific parameters
    if [ -n "$test_parameter" ]; then
        case "$test_name" in
            "mass_withdrawals")
                test_env="$test_env MASS_WITHDRAWAL_COUNT=\"$test_parameter\""
                ;;
            *)
                test_env="$test_env TEST_PARAMETER=\"$test_parameter\""
                ;;
        esac
    fi
    
    # Execute test
    eval "$test_env python \"$test_file\""
    
    TEST_RESULT=$?
    
    # Return to original directory
    cd "$SCRIPT_DIR"
    
    echo ""
    echo -e "${BLUE}🧪 Test Summary for '$test_name' on $site_name${NC}"
    echo "================================"
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ Test '$test_name' passed!${NC}"
    else
        echo -e "${RED}❌ Test '$test_name' failed!${NC}"
        echo -e "${YELLOW}Check the test output above for details.${NC}"
        exit 1
    fi
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
        # For beta and prod, construct URLs with same base as API but different paths
        # Remove /api suffix from api_url if present, then add paths
        base_url=$(echo "$api_url" | sed 's|/api$||')
        metrics_url="${base_url}/metrics"
        grafana_url="${base_url}/grafana"
        grafana_proxy_url="${base_url}/grafana"
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
    # Check if parallel flag is set
    if [ "$2" = "--parallel" ]; then
        echo -e "${YELLOW}Running tests in parallel mode (4x faster)...${NC}"
        ./run_parallel_tests.sh
    else
        ./run_comprehensive_tests.sh
    fi
    
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

# Content upload function
content_upload() {
    local env=$1
    
    echo -e "${BLUE}🎵 Uploading music content to $env environment...${NC}"
    
    # Check if content directory exists
    if [ ! -d "content/music" ]; then
        echo -e "${RED}Error: content/music directory not found${NC}"
        exit 1
    fi
    
    # Check if metadata exists
    metadata_count=$(find content/music -name "metadata.json" -type f | wc -l)
    if [ "$metadata_count" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No metadata.json files found. Generating metadata...${NC}"
        python3 content/generate_metadata.py
    fi
    
    # Run the upload script
    if [ "$env" = "local" ]; then
        echo -e "${YELLOW}Uploading to local environment (http://localhost:5005)...${NC}"
    else
        echo -e "${YELLOW}Uploading to beta environment (https://beta.searchable.ai)...${NC}"
    fi
    
    python3 content/upload_content.py "$env"
    
    echo -e "${GREEN}✅ Content upload completed!${NC}"
}

# Production content upload function
content_upload_prod() {
    local server=$1
    
    echo -e "${BLUE}🎵 Uploading music content to production server: $server...${NC}"
    
    # Check if content directory exists
    if [ ! -d "content/music" ]; then
        echo -e "${RED}Error: content/music directory not found${NC}"
        exit 1
    fi
    
    # Check if metadata exists
    metadata_count=$(find content/music -name "metadata.json" -type f | wc -l)
    if [ "$metadata_count" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No metadata.json files found. Generating metadata...${NC}"
        python3 content/generate_metadata.py
    fi
    
    echo -e "${YELLOW}Uploading to production environment (https://$server)...${NC}"
    
    # Pass server as environment variable or parameter to the upload script
    PROD_SERVER="$server" python3 content/upload_content.py "prod"
    
    echo -e "${GREEN}✅ Content upload to $server completed!${NC}"
}

# Create reviews for existing searchables
create_reviews() {
    local env=$1
    
    echo -e "${BLUE}📝 Creating reviews for $env environment...${NC}"
    
    # Check if Python script exists
    if [ ! -f "content/review_generator.py" ]; then
        echo -e "${RED}Error: review_generator.py not found${NC}"
        echo "Creating review_generator.py..."
        # We'll create this file next
    fi
    
    python3 content/review_generator.py "$env"
    
    echo -e "${GREEN}✅ Review generation completed!${NC}"
}

# Production create reviews function
create_reviews_prod() {
    local server=$1
    
    echo -e "${BLUE}📝 Creating reviews for production server: $server...${NC}"
    
    # Check if Python script exists
    if [ ! -f "content/review_generator.py" ]; then
        echo -e "${RED}Error: review_generator.py not found${NC}"
        echo "Creating review_generator.py..."
        # We'll create this file next
    fi
    
    echo -e "${YELLOW}Creating reviews on production environment (https://$server)...${NC}"
    
    # Pass server as environment variable or parameter to the review generator script
    PROD_SERVER="$server" python3 content/review_generator.py "prod"
    
    echo -e "${GREEN}✅ Review generation on $server completed!${NC}"
}

# List available themes
list_themes() {
    echo -e "${BLUE}Available Themes for Mock Mode:${NC}"
    echo ""
    
    echo -e "${YELLOW}🍭 Cartoon Themes:${NC}"
    echo "  cartoonCandy      - Sweet and playful candy colors"
    echo "  cartoonBubble     - Bubblegum and cotton candy vibes"
    echo "  cartoonPastel     - Soft pastel cartoon palette"
    echo ""
    
    echo -e "${YELLOW}☀️  Light Themes:${NC}"
    echo "  lightMinimal      - Clean and minimalist light theme"
    echo "  lightAiry         - Bright and breathable design"
    echo "  lightSoft         - Gentle and soothing light colors"
    echo ""
    
    echo -e "${YELLOW}👑 Elegant Themes:${NC}"
    echo "  elegantGold       - Luxurious gold and black"
    echo "  elegantSilver     - Sophisticated silver and navy"
    echo "  elegantRoyal      - Regal purple and gold accents"
    echo ""
    
    echo -e "${YELLOW}🌿 Nature Themes:${NC}"
    echo "  natureForest      - Deep forest greens and earth tones"
    echo "  natureOcean       - Deep sea blues and aqua"
    echo "  natureSunset      - Warm sunset oranges and purples"
    echo ""
    
    echo -e "${YELLOW}📼 Retro Themes:${NC}"
    echo "  retro80s          - Radical 80s neon colors"
    echo "  retro70s          - Groovy 70s earth tones"
    echo "  retroTerminal     - Old school amber terminal"
    echo ""
    
    echo -e "${YELLOW}🐉 Fantasy Themes:${NC}"
    echo "  fantasyDragon     - Mystical dragon scales and fire"
    echo "  fantasyUnicorn    - Magical unicorn rainbow pastels"
    echo "  fantasyElven      - Mystical elven forest magic"
    echo ""
    
    echo -e "${YELLOW}⚪ Minimal Themes:${NC}"
    echo "  minimalMonochrome - Pure black and white"
    echo "  minimalNordic     - Scandinavian minimalism"
    echo "  minimalZen        - Peaceful and calming"
    echo ""
    
    echo -e "${YELLOW}🍂 Seasonal Themes:${NC}"
    echo "  seasonalAutumn    - Fall leaves and harvest colors"
    echo "  seasonalWinter    - Cool winter blues and whites"
    echo "  seasonalSpring    - Fresh spring blooms and pastels"
    echo ""
    
    echo -e "${YELLOW}🎮 Original Themes:${NC}"
    echo "  neonTokyo         - Tokyo nights with neon signs (default)"
    echo "  cyberpunk         - Neon-lit streets of the future"
    echo "  vaporwave         - 80s nostalgia with pastel dreams"
    echo "  matrix            - Enter the Matrix (green terminal)"
    echo "  synthwave         - Retro-futuristic sunset vibes"
    echo "  hacker            - Classic green terminal aesthetic"
    echo "  bloodMoon         - Dark and vampiric crimson theme"
    echo "  deepSpace         - Cosmic void with stellar accents"
    echo "  arcade            - Retro arcade game vibes"
    echo "  original          - The classic Searchable look"
    echo ""
    
    echo -e "${GREEN}Usage Examples:${NC}"
    echo "  ./exec.sh local mock --theme=lightMinimal"
    echo "  ./exec.sh local mock --theme=cyberpunk"
    echo "  ./exec.sh local mock --theme=natureForest"
}

# Local React development server in mock mode
local_mock() {
    local theme="$1"
    
    echo -e "${BLUE}🚀 Starting React development server in mock mode...${NC}"
    
    # Check if theme parameter is provided
    if [ -n "$theme" ]; then
        echo -e "${GREEN}🎨 Using theme: $theme${NC}"
    else
        echo -e "${YELLOW}ℹ️  Using default theme: neonTokyo${NC}"
    fi
    
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
    # Add REACT_APP_THEME if provided
    if [ -n "$theme" ]; then
        PORT=3001 \
        REACT_APP_MOCK_MODE=true \
        REACT_APP_ENV=local \
        REACT_APP_BRANDING=silkroadonlightning \
        REACT_APP_LOGO=camel_logo.jpg \
        REACT_APP_DESCRIPTION='Silk Road on Lightning' \
        REACT_APP_THEME="$theme" \
        NODE_OPTIONS=--openssl-legacy-provider \
        npm start
    else
        PORT=3001 \
        REACT_APP_MOCK_MODE=true \
        REACT_APP_ENV=local \
        REACT_APP_BRANDING=silkroadonlightning \
        REACT_APP_LOGO=camel_logo.jpg \
        REACT_APP_DESCRIPTION='Silk Road on Lightning' \
        NODE_OPTIONS=--openssl-legacy-provider \
        npm start
    fi
}

# Local unit tests for critical functions
local_unittests() {
    echo -e "${BLUE}🧪 Running unit tests for critical functions...${NC}"
    
    cd api-server-flask
    
    # Check if unit test runner exists
    if [ ! -f "run_unit_tests.sh" ]; then
        echo -e "${RED}❌ Unit test runner not found${NC}"
        echo "Expected: api-server-flask/run_unit_tests.sh"
        exit 1
    fi
    
    # Make sure the runner is executable
    chmod +x run_unit_tests.sh
    
    # Run the unit tests
    ./run_unit_tests.sh
}

# User lookup function for beta environment
beta_lookup() {
    local user_id=$1
    
    if [ -z "$user_id" ]; then
        echo -e "${RED}Error: user_id parameter is required${NC}"
        echo "Usage: ./exec.sh beta lookup --user_id <user_id>"
        exit 1
    fi
    
    echo -e "${BLUE}🔍 Looking up user information for user_id: $user_id (on beta)${NC}"
    
    # Run the lookup script on remote server
    ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && docker exec flask_api python /app/scripts/lookup_user.py $user_id"
}

# User lookup function for production environment
prod_lookup() {
    local user_id=$1
    local server=$2
    
    if [ -z "$user_id" ] || [ -z "$server" ]; then
        echo -e "${RED}Error: Both user_id and server parameters are required${NC}"
        echo "Usage: ./exec.sh prod lookup --user_id <user_id> --server <domain>"
        echo "Server options: eccentricprotocol or abitchaotic"
        exit 1
    fi
    
    # Determine the server IP based on domain
    local server_ip
    local server_name
    
    case "$server" in
        "eccentricprotocol" | "eccentricprotocol.com")
            server_ip="64.91.240.98"
            server_name="eccentricprotocol.com"
            ;;
        "abitchaotic" | "abitchaotic.com")
            server_ip="64.91.242.2"
            server_name="abitchaotic.com"
            ;;
        *)
            echo -e "${RED}Error: Invalid server domain${NC}"
            echo "Valid options: eccentricprotocol or abitchaotic"
            exit 1
            ;;
    esac
    
    echo -e "${BLUE}🔍 Looking up user information for user_id: $user_id on $server_name${NC}"
    
    # First, we need to copy the lookup script to the remote server if it doesn't exist
    echo -e "${GREEN}Ensuring lookup script exists on remote server...${NC}"
    ssh searchable@${server_ip} "mkdir -p /home/searchable/searchable/api-server-flask/scripts"
    scp "$SCRIPT_DIR/api-server-flask/scripts/lookup_user.py" searchable@${server_ip}:/home/searchable/searchable/api-server-flask/scripts/
    
    # Find the Flask container and run the lookup script
    echo -e "${GREEN}Running lookup on $server_name...${NC}"
    ssh searchable@${server_ip} 'cd /home/searchable/searchable && FLASK_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "(flask_api|flask-api)" | head -1) && docker exec $FLASK_CONTAINER python /app/scripts/lookup_user.py '"$user_id"
}

# Local CI/CD workflow - tear down everything, rebuild, and test
local_lookup() {
    local user_id=$1
    
    if [ -z "$user_id" ]; then
        echo -e "${RED}Error: user_id parameter is required${NC}"
        echo "Usage: ./exec.sh local lookup --user_id <user_id>"
        exit 1
    fi
    
    echo -e "${BLUE}🔍 Looking up user information for user_id: $user_id${NC}"
    
    # Check if the script exists
    if [ ! -f "$SCRIPT_DIR/api-server-flask/scripts/lookup_user.py" ]; then
        echo -e "${RED}Error: lookup_user.py script not found${NC}"
        exit 1
    fi
    
    # Find the Flask container name (could be flask_api or searchable-flask_api-1 or searchable_flask_api_1)
    FLASK_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "(flask_api|flask-api)" | head -1)
    
    if [ -z "$FLASK_CONTAINER" ]; then
        echo -e "${RED}Error: Flask API container not found. Is it running?${NC}"
        echo "Available containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}"
        exit 1
    fi
    
    echo -e "${GREEN}Using container: $FLASK_CONTAINER${NC}"
    
    # Run the lookup script inside the Flask container
    docker exec $FLASK_CONTAINER python /app/scripts/lookup_user.py "$user_id"
}

local_cicd() {
    local parallel_flag=$1
    
    # Create reports directory if it doesn't exist
    REPORTS_DIR="$SCRIPT_DIR/cicd_reports"
    mkdir -p "$REPORTS_DIR"
    
    # Generate timestamp and report filename
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    CICD_REPORT="$REPORTS_DIR/cicd_report_${TIMESTAMP}.log"
    
    # Function to output to both console and report file
    log_output() {
        echo -e "$@" | tee -a "$CICD_REPORT"
    }
    
    # Start logging
    echo "CI/CD Workflow Report - Started at $(date)" > "$CICD_REPORT"
    echo "=======================================" >> "$CICD_REPORT"
    echo "" >> "$CICD_REPORT"
    
    log_output "${BLUE}🔄 Starting full CI/CD workflow...${NC}"
    log_output "${YELLOW}This will:${NC}"
    log_output "  1. 🗑️  Stop and remove all Docker containers"
    log_output "  2. 🧹 Remove all Docker volumes and networks"
    log_output "  3. 🏗️  Rebuild and start all containers"
    log_output "  4. ⏳ Wait for services to be ready"
    if [ "$parallel_flag" = "--parallel" ]; then
        log_output "  5. 🧪 Run comprehensive integration tests in PARALLEL mode (default)"
    else
        log_output "  5. 🧪 Run comprehensive integration tests in SEQUENTIAL mode"
    fi
    log_output ""
    
    # Start CI/CD workflow immediately without confirmation
    log_output "${BLUE}Starting CI/CD workflow...${NC}"
    
    DOCKER_COMPOSE=$(get_docker_compose_cmd)
    
    log_output "${BLUE}📋 Step 1/5: Stopping and removing containers...${NC}"
    
    # Stop all containers (ignore errors)
    log_output "Stopping all containers..."
    docker stop $(docker ps -aq) 2>&1 | tee -a "$CICD_REPORT" || true
    
    # Remove all containers (ignore errors)
    log_output "Removing all containers..."
    docker rm $(docker ps -aq) 2>&1 | tee -a "$CICD_REPORT" || true
    
    # Remove all volumes (ignore errors)
    log_output "Removing all volumes..."
    docker volume rm $(docker volume ls -q) 2>&1 | tee -a "$CICD_REPORT" || true
    
    # Remove all networks (ignore errors)
    log_output "Removing custom networks..."
    docker network rm $(docker network ls --filter type=custom -q) 2>&1 | tee -a "$CICD_REPORT" || true
    
    # Clean up Docker system
    log_output "Cleaning up Docker system..."
    docker system prune -f 2>&1 | tee -a "$CICD_REPORT" || true
    
    log_output "${GREEN}✅ Step 1 complete: Environment cleaned${NC}"
    log_output ""
    
    log_output "${BLUE}📋 Step 2/5: Building Docker images...${NC}"
    
    # Build all images from scratch
    log_output "Building all Docker images..."
    $DOCKER_COMPOSE -f docker-compose.local.yml build --no-cache --pull 2>&1 | tee -a "$CICD_REPORT"
    
    log_output "${GREEN}✅ Step 2 complete: Images built${NC}"
    log_output ""
    
    log_output "${BLUE}📋 Step 3/5: Starting all services...${NC}"
    
    # Start all containers
    log_output "Starting all containers..."
    $DOCKER_COMPOSE -f docker-compose.local.yml up -d 2>&1 | tee -a "$CICD_REPORT"
    
    log_output "${GREEN}✅ Step 3 complete: Services started${NC}"
    log_output ""
    
    log_output "${BLUE}📋 Step 4/5: Waiting for services to be ready...${NC}"
    
    # Wait for services to be ready
    log_output "Waiting for database to be ready..."
    sleep 10
    
    # Check if Flask API is responding
    log_output "Checking Flask API health..."
    for i in {1..30}; do
        if curl -s http://localhost:5005/api/health >/dev/null 2>&1; then
            log_output "✅ Flask API is ready"
            break
        fi
        log_output "⏳ Waiting for Flask API... (attempt $i/30)"
        sleep 2
    done
    
    # Additional wait for full initialization
    log_output "Allowing additional time for full service initialization..."
    sleep 5
    
    log_output "${GREEN}✅ Step 4 complete: Services are ready${NC}"
    log_output ""
    
    log_output "${BLUE}📋 Step 5/5: Running comprehensive integration tests...${NC}"
    
    # Export CICD_REPORT so the test runner can also log to it
    export CICD_REPORT
    
    # Create a modified run_tests function that logs output
    run_tests_with_logging() {
        local environment=$1
        local parallel=$2
        # Redirect all output from run_tests to both console and report file
        run_tests "$environment" "$parallel" 2>&1 | tee -a "$CICD_REPORT"
        return ${PIPESTATUS[0]}
    }
    
    # Run local tests with logging
    run_tests_with_logging "local" "$parallel_flag"
    TEST_RESULT=$?
    
    # Copy individual test logs to the reports directory
    log_output ""
    log_output "${BLUE}📁 Copying individual test logs...${NC}"
    TEST_LOGS_DIR="$SCRIPT_DIR/integration-tests/logs"
    if [ -d "$TEST_LOGS_DIR" ]; then
        # Find the most recent test logs (created in the last 5 minutes)
        find "$TEST_LOGS_DIR" -name "*.log" -type f -mmin -5 -exec cp {} "$REPORTS_DIR/" \; 2>/dev/null || true
        
        # Count how many logs were copied
        COPIED_LOGS=$(find "$TEST_LOGS_DIR" -name "*.log" -type f -mmin -5 2>/dev/null | wc -l)
        log_output "✅ Copied $COPIED_LOGS individual test log files"
    fi
    
    log_output ""
    log_output "${BLUE}🎯 CI/CD Workflow Summary${NC}"
    log_output "================================"
    log_output "✅ Environment cleaned and rebuilt"
    log_output "✅ All services started"
    log_output "✅ Integration tests completed"
    
    if [ $TEST_RESULT -eq 0 ]; then
        log_output "${GREEN}🎉 CI/CD workflow completed successfully!${NC}"
        log_output "${YELLOW}All containers are running and tests passed.${NC}"
        log_output ""
        log_output "${BLUE}🔗 Service URLs:${NC}"
        log_output "  Frontend: http://localhost:80"
        log_output "  API: http://localhost:5005"
        log_output "  Grafana: http://localhost:3050"
        log_output ""
        log_output "${YELLOW}To view logs:${NC} ./exec.sh local logs <container_name>"
        log_output "${YELLOW}To check status:${NC} ./exec.sh local status"
    else
        log_output "${RED}❌ CI/CD workflow failed!${NC}"
        log_output "${YELLOW}Check the test output above for details.${NC}"
        log_output ""
        log_output "${YELLOW}To debug:${NC}"
        log_output "  ./exec.sh local status"
        log_output "  ./exec.sh local logs <container_name>"
    fi
    
    # Add summary at the end of report
    echo "" >> "$CICD_REPORT"
    echo "======================================" >> "$CICD_REPORT"
    echo "CI/CD Workflow Report - Completed at $(date)" >> "$CICD_REPORT"
    echo "Report saved to: $CICD_REPORT" >> "$CICD_REPORT"
    
    # Show report location to user
    echo ""
    echo -e "${BLUE}📝 Full CI/CD report saved to:${NC}"
    echo "   $CICD_REPORT"
    echo ""
    echo -e "${BLUE}📂 All log files saved in:${NC}"
    echo "   $REPORTS_DIR/"
    echo ""
    
    # List all log files in the reports directory
    echo -e "${BLUE}📋 Log files created:${NC}"
    ls -la "$REPORTS_DIR/" | grep -E "\.log$" | awk '{print "   - " $9}'
    echo ""
    
    # Exit with appropriate code
    if [ $TEST_RESULT -ne 0 ]; then
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

# Email test function
email_test() {
    local brand=$1
    
    if [ "$brand" = "--abitchaotic" ]; then
        echo -e "${BLUE}📧 Sending test email via Mailgun (abitchaotic)...${NC}"
    else
        echo -e "${BLUE}📧 Sending test email via Mailgun (eccentricprotocol)...${NC}"
    fi
    
    # Check if .env.secrets exists
    if [ ! -f ".env.secrets" ]; then
        echo -e "${RED}Error: .env.secrets file not found${NC}"
        echo "Please ensure .env.secrets exists and contains MAILGUN_API key"
        exit 1
    fi
    
    # Check if python script exists
    if [ ! -f "send_test_email.py" ]; then
        echo -e "${RED}Error: send_test_email.py not found${NC}"
        exit 1
    fi
    
    # Source .env.secrets and export API_KEY
    source .env.secrets
    export API_KEY=$MAILGUN_API
    
    if [ "$brand" = "--abitchaotic" ]; then
        # Run the python script with abitchaotic parameter
        python3 send_test_email.py abitchaotic
    else
        # Run the python script without parameter (default)
        python3 send_test_email.py
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Email test completed successfully!${NC}"
    else
        echo -e "${RED}❌ Email test failed${NC}"
        exit 1
    fi
}

email_campaign() {
    local brand=""
    local csv_file=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --abitchaotic)
                brand="--abitchaotic"
                shift
                ;;
            --file)
                csv_file="$2"
                shift 2
                ;;
            *)
                # If no --file flag, assume it's the csv file
                if [ -z "$csv_file" ]; then
                    csv_file="$1"
                fi
                shift
                ;;
        esac
    done
    
    # Validate CSV file argument
    if [ -z "$csv_file" ]; then
        echo -e "${RED}Error: CSV file path required${NC}"
        echo "Usage: ./exec.sh email campaign [--abitchaotic] --file <csvfile>"
        exit 1
    fi
    
    # Check if CSV file exists
    if [ ! -f "$csv_file" ]; then
        echo -e "${RED}Error: CSV file '$csv_file' not found${NC}"
        exit 1
    fi
    
    if [ "$brand" = "--abitchaotic" ]; then
        echo -e "${BLUE}📧 Starting email campaign via Mailgun (abitchaotic)...${NC}"
    else
        echo -e "${BLUE}📧 Starting email campaign via Mailgun (eccentricprotocol)...${NC}"
    fi
    
    echo -e "CSV file: ${YELLOW}$csv_file${NC}"
    
    # Check if .env.secrets exists
    if [ ! -f ".env.secrets" ]; then
        echo -e "${RED}Error: .env.secrets file not found${NC}"
        echo "Please ensure .env.secrets exists and contains MAILGUN_API key"
        exit 1
    fi
    
    # Check if python script exists
    if [ ! -f "send_campaign_email.py" ]; then
        echo -e "${RED}Error: send_campaign_email.py not found${NC}"
        exit 1
    fi
    
    # Source .env.secrets and export API_KEY
    source .env.secrets
    export API_KEY=$MAILGUN_API
    
    if [ "$brand" = "--abitchaotic" ]; then
        # Run the python script with abitchaotic parameter
        python3 send_campaign_email.py abitchaotic "$csv_file"
    else
        # Run the python script without brand parameter (default)
        python3 send_campaign_email.py "$csv_file"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Email campaign completed successfully!${NC}"
    else
        echo -e "${RED}❌ Email campaign failed${NC}"
        exit 1
    fi
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
# Special case for email test command
elif [ "$1" = "email" ] && [ "$2" = "test" ]; then
    email_test "$3"
    exit 0
# Special case for email campaign command
elif [ "$1" = "email" ] && [ "$2" = "campaign" ]; then
    shift 2  # Remove 'email campaign' from arguments
    email_campaign "$@"
    exit 0
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
                if [ "$CONTAINER" = "--ls" ]; then
                    list_tests
                elif [ "$CONTAINER" = "--t" ]; then
                    if [ -z "$4" ]; then
                        echo -e "${RED}Error: Test name required for --t option${NC}"
                        echo "Usage: ./exec.sh beta test --t <test_name> [-n <number>]"
                        echo "Use --ls to see available tests"
                        exit 1
                    fi
                    # Check for -n parameter
                    if [ "$5" = "-n" ] && [ -n "$6" ]; then
                        run_single_test "beta" "$4" "$6"
                    else
                        run_single_test "beta" "$4"
                    fi
                else
                    run_tests "beta"
                fi
                ;;
            "content-upload")
                content_upload "beta"
                ;;
            "create-reviews")
                create_reviews "beta"
                ;;
            "lookup")
                if [ "$CONTAINER" = "--user_id" ] && [ -n "$4" ]; then
                    beta_lookup "$4"
                else
                    echo -e "${RED}Error: Invalid lookup syntax${NC}"
                    echo "Usage: ./exec.sh beta lookup --user_id <user_id>"
                    exit 1
                fi
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
                if [ "$CONTAINER" = "--ls" ]; then
                    list_tests
                elif [ "$CONTAINER" = "--t" ]; then
                    if [ -z "$4" ]; then
                        echo -e "${RED}Error: Test name required for --t option${NC}"
                        echo "Usage: ./exec.sh prod test --t <test_name> [-n <number>]"
                        echo "Use --ls to see available tests"
                        exit 1
                    fi
                    # Check for -n parameter
                    if [ "$5" = "-n" ] && [ -n "$6" ]; then
                        run_single_test "prod" "$4" "$6"
                    else
                        run_single_test "prod" "$4"
                    fi
                else
                    run_tests "prod"
                fi
                ;;
            "content-upload")
                # Parse server parameter
                server=""
                if [[ "$CONTAINER" == --server=* ]]; then
                    server="${CONTAINER#--server=}"
                    if [ "$server" != "eccentricprotocol.com" ] && [ "$server" != "abitchaotic.com" ]; then
                        echo -e "${RED}Error: Invalid server '$server'. Use eccentricprotocol.com or abitchaotic.com${NC}"
                        exit 1
                    fi
                else
                    echo -e "${RED}Error: --server parameter required for prod content-upload${NC}"
                    echo "Usage: ./exec.sh prod content-upload --server=<servername>"
                    echo "Where <servername> is eccentricprotocol.com or abitchaotic.com"
                    exit 1
                fi
                content_upload_prod "$server"
                ;;
            "create-reviews")
                # Parse server parameter
                server=""
                if [[ "$CONTAINER" == --server=* ]]; then
                    server="${CONTAINER#--server=}"
                    if [ "$server" != "eccentricprotocol.com" ] && [ "$server" != "abitchaotic.com" ]; then
                        echo -e "${RED}Error: Invalid server '$server'. Use eccentricprotocol.com or abitchaotic.com${NC}"
                        exit 1
                    fi
                else
                    echo -e "${RED}Error: --server parameter required for prod create-reviews${NC}"
                    echo "Usage: ./exec.sh prod create-reviews --server=<servername>"
                    echo "Where <servername> is eccentricprotocol.com or abitchaotic.com"
                    exit 1
                fi
                create_reviews_prod "$server"
                ;;
            "lookup")
                # Parse parameters for lookup
                if [ "$CONTAINER" = "--user_id" ] && [ -n "$4" ] && [ "$5" = "--server" ] && [ -n "$6" ]; then
                    prod_lookup "$4" "$6"
                else
                    echo -e "${RED}Error: Invalid lookup syntax${NC}"
                    echo "Usage: ./exec.sh prod lookup --user_id <user_id> --server <domain>"
                    echo "Server options: eccentricprotocol or abitchaotic"
                    exit 1
                fi
                ;;
            *)
                echo -e "${RED}Error: Invalid action '$ACTION' for prod environment${NC}"
                echo "Available actions: test, lookup, content-upload, create-reviews"
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
                if [ "$CONTAINER" = "--ls" ]; then
                    list_tests
                elif [ "$CONTAINER" = "--t" ]; then
                    if [ -z "$4" ]; then
                        echo -e "${RED}Error: Test name required for --t option${NC}"
                        echo "Usage: ./exec.sh local test --t <test_name> [-n <number>]"
                        echo "Use --ls to see available tests"
                        exit 1
                    fi
                    # Check for -n parameter
                    if [ "$5" = "-n" ] && [ -n "$6" ]; then
                        run_single_test "local" "$4" "$6"
                    else
                        run_single_test "local" "$4"
                    fi
                elif [ "$CONTAINER" = "--parallel" ]; then
                    run_tests "local" "--parallel"
                else
                    local_test
                fi
                ;;
            "mock")
                # Check for --ls option to list themes
                if [ "$CONTAINER" = "--ls" ]; then
                    list_themes
                # Check if theme parameter is provided
                elif [[ "$CONTAINER" == --theme=* ]]; then
                    # Extract theme name from --theme=themename
                    theme_name="${CONTAINER#--theme=}"
                    local_mock "$theme_name"
                else
                    local_mock
                fi
                ;;
            "unittests")
                local_unittests
                ;;
            "cicd")
                # Default to parallel mode for cicd
                if [ "$CONTAINER" = "--sequential" ]; then
                    local_cicd
                else
                    local_cicd "--parallel"
                fi
                ;;
            "content-upload")
                content_upload "local"
                ;;
            "create-reviews")
                create_reviews "local"
                ;;
            "lookup")
                if [ "$CONTAINER" = "--user_id" ] && [ -n "$4" ]; then
                    local_lookup "$4"
                else
                    echo -e "${RED}Error: Invalid lookup syntax${NC}"
                    echo "Usage: ./exec.sh local lookup --user_id <user_id>"
                    exit 1
                fi
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
