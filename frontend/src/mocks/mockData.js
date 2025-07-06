// Import mock images
import mockImage1 from '../assets/mock/mock.png';
import mockImage2 from '../assets/mock/mock1.png';

// Export mock images
export { mockImage1, mockImage2 };

// Mock data for development
export const mockSearchableItem = {
  _id: "mock-item-1",
  searchable_id: "mock-item-1",
  user_id: "1",
  username: "DigitalAssetStore",
  tags: [
    { id: 21, name: "books", tag_type: "searchable" },
    { id: 23, name: "art", tag_type: "searchable" }
  ],
  payloads: {
    public: {
      title: "Premium Digital Asset Bundle",
      description: "A comprehensive collection of high-quality digital assets including templates, graphics, and source files for your creative projects. This bundle includes professional design templates, high-resolution stock photos, and clean documented source code examples. Perfect for designers, developers, and content creators looking to accelerate their workflow with ready-to-use assets.",
      images: [mockImage1, mockImage2], // Use images directly
      imageUrls: [mockImage1, mockImage2], // Store URLs for dynamic loading
      downloadableFiles: [
        {
          fileId: "file-1",
          name: "Professional Design Templates",
          fileName: "design_templates_v1.2.zip",
          description: "Professional design templates for various projects",
          price: 29.99
        },
        {
          fileId: "file-2", 
          name: "Stock Photos Collection",
          fileName: "stock_photos_hd_collection.zip",
          description: "High-resolution stock photos for commercial use",
          price: 49.99
        },
        {
          fileId: "file-3",
          name: "Source Code Examples",
          fileName: "clean_source_code_samples.zip", 
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
    profile_image_url: "/api/v1/media/profile-mock-1",
    introduction: "Welcome to my digital store! I specialize in creating high-quality digital assets and templates for creative professionals.",
    tags: [
      { id: 1, name: "artist", tag_type: "user" },
      { id: 5, name: "designer", tag_type: "user" },
      { id: 10, name: "freelancer", tag_type: "user" }
    ],
    metadata: {
      additional_images: [
        "/api/v1/media/gallery-mock-1",
        "/api/v1/media/gallery-mock-2",
        "/api/v1/media/gallery-mock-3",
        "/api/v1/media/gallery-mock-4"
      ],
      socialMedia: {
        instagram: "designpro_studio",
        x: "designpro",
        youtube: "DesignProTutorials"
      }
    },
    created_at: new Date(Date.now() - 86400000 * 30).toISOString() // 30 days ago
  }
};

// Mock file download blob
export const mockFileBlob = new Blob(['Mock file content'], { type: 'application/octet-stream' });

// Mock invoices data
export const mockInvoices = {
  invoices: [
    {
      id: "invoice-1",
      amount: 29.99,  // Original amount without fees
      payment_status: "complete",
      type: "stripe",
      currency: "usd",
      other_party_username: "DigitalAssetStore",
      payment_date: new Date(Date.now() - 3000000).toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(),
      fee: 0.03,  // Platform fee (0.1% of 29.99)
      buyer_id: "mock-user-1",
      seller_id: "1",
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
      id: "invoice-2",
      amount: 79.98,  // 29.99 + 49.99
      payment_status: "complete",
      type: "stripe",
      currency: "usd",
      other_party_username: "DigitalAssetStore",
      payment_date: new Date(Date.now() - 6600000).toISOString(),
      created_at: new Date(Date.now() - 7200000).toISOString(),
      fee: 0.08,  // Platform fee (0.1% of 79.98)
      buyer_id: "mock-user-2",
      seller_id: "1",
      searchable_id: "mock-item-1",
      metadata: {
        address: "456 Oak Ave, Another City, State 67890", 
        tel: "+1-555-0456",
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
      id: "invoice-3",
      amount: 15.50,
      payment_status: "pending",
      type: "stripe",
      currency: "usd",
      other_party_username: "EbookPublisher",
      payment_date: null,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      fee: 0.02,  // Platform fee (0.1% of 15.50)
      buyer_id: "mock-user-3",
      seller_id: "2",
      searchable_id: "mock-item-2",
      metadata: {
        address: "",
        tel: "",
        description: "E-book Collection",
        stripe_fee: 0.54,  // Stripe fee (3.5% of 15.50)
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
      fee: 0.20,  // Platform fee (0.1% of 199.99)
      buyer_id: "mock-user-1",
      seller_id: "3",
      searchable_id: "mock-item-3",
      metadata: {
        address: "789 Pine St, Metro City, State 11111",
        tel: "+1-555-0789",
        description: "Complete Course Bundle",
        stripe_fee: 7.00,  // Stripe fee (3.5% of 199.99)
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
      fee: 0.02,  // Platform fee (0.1% of 19.99)
      buyer_id: "mock-user-4",
      seller_id: "1",
      searchable_id: "mock-item-1",
      metadata: {
        address: "321 Elm St, Small Town, State 22222",
        tel: "+1-555-0321",
        description: "Source Code Examples",
        stripe_fee: 0.70,  // Stripe fee (3.5% of 19.99)
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
// Mock withdrawal data  
export const mockWithdrawals = {
  withdrawals: [
    {
      id: "withdrawal-1",
      amount: 100.00,
      fee: 0.10,  // Platform fee (0.1% of 100)
      status: "complete",
      type: "usdt_eth",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      metadata: {
        address: "0x742E96Ac4fF1234A3b8DcE9B7B5678901234567F",
        transaction_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
      }
    },
    {
      id: "withdrawal-2", 
      amount: 250.00,
      fee: 0.25,  // Platform fee (0.1% of 250)
      status: "complete",
      type: "lightning",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      metadata: {
        address: "lnbc2500000p1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3"
      }
    },
    {
      id: "withdrawal-3",
      amount: 50.00, 
      fee: 0.05,  // Platform fee (0.1% of 50)
      status: "pending",
      type: "usdt_eth",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      metadata: {
        address: "0x123ABC456DEF789GHI012JKL345MNO678PQR901S"
      }
    }
  ]
};

export const mockUserSearchables = {
  searchables: [
    {
      _id: "user-item-1",
      searchable_id: "user-item-1", 
      user_id: "1",
      payloads: {
        public: {
          title: "My First Digital Product",
          description: "A collection of my best design work",
          type: "downloadable",
          currency: "usd",
          images: ["/api/v1/media/user-item-1-preview-1", "/api/v1/media/user-item-1-preview-2"],
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
      user_id: "1", 
      payloads: {
        public: {
          title: "Advanced Code Tutorials",
          description: "Step-by-step programming tutorials with source code",
          type: "downloadable",
          currency: "usd",
          images: ["/api/v1/media/user-item-2-preview-1"],
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

// Mock rewards data
export const mockRewards = {
  rewards: [
    {
      id: 1,
      amount: 5.0,
      currency: "usd",
      user_id: "mock-user-1",
      created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      metadata: {
        type: "invite_code_reward",
        invite_code: "ABCDEF",
        invite_code_id: 1
      }
    },
    {
      id: 2,
      amount: 10.0,
      currency: "usd", 
      user_id: "mock-user-1",
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      metadata: {
        type: "signup_bonus",
        description: "Welcome bonus for new users"
      }
    }
  ],
  total_amount: 15.0,
  count: 2
};

// Mock direct searchable items
export const mockDirectSearchableItem = {
  _id: "mock-direct-item-1",
  searchable_id: "mock-direct-item-1",
  user_id: "1",
  username: "DirectPaymentMerchant",
  payloads: {
    public: {
      type: "direct",
      title: "Support My Creative Work",
      description: "Thank you for supporting my creative journey! Your contribution helps me continue creating awesome content and tutorials. You can choose any amount that feels right to you - every bit of support is deeply appreciated.\n\nWith your support, I can:\n• Create more free tutorials and guides\n• Invest in better equipment and tools\n• Dedicate more time to community projects\n• Keep sharing knowledge with everyone\n\nYour generosity makes a real difference!",
      images: [mockImage1, mockImage2],
      imageUrls: [mockImage1, mockImage2],
      currency: "usd",
      defaultAmount: 9.99,
      visibility: {
        udf: "always_true",
        data: {}
      }
    }
  },
  created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  updated_at: new Date(Date.now() - 86400000).toISOString()
};

export const mockDirectSearchableItem2 = {
  _id: "mock-direct-item-2",
  searchable_id: "mock-direct-item-2",
  user_id: "2",
  username: "CommunityBuilder",
  payloads: {
    public: {
      type: "direct",
      title: "Community Tip Jar",
      description: "Help us build an amazing community! Your tip goes directly towards hosting community events, maintaining our Discord server, and creating valuable resources for everyone.\n\nWhat your tips support:\n• Monthly community events and contests\n• Server hosting and maintenance\n• Free resources and templates\n• Moderator appreciation gifts\n• Special guest speakers and workshops",
      images: [mockImage2],
      imageUrls: [mockImage2],
      currency: "usd",
      defaultAmount: 4.99,
      visibility: {
        udf: "always_true",
        data: {}
      }
    }
  },
  created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  updated_at: new Date(Date.now() - 172800000).toISOString()
};

export const mockDirectSearchableItem3 = {
  _id: "mock-direct-item-3",
  searchable_id: "mock-direct-item-3",
  user_id: "1",
  username: "DirectPaymentMerchant",
  payloads: {
    public: {
      type: "direct",
      title: "Coffee Fund - Fuel My Coding Sessions",
      description: "Want to buy me a coffee (or three)? Your support keeps me caffeinated and coding through those late-night sessions when I'm working on open source projects and free tutorials.\n\nEvery coffee donation helps me:\n• Stay focused during long coding sessions\n• Work on passion projects after hours\n• Create better content for the community\n• Fix bugs and add features to my open source libraries\n\nCoffee is the fuel of programmers! ☕",
      images: [mockImage1],
      imageUrls: [mockImage1],
      currency: "usd",
      defaultAmount: 19.99,
      visibility: {
        udf: "always_true",
        data: {}
      }
    }
  },
  created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
  updated_at: new Date(Date.now() - 43200000).toISOString()
};

// Mock deposits data
export const mockDeposits = {
  deposits: [
    {
      deposit_id: "mock-deposit-1",
      amount: "100.00",
      currency: "USDT",
      status: "complete",
      type: "usdt",
      address: "0x742d35cc6634c0532925a3b844bc9e7595ed5e6e",
      tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      expires_at: new Date(Date.now() - 63400000).toISOString(),
      metadata: {
        balance_found: "100.00",
        completed_at: new Date(Date.now() - 84000000).toISOString()
      }
    },
    {
      deposit_id: "mock-deposit-2",
      amount: "50.00", 
      currency: "USD",
      status: "complete",
      type: "stripe",
      address: null,  // Stripe deposits don't have blockchain addresses
      tx_hash: null,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      expires_at: null,
      metadata: {
        stripe_session_id: "cs_test_a1b2c3d4e5f6",
        completed_at: new Date(Date.now() - 7000000).toISOString()
      }
    },
    {
      deposit_id: "mock-deposit-3",
      amount: "0.00000000",
      currency: "USDT", 
      status: "pending",
      type: "usdt",
      address: "0xfedcba987654321098765432109876543210fedc",
      tx_hash: null,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      metadata: {
        checked_at: new Date(Date.now() - 300000).toISOString()
      }
    },
    {
      deposit_id: "mock-deposit-4",
      amount: "75.00",
      currency: "USD",
      status: "complete",
      type: "stripe",
      address: null,
      tx_hash: null,
      created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      expires_at: null,
      metadata: {
        stripe_session_id: "cs_test_x9y8z7w6v5u4",
        completed_at: new Date(Date.now() - 259000000).toISOString()
      }
    }
  ],
  total: 4
};