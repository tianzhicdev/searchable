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
DEFAULT_PASSWORD = "TestPassword123!"

# Timeouts
REQUEST_TIMEOUT = 30
UPLOAD_TIMEOUT = 60

# File paths for test data
TEST_FILES_DIR = os.path.join(os.path.dirname(__file__), 'test_files')