# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL DEVELOPER INSTRUCTIONS - Added 2025-01-06

### Workflow Requirements
1. **No confirmation needed** - Execute code changes, deployments, and testing immediately
2. **Always verify changes** - Restart services after changes to catch compile/runtime errors 
3. **Use `say` command** - Announce completion so developer knows task is done
4. **Deploy with `./remote_redeploy.sh`** - For backend deployments. Never deploy backend locally.
5. **Mock data required** - For any UI features, add mock data and verify with `REACT_APP_MOCK_MODE=true npm run start`
6. **Keep services running** - DO NOT stop npm run start servers or Docker containers after starting them - leave them running so developer can manually verify
7. **Show pending invoices** - On searchable detail pages, buyers should see their pending invoices from the past 24 hours alongside completed purchases

### Development Flow Pattern
```
Make Changes → Restart Services → Verify Working → Fix Errors → say "Task completed at [timestamp]"
```

---

## Quick Start Commands

### Frontend Development
 `REACT_APP_MOCK_MODE=true npm run start`

### Backend Development  
- Backend Deployment: `./remote_redeploy.sh` 
- Local Deployment: `./local_redeploy.sh` (use this instead of docker-compose commands)
- Integration Tests: `cd integration-tests && ./run_tests.sh`
  - For local testing: Update `integration-tests/.env` to set `BASE_URL=http://localhost:5005`
  - Tests verify: auth, file operations, searchables, payments, profiles, media
  - Expected: 18/18 tests pass (all integration tests should succeed)

### Local Docker Development
- **Full Stack Local**: `docker-compose -f docker-compose.local.yml up --build`
- **Access**: `http://localhost` or `http://localhost:443` (no SSL)
- **With SSL**: `./generate-local-ssl.sh` then `docker-compose up --build`

### Local Configuration (`REACT_APP_BRANDING=local`)
When `.secrets.env` contains `REACT_APP_BRANDING=local`:
- **Frontend**: Uses `http://localhost:5005/api/` (Flask API)
- **Backend API**: Available at `http://localhost:5005` (Swagger UI available)
- **File Server**: Uses local container `http://file_server:5006`
- **Database**: Local PostgreSQL container (`db:5432`)
- **All traffic stays local** - No external service calls
- **File Storage**: Local `./files` directory

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


---

## Frontend Component Patterns (Updated 2025-01-06)

### Authentication System - Post-Formik Architecture
- **Pattern**: Manual state management with Material-UI components (no Formik dependency)
- **Form State**: `useState` hooks for `formValues`, `formErrors`, `touched`, `isSubmitting`
- **Validation**: Custom `validateField` functions with real-time feedback
- **Files**: `RestLogin.js`, `RestRegister.js`
- **Benefits**: Cleaner code, better Material-UI integration, easier maintenance

```javascript
// New pattern for form handling
const [formValues, setFormValues] = useState({ email: '', password: '' });
const [formErrors, setFormErrors] = useState({});
const validateField = (name, value) => { /* custom validation */ };
```

### Profile System - User ID Based Routing
- **API Pattern**: `/api/v1/profile/<int:user_id>` for public profiles
- **Authentication**: Token-based `/api/v1/profile` for current user operations
- **Database**: `user_profile` table using `user_id` (terminal_id) as primary key
- **Navigation**: Profile links use `terminal_id` instead of username/email

### Media Management System
- **Pattern**: URI-based media system (`/api/v1/media/{uuid}`)
- **Utils**: `mediaUtils.js` for URL processing and mock mode support
- **Component**: `ZoomableImage` for interactive image viewing
- **Storage**: File server integration with proper URI mapping

```javascript
// Media URI processing
import { getMediaUrl, processMediaUrls } from '../../utils/mediaUtils';
const imageUrl = getMediaUrl(profile.profile_image_url);
```

### Component Styling Standards
- **Theme**: 5-color system (primary, secondary, alerting, warning, highlight)
- **Font**: FreePixel standardized across components
- **Import Pattern**: `useComponentStyles` for consistent styling
- **File**: `/frontend/src/themes/componentStyles.js`

## Backend API Patterns (Updated 2025-01-06)

### Profile Endpoints
- `GET /api/v1/profile/<int:user_id>` - Public profile access by user ID
- `GET /api/v1/profile` - Current user profile (token-required)
- `PUT /api/v1/profile` - Update current user profile (token-required)
- `POST /api/v1/profile` - Create user profile (token-required)

### Media Endpoints
- `POST /api/v1/media` - Upload media files
- `GET /api/v1/media/<uuid>` - Retrieve media by UUID
- **File**: `/api-server-flask/api/routes/media.py`

### Authentication Flow
1. **Login**: Email/password → JWT token with user object
2. **Profile Access**: Token-based for current user, ID-based for public profiles
3. **Navigation**: Use `terminal_id` for profile routing

## Development Practices (Updated 2025-01-06)

### Form Development
- **Use Material-UI directly** - No Formik dependency
- **Manual state management** - useState hooks with validation functions
- **Error handling** - Real-time validation with touched state tracking

### Media in Mock Mode
```bash
REACT_APP_MOCK_MODE=true npm run start
# Automatically maps media URIs to mock images
# Supports both data URLs and file server URLs
```

### Profile Development
- **Always use user_id** - Never use email for profile API calls
- **Terminal ID mapping** - Profile navigation uses terminal_id from searchable items
- **Token authentication** - Current user operations require valid JWT

---

## Recent Material Changes Log

### 2025-01-06: Authentication & Profile System Overhaul
1. **Authentication Components**: Converted from Formik to native Material-UI with manual state management
2. **Profile API**: Migrated from email-based to user_id-based routing
3. **Media System**: Implemented URI-based media management with file server integration
4. **Component Architecture**: Enhanced with ZoomableImage and improved styling patterns

### 2025-01-06: Integration Testing Update
1. **Test Suite Status**: All 17/17 integration tests now pass successfully
2. **Test Coverage**: Complete end-to-end testing of auth, file operations, searchables, payments, profiles, and media
3. **Command Update**: Use `cd integration-tests && ./run_tests.sh` for proper execution
4. **Test Reporting**: HTML reports generated for detailed test analysis

addtional: 
1. this file should be updated frequently, everytime there is a material change we should update this file. 
