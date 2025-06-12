# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL DEVELOPER INSTRUCTIONS - Added 2025-01-06

### Workflow Requirements
1. **No confirmation needed** - Execute code changes, deployments, and testing immediately
2. **Always verify changes** - Restart services after changes to catch compile/runtime errors 
3. **Use `say` command** - Announce completion so developer knows task is done
4. **Deploy with `./remote_redeploy.sh`** - For backend deployments. Never deploy backend locally.
5. **Mock data required** - For any UI features, add mock data and verify with `REACT_APP_MOCK_MODE=true npm run`
6. **Always use timestamps** - Include timestamps in logs and communications for tracking

### Development Flow Pattern
```
Make Changes → Restart Services → Verify Working → Fix Errors → say "Task completed at [timestamp]"
```

---

## Quick Start Commands

### Frontend Development
 `REACT_APP_MOCK_MODE=true npm run`

### Backend Development  
- Backend Deployment: `remote_redeploy.sh` 
- Integration: `./integration-tests/run_tests.sh`

### Full Stack
```bash
docker-compose up               # All services
```

## Project Overview

Searchable is a declarative framework for building information deposit and retrieval systems. Multi-service architecture with React frontend, Flask API, PostgreSQL database, and Docker Compose orchestration.

**Key Concepts:**
- **Terminals**: Information consumers (users/services) 
- **Searchables**: Information items (public/private)
- **Visibility Checks**: Access control functions

## Core Development Rules

1. **Use history not navigate** - React Router navigation
2. **String interpolation and execute_sql** - Database operations  
3. **No restructuring unless instructed** - Modify, don't rebuild
4. **Mock mode for UI testing** - Always verify UI changes with mock data
5. **Restart services after changes** - Verify functionality before declaring success

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

## Environment Configuration

### Frontend
- `REACT_APP_BRANDING=silkroadonlightning` or `eccentricprotocol`
- `REACT_APP_ENV=local` (debug info)
- `REACT_APP_MOCK_MODE=true` (mock backend)


## Payment System
Flow: Invoice creation → Payment processing → Verification → Balance updates

## Testing
- Backend: `remote_redeploy.sh` 
- Integration: `./integration-tests/run_tests.sh`
- React UI Mock: `REACT_APP_MOCK_MODE=true npm run`

---

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

### Payment System Details

**Payment Flow:**
1. Invoice creation with currency/amount
2. Payment processing 
3. Payment verification and completion
4. Balance updates and withdrawal processing

### Mock Mode Development
For UI development without backend dependencies for testing:

```bash
REACT_APP_MOCK_MODE=true npm run dev
```

Navigate to: `http://localhost:3000/searchable-item/mock-item-1`

Mock mode features:
- Complete mock data for testing UI flows
- Authentication bypass for development
- Visual indicator (orange "🔧 MOCK MODE" badge)
- Production-safe (only active with env var)

