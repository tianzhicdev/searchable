# Frontend Routes and API Summary

## Route Configuration

### Authentication Routes (GuestGuard)
- **`/login`** → `AuthLogin`
  - `POST /api/users/login` - User authentication
- **`/register`** → `AuthRegister`
  - `POST /api/users/register` - Create new account
  - `POST /api/users/login` - Auto-login after registration
- **`/visitor`** → `AuthVisitor`
  - Visitor flow (no API calls)

### Main Application Routes (AuthGuard)

#### Search & Discovery
- **`/`** → `Dashboard`
  - `GET /api/balance` - Get user balance
  - `GET /api/v1/profile` - Get user profile data
- **`/search`** → `Search` (redirects based on mode)
- **`/search-by-user`** → `SearchByUser`
  - `GET /api/v1/search/users` - Search users with filters
- **`/search-by-content`** → `SearchByContent`
  - `GET /api/v1/searchable/search` - Search content with filters

#### Searchable Item Details
- **`/searchable-item/:id`** → `DownloadableSearchableDetails`
  - `GET /api/v1/searchable/:id` - Get item details
  - `GET /api/v1/user-paid-files/:id` - Check user's paid files
  - `GET /api/v1/download-file/:searchableId/:fileId` - Download file
  - `POST /api/v1/create-invoice` - Create payment invoice
- **`/offline-item/:id`** → `OfflineSearchableDetails`
  - Same as above but for offline items
- **`/direct-item/:id`** → `DirectSearchableDetails`
  - Same as above but for direct payment items
- **`/allinone-item/:id`** → `AllInOneSearchableDetails`
  - Same as above but handles all component types
  - `GET /api/v1/user-paid-files/:id` - Check which files user has paid for
  - `GET /api/v1/download-file/:searchableId/:fileId` - Download paid files

#### Publishing Content
- **`/publish-downloadable`** → `PublishDownloadableSearchable`
  - `POST /api/v1/files/upload` - Upload files
  - `POST /api/v1/searchable/create` - Create searchable item
- **`/publish-offline`** → `PublishOfflineSearchable`
  - `POST /api/v1/searchable/create` - Create offline searchable
- **`/publish-direct`** → `PublishDirectSearchable`
  - `POST /api/v1/searchable/create` - Create direct payment searchable
- **`/publish-allinone`** → `PublishAllInOneSearchable`
  - `POST /api/v1/files/upload` - Upload images/files
  - `POST /api/v1/searchable/create` - Create all-in-one searchable
- **`/publish/ai-content`** → `PublishAIContent`
  - `POST /api/v1/ai-content` - Generate AI content
  - `GET /api/v1/ai-content` - Poll generation status

#### User Profile & Account
- **`/profile/:identifier`** → `UserProfile`
  - `GET /api/v1/profile?identifier=:identifier` - Get user profile
  - `GET /api/v1/downloadable-items-by-user/:identifier` - Get user's items
- **`/my-downloads`** → `MyDownloads`
  - `GET /api/v1/downloadable-items-by-user/:userId` - Get purchased items
- **`/edit-profile`** → `EditProfile`
  - `POST /api/users/edit-account` - Update profile info
  - `POST /api/v1/files/upload` - Upload profile image
  - `PUT /api/v1/profile` - Update profile metadata
- **`/change-password`** → `ChangePassword`
  - `POST /api/users/change-password` - Update password

#### Payments & Transactions
- **`/credit-card-refill`** → `CreditCardRefill`
  - `POST /api/v1/create-balance-invoice` - Create balance refill invoice
- **`/refill-usdt`** → `RefillUSDT`
  - `POST /api/v1/deposit/create` - Create USDT deposit
  - `GET /api/v1/deposit/:uuid` - Check deposit status
- **`/withdrawal-usdt`** → `WithdrawalUSDT`
  - `POST /api/v1/deposit/create` - Create withdrawal request
- **`/receipts`** → `Receipts`
  - `GET /api/v1/invoices` - Get user's invoices
- **`/ledger`** → `Ledger`
  - `GET /api/v1/balance-log` - Get balance history

#### Other Features
- **`/invite`** → `Invite`
  - `GET /api/v1/get-active-invite-code` - Get user's invite code
- **`/settings`** → `Settings`
  - Various profile and account management APIs

### Public Routes (No Auth)
- **`/`** → `Main` (landing page)
- **`/auth-onboarding`** → `AuthOnboarding`
- **`/onboarding`** → `Onboarding`
- **`/pricing`** → `Pricing`
- **`/publishers`** → `Publishers`
- **`/content-rules`** → `ContentPolicy`
- **`/developer`** → `Developer`

## Common API Patterns

### Authentication
- Token stored in Redux state (`state.account.token`)
- Automatically added to requests via Axios interceptor
- Token format: JWT without "Bearer " prefix

### File Operations
- **Upload**: `POST /api/v1/files/upload` (multipart/form-data)
  - Returns: `{ file_id, uuid, uri }`
  - URI used for profile images and searchable images
- **Download**: `GET /api/v1/download-file/:searchableId/:fileId`
  - Returns: Binary file data

### Search Operations
- Query parameters: `q` (search term), `page`, `limit`
- Response includes pagination metadata

### Payment Flow
1. Create invoice: `POST /api/v1/create-invoice`
2. Process payment (handled by payment component)
3. Check payment status via invoice endpoints

### Mock Mode
- Enabled via `REACT_APP_MOCK_MODE=true`
- Mock handlers in `frontend/src/mocks/`
- Simulates backend responses for UI development