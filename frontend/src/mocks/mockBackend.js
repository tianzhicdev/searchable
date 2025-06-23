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
    
    let msg = 'User registered successfully';
    if (data.invite_code) {
      const validCodes = ['ABCDEF', 'TESTME', 'MOCK01', 'REWARD'];
      if (validCodes.includes(data.invite_code)) {
        msg = 'User registered successfully with invite code reward!';
      }
    }
    
    return createMockResponse({
      success: true,
      msg: msg
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
              images: [mockData.mockImage1, mockData.mockImage2],
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
              images: [mockData.mockImage2, mockData.mockImage1],
              downloadableFiles: [
                { name: 'Logo Templates', price: 19.99 },
                { name: 'Business Card Designs', price: 14.99 }
              ]
            }
          },
          created_at: new Date(Date.now() - 172800000).toISOString(),
          username: 'designer_pro'
        },
        {
          _id: 'mock-offline-1',
          searchable_id: 'mock-offline-1',
          terminal_id: 'mock-terminal-3',
          payloads: {
            public: {
              title: 'Local Coffee Shop Menu',
              description: 'Fresh handcrafted coffee, pastries, and light meals. Pickup available Monday-Friday 7AM-6PM',
              type: 'offline',
              currency: 'usd',
              images: [mockData.mockImage1, mockData.mockImage2],
              offlineItems: [
                { itemId: 'coffee-1', name: 'Espresso', price: 3.50 },
                { itemId: 'coffee-2', name: 'Cappuccino', price: 4.50 },
                { itemId: 'coffee-3', name: 'Latte', price: 5.00 },
                { itemId: 'pastry-1', name: 'Croissant', price: 2.50 },
                { itemId: 'pastry-2', name: 'Muffin', price: 3.00 }
              ]
            }
          },
          created_at: new Date(Date.now() - 259200000).toISOString(),
          username: 'local_cafe'
        },
        {
          _id: 'mock-offline-2',
          searchable_id: 'mock-offline-2',
          terminal_id: 'mock-terminal-4',
          payloads: {
            public: {
              title: 'Handmade Crafts Store',
              description: 'Beautiful handmade jewelry, pottery, and artwork. Custom orders welcome!',
              type: 'offline',
              currency: 'usd',
              images: [mockData.mockImage2, mockData.mockImage1],
              offlineItems: [
                { itemId: 'jewelry-1', name: 'Silver Necklace', price: 45.00 },
                { itemId: 'jewelry-2', name: 'Handmade Earrings', price: 25.00 },
                { itemId: 'pottery-1', name: 'Ceramic Mug', price: 18.00 },
                { itemId: 'pottery-2', name: 'Decorative Vase', price: 65.00 },
                { itemId: 'art-1', name: 'Small Canvas Painting', price: 120.00 }
              ]
            }
          },
          created_at: new Date(Date.now() - 345600000).toISOString(),
          username: 'artisan_maker'
        }
      ],
      pagination: {
        current_page: 1,
        page_size: 10,
        total_count: 4,
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
      const searchableId = url.split('/').pop();
      console.log(`[MOCK] Fetching searchable: ${searchableId}`);
      
      // Handle offline items
      if (searchableId === 'mock-offline-1') {
        return createMockResponse({
          _id: 'mock-offline-1',
          searchable_id: 'mock-offline-1',
          terminal_id: 'mock-terminal-3',
          payloads: {
            public: {
              title: 'Local Coffee Shop Menu',
              description: 'Fresh handcrafted coffee, pastries, and light meals. Pickup available Monday-Friday 7AM-6PM. Located at 123 Main Street, Downtown.',
              type: 'offline',
              currency: 'usd',
              images: [mockData.mockImage1, mockData.mockImage2],
              offlineItems: [
                { itemId: 'coffee-1', name: 'Espresso', price: 3.50 },
                { itemId: 'coffee-2', name: 'Cappuccino', price: 4.50 },
                { itemId: 'coffee-3', name: 'Latte', price: 5.00 },
                { itemId: 'pastry-1', name: 'Croissant', price: 2.50 },
                { itemId: 'pastry-2', name: 'Muffin', price: 3.00 }
              ]
            }
          },
          created_at: new Date(Date.now() - 259200000).toISOString(),
          username: 'local_cafe'
        });
      }
      
      if (searchableId === 'mock-offline-2') {
        return createMockResponse({
          _id: 'mock-offline-2',
          searchable_id: 'mock-offline-2',
          terminal_id: 'mock-terminal-4',
          payloads: {
            public: {
              title: 'Handmade Crafts Store',
              description: 'Beautiful handmade jewelry, pottery, and artwork. Custom orders welcome! Visit our studio at 456 Art Lane.',
              type: 'offline',
              currency: 'usd',
              images: [mockData.mockImage2, mockData.mockImage1],
              offlineItems: [
                { itemId: 'jewelry-1', name: 'Silver Necklace', price: 45.00 },
                { itemId: 'jewelry-2', name: 'Handmade Earrings', price: 25.00 },
                { itemId: 'pottery-1', name: 'Ceramic Mug', price: 18.00 },
                { itemId: 'pottery-2', name: 'Decorative Vase', price: 65.00 },
                { itemId: 'art-1', name: 'Small Canvas Painting', price: 120.00 }
              ]
            }
          },
          created_at: new Date(Date.now() - 345600000).toISOString(),
          username: 'artisan_maker'
        });
      }
      
      // Default to downloadable item for backwards compatibility
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
  
  // Media upload endpoint
  'v1/media/upload': () => {
    console.log('[MOCK] Media upload');
    const mockMediaId = `mock-media-${Date.now()}`;
    return createMockResponse({
      success: true,
      media_id: mockMediaId,
      media_uri: `/api/v1/media/${mockMediaId}`,
      file_id: `file-${mockMediaId}`,
      filename: `${mockMediaId}.png`,
      size: 1024
    });
  },
  
  // Media retrieval endpoint - handle any media ID
  'v1/media/': (url) => {
    const mediaId = url.split('/').pop();
    console.log('[MOCK] Media retrieval for:', mediaId);
    
    // Map mock media IDs to actual image files
    const mediaMap = {
      'profile-mock-1': mockData.mockImage1,
      'profile-designer-pro': mockData.mockImage2,
      'profile-digital-store': mockData.mockImage1,
      'gallery-mock-1': mockData.mockImage1,
      'gallery-mock-2': mockData.mockImage2,
      'gallery-mock-3': mockData.mockImage1,
      'gallery-mock-4': mockData.mockImage2,
      'designer-gallery-1': mockData.mockImage2,
      'designer-gallery-2': mockData.mockImage1,
      'designer-gallery-3': mockData.mockImage2,
      'designer-gallery-4': mockData.mockImage1,
      'store-gallery-1': mockData.mockImage1,
      'store-gallery-2': mockData.mockImage2
    };
    
    // Return the corresponding image or default
    const imageUrl = mediaMap[mediaId] || mockData.mockImage1;
    
    // For mock mode, we'll redirect to the actual image
    // In real implementation, this would return the binary image data
    return Promise.resolve({
      status: 200,
      data: imageUrl, // This will be handled by the browser as an image URL
      headers: {
        'content-type': 'image/png'
      }
    });
  },
  
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
          id: "purchase-1",
          amount: 29.99,  // Invoice amount (total price)
          payment_status: "complete",
          type: "stripe",
          currency: "usd",
          other_party_username: "DigitalAssetStore",
          payment_date: new Date(Date.now() - 3000000).toISOString(),
          created_at: new Date(Date.now() - 3600000).toISOString(),
          fee: 0.03,  // Platform fee (0.1% of 29.99)
          buyer_id: "mock-user-1",
          seller_id: "mock-terminal-1",
          searchable_id: "mock-item-1",
          metadata: {
            address: "123 Main St, City, State 12345",
            tel: "+1-555-0123",
            description: "Premium Digital Asset Bundle",
            stripe_fee: 1.05,  // Stripe fee (3.5% of 29.99)
            selections: [
              {
                id: "file-1",
                type: "downloadable",
                name: "Design_Templates_Pack.zip",
                price: 29.99
              }
            ]
          }
        },
        {
          id: "purchase-2",
          amount: 79.98,  // Invoice amount (29.99 + 49.99)
          payment_status: "complete",
          type: "stripe",
          currency: "usd",
          other_party_username: "DigitalAssetStore",
          payment_date: new Date(Date.now() - 6600000).toISOString(),
          created_at: new Date(Date.now() - 7200000).toISOString(),
          fee: 0.08,  // Platform fee (0.1% of 79.98)
          buyer_id: "mock-user-1",
          seller_id: "mock-terminal-1",
          searchable_id: "mock-item-1",
          metadata: {
            address: "123 Main St, City, State 12345",
            tel: "+1-555-0123",
            description: "Premium Digital Asset Bundle (x2 files)",
            stripe_fee: 2.80,  // Stripe fee (3.5% of 79.98)
            selections: [
              {
                id: "file-1",
                type: "downloadable",
                name: "Design_Templates_Pack.zip",
                price: 29.99
              },
              {
                id: "file-2",
                type: "downloadable",
                name: "Stock_Photos_Collection.zip",
                price: 49.99
              }
            ]
          }
        },
        {
          id: "purchase-3",
          amount: 16.50,  // Invoice amount (3.50 * 2 + 4.50 * 2 + 2.50 * 1)
          payment_status: "complete",
          type: "stripe",
          currency: "usd",
          other_party_username: "local_cafe",
          payment_date: new Date(Date.now() - 1800000).toISOString(),
          created_at: new Date(Date.now() - 2400000).toISOString(),
          fee: 0.02,  // Platform fee (0.1% of 16.50)
          buyer_id: "mock-user-1",
          seller_id: "mock-terminal-3",
          searchable_id: "mock-offline-1",
          metadata: {
            address: "123 Main St, City, State 12345",
            tel: "+1-555-0123",
            description: "Local Coffee Shop Menu - Morning Order",
            stripe_fee: 0.58,  // Stripe fee (3.5% of 16.50)
            selections: [
              {
                id: "coffee-1",
                type: "offline",
                name: "Espresso",
                price: 3.50,
                count: 2
              },
              {
                id: "coffee-2",
                type: "offline",
                name: "Cappuccino",
                price: 4.50,
                count: 2
              },
              {
                id: "pastry-1",
                type: "offline",
                name: "Croissant",
                price: 2.50,
                count: 1
              }
            ]
          }
        },
        {
          id: "purchase-4",
          amount: 108.00,  // Invoice amount (45.00 + 18.00 * 2 + 25.00)
          payment_status: "complete",
          type: "stripe",
          currency: "usd",
          other_party_username: "artisan_maker",
          payment_date: new Date(Date.now() - 7200000).toISOString(),
          created_at: new Date(Date.now() - 7800000).toISOString(),
          fee: 0.11,  // Platform fee (0.1% of 108.00)
          buyer_id: "mock-user-1",
          seller_id: "mock-terminal-4",
          searchable_id: "mock-offline-2",
          metadata: {
            address: "123 Main St, City, State 12345",
            tel: "+1-555-0123",
            description: "Handmade Crafts Store - Birthday Gifts",
            stripe_fee: 3.78,  // Stripe fee (3.5% of 108.00)
            selections: [
              {
                id: "jewelry-1",
                type: "offline",
                name: "Silver Necklace",
                price: 45.00,
                count: 1
              },
              {
                id: "pottery-1",
                type: "offline",
                name: "Ceramic Mug",
                price: 18.00,
                count: 2
              },
              {
                id: "jewelry-2",
                type: "offline",
                name: "Handmade Earrings",
                price: 25.00,
                count: 1
              }
            ]
          }
        }
      ],
      sales: [
        {
          id: "sale-1",
          amount: 15.50,  // Invoice amount (total price)
          payment_status: "complete",
          type: "stripe",
          currency: "usd",
          other_party_username: "BuyerUser123",
          payment_date: new Date(Date.now() - 6900000).toISOString(),
          created_at: new Date(Date.now() - 7200000).toISOString(),
          fee: 0.02,  // Platform fee (0.1% of 15.50)
          buyer_id: "mock-user-3",
          seller_id: "mock-user-1",
          searchable_id: "user-item-1",
          metadata: {
            address: "456 Buyer St, Customer City, State 67890",
            tel: "+1-555-0456",
            description: "My Digital Product",
            stripe_fee: 0.54,  // Stripe fee (3.5% of 15.50)
            selections: [
              {
                id: "my-file-1",
                type: "downloadable",
                name: "My_Product_Files.zip",
                price: 15.50
              }
            ]
          }
        },
        {
          id: "sale-2",
          amount: 99.99,  // Invoice amount (total price)
          payment_status: "complete",
          type: "stripe",
          currency: "usd",
          other_party_username: "CustomerPro",
          payment_date: new Date(Date.now() - 172200000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          fee: 0.10,  // Platform fee (0.1% of 99.99)
          buyer_id: "mock-user-4",
          seller_id: "mock-user-1",
          searchable_id: "user-item-2",
          metadata: {
            address: "789 Customer Ave, Buyer Town, State 11111",
            tel: "+1-555-0789",
            description: "Advanced Course Bundle",
            stripe_fee: 3.50,  // Stripe fee (3.5% of 99.99)
            selections: [
              {
                id: "course-bundle-1",
                type: "downloadable",
                name: "Advanced_Course_Complete.zip",
                price: 99.99
              }
            ]
          }
        }
      ],
      purchases_count: 4,
      sales_count: 2
    });
  },
  
  
  // User withdrawals endpoint
  'v1/withdrawals': () => {
    console.log('[MOCK] Fetching user withdrawals');
    return createMockResponse(mockData.mockWithdrawals);
  },
  
  // User rewards endpoint
  'v1/rewards': () => {
    console.log('[MOCK] Fetching user rewards');
    return createMockResponse(mockData.mockRewards);
  },
  
  
  'v1/profile/': (url) => {
    const identifier = url.split('/').pop();
    console.log('[MOCK] Fetching user profile by identifier:', identifier);
    
    // Create different profiles based on identifier
    let profileData = {
      username: 'test_user',
      profile_image_url: '/api/v1/media/profile-mock-1',
      introduction: 'Welcome to my digital marketplace profile!',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      metadata: {
        additional_images: [
          '/api/v1/media/gallery-mock-1',
          '/api/v1/media/gallery-mock-2',
          '/api/v1/media/gallery-mock-3'
        ],
        socialMedia: {
          instagram: 'mockuser_studio',
          x: 'mockuser',
          youtube: 'MockUserChannel'
        }
      }
    };
    
    let downloadables = [
      {
        searchable_id: 'mock-item-1',
        title: 'Premium Digital Asset Bundle',
        description: 'A comprehensive collection of high-quality digital assets',
        type: 'downloadable',
        price: 29.99,
        currency: 'USD'
      }
    ];
    
    // Handle specific seller profiles
    if (identifier === 'designer_pro') {
      profileData = {
        username: 'designer_pro',
        profile_image_url: '/api/v1/media/profile-designer-pro',
        introduction: 'Professional designer with 5+ years of experience creating stunning digital assets and templates.',
        created_at: new Date(Date.now() - 86400000 * 180).toISOString(),
        metadata: {
          additional_images: [
            '/api/v1/media/designer-gallery-1',
            '/api/v1/media/designer-gallery-2',
            '/api/v1/media/designer-gallery-3',
            '/api/v1/media/designer-gallery-4'
          ],
          socialMedia: {
            instagram: 'designer_pro_studio',
            x: 'designerpro',
            youtube: 'DesignerProChannel'
          }
        }
      };
      downloadables = [
        {
          searchable_id: 'mock-item-1',
          title: 'Premium Digital Asset Bundle',
          description: 'A comprehensive collection of high-quality digital assets',
          type: 'downloadable',
          price: 29.99,
          currency: 'USD'
        },
        {
          searchable_id: 'mock-item-2',
          title: 'Professional Design Templates',
          description: 'High-end design templates for business and creative projects',
          type: 'downloadable',
          price: 49.99,
          currency: 'USD'
        }
      ];
    } else if (identifier === 'DigitalAssetStore') {
      profileData = {
        username: 'DigitalAssetStore',
        profile_image_url: '/api/v1/media/profile-digital-store',
        introduction: 'Your trusted source for premium digital assets, templates, and creative resources.',
        created_at: new Date(Date.now() - 86400000 * 365).toISOString(),
        metadata: {
          additional_images: [
            '/api/v1/media/store-gallery-1',
            '/api/v1/media/store-gallery-2'
          ],
          socialMedia: {
            instagram: 'digitalassetstore',
            x: 'digitalassets',
            youtube: 'DigitalAssetStore'
          }
        }
      };
      downloadables = [
        {
          searchable_id: 'mock-item-1',
          title: 'Premium Digital Asset Bundle',
          description: 'A comprehensive collection of high-quality digital assets',
          type: 'downloadable',
          price: 29.99,
          currency: 'USD'
        },
        {
          searchable_id: 'mock-item-3',
          title: 'Stock Photo Collection',
          description: 'High-resolution stock photos for commercial use',
          type: 'downloadable',
          price: 79.99,
          currency: 'USD'
        },
        {
          searchable_id: 'mock-item-4',
          title: 'Design Element Library',
          description: 'Complete library of design elements and graphics',
          type: 'downloadable',
          price: 39.99,
          currency: 'USD'
        }
      ];
    }
    
    return createMockResponse({
      profile: profileData,
      downloadables: downloadables
    });
  },
  
  // Invite code validation endpoint
  'v1/is_active/': (url) => {
    const code = url.split('v1/is_active/')[1];
    console.log('[MOCK] Checking invite code:', code);
    
    // Mock some valid codes
    const validCodes = ['ABCDEF', 'TESTME', 'MOCK01', 'REWARD'];
    const isActive = validCodes.includes(code);
    
    return createMockResponse({ active: isActive });
  },

  // Get active invite code endpoint
  'v1/get-active-invite-code': () => {
    console.log('[MOCK] Getting active invite code');
    
    // Return a random active invite code
    const activeCodes = [
      { code: 'TESTME', description: 'Test invite code for demo purposes' },
      { code: 'MOCK01', description: 'Mock invite code - Get $5 bonus!' },
      { code: 'REWARD', description: 'Special reward code for new users' }
    ];
    
    const randomCode = activeCodes[Math.floor(Math.random() * activeCodes.length)];
    
    return createMockResponse({
      success: true,
      invite_code: randomCode.code,
      description: randomCode.description
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
  
  // User downloadable items endpoint
  'v1/downloadable-items-by-user': () => {
    console.log('[MOCK] Fetching user downloadable items');
    return createMockResponse({
      downloadable_items: [
        {
          invoice_id: 'purchase-1',
          searchable_id: 'mock-item-1',
          searchable_title: 'Premium Digital Asset Bundle',
          searchable_description: 'A comprehensive collection of high-quality digital assets including templates, graphics, and source files',
          seller_username: 'DigitalAssetStore',
          amount_paid: 29.99,
          fee_paid: 0.03,
          currency: 'usd',
          purchase_date: new Date(Date.now() - 3000000).toISOString(),
          item_type: 'downloadable',
          images: [mockData.mockImage1, mockData.mockImage2],
          downloadable_files: [
            {
              id: 'file-1',
              name: 'Design_Templates_Pack.zip',
              price: 29.99,
              file_uri: '/api/v1/download-file/file-1',
              download_url: '/api/v1/download-file/file-1'
            }
          ]
        },
        {
          invoice_id: 'purchase-2',
          searchable_id: 'mock-item-1',
          searchable_title: 'Premium Digital Asset Bundle',
          searchable_description: 'A comprehensive collection of high-quality digital assets including templates, graphics, and source files',
          seller_username: 'DigitalAssetStore',
          amount_paid: 79.98,
          fee_paid: 0.08,
          currency: 'usd',
          purchase_date: new Date(Date.now() - 6600000).toISOString(),
          item_type: 'downloadable',
          images: [mockData.mockImage1, mockData.mockImage2],
          downloadable_files: [
            {
              id: 'file-1',
              name: 'Design_Templates_Pack.zip',
              price: 29.99,
              file_uri: '/api/v1/download-file/file-1',
              download_url: '/api/v1/download-file/file-1'
            },
            {
              id: 'file-2',
              name: 'Stock_Photos_Collection.zip',
              price: 49.99,
              file_uri: '/api/v1/download-file/file-2',
              download_url: '/api/v1/download-file/file-2'
            }
          ]
        },
        {
          invoice_id: 'purchase-3',
          searchable_id: 'mock-item-2',
          searchable_title: 'Professional Design Templates',
          searchable_description: 'High-quality design templates for various business and creative projects',
          seller_username: 'designer_pro',
          amount_paid: 49.99,
          fee_paid: 0.05,
          currency: 'usd',
          purchase_date: new Date(Date.now() - 10800000).toISOString(),
          item_type: 'downloadable',
          images: [mockData.mockImage2],
          downloadable_files: [
            {
              id: 'file-3',
              name: 'Logo_Templates.zip',
              price: 19.99,
              file_uri: '/api/v1/download-file/file-3',
              download_url: '/api/v1/download-file/file-3'
            },
            {
              id: 'file-4',
              name: 'Business_Card_Designs.zip',
              price: 14.99,
              file_uri: '/api/v1/download-file/file-4',
              download_url: '/api/v1/download-file/file-4'
            },
            {
              id: 'file-5',
              name: 'Presentation_Templates.zip',
              price: 15.01,
              file_uri: '/api/v1/download-file/file-5',
              download_url: '/api/v1/download-file/file-5'
            }
          ]
        }
      ],
      count: 3
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