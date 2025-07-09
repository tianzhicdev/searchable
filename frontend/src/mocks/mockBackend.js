import axios from 'axios';
import configData from '../config';
import * as mockData from './mockData';
import { store } from '../store';
import { getUserAIContents, getAIContentById, createAIContent } from './mockAIContent';

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

// Helper function to check if request is authenticated
const isAuthenticated = (config) => {
  // Check if auth token is passed in headers
  if (config && config.headers && config.headers.authorization) {
    return true;
  }
  
  // Also check Redux store for auth status
  const state = store.getState();
  const account = state.account;
  
  if (account?.isLoggedIn && account?.token) {
    console.log('[MOCK] User is authenticated from Redux store');
    return true;
  }
  
  console.log('[MOCK] User is not authenticated');
  return false;
};

// Helper function to generate random usernames
const generateUsername = (index) => {
  const prefixes = ['creative', 'digital', 'tech', 'art', 'music', 'photo', 'design', 'dev', 'pro', 'master'];
  const suffixes = ['studio', 'works', 'craft', 'shop', 'hub', 'lab', 'zone', 'space', 'corner', 'market'];
  const numbers = ['', '2024', '99', '123', '_pro', '_official', '_x', '_one', '_plus', '007'];
  
  return `${prefixes[index % prefixes.length]}_${suffixes[Math.floor(index / 10) % suffixes.length]}${numbers[index % numbers.length]}`;
};

// Helper function to generate random display names
const generateDisplayName = (index) => {
  const adjectives = ['Creative', 'Professional', 'Amazing', 'Stellar', 'Premium', 'Elite', 'Supreme', 'Ultimate', 'Expert', 'Master'];
  const nouns = ['Designer', 'Artist', 'Developer', 'Creator', 'Studio', 'Workshop', 'Academy', 'Gallery', 'Store', 'Hub'];
  const extras = ['& Co.', 'Pro', 'Plus', 'Studio', 'Works', 'Solutions', 'Creations', 'Digital', 'Online', ''];
  
  return `${adjectives[index % adjectives.length]} ${nouns[Math.floor(index / 10) % nouns.length]} ${extras[index % extras.length]}`.trim();
};

// Helper function to generate diverse descriptions with edge cases
const generateUserDescription = (index) => {
  const descriptions = [
    'Creating amazing digital content for professionals worldwide 🌟',
    'Very long description that goes on and on and on... ' + 'x'.repeat(200) + ' ...and includes lots of text to test UI limits',
    '🎨 Artist | 🎵 Musician | 📸 Photographer | Creating multi-disciplinary art',
    'Special chars test: <script>alert("test")</script> & HTML entities © ® ™',
    '한국어 테스트 | 日本語テスト | 中文测试 | Testing international characters',
    'Simple and clean.',
    '',  // Empty description
    'UPPERCASE DESCRIPTION TO TEST STYLING AND READABILITY IN THE UI',
    'Numbers everywhere! 123456789 0.99 $$$$ 100% #1 @2024',
    'Emojis galore! 😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜',
    `Multi-line description
    with line breaks
    and formatting
    to test display`,
    'Professional • Reliable • Fast • Quality Work • 5 Stars ⭐⭐⭐⭐⭐',
    '!!!Lots!!! of!!! punctuation!!! marks??? really... REALLY... --test--',
    'Минималистичное описание на русском языке',
    '🔥 HOT DEALS 🔥 LIMITED TIME OFFER 🔥 SAVE 50% NOW 🔥'
  ];
  
  return descriptions[index % descriptions.length];
};

// Helper function to generate searchable titles with variety
const generateSearchableTitle = (index, type) => {
  const downloadableTitles = [
    'Premium Digital Asset Bundle',
    'Professional Design Kit Pro Max Ultra Deluxe Edition with Extra Long Title to Test UI Limits',
    '🎨 Creative Assets Pack',
    'Simple Pack',
    'MEGA BUNDLE - 1000+ FILES',
    'Test <script>alert("XSS")</script> Title',
    '$$$ Money Maker Pack $$$',
    'Multi-Language Pack 한국어 日本語 中文',
    '',  // Empty title edge case
    'Numbers Pack v2.0.1 (2024)',
    'Special©️ Characters™️ Pack®️',
    '⭐⭐⭐⭐⭐ Five Star Collection',
    'Budget-Friendly Starter Kit',
    'Ultra Premium Exclusive Limited Edition',
    'Quick & Easy Templates'
  ];
  
  const directTitles = [
    'Support My Work',
    'Buy Me a Coffee ☕',
    'Tip Jar 💰',
    'Help Fund My Projects',
    'Support Creator',
    'Donate to Keep Content Free',
    'Artist Support Fund',
    'Community Contribution',
    'Patron Support',
    'Creative Fund'
  ];
  
  const offlineTitles = [
    'Local Coffee Shop',
    'Artisan Bakery 🥐',
    'Handmade Crafts Store',
    'Fresh Produce Market',
    'Vintage Clothing Shop',
    'Book Store & Café',
    'Art Gallery & Studio',
    'Music Store',
    'Electronics Repair Shop',
    'Pet Grooming Service'
  ];
  
  if (type === 'direct') return directTitles[index % directTitles.length];
  if (type === 'offline') return offlineTitles[index % offlineTitles.length];
  return downloadableTitles[index % downloadableTitles.length];
};

// Helper function to generate searchable descriptions
const generateSearchableDescription = (index) => {
  const descriptions = [
    'High-quality digital assets for your creative projects.',
    'Super long description that contains a lot of text to test how the UI handles very lengthy content. ' + 'This goes on and on '.repeat(20),
    'Short & sweet 🍭',
    '',  // Empty description
    'Special characters test: <>&"\'`{}[]()!@#$%^&*',
    '🌟🎨🎵📸🎬🎮📚💻🏆🎯 Emoji overload test',
    'SCREAMING DESCRIPTION IN ALL CAPS TO TEST READABILITY',
    `Multiple
    Line
    Breaks
    Test`,
    '价格实惠 | お買い得 | выгодная цена | International descriptions',
    'Numbers: 100% satisfaction, 24/7 support, 30-day guarantee, 5-star rated',
    '...starts with ellipsis and ends with ellipsis...',
    'Visit us at: https://example.com/very/long/url/that/might/break/layout',
    '@mentions #hashtags $prices testing social media style content',
    'Minimalist.',
    'This product is amazing!!! Buy now!!! Limited time!!! Act fast!!! Don\'t miss out!!!'
  ];
  
  return descriptions[index % descriptions.length];
};

// Generate mock users programmatically
const generateMockUsers = () => {
  const users = [];
  const tagCombinations = [
    [1, 5],      // artist, designer
    [2, 7],      // musician, educator
    [3, 8],      // writer, store
    [4, 10],     // photographer, freelancer
    [6, 7],      // developer, educator
    [1, 4, 10],  // artist, photographer, freelancer
    [8, 9],      // store, agency
    [1],         // artist only
    [6],         // developer only
    [2, 3, 7],   // musician, writer, educator
  ];
  
  for (let i = 0; i < 100; i++) {
    const hasProfileImage = Math.random() > 0.2; // 80% have profile images
    const tagIds = tagCombinations[i % tagCombinations.length];
    
    users.push({
      id: i + 1,
      username: generateUsername(i),
      displayName: Math.random() > 0.3 ? generateDisplayName(i) : null, // 70% have display names
      profile_image_url: hasProfileImage ? `/api/v1/media/profile-mock-${(i % 5) + 1}` : null,
      introduction: generateUserDescription(i),
      tags: tagIds.map(id => ({
        id,
        name: ['artist', 'musician', 'writer', 'photographer', 'designer', 'developer', 'educator', 'store', 'agency', 'freelancer'][id - 1],
        tag_type: 'user'
      })),
      rating: 3.5 + (Math.random() * 1.5), // Random rating between 3.5 and 5.0
      totalRatings: Math.floor(Math.random() * 500),
      searchableCount: Math.floor(Math.random() * 200),
      joinedDate: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString() // Random date within last year
    });
  }
  
  return users;
};

// Generate mock searchables programmatically
const generateMockSearchables = () => {
  const searchables = [];
  const types = ['downloadable', 'direct', 'offline'];
  const tagCombinations = [
    [21, 23],      // books, art
    [22, 25],      // music, videos
    [24, 23],      // photos, art
    [26, 28],      // software, courses
    [27, 29],      // games, templates
    [30, 29],      // fonts, templates
    [31, 28],      // business, courses
    [32],          // support only
    [33, 35],      // community, local
    [34, 35, 36],  // food, local, handmade
  ];
  
  for (let i = 0; i < 100; i++) {
    const type = types[i % 3];
    const hasImages = Math.random() > 0.15; // 85% have images
    const imageCount = hasImages ? Math.floor(Math.random() * 4) + 1 : 0; // 1-4 images
    const tagIds = tagCombinations[i % tagCombinations.length];
    
    const searchable = {
      _id: `mock-item-${i + 1}`,
      searchable_id: `mock-item-${i + 1}`,
      user_id: `${(i % 10) + 1}`,
      payloads: {
        public: {
          title: generateSearchableTitle(i, type),
          description: generateSearchableDescription(i),
          type: type,
          currency: 'usd',
          images: hasImages ? Array(imageCount).fill(null).map((_, idx) => 
            idx % 2 === 0 ? mockData.mockImage1 : mockData.mockImage2
          ) : []
        }
      },
      tags: tagIds.map(id => {
        const tagNames = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 
          'books', 'music', 'art', 'photos', 'videos', 'software', 'games', 'courses', 'templates', 'fonts',
          'business', 'support', 'community', 'food', 'local', 'handmade'];
        return {
          id,
          name: tagNames[id] || 'unknown',
          tag_type: 'searchable'
        };
      }),
      created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(), // Random date within last 30 days
      username: generateUsername(Math.floor(Math.random() * 50)) // Random username from first 50 users
    };
    
    // Add type-specific data
    if (type === 'downloadable') {
      const fileCount = Math.floor(Math.random() * 5) + 1; // 1-5 files
      const fileNames = [
        'Design_Templates_Pack.zip', 'Stock_Photos_Collection.zip', 'Vector_Graphics_Bundle.ai',
        'UI_Kit_Components.fig', 'Icon_Set_Premium.svg', 'Mockup_Templates.psd',
        'Audio_Tracks_Collection.mp3', 'Video_Templates.mp4', 'Sound_Effects_Pack.wav',
        'Ebook_Collection.pdf', 'Tutorial_Videos.mp4', 'Source_Code_Examples.zip',
        'Font_Collection.ttf', 'Brush_Pack.abr', 'Pattern_Library.pat',
        'Presentation_Templates.pptx', 'Spreadsheet_Templates.xlsx', 'Document_Templates.docx',
        'Game_Assets_Bundle.unitypackage', '3D_Models_Pack.obj', 'Texture_Collection.png',
        'Plugin_Collection.zip', 'Script_Library.js', 'CSS_Framework.css',
        'Mobile_App_Template.apk', 'Website_Template.html', 'WordPress_Theme.zip',
        'Lightroom_Presets.lrtemplate', 'Photoshop_Actions.atn', 'After_Effects_Templates.aep',
        'Music_Loops_Pack.wav', 'Podcast_Intro_Outro.mp3', 'Voice_Over_Samples.mp3'
      ];
      
      searchable.payloads.public.downloadableFiles = Array(fileCount).fill(null).map((_, idx) => {
        const fileIndex = (i * 5 + idx) % fileNames.length;
        return {
          name: fileNames[fileIndex],
          price: Math.floor(Math.random() * 100) + 0.99 // Random price from 0.99 to 100.99
        };
      });
    } else if (type === 'direct') {
      searchable.payloads.public.defaultAmount = Math.floor(Math.random() * 50) + 0.99; // Random amount from 0.99 to 50.99
    } else if (type === 'offline') {
      const itemCount = Math.floor(Math.random() * 10) + 1; // 1-10 items
      const offlineProductNames = [
        'Espresso', 'Cappuccino', 'Latte', 'Americano', 'Mocha',
        'Croissant', 'Bagel', 'Muffin', 'Danish', 'Scone',
        'T-Shirt', 'Jeans', 'Jacket', 'Dress', 'Shoes',
        'Necklace', 'Bracelet', 'Ring', 'Earrings', 'Watch',
        'Sandwich', 'Salad', 'Soup', 'Pizza Slice', 'Burger',
        'Book', 'Magazine', 'Notebook', 'Pen Set', 'Bookmark',
        'Painting', 'Sculpture', 'Photo Print', 'Poster', 'Sticker Pack',
        'Guitar Pick', 'Sheet Music', 'CD Album', 'Vinyl Record', 'Music Lesson',
        'Phone Case', 'Charger', 'Screen Protector', 'Cable', 'Adapter',
        'Dog Grooming', 'Cat Grooming', 'Nail Trim', 'Bath Service', 'Hair Cut'
      ];
      
      searchable.payloads.public.offlineItems = Array(itemCount).fill(null).map((_, idx) => {
        const productIndex = (i * 10 + idx) % offlineProductNames.length;
        return {
          itemId: `item-${idx + 1}`,
          name: offlineProductNames[productIndex],
          price: Math.floor(Math.random() * 200) + 0.99 // Random price from 0.99 to 200.99
        };
      });
    }
    
    searchables.push(searchable);
  }
  
  return searchables;
};

// Initialize mock data
let allMockUsers = [];
let allMockSearchables = [];
try {
  allMockUsers = generateMockUsers();
  allMockSearchables = generateMockSearchables();
  console.log('[MOCK] Initialized mock data - Users:', allMockUsers.length, 'Searchables:', allMockSearchables.length);
} catch (error) {
  console.error('[MOCK] Error initializing mock data:', error);
}

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
  
  'users/change-password': (url, config) => {
    console.log('[MOCK] Change password');
    const data = JSON.parse(config.data || '{}');
    
    // Simulate validation of current password
    if (!data.current_password) {
      return createMockResponse({
        success: false,
        msg: 'Current password is required'
      });
    }
    
    // For mock, any current password is accepted
    if (!data.new_password || data.new_password.length < 4) {
      return createMockResponse({
        success: false,
        msg: 'New password must be at least 4 characters'
      });
    }
    
    return createMockResponse({
      success: true,
      msg: 'Password changed successfully'
    });
  },
  
  // Tag endpoints
  'v1/tags': (url) => {
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const tagType = urlParams.get('type');
    const activeOnly = urlParams.get('active') !== 'false';
    
    console.log('[MOCK] Getting tags, type:', tagType, 'active:', activeOnly);
    
    const mockTags = [
      // User tags
      { id: 1, name: 'artist', tag_type: 'user', description: 'Visual artists, digital artists, painters, sculptors', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 2, name: 'musician', tag_type: 'user', description: 'Music creators, composers, performers', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 3, name: 'writer', tag_type: 'user', description: 'Authors, bloggers, content writers', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 4, name: 'photographer', tag_type: 'user', description: 'Professional and amateur photographers', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 5, name: 'designer', tag_type: 'user', description: 'Graphic designers, UI/UX designers, product designers', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 6, name: 'developer', tag_type: 'user', description: 'Software developers, web developers, app creators', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 7, name: 'educator', tag_type: 'user', description: 'Teachers, trainers, course creators', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 8, name: 'store', tag_type: 'user', description: 'Online stores, retail businesses', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 9, name: 'agency', tag_type: 'user', description: 'Marketing agencies, creative agencies', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 10, name: 'freelancer', tag_type: 'user', description: 'Independent contractors and freelancers', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      
      // Searchable tags
      { id: 21, name: 'books', tag_type: 'searchable', description: 'Books, ebooks, novels, textbooks', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 22, name: 'music', tag_type: 'searchable', description: 'Songs, albums, audio tracks, soundtracks', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 23, name: 'art', tag_type: 'searchable', description: 'Digital art, paintings, illustrations, graphics', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 24, name: 'photos', tag_type: 'searchable', description: 'Photography, stock photos, portraits', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 25, name: 'videos', tag_type: 'searchable', description: 'Video content, tutorials, entertainment', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 26, name: 'software', tag_type: 'searchable', description: 'Applications, tools, plugins, scripts', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 27, name: 'games', tag_type: 'searchable', description: 'Video games, mobile games, game assets', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 28, name: 'courses', tag_type: 'searchable', description: 'Educational content, tutorials, training materials', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 29, name: 'templates', tag_type: 'searchable', description: 'Design templates, document templates', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 30, name: 'fonts', tag_type: 'searchable', description: 'Typography, custom fonts, typefaces', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 31, name: 'business', tag_type: 'searchable', description: 'Business resources, professional content', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 32, name: 'support', tag_type: 'searchable', description: 'Support creators, donations, tips', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 33, name: 'community', tag_type: 'searchable', description: 'Community projects, collaborative content', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 34, name: 'food', tag_type: 'searchable', description: 'Food, beverages, culinary content', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 35, name: 'local', tag_type: 'searchable', description: 'Local businesses, local services', is_active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 36, name: 'handmade', tag_type: 'searchable', description: 'Handcrafted items, artisan products', is_active: true, created_at: '2024-01-01T00:00:00Z' }
    ];
    
    let filteredTags = mockTags;
    
    if (tagType) {
      filteredTags = filteredTags.filter(tag => tag.tag_type === tagType);
    }
    
    if (activeOnly) {
      filteredTags = filteredTags.filter(tag => tag.is_active);
    }
    
    return createMockResponse({
      success: true,
      tags: filteredTags,
      count: filteredTags.length
    });
  },
  
  // User search endpoint
  'v1/search/users': (url, config) => {
    // Get params from config object, not URL string
    const params = config?.params || {};
    const username = params.username;
    const tagNames = params['tags[]'] || [];
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    
    console.log('[MOCK] Searching users:', { username, tagNames, page, limit });
    
    let filteredUsers = [...allMockUsers];
    
    // Filter by username if provided
    if (username) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(username.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(username.toLowerCase()))
      );
    }
    
    // Filter by tags if provided
    if (tagNames.length > 0) {
      filteredUsers = filteredUsers.filter(user => {
        const userTagNames = user.tags.map(tag => tag.name);
        return tagNames.every(tagName => userTagNames.includes(tagName));
      });
    }
    
    const total = filteredUsers.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return createMockResponse({
      success: true,
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  },

  // Searchable endpoints - ORDER MATTERS! Most specific patterns first
  'v1/searchable/search': (url) => {
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const tags = urlParams.get('tags');
    const searchTerm = urlParams.get('q') || '';
    const page = parseInt(urlParams.get('page')) || 1;
    const pageSize = parseInt(urlParams.get('page_size')) || 10;
    
    console.log('[MOCK] Searching searchables with tags:', tags, 'search term:', searchTerm, 'page:', page);
    
    let results = [...allMockSearchables];

    // Filter by tags if provided
    if (tags && tags.trim()) {
      const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
      results = results.filter(item => {
        if (!item.tags) return false;
        return item.tags.some(tag => tagList.includes(tag.name.toLowerCase()));
      });
    }

    // Filter by search term if provided
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(item => {
        const title = item.payloads?.public?.title?.toLowerCase() || '';
        const description = item.payloads?.public?.description?.toLowerCase() || '';
        return title.includes(term) || description.includes(term);
      });
    }
    
    // Calculate pagination
    const totalCount = results.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = results.slice(startIndex, endIndex);
    
    return createMockResponse({
      results: paginatedResults,
      pagination: {
        current_page: page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: totalPages
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
      
      // Try to find the searchable in our generated data
      const foundSearchable = allMockSearchables.find(s => s.searchable_id === searchableId);
      
      if (foundSearchable) {
        return createMockResponse(foundSearchable);
      }
      
      // Handle legacy direct payment items for backward compatibility
      if (searchableId === 'mock-direct-item-1') {
        return createMockResponse({
          ...mockData.mockDirectSearchableItem,
          payloads: {
            ...mockData.mockDirectSearchableItem.payloads,
            public: {
              ...mockData.mockDirectSearchableItem.payloads.public,
              images: mockData.mockDirectSearchableItem.payloads.public.imageUrls || mockData.mockDirectSearchableItem.payloads.public.images || []
            }
          }
        });
      }
      
      if (searchableId === 'mock-direct-item-2') {
        return createMockResponse({
          ...mockData.mockDirectSearchableItem2,
          payloads: {
            ...mockData.mockDirectSearchableItem2.payloads,
            public: {
              ...mockData.mockDirectSearchableItem2.payloads.public,
              images: mockData.mockDirectSearchableItem2.payloads.public.imageUrls || mockData.mockDirectSearchableItem2.payloads.public.images || []
            }
          }
        });
      }
      
      if (searchableId === 'mock-direct-item-3') {
        return createMockResponse({
          ...mockData.mockDirectSearchableItem3,
          payloads: {
            ...mockData.mockDirectSearchableItem3.payloads,
            public: {
              ...mockData.mockDirectSearchableItem3.payloads.public,
              images: mockData.mockDirectSearchableItem3.payloads.public.imageUrls || mockData.mockDirectSearchableItem3.payloads.public.images || []
            }
          }
        });
      }
      
      // Default to the original mock item for backwards compatibility
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
  
  '/balance': (url, config) => {
    // For balance endpoint, we always check authentication in Redux
    if (!isAuthenticated(config)) {
      return Promise.reject({
        response: {
          status: 401,
          data: { error: 'Authentication required' }
        }
      });
    }
    // Return the balance data in the correct format
    return createMockResponse(mockData.mockBalance);
  },
  
  // Deposit endpoints
  'v1/deposit/create': (url, config) => {
    const data = JSON.parse(config.data || '{}');
    console.log('[MOCK] Creating deposit:', data);
    const depositId = Date.now();  // Use number to match backend
    return createMockResponse({
      deposit_id: depositId,
      amount: data.amount || '0.00',  // Amount can be 0 for deposits
      currency: 'USDT',
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()
    });
  },
  
  'v1/deposit/status/': (url) => {
    const depositId = url.split('/').pop();
    console.log('[MOCK] Getting deposit status:', depositId);
    return createMockResponse({
      deposit_id: depositId,
      status: 'pending',
      amount: '100.00',
      currency: 'USDT',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString()
    });
  },
  
  'v1/deposits': () => {
    console.log('[MOCK] Getting user deposits');
    return createMockResponse(mockData.mockDeposits);
  },
  
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
    console.log('[MOCK] Creating invoice:', payload);
    
    // Handle direct payments
    if (payload.selections && payload.selections.some(s => s.type === 'direct')) {
      const directSelection = payload.selections.find(s => s.type === 'direct');
      const amount = directSelection.amount;
      return createMockResponse({
        url: `${window.location.origin}${window.location.pathname}?payment=success&amount=${amount}`,
        session_id: 'mock-direct-session-' + Date.now(),
        invoice_id: Math.floor(Math.random() * 1000) + 1,
        amount: amount,
        platform_fee: amount * 0.001,
        stripe_fee: amount * 0.035,
        total_charged: amount * 1.035
      });
    }
    
    // Handle regular invoice creation  
    if (payload.invoice_type === 'stripe' || payload.type === 'stripe') {
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
          seller_id: "1",
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
          seller_id: "3",
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
          seller_id: "4",
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
          user_id: '2',
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
  
  // Searchable search endpoint
  'v1/searchable/search': (url, config) => {
    // Get params from config object, not URL string
    const params = config?.params || {};
    const page = parseInt(params.page || '1');
    const pageSize = parseInt(params.page_size || '10');
    const searchTerm = params.q || '';
    const filters = typeof params.filters === 'string' ? JSON.parse(params.filters || '{}') : params.filters || {};
    const tags = params.tags || '';
    
    console.log('[MOCK] Searchable search:', { page, pageSize, searchTerm, filters, tags });
    console.log('[MOCK] Total mock searchables available:', allMockSearchables.length);
    
    // Filter searchables based on search criteria
    let filteredSearchables = [...allMockSearchables];
    
    // Apply text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredSearchables = filteredSearchables.filter(item => {
        const publicData = item.payloads?.public || {};
        return (
          publicData.title?.toLowerCase().includes(term) ||
          publicData.description?.toLowerCase().includes(term) ||
          publicData.category?.toLowerCase().includes(term) ||
          item.username?.toLowerCase().includes(term)
        );
      });
    }
    
    // Apply tag filter
    if (tags) {
      const tagList = tags.split(',').filter(t => t);
      if (tagList.length > 0) {
        filteredSearchables = filteredSearchables.filter(item => {
          if (!item.tags || item.tags.length === 0) return false;
          return tagList.some(tagName => 
            item.tags.some(tag => tag.name === tagName)
          );
        });
      }
    }
    
    // Calculate pagination
    const totalCount = filteredSearchables.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Get page of results
    const results = filteredSearchables.slice(startIndex, endIndex);
    
    console.log('[MOCK] Search results:', { 
      totalCount, 
      totalPages, 
      currentPage: page,
      resultsCount: results.length,
      startIndex,
      endIndex,
      firstItemId: results[0]?.searchable_id,
      lastItemId: results[results.length - 1]?.searchable_id
    });
    
    return createMockResponse({
      results,
      pagination: {
        current_page: page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: totalPages
      }
    });
  },
  
  // AI Content endpoints
  'v1/ai-content': (url, config) => {
    console.log('[MOCK] AI Content endpoint called:', url);
    
    // Handle GET requests
    if (!config?.data) {
      // Check if getting specific AI content
      const idMatch = url.match(/v1\/ai-content\/(\d+)/);
      if (idMatch) {
        const id = idMatch[1];
        return createMockResponse(getAIContentById(id));
      }
      
      // Otherwise return user's AI contents
      return createMockResponse(getUserAIContents());
    }
    
    // Handle POST request (create new AI content)
    try {
      const data = JSON.parse(config.data);
      return createMockResponse(createAIContent(data));
    } catch (error) {
      return createMockResponse({
        success: false,
        msg: 'Invalid request data'
      });
    }
  },
  
  // Default handler for unmatched routes
  default: (url) => {
    console.warn(`Mock handler not found for: ${url}`);
    return createMockResponse({ message: 'Mock data not available' });
  }
};

// Create mock backend wrapper
const mockBackend = {
  // Add defaults property to match axios structure
  defaults: {
    headers: {
      common: {}
    }
  },
  
  get: (url, config) => {
    if (!isMockMode) {
      console.log(`[MOCK] Redirecting to real backend: GET ${url}`);
      return realBackend.get(url, config);
    }
    
    console.log(`[MOCK] GET ${url}`, config);
    console.log(`[MOCK] Config params:`, config?.params);
    
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