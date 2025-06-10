import realBackend from '../views/utilities/Backend';
import * as mockData from './mockData';

// Check if we're in mock mode
const isMockMode = process.env.REACT_APP_MOCK_MODE === 'true' || 
                   window.location.search.includes('mock=true');

// Mock response generator
const createMockResponse = (data, delay = 300) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data, status: 200, statusText: 'OK' });
    }, delay);
  });
};

// Mock API handlers
const mockHandlers = {
  // Searchable detail
  'v1/searchable/': (url) => {
    if (url.includes('v1/searchable/')) {
      return createMockResponse(mockData.mockSearchableItem);
    }
  },
  
  // Ratings
  'v1/rating/searchable/': () => createMockResponse(mockData.mockSearchableRating),
  'v1/rating/terminal/': () => createMockResponse(mockData.mockTerminalRating),
  
  // User paid files
  'v1/user-paid-files/': () => createMockResponse(mockData.mockUserPaidFiles),
  
  // Payments by searchable
  'v1/payments-by-searchable/': () => createMockResponse(mockData.mockPaymentsBySearchable),
  
  // Profile endpoints
  'v1/profile': () => createMockResponse(mockData.mockUserProfile),
  'v1/terminal': () => createMockResponse(mockData.mockTerminal),
  'balance': () => createMockResponse(mockData.mockBalance),
  
  // File download
  'v1/download-file/': () => createMockResponse(mockData.mockFileBlob, 100),
  
  // Create invoice (simulate Stripe redirect)
  'v1/create-invoice': (url, config) => {
    const payload = JSON.parse(config.data);
    if (payload.invoice_type === 'stripe') {
      return createMockResponse({
        url: `${window.location.origin}${window.location.pathname}?payment=success&mock=true`,
        session_id: 'mock-session-123'
      });
    }
    return createMockResponse({ success: true });
  },
  
  // Refresh payment status
  'v1/refresh-payment': () => createMockResponse({ status: 'complete' }),
  
  // Invoices
  'v1/invoices': () => createMockResponse(mockData.mockInvoices),
  
  // Payments by terminal
  'v1/payments-by-terminal': () => createMockResponse({ receipts: [] }),
  
  // Withdrawals by terminal
  'v1/withdrawals-by-terminal': () => createMockResponse({ withdrawals: [] }),
  
  // Default handler for unmatched routes
  default: (url) => {
    console.warn(`Mock handler not found for: ${url}`);
    return createMockResponse({ message: 'Mock data not available' });
  }
};

// Create mock backend wrapper
const mockBackend = {
  get: (url, config) => {
    if (!isMockMode) return realBackend.get(url, config);
    
    console.log(`[MOCK] GET ${url}`);
    
    // Find matching handler
    for (const [pattern, handler] of Object.entries(mockHandlers)) {
      if (pattern !== 'default' && url.includes(pattern)) {
        return handler(url, config);
      }
    }
    
    return mockHandlers.default(url);
  },
  
  post: (url, data, config) => {
    if (!isMockMode) return realBackend.post(url, data, config);
    
    console.log(`[MOCK] POST ${url}`, data);
    
    // Find matching handler
    for (const [pattern, handler] of Object.entries(mockHandlers)) {
      if (pattern !== 'default' && url.includes(pattern)) {
        return handler(url, { ...config, data: JSON.stringify(data) });
      }
    }
    
    return mockHandlers.default(url);
  },
  
  put: (url, data, config) => {
    if (!isMockMode) return realBackend.put(url, data, config);
    
    console.log(`[MOCK] PUT ${url}`, data);
    return createMockResponse({ success: true });
  },
  
  delete: (url, config) => {
    if (!isMockMode) return realBackend.delete(url, config);
    
    console.log(`[MOCK] DELETE ${url}`);
    return createMockResponse({ success: true });
  }
};

// Export the appropriate backend based on mock mode
const backend = isMockMode ? mockBackend : realBackend;

export default backend;
export { isMockMode };