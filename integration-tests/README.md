# Searchable Platform Integration Tests

This directory contains integration tests for the Searchable platform deployed at `silkroadonlightning.com`.

## Overview

The integration tests verify the following functionality:
1. User registration with dummy credentials
2. User login and authentication
3. File upload functionality
4. Publishing searchable items with downloadable files
5. Retrieving searchable item information
6. Search functionality
7. User profile retrieval

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure the target environment in `.env`:
```bash
# Default target
BASE_URL=https://silkroadonlightning.com

# For local testing
# BASE_URL=http://localhost:5000
```

## Running Tests

### Run all integration tests:
```bash
python test_integration.py
```

### Run with pytest:
```bash
pytest test_integration.py -v -s
```

### Run specific test:
```bash
pytest test_integration.py::TestSearchableIntegration::test_01_register_user -v -s
```

## Test Structure

- **`config.py`** - Configuration and environment variables
- **`api_client.py`** - API client wrapper for HTTP requests
- **`test_integration.py`** - Main integration test suite
- **`test_files/`** - Sample files for upload testing
- **`.env`** - Environment configuration

## Test Flow

The tests run in sequence and share state:

1. **Registration** - Creates a new user with unique credentials
2. **Login** - Authenticates and receives auth token
3. **File Upload** - Uploads a test file for downloadable content
4. **Create Searchable** - Publishes a searchable item with the uploaded file
5. **Retrieve Item** - Gets the created searchable by ID
6. **Search** - Searches for the created item
7. **Profile** - Retrieves user profile information

## Test Data

Each test run uses unique identifiers to avoid conflicts:
- Username: `test_user_<unique_id>`
- Email: `test_user_<unique_id>@test.example.com`
- Password: `TestPassword123!`

## Cleanup

Tests automatically clean up authentication tokens on completion. Test users and items remain on the server for manual verification if needed.

## Troubleshooting

### Common Issues

1. **Connection errors**: Verify the BASE_URL is correct and accessible
2. **Authentication failures**: Check if registration/login endpoints are working
3. **File upload issues**: Ensure test files exist in `test_files/` directory
4. **API changes**: Update `api_client.py` if endpoint signatures change

### Debug Mode

Run with additional debugging:
```bash
pytest test_integration.py -v -s --tb=long
```

### Environment Variables

- `BASE_URL`: Target server URL (default: https://silkroadonlightning.com)
- Add other environment variables as needed for testing

## API Endpoints Tested

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `POST /api/files/upload` - File upload
- `POST /api/v1/searchable/create` - Create searchable item
- `GET /api/v1/searchable/{id}` - Retrieve searchable item
- `GET /api/v1/searchable/search` - Search searchables
- `GET /api/profile` - User profile
- `POST /api/users/logout` - User logout