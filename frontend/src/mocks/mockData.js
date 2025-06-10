// Import mock images
import mockImage1 from '../assets/mock/mock.png';
import mockImage2 from '../assets/mock/mock1.png';

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
    introduction: "Welcome to my digital store!"
  }
};

export const mockTerminal = {
  address: "123 Mock Street, Test City",
  tel: "+1234567890"
};

// Mock file download blob
export const mockFileBlob = new Blob(['Mock file content'], { type: 'application/octet-stream' });

// Mock invoices data
export const mockInvoices = {
  invoices: [
    {
      _id: "invoice-1",
      invoice_id: "invoice-1",
      buyer_id: "mock-user-1",
      seller_id: "mock-terminal-1",
      searchable_id: "mock-item-1",
      amount: 29.99,
      status: "paid",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      metadata: {
        selections: [
          {
            id: "file-1",
            type: "downloadable",
            name: "Design_Templates_Pack.zip",
            price: 29.99
          }
        ]
      }
    }
  ],
  user_role: "buyer"
};