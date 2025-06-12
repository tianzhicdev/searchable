// Import mock images
import mockImage1 from '../assets/mock/mock.png';
import mockImage2 from '../assets/mock/mock1.png';

// Export mock images
export { mockImage1, mockImage2 };

// Mock data for development
export const mockSearchableItem = {
  _id: "mock-item-1",
  searchable_id: "mock-item-1",
  terminal_id: "mock-terminal-1",
  payloads: {
    public: {
      title: "Premium Digital Asset Bundle",
      description: "A comprehensive collection of high-quality digital assets including templates, graphics, and source files for your creative projects. This bundle includes professional design templates, high-resolution stock photos, and clean documented source code examples. Perfect for designers, developers, and content creators looking to accelerate their workflow with ready-to-use assets.",
      images: [mockImage1, mockImage2], // Use images directly
      imageUrls: [mockImage1, mockImage2], // Store URLs for dynamic loading
      downloadableFiles: [
        {
          fileId: "file-1",
          name: "Design_Templates_Pack.zip",
          description: "Professional design templates for various projects",
          price: 29.99
        },
        {
          fileId: "file-2", 
          name: "Stock_Photos_Collection.zip",
          description: "High-resolution stock photos for commercial use",
          price: 49.99
        },
        {
          fileId: "file-3",
          name: "Source_Code_Examples.zip",
          description: "Clean, documented source code examples",
          price: 19.99
        }
      ],
      currency: "usd",
      require_address: false
    }
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockSearchableRating = {
  average_rating: 4.5,
  total_ratings: 23,
  individual_ratings: [
    {
      rating: 5,
      review: "Excellent quality files, exactly what I needed!",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      username: "happy_customer"
    },
    {
      rating: 4,
      review: "Good value for money, fast download",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      username: "design_pro"
    },
    {
      rating: 5,
      review: "Amazing collection, will buy again",
      created_at: new Date(Date.now() - 259200000).toISOString(),
      username: "creative_mind"
    }
  ]
};

export const mockTerminalRating = {
  average_rating: 4.8,
  total_ratings: 156
};

export const mockUserPaidFiles = {
  paid_file_ids: ["file-1"] // User has already purchased file-1
};

export const mockPaymentsBySearchable = {
  receipts: [
    {
      public: {
        status: "complete",
        selections: [
          {
            id: "file-1",
            type: "downloadable",
            name: "Design_Templates_Pack.zip",
            price: 29.99
          }
        ],
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    },
    {
      public: {
        status: "complete",
        selections: [
          {
            id: "file-2",
            type: "downloadable",
            name: "Stock_Photos_Collection.zip",
            price: 49.99
          }
        ],
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    }
  ]
};

export const mockProfile = {
  _id: "mock-user-1",
  username: "test_user",
  email: "test@example.com",
  address: "123 Mock Street, Test City",
  tel: "+1234567890"
};

export const mockBalance = {
  balance: {
    usd: 125.50
  }
};

export const mockUserProfile = {
  profile: {
    username: "test_user",
    profile_image_url: null,
    introduction: "Welcome to my digital store! I specialize in creating high-quality digital assets and templates for creative professionals.",
    metadata: {
      additional_images: [
        mockImage1,
        mockImage2,
        mockImage1, // Reusing for demo purposes
        mockImage2
      ]
    },
    created_at: new Date(Date.now() - 86400000 * 30).toISOString() // 30 days ago
  }
};

export const mockTerminal = {
  terminal_id: "mock-terminal-1",
  address: "123 Mock Street, Test City",
  tel: "+1234567890"
};

// Mock file download blob
export const mockFileBlob = new Blob(['Mock file content'], { type: 'application/octet-stream' });

// Mock invoices data
export const mockInvoices = {
  invoices: [
    {
      id: "invoice-1",
      amount: 29.99,
      payment_status: "complete",
      type: "stripe",
      currency: "usd",
      other_party_username: "DigitalAssetStore",
      payment_date: new Date(Date.now() - 3000000).toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(),
      fee: 1.05,
      buyer_id: "mock-user-1",
      seller_id: "mock-terminal-1",
      searchable_id: "mock-item-1",
      metadata: {
        address: "123 Main St, City, State 12345",
        tel: "+1-555-0123",
        description: "Premium Digital Asset Bundle",
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
      id: "invoice-2",
      amount: 79.97,
      payment_status: "complete",
      type: "stripe",
      currency: "usd",
      other_party_username: "DigitalAssetStore",
      payment_date: new Date(Date.now() - 6600000).toISOString(),
      created_at: new Date(Date.now() - 7200000).toISOString(),
      fee: 2.80,
      buyer_id: "mock-user-2",
      seller_id: "mock-terminal-1",
      searchable_id: "mock-item-1",
      metadata: {
        address: "456 Oak Ave, Another City, State 67890", 
        tel: "+1-555-0456",
        description: "Premium Digital Asset Bundle (x2 files)",
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
      id: "invoice-3",
      amount: 15.50,
      payment_status: "pending",
      type: "stripe",
      currency: "usd",
      other_party_username: "EbookPublisher",
      payment_date: null,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      fee: 0,
      buyer_id: "mock-user-3",
      seller_id: "mock-terminal-2",
      searchable_id: "mock-item-2",
      metadata: {
        address: "",
        tel: "",
        description: "E-book Collection",
        selections: [
          {
            id: "ebook-1",
            type: "downloadable",
            name: "JavaScript_Mastery.pdf",
            price: 15.50
          }
        ]
      }
    },
    {
      id: "invoice-4",
      amount: 199.99,
      payment_status: "complete",
      type: "stripe",
      currency: "usd",
      other_party_username: "TechAcademy",
      payment_date: new Date(Date.now() - 85800000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      fee: 7.00,
      buyer_id: "mock-user-1",
      seller_id: "mock-terminal-3",
      searchable_id: "mock-item-3",
      metadata: {
        address: "789 Pine St, Metro City, State 11111",
        tel: "+1-555-0789",
        description: "Complete Course Bundle",
        selections: [
          {
            id: "course-1",
            type: "downloadable",
            name: "Full_Stack_Development_Course.zip",
            price: 199.99
          }
        ]
      }
    },
    {
      id: "invoice-5",
      amount: 19.99,
      payment_status: "failed",
      type: "stripe",
      currency: "usd",
      other_party_username: "DigitalAssetStore",
      payment_date: null,
      created_at: new Date(Date.now() - 43200000).toISOString(),
      fee: 0,
      buyer_id: "mock-user-4",
      seller_id: "mock-terminal-1",
      searchable_id: "mock-item-1",
      metadata: {
        address: "321 Elm St, Small Town, State 22222",
        tel: "+1-555-0321",
        description: "Source Code Examples",
        selections: [
          {
            id: "file-3",
            type: "downloadable",
            name: "Source_Code_Examples.zip",
            price: 19.99
          }
        ]
      }
    }
  ],
  user_role: "buyer"
};

// Mock user's own searchables for publish-searchables page
export const mockUserSearchables = {
  searchables: [
    {
      _id: "user-item-1",
      searchable_id: "user-item-1", 
      terminal_id: "mock-terminal-1",
      payloads: {
        public: {
          title: "My First Digital Product",
          description: "A collection of my best design work",
          type: "downloadable",
          currency: "usd",
          downloadableFiles: [
            { fileId: "my-file-1", name: "Premium_Designs.zip", price: 39.99 },
            { fileId: "my-file-2", name: "Vector_Graphics.zip", price: 24.99 }
          ]
        }
      },
      created_at: new Date(Date.now() - 86400000).toISOString(),
      username: "test_user"
    },
    {
      _id: "user-item-2",
      searchable_id: "user-item-2",
      terminal_id: "mock-terminal-1", 
      payloads: {
        public: {
          title: "Advanced Code Tutorials",
          description: "Step-by-step programming tutorials with source code",
          type: "downloadable",
          currency: "usd",
          downloadableFiles: [
            { fileId: "my-file-3", name: "React_Tutorial.zip", price: 49.99 },
            { fileId: "my-file-4", name: "Node_Examples.zip", price: 34.99 }
          ]
        }
      },
      created_at: new Date(Date.now() - 172800000).toISOString(),
      username: "test_user"
    }
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1
  }
};