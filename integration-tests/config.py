import os
from dotenv import load_dotenv

load_dotenv()

# Base URL for the service
BASE_URL = os.getenv('BASE_URL', 'http://localhost:5005')

# Ensure BASE_URL has protocol
if not BASE_URL.startswith(('http://', 'https://')):
    if 'localhost' in BASE_URL or '127.0.0.1' in BASE_URL:
        BASE_URL = f"http://{BASE_URL}"
    else:
        BASE_URL = f"https://{BASE_URL}"

API_BASE_URL = f"{BASE_URL}/api"

print(f"Using API base URL: {API_BASE_URL}")

# Test configuration
TEST_USER_PREFIX = "test_user_"
TEST_EMAIL_DOMAIN = "test.example.com"
DEFAULT_PASSWORD = "TestPassword123"

# Timeouts
REQUEST_TIMEOUT = 30
UPLOAD_TIMEOUT = 60

# File paths for test data
TEST_FILES_DIR = os.path.join(os.path.dirname(__file__), 'test_files')

# SSH configuration for remote servers
SSH_USER = os.getenv('SSH_USER', 'searchable')  # Default SSH user
SSH_KEY_PATH = os.getenv('SSH_KEY_PATH')  # e.g., '~/.ssh/id_rsa'
SSH_PORT = os.getenv('SSH_PORT', '22')

# Docker container name for database
DB_CONTAINER_NAME = os.getenv('DB_CONTAINER_NAME', 'searchable-db-1')

# Determine if we're running against a remote server
IS_REMOTE = not ('localhost' in BASE_URL or '127.0.0.1' in BASE_URL)

# Extract hostname from BASE_URL for SSH
SSH_HOST = None
if IS_REMOTE:
    from urllib.parse import urlparse
    parsed_url = urlparse(BASE_URL)
    SSH_HOST = f"{SSH_USER}@{parsed_url.hostname}"

print(f"Running tests against {'remote' if IS_REMOTE else 'local'} server")
if IS_REMOTE and SSH_HOST:
    print(f"Will SSH to: {SSH_HOST}")
else:
    print(f"Using local docker container: {DB_CONTAINER_NAME}")