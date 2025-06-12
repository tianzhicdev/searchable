# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Searchable is a declarative framework for building information deposit and retrieval systems. The goal is to enable websites to transform (from Twitter to Uber, Amazon to Tinder) with only configuration changes.

### Core Architecture

**Multi-service architecture with Docker Compose:**
- **Frontend**: React/Material-UI app with authentication and payment flows
- **Flask API**: Python backend with JWT auth, payment processing, and database operations  
- **File Server**: Separate service for file storage/retrieval
- **PostgreSQL**: Primary database with proper normalized tables
- **NGINX**: Reverse proxy and static file serving
- **Background Service**: Background task processing
- **USDT API**: Ethereum-based USDT transactions

**Key Concepts:**
- **Terminals**: Entities that consume information (users/services)
- **Searchables**: Information items produced by terminals (public/private)
- **Visibility Checks**: User-defined functions controlling access to private searchables

## Development Commands

### Frontend Development
```bash
cd frontend
npm install
npm run start                    # Local development
npm run start:mock              # Development with mock backend
npm run build                   # Production build
npm run test                    # Run tests
```

### Backend Development
```bash
cd api-server-flask
pip install -r requirements.txt
python run.py                   # Start API server (port 3006)
python run_file_server.py       # Start file server (port 5006)
python background.py             # Start background service
python tests.py                 # Run backend tests
```

### Full Stack Development
```bash
docker-compose up               # Start all services
docker-compose down             # Stop all services
```

### Integration Testing
```bash
cd integration-tests
./run_tests.sh                 # Run integration tests with HTML report
```

## Code Architecture

### Frontend Structure (`frontend/src/`)
- **`config.js`**: Environment-specific configuration and branding
- **`mocks/`**: Mock backend system for UI development without backend
- **`routes/`**: React Router configuration for different user types
- **`views/`**: Main application pages (searchables, payments, profile)
- **`components/`**: Reusable UI components
- **`store/`**: Redux state management
- **`utils/`**: Authentication guards and utilities

### Backend Structure (`api-server-flask/api/`)
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

### Database Design
Recently refactored from generic `kv` table to proper normalized tables:
- **invoice**: Invoice records with foreign keys
- **payment**: Payment records linked to invoices
- **withdrawal**: Enhanced withdrawal tracking  
- **rating**: Buyer/seller rating system
- **invoice_note**: Communication between parties

## Important Development Rules

1. **Use history not navigate** - For React Router navigation
2. **String interpolation and execute_sql** - For all database operations
3. **No restructuring unless instructed** - Make modifications, not wholesale changes

## Environment Configuration

### Frontend Branding
Configure via environment variables:
- `REACT_APP_BRANDING=silkroadonlightning` or `eccentricprotocol`
- `REACT_APP_ENV=local` (enables debug info)
- `REACT_APP_MOCK_MODE=true` (enables mock backend)

### Backend Configuration
Set via `.env` files in `api-server-flask/`:
- Database connection (PostgreSQL preferred, SQLite fallback)
- JWT secrets and GitHub OAuth
- Stripe payment configuration
- External service integrations

## Payment System

**Multi-currency support:**
- Lightning Network (sats)
- Stripe (USD)
- USDT (Ethereum)
- Automatic conversion using BTC price API

**Payment Flow:**
1. Invoice creation with currency/amount
2. Payment processing (Lightning/Stripe/USDT)
3. Payment verification and completion
4. Balance updates and withdrawal processing

## Mock Mode Development

For UI development without backend dependencies:

```bash
REACT_APP_MOCK_MODE=true npm run dev
```

Navigate to: `http://localhost:3000/searchable-item/mock-item-1`

Mock mode features:
- Complete mock data for testing UI flows
- Authentication bypass for development
- Visual indicator (orange "🔧 MOCK MODE" badge)
- Production-safe (only active with env var)

## Testing Strategy

1. **Frontend Tests**: `npm run test` (React Testing Library)
2. **Backend Tests**: `python tests.py` (pytest)
3. **Integration Tests**: `./integration-tests/run_tests.sh` (API endpoint testing)
4. **Mock Testing**: Use mock mode for UI development and testing

## Common Development Tasks

- **Run lint/typecheck**: Check `package.json` scripts for specific commands
- **Database migrations**: Apply schema changes via SQL scripts
- **Payment testing**: Use mock mode or test payment providers
- **File operations**: Test upload/download flows with file server
- **Currency conversion**: Verify BTC price API integration

## Developer Instructions:
1. Do not ask me for confirmation when editing code, doing local UI deployment or remote server deployment. Just do it.

2. After making changes, you must restart the server or ui service to verify that the changes requested are actually working. At the same time you can catch compile time and run time errors. Fix it before you declare victory.

3. Use “say” command to announce when the task is done so I know.
