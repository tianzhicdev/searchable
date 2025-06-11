import axios from 'axios';
import configData from '../config';
import * as mockData from './mockData';

// Create real backend instance directly here to avoid circular imports
const realBackend = axios.create({
  baseURL: configData.API_SERVER,
});

// Check if we're in mock mode (only use environment variable)
const isMockMode = process.env.REACT_APP_MOCK_MODE === 'true';

console.log('[MOCK BACKEND] Mock mode check:', {
  env: process.env.REACT_APP_MOCK_MODE,
  isMockMode
});

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
  // Authentication endpoints
  'users/login': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Login attempt with:', data);
    return createMockResponse({
      success: true,
      token: 'mock-jwt-token-12345',
      user: {
        _id: 'mock-user-1',
        username: 'test_user',
        email: data.email
      }
    });
  },
  
  'users/register': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Register attempt with:', data);
    return createMockResponse({
      success: true,
      msg: 'User registered successfully'
    });
  },
  
  'users/logout': () => {
    console.log('[MOCK] Logout');
    return createMockResponse({ success: true });
  },
  
  // Searchable endpoints - ORDER MATTERS! Most specific patterns first
  'v1/searchable/search': (url) => {
    console.log('[MOCK] Searching searchables');
    return createMockResponse({
      results: [
        {
          _id: 'mock-item-1',
          searchable_id: 'mock-item-1',
          terminal_id: 'mock-terminal-1',
          payloads: {
            public: {
              title: 'Premium Digital Asset Bundle',
              description: 'A comprehensive collection of high-quality digital assets including templates, graphics, and source files',
              type: 'downloadable',
              currency: 'usd',
              downloadableFiles: [
                { name: 'Design Templates Pack', price: 29.99 },
                { name: 'Stock Photos Collection', price: 49.99 }
              ]
            }
          },
          created_at: new Date(Date.now() - 86400000).toISOString(),
          username: 'test_user'
        },
        {
          _id: 'mock-item-2',
          searchable_id: 'mock-item-2',
          terminal_id: 'mock-terminal-2',
          payloads: {
            public: {
              title: 'Professional Design Kit',
              description: 'High-quality design templates and resources for professional projects',
              type: 'downloadable',
              currency: 'usd',
              downloadableFiles: [
                { name: 'Logo Templates', price: 19.99 },
                { name: 'Business Card Designs', price: 14.99 }
              ]
            }
          },
          created_at: new Date(Date.now() - 172800000).toISOString(),
          username: 'designer_pro'
        }
      ],
      pagination: {
        current_page: 1,
        page_size: 10,
        total_count: 2,
        total_pages: 1
      }
    });
  },
  
  'v1/searchable/create': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Creating searchable:', data);
    return createMockResponse({
      success: true,
      searchable_id: 'mock-created-item-' + Date.now(),
      message: 'Searchable created successfully'
    });
  },
  
  'v1/searchable/': (url) => {
    if (url.includes('v1/searchable/')) {
      // Return mock data with image URLs - manually create copy to preserve imports
      const originalItem = mockData.mockSearchableItem;
      const mockItem = {
        ...originalItem,
        payloads: {
          ...originalItem.payloads,
          public: {
            ...originalItem.payloads.public,
            images: originalItem.payloads.public.imageUrls || originalItem.payloads.public.images || []
          }
        }
      };
      
      // Remove imageUrls from the response
      delete mockItem.payloads.public.imageUrls;
      
      console.log('[MOCK] Returning searchable item with images:', mockItem.payloads.public.images);
      console.log('[MOCK] Images length:', mockItem.payloads.public.images.length);
      console.log('[MOCK] First image:', mockItem.payloads.public.images[0]?.substring(0, 50));
      return createMockResponse(mockItem);
    }
  },
  
  // File upload endpoint
  'v1/files/upload': () => {
    console.log('[MOCK] File upload');
    return createMockResponse({
      success: true,
      file_id: 'mock-file-id-' + Date.now(),
      uuid: 'mock-uuid-' + Date.now(),
      message: 'File uploaded successfully'
    });
  },
  
  // Ratings
  'v1/rating/searchable/': () => createMockResponse(mockData.mockSearchableRating),
  'v1/rating/terminal/': () => createMockResponse(mockData.mockTerminalRating),
  
  // User purchases and ratings
  'v1/user/purchases': () => {
    console.log('[MOCK] Fetching user purchases');
    return createMockResponse({
      purchases: [
        {
          invoice_id: 'mock-invoice-1',
          item_title: 'Premium Digital Asset Bundle',
          item_description: 'A comprehensive collection of high-quality digital assets',
          amount: 29.99,
          currency: 'usd',
          payment_completed: new Date(Date.now() - 86400000).toISOString(),
          can_rate: true,
          already_rated: false
        },
        {
          invoice_id: 'mock-invoice-2',
          item_title: 'Professional Design Templates',
          item_description: 'High-quality design templates for various projects',
          amount: 49.99,
          currency: 'usd',
          payment_completed: new Date(Date.now() - 172800000).toISOString(),
          can_rate: false,
          already_rated: true
        }
      ]
    });
  },
  
  'v1/rating/submit': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Submitting rating:', data);
    return createMockResponse({
      success: true,
      message: 'Rating submitted successfully'
    });
  },
  
  // User paid files
  'v1/user-paid-files/': () => createMockResponse(mockData.mockUserPaidFiles),
  
  // Payments by searchable
  'v1/payments-by-searchable/': () => createMockResponse(mockData.mockPaymentsBySearchable),
  
  // Profile endpoints
  'v1/profile': () => createMockResponse(mockData.mockUserProfile),
  'v1/terminal': () => createMockResponse(mockData.mockTerminal),
  'balance': () => createMockResponse(mockData.mockBalance),
  
  // Withdrawal endpoint
  'v1/withdrawal-usd': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Processing USDT withdrawal:', data);
    return createMockResponse({
      success: true,
      transaction_id: 'mock-txn-' + Date.now(),
      message: 'Withdrawal processed successfully'
    });
  },
  
  // File download
  'v1/download-file/': () => createMockResponse(mockData.mockFileBlob, 100),
  
  // Create invoice (simulate Stripe redirect)
  'v1/create-invoice': (url, config) => {
    const payload = JSON.parse(config.data);
    if (payload.invoice_type === 'stripe') {
      return createMockResponse({
        url: `${window.location.origin}${window.location.pathname}?payment=success`,
        session_id: 'mock-session-123'
      });
    }
    return createMockResponse({ success: true });
  },
  
  // Refresh payment status
  'v1/refresh-payment': () => createMockResponse({ status: 'complete' }),
  
  // Invoices endpoint for user invoices view
  'v1/invoices': () => createMockResponse(mockData.mockInvoices),
  
  // Invoices by searchable item endpoint
  'v1/invoices-by-searchable/': (url) => {
    const searchableId = url.split('/').pop();
    console.log(`[MOCK] Fetching invoices for searchable: ${searchableId}`);
    return createMockResponse({
      invoices: mockData.mockInvoices.invoices.filter(invoice => 
        invoice.searchable_id === searchableId
      )
    });
  },
  
  // User invoices endpoint with purchases and sales
  'v1/user/invoices': () => {
    console.log('[MOCK] Fetching user invoices (purchases/sales)');
    return createMockResponse({
      invoices: mockData.mockInvoices.invoices,
      purchases: [
        {
          _id: "purchase-1",
          invoice_id: "invoice-1",
          searchable_id: "mock-item-1",
          amount: 29.99,
          currency: "usd",
          status: "paid",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          item_title: "Premium Digital Asset Bundle",
          seller_username: "designer_pro"
        },
        {
          _id: "purchase-2",
          invoice_id: "invoice-2",
          searchable_id: "mock-item-3",
          amount: 19.99,
          currency: "usd",
          status: "paid",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          item_title: "Professional Design Kit",
          seller_username: "creator_master"
        }
      ],
      sales: [
        {
          _id: "sale-1",
          invoice_id: "invoice-3",
          searchable_id: "user-item-1",
          amount: 39.99,
          currency: "usd",
          status: "paid",
          created_at: new Date(Date.now() - 7200000).toISOString(),
          item_title: "My First Digital Product",
          buyer_username: "happy_buyer"
        },
        {
          _id: "sale-2",
          invoice_id: "invoice-4",
          searchable_id: "user-item-2",
          amount: 49.99,
          currency: "usd",
          status: "paid",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          item_title: "Advanced Code Tutorials",
          buyer_username: "code_learner"
        }
      ],
      purchases_count: 2,
      sales_count: 2
    });
  },
  
  
  // User withdrawals endpoint
  'v1/withdrawals': () => {
    console.log('[MOCK] Fetching user withdrawals');
    return createMockResponse({
      withdrawals: [
        {
          _id: "withdrawal-1",
          withdrawal_id: "withdrawal-1",
          amount: 50.00,
          currency: "usd",
          status: "complete",
          type: "usdt",
          created_at: new Date(Date.now() - 259200000).toISOString(),
          completed_at: new Date(Date.now() - 172800000).toISOString(),
          wallet_address: "0x1234...5678"
        },
        {
          _id: "withdrawal-2", 
          withdrawal_id: "withdrawal-2",
          amount: 100.00,
          currency: "usd",
          status: "pending",
          type: "lightning",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          lightning_invoice: "lnbc100..."
        }
      ]
    });
  },
  
  
  'v1/profile/': (url) => {
    const userId = url.split('/').pop();
    console.log('[MOCK] Fetching user profile by ID:', userId);
    return createMockResponse({
      profile: {
        username: 'test_user',
        profile_image_url: null,
        introduction: 'Welcome to my digital marketplace profile!',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString()
      },
      downloadables: [
        {
          searchable_id: 'mock-item-1',
          title: 'Premium Digital Asset Bundle',
          description: 'A comprehensive collection of high-quality digital assets',
          type: 'downloadable',
          price: 29.99,
          currency: 'USD'
        }
      ]
    });
  },
  
  // Search/listing endpoints  
  'v1/searchables': (url) => {
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const userId = urlParams.get('user_id');
    
    if (userId) {
      // Return user's own searchables for publish-searchables page
      console.log('[MOCK] Fetching user searchables for user:', userId);
      return createMockResponse(mockData.mockUserSearchables);
    }
    
    // In mock mode, show a mix that includes the user's own items to simulate logged-in experience
    console.log('[MOCK] Fetching all searchables list (logged-in user view)');
    return createMockResponse({
      searchables: [
        // Include user's own searchables
        ...mockData.mockUserSearchables.searchables,
        // Include other users' searchables
        {
          _id: 'mock-item-3',
          searchable_id: 'mock-item-3',
          terminal_id: 'mock-terminal-2',
          payloads: {
            public: {
              title: 'Professional Design Kit',
              description: 'High-quality design templates and resources for professional projects',
              type: 'downloadable',
              currency: 'usd',
              downloadableFiles: [
                { name: 'Logo Templates', price: 19.99 },
                { name: 'Business Card Designs', price: 14.99 }
              ]
            }
          },
          created_at: new Date(Date.now() - 172800000).toISOString(),
          username: 'designer_pro'
        }
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 3,
        totalPages: 1
      }
    });
  },
  
  // Default handler for unmatched routes
  default: (url) => {
    console.warn(`Mock handler not found for: ${url}`);
    return createMockResponse({ message: 'Mock data not available' });
  }
};

// Create mock backend wrapper
const mockBackend = {
  get: (url, config) => {
    if (!isMockMode) {
      console.log(`[MOCK] Redirecting to real backend: GET ${url}`);
      return realBackend.get(url, config);
    }
    
    console.log(`[MOCK] GET ${url}`, config);
    
    // Find matching handler - sort patterns by length descending for more specific matches first
    const sortedPatterns = Object.entries(mockHandlers)
      .filter(([pattern]) => pattern !== 'default')
      .sort(([a], [b]) => b.length - a.length);
      
    for (const [pattern, handler] of sortedPatterns) {
      if (url.includes(pattern)) {
        console.log(`[MOCK] Found handler for pattern: ${pattern}`);
        return handler(url, config);
      }
    }
    
    console.log(`[MOCK] No handler found, using default for: ${url}`);
    return mockHandlers.default(url);
  },
  
  post: (url, data, config) => {
    if (!isMockMode) return realBackend.post(url, data, config);
    
    console.log(`[MOCK] POST ${url}`, data);
    
    // Find matching handler - sort patterns by length descending for more specific matches first
    const sortedPatterns = Object.entries(mockHandlers)
      .filter(([pattern]) => pattern !== 'default')
      .sort(([a], [b]) => b.length - a.length);
      
    for (const [pattern, handler] of sortedPatterns) {
      if (url.includes(pattern)) {
        console.log(`[MOCK] Found POST handler for pattern: ${pattern}`);
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