# Mock Mode Documentation

This directory contains the mock data system for UI development without backend dependencies.

## How to Use

### 1. Start in Mock Mode

```bash
npm run start:mock
```

Or append `?mock=true` to any URL when running the regular dev server:
```
http://localhost:3000/searchable-item/mock-item-1?mock=true
```

### 2. Visual Indicator

When mock mode is active, you'll see an orange "🔧 MOCK MODE" badge in the top-right corner.

### 3. Test the DownloadableSearchableDetails

Navigate to: `http://localhost:3000/searchable-item/mock-item-1`

This will show:
- A mock item with title "Premium Digital Asset Bundle"
- 3 downloadable files with different prices
- Mock ratings (4.5/5 with 23 reviews)
- File selection and purchase flow
- Mock payment simulation

**Note**: Authentication is automatically bypassed in mock mode for the DownloadableSearchableDetails component.

### 4. Mock Data Structure

All mock data is defined in `mockData.js`:
- `mockSearchableItem` - The main item data
- `mockSearchableRating` - Item ratings
- `mockTerminalRating` - Seller ratings
- `mockUserPaidFiles` - Files the user has already purchased
- `mockPaymentsBySearchable` - Payment history
- `mockProfile` - User profile data
- `mockBalance` - User balance
- `mockInvoices` - Invoice history

### 5. Adding New Mock Endpoints

To add new mock endpoints:

1. Add mock data to `mockData.js`
2. Add handler to `mockHandlers` in `mockBackend.js`
3. Update component imports from `Backend` to `mockBackend`

Example:
```javascript
// In mockData.js
export const mockNewData = { ... };

// In mockBackend.js
const mockHandlers = {
  'v1/new-endpoint': () => createMockResponse(mockData.mockNewData),
  // ...
};
```

### 6. Production Safety

Mock mode is only activated when:
- `REACT_APP_MOCK_MODE=true` environment variable is set
- OR `?mock=true` query parameter is present

Production builds ignore mock mode completely, ensuring no mock code affects production.

### 7. Extending to Other Components

To use mock mode in other components:

1. Change the import:
   ```javascript
   // From:
   import backend from '../utilities/Backend';
   
   // To:
   import backend from '../../mocks/mockBackend';
   ```

2. The mock backend will automatically handle requests based on the mode.

### 8. Mock Features

The mock system simulates:
- API response delays (300ms default)
- Successful payment flows
- File downloads (returns mock blob)
- Authentication state
- Error states (can be added as needed)

### 9. Console Logging

All mock API calls are logged to the console with `[MOCK]` prefix for debugging.