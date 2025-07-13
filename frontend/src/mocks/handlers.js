// MSW request handlers
import { http, HttpResponse } from 'msw';
import { 
  mockSearchableItem, 
  mockDeletedSearchableItem, 
  mockSearchableRating,
  mockTerminalRating,
  mockUserPaidFiles,
  mockPaymentsBySearchable,
  mockProfile,
  mockBalance,
  mockUserProfile
} from './mockData';

// Mock data
const mockUser = {
  _id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  balance: { usd: 100 },
  profile_image_url: '/api/test-profile.jpg',
  tags: [
    { id: 1, name: 'artist', tag_type: 'user' }
  ]
};

const mockSearchables = [
  {
    searchable_id: 'mock-item-1',
    title: 'Test Downloadable Content',
    description: 'High quality digital assets for your projects',
    type: 'downloadable',
    price: 29.99,
    owner_username: 'seller123',
    owner_id: 'seller-1',
    images: ['/api/test-image-1.jpg'],
    tags: [{ id: 1, name: 'art', tag_type: 'searchable' }],
    payloads: {
      public: {
        downloadableFiles: [
          {
            fileId: 'file-1',
            name: 'Design Template Pack',
            description: 'Professional templates',
            price: 19.99,
            fileName: 'templates.zip',
            fileSize: 1048576
          },
          {
            fileId: 'file-2',
            name: 'Bonus Icons',
            description: 'Icon pack',
            price: 10.00,
            fileName: 'icons.zip',
            fileSize: 524288
          }
        ]
      }
    },
    avg_rating: 4.5,
    total_ratings: 10
  },
  {
    searchable_id: 'mock-item-2',
    title: 'Coffee Shop Menu',
    description: 'Artisan coffee and pastries',
    type: 'offline',
    owner_username: 'cafe_owner',
    owner_id: 'seller-2',
    images: ['/api/test-image-2.jpg'],
    tags: [{ id: 2, name: 'food', tag_type: 'searchable' }],
    payloads: {
      public: {
        offlineItems: [
          { itemId: 1, name: 'Espresso', price: 3.50, description: 'Single shot' },
          { itemId: 2, name: 'Cappuccino', price: 4.50, description: 'With foam art' },
          { itemId: 3, name: 'Croissant', price: 3.00, description: 'Fresh baked' }
        ]
      }
    },
    avg_rating: 4.8,
    total_ratings: 25
  },
  {
    searchable_id: 'mock-item-3',
    title: 'Support My Art',
    description: 'Help me create more amazing content',
    type: 'direct',
    owner_username: 'creator789',
    owner_id: 'seller-3',
    payment_type: 'flexible',
    images: [],
    tags: [{ id: 3, name: 'support', tag_type: 'searchable' }],
    payloads: {
      public: {
        payment_type: 'flexible',
        price: null,
        preset_amounts: []
      }
    },
    avg_rating: 5.0,
    total_ratings: 5
  }
];

const mockInvoices = {
  purchases: [
    {
      id: 1,
      invoice_id: 'inv-1',
      searchable_id: 'mock-item-1',
      item_title: 'Test Downloadable Content',
      searchable_type: 'downloadable',
      amount: 29.99,
      currency: 'usd',
      status: 'paid',
      payment_date: new Date().toISOString(),
      other_party_username: 'seller123',
      metadata: {
        selections: [
          { id: 'file-1', name: 'Design Template Pack', price: 19.99, type: 'downloadable' },
          { id: 'file-2', name: 'Bonus Icons', price: 10.00, type: 'downloadable' }
        ]
      }
    }
  ],
  sales: [],
  purchases_count: 1,
  sales_count: 0
};

const mockTags = [
  { id: 1, name: 'art', tag_type: 'searchable', description: 'Digital art', is_active: true },
  { id: 2, name: 'music', tag_type: 'searchable', description: 'Music files', is_active: true },
  { id: 3, name: 'books', tag_type: 'searchable', description: 'Digital books', is_active: true },
  { id: 4, name: 'food', tag_type: 'searchable', description: 'Food items', is_active: true },
  { id: 5, name: 'support', tag_type: 'searchable', description: 'Support creators', is_active: true },
  { id: 10, name: 'artist', tag_type: 'user', description: 'Visual artists', is_active: true },
  { id: 11, name: 'musician', tag_type: 'user', description: 'Musicians', is_active: true },
  { id: 12, name: 'writer', tag_type: 'user', description: 'Writers', is_active: true }
];

// Request handlers
export const handlers = [
  // Auth endpoints
  http.get('/api/v1/me', () => {
    return HttpResponse.json({ success: true, user: mockUser });
  }),

  // Search endpoints
  http.post('/api/v1/search/searchables', async ({ request }) => {
    const body = await request.json();
    let results = [...mockSearchables];
    
    // Filter by query
    if (body.query) {
      results = results.filter(s => 
        s.title.toLowerCase().includes(body.query.toLowerCase()) ||
        s.description.toLowerCase().includes(body.query.toLowerCase())
      );
    }
    
    // Filter by type
    if (body.type && body.type !== 'all') {
      results = results.filter(s => s.type === body.type);
    }
    
    return HttpResponse.json({
      success: true,
      searchables: results,
      pagination: {
        page: 1,
        limit: 20,
        total: results.length,
        pages: 1
      }
    });
  }),

  // Searchable detail
  http.get('/api/v1/searchable/:id', ({ params }) => {
    console.log('Mock API: Fetching searchable with ID:', params.id);
    
    // Handle specific mock items
    if (params.id === 'mock-item-1') {
      console.log('Mock API: Returning active mock item');
      return HttpResponse.json(mockSearchableItem);
    }
    
    if (params.id === 'mock-deleted-item-1') {
      console.log('Mock API: Returning deleted mock item');
      return HttpResponse.json(mockDeletedSearchableItem);
    }
    
    // If it's a mock-deleted ID variant, override the generated item
    if (params.id.includes('mock-deleted')) {
      console.log('Mock API: Creating deleted version of generated item');
      // Get the base generated item
      const searchable = mockSearchables.find(s => s.searchable_id === params.id);
      if (searchable) {
        // Mark it as removed and update title
        const deletedSearchable = {
          ...searchable,
          removed: true,
          payloads: {
            ...searchable.payloads,
            public: {
              ...searchable.payloads.public,
              title: `DELETED: ${searchable.payloads.public.title}`,
              description: `This item has been removed by the seller. ${searchable.payloads.public.description}`
            }
          }
        };
        return HttpResponse.json(deletedSearchable);
      }
    }
    
    // Fallback to existing mockSearchables for other IDs
    const searchable = mockSearchables.find(s => s.searchable_id === params.id);
    if (searchable) {
      console.log('Mock API: Returning searchable from mockSearchables');
      // Ensure removed field is set for non-deleted items
      const activeSearchable = {
        ...searchable,
        removed: false
      };
      return HttpResponse.json(activeSearchable);
    }
    
    console.log('Mock API: Searchable not found');
    return HttpResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }),

  // User invoices
  http.get('/api/v1/user/invoices', () => {
    return HttpResponse.json({
      success: true,
      ...mockInvoices
    });
  }),

  // Balance
  http.get('/api/v1/balance', () => {
    return HttpResponse.json({
      success: true,
      balance: { usd: 100 }
    });
  }),

  // Tags
  http.get('/api/v1/tags', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    let filteredTags = mockTags;
    if (type) {
      filteredTags = mockTags.filter(tag => tag.tag_type === type);
    }
    
    return HttpResponse.json({
      success: true,
      tags: filteredTags
    });
  }),

  // Create invoice
  http.post('/api/v1/invoices', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      invoice: {
        id: 'new-invoice-1',
        searchable_id: body.searchable_id,
        amount: body.total_price,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });
  }),

  // Create searchable
  http.post('/api/v1/searchables', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      searchable: {
        searchable_id: 'new-searchable-1',
        ...body
      }
    });
  }),

  // Update searchable
  http.put('/api/v1/searchables/:id', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      searchable: {
        searchable_id: params.id,
        ...body
      }
    });
  }),

  // User paid files
  http.get('/api/v1/user-paid-files/:id', () => {
    return HttpResponse.json({
      success: true,
      paid_file_ids: ['file-1'] // User has paid for file-1
    });
  }),

  // Withdrawals
  http.get('/api/v1/withdrawals', () => {
    return HttpResponse.json({
      success: true,
      withdrawals: []
    });
  }),

  // Deposits
  http.get('/api/v1/deposits', () => {
    return HttpResponse.json({
      success: true,
      deposits: []
    });
  }),

  // Rewards
  http.get('/api/v1/rewards', () => {
    return HttpResponse.json({
      success: true,
      rewards: []
    });
  }),

  // Searchable ratings
  http.get('/api/v1/searchable/:id/ratings', ({ params }) => {
    return HttpResponse.json({
      success: true,
      average_rating: 4.5,
      total_ratings: 10,
      individual_ratings: [
        {
          rating: 5,
          comment: 'Excellent quality!',
          created_at: new Date().toISOString(),
          username: 'buyer1'
        },
        {
          rating: 4,
          comment: 'Good value for money',
          created_at: new Date().toISOString(),
          username: 'buyer2'
        }
      ]
    });
  }),

  // File upload
  http.post('/api/v1/files/upload', () => {
    return HttpResponse.json({
      success: true,
      file_id: 'uploaded-file-1',
      uuid: 'file-uuid-1'
    });
  })
];