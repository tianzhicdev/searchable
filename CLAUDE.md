# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL DEVELOPER INSTRUCTIONS - Added 2025-01-06

### Workflow Requirements
1. **No confirmation needed** - Execute code changes, deployments, and testing immediately
2. **Always verify changes** - Restart services after changes to catch compile/runtime errors 
5. **Mock data required** - For any UI features, add mock data and verify with `REACT_APP_MOCK_MODE=true npm run start`
6. **Keep services running** - DO NOT stop npm run start servers or Docker containers after starting them - leave them running so developer can manually verify

### Development Flow Pattern
```
Make Changes → Restart Services → Verify Working → Fix Errors → say "Task completed at [timestamp]"
```

## Quick Start Commands

### Frontend Development and Testing
 - run `REACT_APP_MOCK_MODE=true npm run start` to have mock ui rendered on localhost:3000

### Backend Development and Testing
- Backend Deployment: `./exec.sh remote deploy-all` 
- Local Deployment: `./exec.sh local deploy-all` (use this instead of docker-compose commands) to start backend on localhost:5005 and frontend at localhost:80 or 443
- Integration Tests: `cd integration-tests && ./run_comprehensive_tests.sh`
  - For local testing: Update `integration-tests/.env` to set `BASE_URL=http://localhost:5005`

## Project Overview

Searchable is a declarative framework for building information deposit and retrieval systems. Multi-service architecture with React frontend, Flask API, PostgreSQL database, and Docker Compose orchestration.

**Key Concepts:**
- **Terminals**: Information consumers (users/services) 
- **Searchables**: Information items (public/private)
- **Visibility Checks**: Access control functions

## Core Development Rules

1. **Use history not navigate** - React Router navigation
2. **Button styling** - Always use `variant="contained"` for all buttons throughout the application
3. **Mock mode for UI testing** - Always verify UI changes with mock data
4. **Restart services after changes** - Verify functionality using `./exec.sh local deploy-all` and `cd integration-tests && ./run_comprehensive_tests.sh` before declaring success

## Architecture Overview

### Frontend (`frontend/src/`)
- `config.js`: Environment/branding configuration
- `mocks/`: Mock backend for UI development
- `routes/`: React Router configuration  
- `views/`: Main application pages
- `components/`: Reusable UI components
- `store/`: Redux state management

### Backend (`api-server-flask/api/`)
- `common/`: Shared utilities (config, models, data helpers)
- `routes/`: API endpoints (auth, payment, searchable, files, withdrawals)

### Database
Normalized tables: invoice, payment, withdrawal, rating, invoice_note

## Additional Context (For Reference Only)

<details>
<summary>Detailed Architecture Information</summary>

### Multi-service architecture with Docker Compose:
- **Frontend**: React/Material-UI app with authentication and payment flows
- **Flask API**: Python backend with JWT auth, payment processing, and database operations  
- **File Server**: Separate service for file storage/retrieval
- **PostgreSQL**: Primary database with proper normalized tables
- **NGINX**: Reverse proxy and static file serving
- **Background Service**: Background task processing
- **USDT API**: Ethereum-based USDT transactions

### Frontend Structure Details (`frontend/src/`)
- **`config.js`**: Environment-specific configuration and branding
- **`mocks/`**: Mock backend system for UI development without backend
- **`routes/`**: React Router configuration for different user types
- **`views/`**: Main application pages (searchables, payments, profile)
- **`components/`**: Reusable UI components
- **`store/`**: Redux state management
- **`utils/`**: Authentication guards and utilities

### Backend Structure Details (`api-server-flask/api/`)
- **`common/`**: Shared utilities and configuration
  - `config.py`: Database and app configuration
  - `models.py`: SQLAlchemy database models
  - `data_helpers.py`: Database CRUD operations
  - `payment_helpers.py`: Payment business logic
- **`routes/`**: API endpoints organized by domain
  - `auth.py`: Authentication and user management
  - `payment.py`: Invoice creation and payment processing
  - `searchable.py`: Core searchable CRUD operations
  - `files.py`: File upload/download operations
  - `withdrawals.py`: USDT and Lightning withdrawals
