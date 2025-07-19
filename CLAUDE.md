# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL DEVELOPER INSTRUCTIONS - Updated 2025-01-14

### Core Development Principles

#### 1. **CODE REUSABILITY IS PARAMOUNT**
- **ALWAYS check for existing implementations** before writing new code
- **Reuse existing components, utilities, and patterns** - NEVER duplicate functionality
- **Extract common logic** into shared utilities/components when modifying code
- **DRY (Don't Repeat Yourself)** - If you find yourself writing similar code twice, create a reusable function/component

#### 2. **RESPECT EXISTING CODE STYLES**
- **MANDATORY: Study existing code patterns** before implementing anything new
- **Match the exact style** of surrounding code (indentation, naming, structure)
- **Use existing libraries and utilities** - check package.json/requirements.txt first
- **Follow established patterns** for similar functionality elsewhere in codebase

#### 3. **CENTRALIZED MANAGEMENT**
- **Backend SQL**: ALL database queries MUST go through `api/common/data_helpers.py`
  - NEVER write raw SQL in route handlers
  - Add new database operations as functions in data_helpers.py
  - Reuse existing query patterns and helper functions
- **Frontend Components**: Use and extend components in `frontend/src/components/`
  - Check for existing components before creating new ones
  - Extend existing components rather than duplicating
  - Keep component styles co-located with components
  - always add 'data-testid' and 'id' for UI components
- **Shared Styles**: Use Material-UI theme and existing style patterns
  - Leverage existing makeStyles patterns
  - Use theme variables for consistency

### Workflow Requirements
1. **No confirmation needed** - Execute code changes, deployments, and testing immediately
2. **Always verify changes** - Restart services after changes to catch compile/runtime errors
3. **Study before implementing** - ALWAYS scan relevant parts of codebase first
4. **Mock data required** - For any UI features, add mock data and verify with `REACT_APP_MOCK_MODE=true npm run start`
5. **Keep services running** - DO NOT stop npm run start servers or Docker containers after starting them
6. **Currency consistency** - Only use 'usd' in database; USDT for UI display only

### Development Flow Pattern
```
Study Existing Code → Find Reusable Components → Implement Using Existing Patterns → Verify → Fix Errors → say "Task completed at [timestamp]"
```

## Quick Start Commands

### Frontend Development and Testing
- Run `REACT_APP_MOCK_MODE=true npm run start` to have mock UI rendered on localhost:3000

### Backend Development and Testing
- Backend Deployment: `./exec.sh remote deploy-all` 
- Local Deployment: `./exec.sh local deploy-all` (use instead of docker-compose)
- Integration Tests: `cd integration-tests && ./run_comprehensive_tests.sh`
  - For local testing: Update `integration-tests/.env` to set `BASE_URL=http://localhost:5005`

## Project Overview

Searchable is a declarative framework for building information deposit and retrieval systems. Multi-service architecture with React frontend, Flask API, PostgreSQL database, and Docker Compose orchestration.

**Key Concepts:**
- **Terminals**: Information consumers (users/services) 
- **Searchables**: Information items (public/private)
- **Visibility Checks**: Access control functions

## Core Development Rules

1. **Code Reusability First** - Check for existing implementations before writing new code
2. **Centralized SQL Management** - ALL database operations through `data_helpers.py`
3. **Component Reuse** - Use existing components from `frontend/src/components/`
4. **Consistent Styling** - Follow existing Material-UI patterns and theme
5. **Use history not navigate** - React Router navigation
6. **Button styling** - Always use `variant="contained"` for all buttons
7. **Mock mode for UI testing** - Always verify UI changes with mock data
8. **Currency Standardization** - lowercase 'usd' in database, USDT for UI display
9. **Downloadable File IDs** - Consistent ID usage for downloadable files:
   - **fileId**: Numeric ID from files table - used for frontend/backend communication
   - **id**: UUID for file server - used for backend/fileserver communication only
   - In payment selections, always include both `id` and `fileId` fields for downloadables
   - Download endpoint accepts numeric fileId in URL: `/api/v1/download-file/<searchable_id>/<fileId>`

## Architecture Overview

### Frontend (`frontend/src/`)
- `config.js`: Environment/branding configuration
- `mocks/`: Mock backend for UI development
- `routes/`: React Router configuration  
- `views/`: Main application pages
- `components/`: **REUSABLE UI COMPONENTS - CHECK HERE FIRST**
- `store/`: Redux state management
- `utils/`: Shared utilities and helpers

### Backend (`api-server-flask/api/`)
- `common/`: **CENTRALIZED SHARED UTILITIES**
  - `config.py`: Database and app configuration
  - `models.py`: SQLAlchemy database models
  - `data_helpers.py`: **ALL DATABASE OPERATIONS GO HERE**
  - `payment_helpers.py`: Payment business logic
- `routes/`: API endpoints (use data_helpers for DB operations)

### Database
Normalized tables: invoice, payment, withdrawal, rating, invoice_note

## Code Reusability Examples

### Backend Example - Adding New Database Query
```python
# WRONG - Don't write SQL in routes
@app.route('/api/users/<user_id>/stats')
def get_user_stats(user_id):
    result = db.execute("SELECT COUNT(*) FROM searchables WHERE user_id = ?", user_id)
    
# CORRECT - Add to data_helpers.py and reuse
# In data_helpers.py:
def get_user_searchable_count(user_id):
    return Searchable.query.filter_by(user_id=user_id).count()

# In route:
@app.route('/api/users/<user_id>/stats')
def get_user_stats(user_id):
    count = get_user_searchable_count(user_id)
```

### Frontend Example - Creating New Component
```javascript
// WRONG - Don't create new button component
const MyCustomButton = () => <button style={{...}}>Click</button>

// CORRECT - Reuse existing components
import { Button } from '@mui/material';
<Button variant="contained">Click</Button>
```

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

</details>

## Remember: Reuse > Recreate

Before implementing ANY feature:
1. Search for existing implementations
2. Check data_helpers.py for similar database operations  
3. Browse components/ for reusable UI elements
4. Follow the exact patterns you find
5. Only create new code when absolutely necessary