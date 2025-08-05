import { mockImage1, mockImage2, mockRewards, mockUserSearchables, mockUserProfile2, mockUser2Searchables } from './mockData';
import { getMockUser } from './mockAuth';

// Export isMockMode for other files to use
export const isMockMode = process.env.REACT_APP_MOCK_MODE === 'true';

// Helper function to generate usernames
const generateUsername = (index) => {
  const prefixes = ['creative', 'digital', 'art', 'tech', 'design', 'music', 'photo', 'writer', 'dev', 'craft'];
  const suffixes = ['studio', 'works', 'lab', 'hub', 'space', 'zone', 'pro', 'master', 'expert', 'ninja'];
  return `${prefixes[index % 10]}_${suffixes[index % 10]}_${index + 1}`;
};

// Helper function to generate display names
const generateDisplayName = (index) => {
  const firstNames = ['Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Jamie', 'Avery', 'Riley', 'Quinn'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Wilson'];
  const businessNames = ['Creative Studio', 'Digital Arts', 'Tech Solutions', 'Design Lab', 'Media Works'];
  
  if (index % 3 === 0) {
    return businessNames[index % 5] + ' ' + (index + 1);
  }
  return firstNames[index % 10] + ' ' + lastNames[index % 10];
};

// Helper function to generate searchable titles
const generateSearchableTitle = (index, type) => {
  const downloadableTitles = [
    'Premium Digital Asset Bundle',
    'Professional Design Templates',
    'High-Quality Stock Photos Collection',
    'Ultimate UI/UX Kit',
    'Creative Graphics Pack',
    'Business Document Templates',
    'Social Media Templates Bundle',
    'Website Design Resources',
    'Marketing Materials Collection',
    'Brand Identity Package'
  ];
  
  const directTitles = [
    'Support My Creative Work',
    'Buy Me a Coffee',
    'Digital Tip Jar',
    'Creative Support Fund',
    'Artist Appreciation',
    'Content Creator Support',
    'Help Fund My Projects',
    'Support Independent Creator',
    'Creative Patronage',
    'Digital Busking'
  ];
  
  const offlineTitles = [
    'Artisan Coffee Shop Menu',
    'Handcrafted Jewelry Collection',
    'Local Art Gallery',
    'Boutique Fashion Store',
    'Gourmet Restaurant Menu',
    'Craft Beer Selection',
    'Vintage Bookstore Catalog',
    'Farmers Market Produce',
    'Handmade Pottery Shop',
    'Local Music Venue Tickets'
  ];
  
  if (type === 'downloadable') return downloadableTitles[index % 10];
  if (type === 'direct') return directTitles[index % 10];
  if (type === 'offline') return offlineTitles[index % 10];
  
  // Titles for allinone type
  const allinoneTitles = [
    'Complete Creative Bundle - Files, Merch & Support',
    'Ultimate Learning Package + Community Access',
    'Full Stack Resource Kit & Donation Option',
    'Premium Content Collection with Physical Rewards',
    'Digital & Physical Art Bundle + Tips',
    'All-Inclusive Creator Package',
    'Mixed Media Bundle - Downloads & Merchandise',
    'Comprehensive Course Material + Support Options',
    'Multi-Format Content Bundle',
    'Everything Pack - Digital, Physical & Donations'
  ];
  
  return allinoneTitles[index % 10];
};

// Helper function to generate user descriptions/introductions
const generateUserDescription = (index) => {
  const descriptions = [
    'Digital artist creating unique and inspiring content for creators worldwide.',
    'Professional photographer specializing in landscapes and portraits.',
    'UI/UX designer with a passion for clean, modern interfaces.',
    'Content creator sharing knowledge and resources with the community.',
    'Musician and sound designer creating ambient and experimental tracks.',
    'Graphic designer focused on branding and visual identity.',
    'Web developer building tools and templates for fellow developers.',
    'Creative writer sharing stories, guides, and educational content.',
    'Video editor and motion graphics artist.',
    'Illustrator bringing ideas to life through digital art.',
    'E-commerce entrepreneur selling unique digital products.',
    'Educator creating courses and learning materials.',
    'Marketing specialist sharing templates and strategies.',
    'Game developer creating assets and tools for indie games.',
    'Photographer selling presets and editing tutorials.',
    'Artist collective showcasing diverse creative works.',
    'Design agency offering premium templates and resources.',
    'Content studio producing high-quality digital assets.',
    'Independent creator building a sustainable creative business.',
    'Digital nomad sharing travel photography and stories.'
  ];
  
  return descriptions[index % 20];
};

// Helper function to generate searchable descriptions
const generateSearchableDescription = (index) => {
  const descriptions = [
    'A comprehensive collection of high-quality digital assets including templates, graphics, and source files.',
    'Professional-grade resources designed to elevate your creative projects and save you time.',
    'Carefully curated bundle of premium content for designers, developers, and content creators.',
    'Everything you need to kickstart your next project with style and efficiency.',
    'Hand-picked selection of top-tier digital resources used by professionals worldwide.',
    'Exclusive collection featuring unique designs and hard-to-find creative assets.',
    'Time-saving templates and tools that will transform your workflow.',
    'Premium quality meets affordability in this essential resource pack.',
    'Versatile and modern designs suitable for any creative project.',
    'Boost your productivity with these professionally crafted digital tools.',
    // Edge cases and special descriptions
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
  const types = ['downloadable', 'direct', 'offline', 'allinone'];
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
    const type = types[i % 4];
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
            idx % 2 === 0 ? mockImage1 : mockImage2
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
      
      const fileDescriptions = [
        'Professional design templates with editable layers and modern layouts',
        'High-resolution stock photos suitable for commercial use, includes diverse subjects',
        'Scalable vector graphics bundle with over 500 unique elements',
        'Complete UI kit with components, styles, and design system documentation',
        'Premium icon set featuring 1000+ pixel-perfect icons in multiple formats',
        'Photorealistic mockup templates for showcasing your designs',
        'Royalty-free audio tracks perfect for videos, podcasts, and presentations',
        'Professional video templates with transitions and effects included',
        'High-quality sound effects library for multimedia projects',
        'Comprehensive ebook collection covering design principles and best practices',
        'Step-by-step tutorial videos with downloadable project files',
        'Clean, documented source code examples with best practices',
        'Complete font collection including serif, sans-serif, and display fonts',
        'Custom brush pack for digital painting and illustration',
        'Seamless pattern library for backgrounds and textures',
        'Business presentation templates with charts and infographics',
        'Excel spreadsheet templates with formulas and automation',
        'Professional document templates for contracts and proposals',
        'Game-ready asset bundle with sprites, tiles, and animations',
        'Optimized 3D models pack with textures and materials',
        'High-resolution texture collection for 3D rendering',
        'Essential plugin collection to enhance your workflow',
        'Modular script library with reusable components',
        'Modern CSS framework with responsive grid system',
        'Cross-platform mobile app template with documentation',
        'Responsive website template with SEO optimization',
        'Premium WordPress theme with drag-and-drop builder',
        'Professional Lightroom presets for photo editing',
        'Time-saving Photoshop actions for common tasks',
        'Dynamic After Effects templates for motion graphics',
        'Loopable music tracks ideal for background audio',
        'Professional podcast intro/outro with multiple variations',
        'Voice-over samples in multiple languages and styles'
      ];
      
      searchable.payloads.public.downloadableFiles = Array(fileCount).fill(null).map((_, idx) => {
        const fileIndex = (i * 5 + idx) % fileNames.length;
        return {
          fileId: `file-${i}-${idx}`,
          name: fileNames[fileIndex],
          description: fileDescriptions[fileIndex % fileDescriptions.length],
          price: Math.floor(Math.random() * 100) + 0.99 // Random price from 0.99 to 100.99
        };
      });
    } else if (type === 'direct') {
      // Generate random pricing mode for mock data
      const pricingModes = ['fixed', 'preset', 'flexible'];
      const randomMode = pricingModes[Math.floor(Math.random() * pricingModes.length)];
      
      if (randomMode === 'fixed') {
        const fixedAmount = Math.floor(Math.random() * 50) + 0.99;
        searchable.payloads.public.pricingMode = 'fixed';
        searchable.payloads.public.fixedAmount = fixedAmount;
        searchable.payloads.public.defaultAmount = fixedAmount; // Backward compatibility
      } else if (randomMode === 'preset') {
        const presetCount = Math.floor(Math.random() * 3) + 1; // 1-3 preset amounts
        const presetAmounts = [];
        for (let j = 0; j < presetCount; j++) {
          presetAmounts.push(Math.floor(Math.random() * 30) + 0.99);
        }
        presetAmounts.sort((a, b) => a - b); // Sort ascending
        searchable.payloads.public.pricingMode = 'preset';
        searchable.payloads.public.presetAmounts = presetAmounts;
        searchable.payloads.public.defaultAmount = presetAmounts[0]; // Backward compatibility
      } else {
        searchable.payloads.public.pricingMode = 'flexible';
        searchable.payloads.public.defaultAmount = null; // No default for flexible
      }
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
        'Coffee Beans', 'Tea Selection', 'Honey Jar', 'Jam Set', 'Chocolate Box'
      ];
      
      searchable.payloads.public.offlineItems = Array(itemCount).fill(null).map((_, idx) => {
        const itemIndex = (i * 10 + idx) % offlineProductNames.length;
        return {
          itemId: `offline-item-${i}-${idx}`,
          id: `offline-item-${i}-${idx}`, // Keep for backward compatibility
          name: offlineProductNames[itemIndex],
          price: Math.floor(Math.random() * 50) + 0.99, // Random price from 0.99 to 50.99
          description: `Fresh, high-quality ${offlineProductNames[itemIndex].toLowerCase()}`
        };
      });
    } else if (type === 'allinone') {
      // Generate components for allinone searchable
      const components = {
        downloadable: {
          enabled: Math.random() > 0.3, // 70% chance
          files: []
        },
        offline: {
          enabled: Math.random() > 0.5, // 50% chance
          items: []
        },
        donation: {
          enabled: Math.random() > 0.4, // 60% chance
          pricingMode: 'flexible',
          fixedAmount: 10.00,
          presetAmounts: [5, 10, 20]
        }
      };
      
      // Ensure at least one component is enabled
      if (!components.downloadable.enabled && !components.offline.enabled && !components.donation.enabled) {
        components.downloadable.enabled = true;
      }
      
      // Add downloadable files if enabled
      if (components.downloadable.enabled) {
        const fileCount = Math.floor(Math.random() * 3) + 1; // 1-3 files
        const fileNames = [
          'Premium_Bundle.zip', 'Source_Files.zip', 'Templates_Pack.zip',
          'Graphics_Collection.zip', 'Audio_Samples.mp3', 'Video_Tutorial.mp4'
        ];
        
        components.downloadable.files = Array(fileCount).fill(null).map((_, idx) => {
          return {
            fileId: `allinone-file-${i}-${idx}`,
            id: `allinone-file-${i}-${idx}`,
            name: fileNames[(i * 3 + idx) % fileNames.length],
            price: Math.floor(Math.random() * 30) + 9.99,
            size: Math.floor(Math.random() * 100000000) + 1000000 // 1MB to 100MB
          };
        });
      }
      
      // Add offline items if enabled
      if (components.offline.enabled) {
        const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
        const itemNames = ['T-Shirt', 'Mug', 'Sticker Pack', 'Poster', 'Hat', 'Keychain'];
        
        components.offline.items = Array(itemCount).fill(null).map((_, idx) => {
          return {
            itemId: `allinone-item-${i}-${idx}`,
            id: `allinone-item-${i}-${idx}`,
            name: itemNames[(i * 3 + idx) % itemNames.length],
            price: Math.floor(Math.random() * 20) + 4.99
          };
        });
      }
      
      // Configure donation component if enabled
      if (components.donation.enabled) {
        const pricingModes = ['fixed', 'preset', 'flexible'];
        components.donation.pricingMode = pricingModes[i % 3];
        
        if (components.donation.pricingMode === 'fixed') {
          components.donation.fixedAmount = Math.floor(Math.random() * 20) + 5;
        } else if (components.donation.pricingMode === 'preset') {
          components.donation.presetAmounts = [
            Math.floor(Math.random() * 5) + 1,
            Math.floor(Math.random() * 10) + 10,
            Math.floor(Math.random() * 20) + 20
          ].sort((a, b) => a - b);
        }
      }
      
      searchable.payloads.public.components = components;
    }
    
    // Add some searchables with extreme/edge case prices
    if (i % 20 === 0) {
      if (type === 'downloadable' && searchable.payloads.public.downloadableFiles) {
        searchable.payloads.public.downloadableFiles[0].price = 0.01; // Very cheap
      } else if (type === 'direct') {
        searchable.payloads.public.defaultAmount = 999.99; // Very expensive
      }
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
  // Add user 2's searchables for pagination testing
  allMockSearchables.push(...mockUser2Searchables);
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
    
    // Check if it's a guest login
    const isGuest = data.email && data.email.startsWith('guest_') && data.email.endsWith('@ec.com');
    const userId = isGuest ? data.email.match(/guest_(\d+)@/)?.[1] || '999' : '1';
    
    return createMockResponse({
      success: true,
      token: 'mock-jwt-token-12345',
      user: {
        _id: userId,
        username: isGuest ? `guest_${userId}` : 'test_user',
        email: data.email,
        profile: {
          id: parseInt(userId),
          user_id: parseInt(userId),
          username: isGuest ? `guest_${userId}` : 'test_user',
          profile_image_url: null,
          introduction: null,
          metadata: {},
          is_guest: isGuest,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    });
  },
  
  'users/register': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Register attempt with:', data);
    
    // Check if it's a guest registration request
    const isGuestRequest = data.email === 'GUEST_REGISTRATION_REQUEST';
    const userId = isGuestRequest ? Math.floor(Math.random() * 1000) + 100 : 2;
    
    let msg = 'User registered successfully';
    if (data.invite_code) {
      const validCodes = ['ABCDEF', 'TESTME', 'MOCK01', 'REWARD'];
      if (validCodes.includes(data.invite_code)) {
        msg = 'User registered successfully with invite code reward!';
      }
    }
    
    const user = {
      _id: userId.toString(),
      username: isGuestRequest ? `guest_${userId}` : data.username,
      email: isGuestRequest ? `guest_${userId}@ec.com` : data.email,
      profile: {
        id: userId,
        user_id: userId,
        username: isGuestRequest ? `guest_${userId}` : data.username,
        profile_image_url: null,
        introduction: null,
        metadata: {},
        is_guest: isGuestRequest,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    return createMockResponse({
      success: true,
      userID: userId,
      user: user,
      msg: msg
    });
  },
  
  'users/logout': () => {
    console.log('[MOCK] Logout');
    return createMockResponse({ success: true });
  },
  
  'users/edit-account': (url, config) => {
    console.log('[MOCK] Edit account');
    const data = JSON.parse(config.data || '{}');
    const user = getMockUser();
    
    // Simulate validation of current password
    if (!data.current_password) {
      return createMockResponse({
        success: false,
        msg: 'Current password is required'
      });
    }
    
    // In mock mode, we'll accept any username/email changes
    // Update user data
    if (data.username) user.username = data.username;
    if (data.email) user.email = data.email;
    
    return createMockResponse({
      success: true,
      msg: 'Account updated successfully',
      user: user
    });
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
    
    return createMockResponse({ success: true, tags: filteredTags });
  },
  
  // User search endpoint
  'v1/search/users': (url, config) => {
    // Get params from config object, not URL string
    const params = config?.params || {};
    const username = params.username;
    // Handle tags as comma-separated string (matching backend API)
    const tagsParam = params.tags || '';
    const tagIds = tagsParam ? tagsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    
    console.log('[MOCK] Searching users:', { username, tagIds, page, limit });
    
    let filteredUsers = [...allMockUsers];
    
    // Filter by username if provided
    if (username) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(username.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(username.toLowerCase()))
      );
    }
    
    // Filter by tags if provided (match by tag IDs)
    if (tagIds.length > 0) {
      filteredUsers = filteredUsers.filter(user => {
        const userTagIds = user.tags.map(tag => tag.id);
        return tagIds.some(tagId => userTagIds.includes(tagId));
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
    
    // Add random searchable_id for response
    const searchableId = `mock-item-${Date.now()}`;
    
    return createMockResponse({
      success: true,
      searchable_id: searchableId,
      msg: 'Searchable created successfully!'
    });
  },
  
  'v1/searchable/update/': (url, config) => {
    const searchableId = url.split('/').pop();
    const data = JSON.parse(config.data);
    console.log('[MOCK] Updating searchable:', searchableId, data);
    
    return createMockResponse({
      success: true,
      msg: 'Searchable updated successfully!'
    });
  },
  
  'v1/searchable/delete/': (url) => {
    const searchableId = url.split('/').pop();
    console.log('[MOCK] Deleting searchable:', searchableId);
    
    return createMockResponse({
      success: true,
      msg: 'Searchable deleted successfully!'
    });
  },
  
  'v1/searchable/': (url) => {
    const searchableId = url.split('/').pop();
    console.log('[MOCK] Fetching searchable details:', searchableId);
    
    // Special handling for deleted items
    if (searchableId === 'mock-deleted-item-1') {
      console.log('[MOCK] Returning DELETED mock item');
      const deletedSearchable = {
        searchable_id: searchableId,
        user_id: '1',
        removed: true, // Mark as deleted
        payloads: {
          public: {
            title: 'DELETED: Vintage Photography Collection',
            description: 'This was a beautiful collection of vintage photographs that has been removed by the seller. While you can still view this page for reference, the item is no longer available for purchase.',
            type: 'direct',
            currency: 'usd',
            images: [mockImage1, mockImage2],
            defaultAmount: 39.99
          }
        },
        created_at: new Date(Date.now() - 86400000).toISOString(), // Created yesterday
        username: 'DigitalAssetStore',
        seller_rating: 4.5,
        seller_total_ratings: 23,
        tags: [
          { id: 21, name: 'books', tag_type: 'searchable' },
          { id: 28, name: 'vintage', tag_type: 'searchable' }
        ]
      };
      return createMockResponse(deletedSearchable);
    }
    
    // Find searchable in our mock data
    let searchable = allMockSearchables.find(s => s.searchable_id === searchableId);
    
    if (!searchable) {
      // Create a default searchable for testing - matching backend structure
      searchable = {
        searchable_id: searchableId,
        user_id: '1',
        removed: false, // Explicitly mark as not deleted
        payloads: {
          public: {
            title: 'Mock Searchable Item',
            description: 'This is a mock searchable item for testing purposes.',
            type: 'downloadable',
            currency: 'usd',
            images: [mockImage1, mockImage2],
            downloadableFiles: [
              { fileId: 'file-1', name: 'Test_File_1.zip', price: 9.99 },
              { fileId: 'file-2', name: 'Test_File_2.pdf', price: 4.99 }
            ]
          }
        },
        created_at: new Date().toISOString(),
        username: 'mock_creator',
        seller_rating: 4.5,
        seller_total_ratings: 10,
        tags: [
          { id: 23, name: 'art', tag_type: 'searchable' },
          { id: 29, name: 'templates', tag_type: 'searchable' }
        ]
      };
    } else {
      // Enrich with seller info to match backend response
      const user = allMockUsers.find(u => u.id.toString() === searchable.user_id.toString());
      searchable.username = searchable.username || user?.username || 'unknown_user';
      searchable.seller_rating = user?.rating || 4.0;
      searchable.seller_total_ratings = user?.totalRatings || 0;
      // Ensure removed field is set for non-deleted items
      searchable.removed = false;
    }
    
    console.log('[MOCK] Returning searchable:', {
      hasPayloads: !!searchable.payloads,
      hasPublic: !!searchable.payloads?.public,
      type: searchable.payloads?.public?.type,
      searchable_id: searchable.searchable_id,
      removed: searchable.removed
    });
    
    // Return the searchable data directly, NOT wrapped in { searchable: ... }
    return createMockResponse(searchable);
  },
  
  // Files endpoints
  'v1/files/upload': (url, config) => {
    console.log('[MOCK] File upload');
    
    // Generate a mock file ID
    const fileId = `file-${Date.now()}`;
    
    return createMockResponse({
      success: true,
      file_id: fileId,
      file_url: `/api/v1/files/${fileId}`,
      msg: 'File uploaded successfully!'
    });
  },
  
  'v1/files/': (url) => {
    const fileId = url.split('/').pop();
    console.log('[MOCK] Fetching file:', fileId);
    
    return createMockResponse({
      file_id: fileId,
      filename: 'mock-file.pdf',
      size: 1024000,
      uploaded_at: new Date().toISOString()
    });
  },
  
  // Media endpoints
  'v1/media/upload': (url, config) => {
    console.log('[MOCK] Media upload');
    
    // Generate a mock media ID
    const mediaId = `media-${Date.now()}`;
    
    return createMockResponse({
      success: true,
      media_id: mediaId,
      media_url: `/api/v1/media/${mediaId}`,
      msg: 'Media uploaded successfully!'
    });
  },
  
  // Payment endpoints
  'v1/payment/create-invoice': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Creating invoice:', data);
    
    // Generate mock invoice
    const invoiceId = `inv-${Date.now()}`;
    
    return createMockResponse({
      success: true,
      invoice_id: invoiceId,
      payment_request: 'lnbc1234567890abcdef',
      amount: data.amount,
      currency: data.currency || 'usd',
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    });
  },
  
  'v1/payment/check-invoice/': (url) => {
    const invoiceId = url.split('/').pop();
    console.log('[MOCK] Checking invoice:', invoiceId);
    
    // Simulate paid invoice
    return createMockResponse({
      status: 'paid',
      paid_at: new Date().toISOString(),
      amount: 10.00,
      currency: 'usd'
    });
  },
  
  // Balance endpoints
  'v1/balance': () => {
    console.log('[MOCK] Fetching balance');
    
    return createMockResponse({
      balance: {
        available: 123.45,
        pending: 10.00,
        currency: 'usd'
      }
    });
  },
  
  'balance': () => {
    console.log('[MOCK] Fetching balance (legacy)');
    
    return createMockResponse({
      balance: {
        usd: 123.45
      }
    });
  },
  
  // Profile endpoints
  'v1/my-profile': () => {
    console.log('[MOCK] Fetching my profile');
    
    return createMockResponse({
      profile: {
        user_id: 'mock-user-1',
        username: 'test_user',
        email: 'test@example.com',
        profile_image_url: '/api/v1/media/profile-mock-1',
        introduction: 'Welcome to my profile!',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        metadata: {
          additional_images: [
            '/api/v1/media/gallery-mock-1',
            '/api/v1/media/gallery-mock-2'
          ],
          socialMedia: {
            instagram: 'testuser',
            x: 'testuser'
          }
        }
      }
    });
  },
  
  'v1/my-profile/update': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Updating profile:', data);
    
    return createMockResponse({
      success: true,
      msg: 'Profile updated successfully!'
    });
  },
  
  // v1/profile endpoints (used by EditProfile)
  'v1/profile': (url, config) => {
    // Handle both GET and PUT requests
    if (config?.data) {
      // PUT request - update profile
      const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      console.log('[MOCK] Updating profile via PUT:', data);
      
      // Store the updated profile data in mock storage
      if (data.profile_image_url !== undefined) {
        console.log('[MOCK] Profile image updated to:', data.profile_image_url || 'REMOVED');
      }
      
      return createMockResponse({
        success: true,
        profile: {
          user_id: 'mock-user-1',
          username: data.username || 'test_user',
          email: 'test@example.com',
          profile_image_url: data.profile_image_url,
          introduction: data.introduction || '',
          created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          metadata: data.metadata || {
            additional_images: [],
            socialMedia: {}
          }
        }
      });
    } else {
      // GET request - fetch profile
      console.log('[MOCK] Fetching profile via GET');
      
      return createMockResponse({
        profile: {
          user_id: 'mock-user-1',
          username: 'test_user',
          email: 'test@example.com',
          profile_image_url: '/api/v1/media/profile-mock-1',
          introduction: 'Welcome to my profile!',
          created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          metadata: {
            additional_images: [
              '/api/v1/media/gallery-mock-1',
              '/api/v1/media/gallery-mock-2'
            ],
            socialMedia: {
              instagram: 'testuser',
              x: 'testuser'
            }
          }
        }
      });
    }
  },
  
  // User balance endpoint (different from v1/balance)
  'v1/user-balance': () => {
    console.log('[MOCK] Fetching user balance');
    
    return createMockResponse({
      balance: 123.45,
      pending_balance: 10.00,
      total_earned: 500.00,
      total_withdrawn: 376.55,
      currency: 'usd'
    });
  },
  
  // Payment history endpoints
  'v1/payments/received': (url) => {
    console.log('[MOCK] Fetching received payments');
    
    const mockPayments = [
      {
        payment_id: 'pay-1',
        invoice_id: 'inv-1',
        amount: 29.99,
        currency: 'usd',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        searchable_title: 'Premium Digital Asset Bundle',
        buyer_username: 'buyer1'
      },
      {
        payment_id: 'pay-2',
        invoice_id: 'inv-2',
        amount: 49.99,
        currency: 'usd',
        status: 'completed',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        searchable_title: 'Professional Design Templates',
        buyer_username: 'buyer2'
      }
    ];
    
    return createMockResponse({
      payments: mockPayments,
      total: mockPayments.length
    });
  },
  
  'v1/payments/sent': (url) => {
    console.log('[MOCK] Fetching sent payments');
    
    const mockPayments = [
      {
        payment_id: 'pay-3',
        invoice_id: 'inv-3',
        amount: 19.99,
        currency: 'usd',
        status: 'completed',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        searchable_title: 'UI Kit Components',
        seller_username: 'designer_pro'
      }
    ];
    
    return createMockResponse({
      payments: mockPayments,
      total: mockPayments.length
    });
  },

  // Rewards endpoints
  'v1/rewards': () => {
    console.log('[MOCK] Fetching rewards');
    return createMockResponse(mockRewards);
  },
  
  
  'v1/profile/': (url) => {
    const identifier = url.split('/').pop();
    console.log('[MOCK] Fetching user profile by identifier:', identifier);
    
    // Check if identifier is numeric (user ID)
    const userId = parseInt(identifier);
    let user = null;
    
    // Special handling for user 2 (pagination testing)
    if (userId === 2 || identifier === 'creativepro') {
      console.log('[MOCK] Returning special user 2 profile for pagination testing');
      return createMockResponse(mockUserProfile2);
    }
    
    if (!isNaN(userId)) {
      // Find user by ID
      user = allMockUsers.find(u => u.id === userId);
    } else {
      // Find user by username (backward compatibility)
      user = allMockUsers.find(u => u.username === identifier);
    }
    
    if (!user) {
      console.log('[MOCK] User not found:', identifier);
      // Return a default user for testing
      user = allMockUsers[0];
    }
    
    // Create profile data from user
    let profileData = {
      user_id: user.id,
      username: user.username,
      displayName: user.displayName,
      profile_image_url: user.profile_image_url,
      introduction: user.introduction,
      created_at: user.joinedDate,
      rating: user.rating,
      totalRatings: user.totalRatings,
      tags: user.tags,
      metadata: {
        additional_images: [
          '/api/v1/media/gallery-mock-1',
          '/api/v1/media/gallery-mock-2',
          '/api/v1/media/gallery-mock-3'
        ],
        socialMedia: {
          instagram: user.username + '_studio',
          x: user.username,
          youtube: user.username + 'Channel'
        }
      }
    };
    
    // Generate some downloadables for this user
    const userSearchables = allMockSearchables.filter(s => s.user_id === user.id.toString());
    let downloadables = userSearchables.slice(0, 5).map(s => ({
      searchable_id: s.searchable_id,
      title: s.payloads.public.title,
      description: s.payloads.public.description,
      type: s.payloads.public.type,
      price: s.payloads.public.downloadableFiles?.[0]?.price || s.payloads.public.defaultAmount || 9.99,
      currency: s.payloads.public.currency || 'USD'
    }));
    
    // If user has no searchables, show some default ones
    if (downloadables.length === 0) {
      downloadables = [
        {
          searchable_id: 'mock-item-1',
          title: 'Sample Digital Product',
          description: 'A sample product for this user',
          type: 'downloadable',
          price: 9.99,
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
      return createMockResponse(mockUserSearchables);
    }
    
    // In mock mode, show a mix that includes the user's own items to simulate logged-in experience
    console.log('[MOCK] Fetching all searchables list (logged-in user view)');
    // Get some searchables from the generated list instead of hard-coding
    const sampleSearchables = allMockSearchables.slice(0, 10);
    
    return createMockResponse({
      searchables: [
        // Include user's own searchables
        ...mockUserSearchables.searchables,
        // Include other users' searchables
        ...sampleSearchables.filter(s => s.user_id !== '1') // Exclude user's own items
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: mockUserSearchables.searchables.length + sampleSearchables.length,
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
          images: [mockImage1, mockImage2],
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
          images: [mockImage1, mockImage2],
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
          images: [mockImage2],
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
    
    console.log('[MOCK] Searching searchables:', { page, pageSize, searchTerm, filters, tags });
    
    let results = [...allMockSearchables];
    
    // Filter by tags if provided
    if (tags && tags.trim()) {
      const tagList = tags.split(',').map(tag => tag.trim());
      results = results.filter(item => {
        if (!item.tags) return false;
        return item.tags.some(tag => tagList.includes(tag.id.toString()) || tagList.includes(tag.name));
      });
    }
    
    // Filter by search term if provided
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(item => {
        const title = item.payloads?.public?.title?.toLowerCase() || '';
        const description = item.payloads?.public?.description?.toLowerCase() || '';
        return title.includes(term) || description.includes(term);
      });
    }
    
    // Filter by type if provided in filters
    if (filters.type) {
      results = results.filter(item => item.payloads?.public?.type === filters.type);
    }
    
    // Filter by user_id if provided in filters
    if (filters.user_id) {
      results = results.filter(item => item.user_id === filters.user_id.toString());
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
  
  // Add offline and direct item endpoints for better search testing
  'v1/offline-items-by-user': () => {
    console.log('[MOCK] Fetching user offline items');
    return createMockResponse({
      offline_items: [
        {
          invoice_id: 'purchase-offline-1',
          searchable_id: 'mock-item-offline-1',
          searchable_title: 'Artisan Coffee Shop Menu',
          searchable_description: 'Premium coffee and pastries from our local shop',
          seller_username: 'local_coffee_shop',
          amount_paid: 15.50,
          fee_paid: 0.02,
          currency: 'usd',
          purchase_date: new Date(Date.now() - 1800000).toISOString(),
          item_type: 'offline',
          images: [mockImage1],
          offline_items: [
            { name: 'Cappuccino', price: '4.50', quantity: 2 },
            { name: 'Croissant', price: '3.25', quantity: 2 }
          ]
        }
      ],
      count: 1
    });
  },
  
  'v1/direct-payments-by-user': () => {
    console.log('[MOCK] Fetching user direct payments');
    return createMockResponse({
      direct_payments: [
        {
          invoice_id: 'purchase-direct-1',
          searchable_id: 'mock-item-direct-1',
          searchable_title: 'Support My Creative Work',
          searchable_description: 'Direct support for ongoing creative projects',
          seller_username: 'indie_artist',
          amount_paid: 25.00,
          fee_paid: 0.03,
          currency: 'usd',
          purchase_date: new Date(Date.now() - 7200000).toISOString(),
          item_type: 'direct'
        }
      ],
      count: 1
    });
  },
  
  // Invoice and rating endpoints
  'v1/invoice/': (url) => {
    const invoiceId = url.split('/').pop();
    console.log('[MOCK] Fetching invoice:', invoiceId);
    
    return createMockResponse({
      invoice: {
        invoice_id: invoiceId,
        searchable_id: 'mock-item-1',
        searchable_title: 'Premium Digital Asset Bundle',
        seller_username: 'DigitalAssetStore',
        buyer_username: 'test_user',
        amount: 29.99,
        fee: 0.03,
        currency: 'usd',
        status: 'paid',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        paid_at: new Date(Date.now() - 3000000).toISOString()
      }
    });
  },
  
  'v1/ratings/searchable/': (url) => {
    const searchableId = url.split('/').pop();
    console.log('[MOCK] Fetching ratings for searchable:', searchableId);
    
    const mockRatings = [
      {
        rating_id: 'rating-1',
        rating: 5,
        comment: 'Excellent quality! Highly recommend.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        buyer_username: 'happy_customer1',
        reply: {
          comment: 'Thank you for your kind words!',
          created_at: new Date(Date.now() - 82800000).toISOString()
        }
      },
      {
        rating_id: 'rating-2',
        rating: 4,
        comment: 'Good value for money.',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        buyer_username: 'customer2',
        reply: null
      }
    ];
    
    return createMockResponse({
      ratings: mockRatings,
      average_rating: 4.5,
      total_ratings: 2
    });
  },
  
  'v1/rating/create': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Creating rating:', data);
    
    return createMockResponse({
      success: true,
      rating_id: `rating-${Date.now()}`,
      msg: 'Rating submitted successfully!'
    });
  },
  
  'v1/rating/reply': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Replying to rating:', data);
    
    return createMockResponse({
      success: true,
      msg: 'Reply posted successfully!'
    });
  },
  
  // User invoices endpoints
  'v1/user/invoices': (url) => {
    console.log('[MOCK] Fetching user invoices (new endpoint)');
    
    const mockPurchases = [
      {
        id: 1,
        invoice_id: 'inv-purchase-1',
        searchable_id: 'mock-item-2',
        searchable_title: 'Professional Design Templates',
        searchable_type: 'downloadable',
        amount: 19.99,
        fee: 0.02, // Platform fee 0.1%
        currency: 'usd',
        type: 'stripe',
        status: 'paid',
        payment_status: 'complete',
        payment_date: new Date(Date.now() - 170000000).toISOString(),
        created_at: new Date(Date.now() - 172800000).toISOString(),
        other_party_username: 'seller456',
        metadata: {
          selections: [
            {
              id: 'file-1',
              name: 'Professional Templates Pack',
              price: 19.99,
              count: 1
            }
          ],
          stripe_fee: 0.70 // 3.5% Stripe fee
        }
      },
      {
        id: 2,
        invoice_id: 'inv-purchase-2',
        searchable_id: 'mock-item-4',
        searchable_title: 'UI Kit Components Bundle',
        searchable_type: 'offline',
        amount: 39.99,
        fee: 0.04,
        currency: 'usd',
        type: 'stripe',
        status: 'paid',
        payment_status: 'complete',
        payment_date: new Date(Date.now() - 259000000).toISOString(),
        created_at: new Date(Date.now() - 259200000).toISOString(),
        other_party_username: 'designer_pro',
        metadata: {
          selections: [
            {
              id: 'file-2',
              name: 'UI Kit Components',
              price: 29.99,
              count: 1
            },
            {
              id: 'file-3',
              name: 'Bonus Icons Pack',
              price: 10.00,
              count: 1
            }
          ],
          stripe_fee: 1.40
        }
      }
    ];
    
    const mockSales = [
      {
        id: 3,
        invoice_id: 'inv-sale-1',
        searchable_id: 'mock-item-1',
        searchable_title: 'Premium Digital Asset Bundle',
        searchable_type: 'downloadable',
        amount: 29.99,
        fee: 0.03,
        currency: 'usd',
        type: 'stripe',
        status: 'paid',
        payment_status: 'complete',
        payment_date: new Date(Date.now() - 80000000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        other_party_username: 'buyer123',
        metadata: {
          selections: [
            {
              id: 'file-4',
              name: 'Premium Digital Asset Bundle',
              price: 29.99,
              count: 1
            }
          ]
        }
      }
    ];
    
    const allInvoices = [...mockPurchases, ...mockSales].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    return createMockResponse({
      invoices: allInvoices,
      purchases: mockPurchases,
      sales: mockSales,
      total_count: allInvoices.length,
      purchases_count: mockPurchases.length,
      sales_count: mockSales.length
    });
  },
  
  'v1/user-invoices': (url) => {
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const page = parseInt(urlParams.get('page')) || 1;
    const pageSize = parseInt(urlParams.get('page_size')) || 10;
    const status = urlParams.get('status');
    
    console.log('[MOCK] Fetching user invoices:', { page, pageSize, status });
    
    const mockInvoices = [
      {
        invoice_id: 'inv-sent-1',
        searchable_id: 'mock-item-1',
        searchable_title: 'Premium Digital Asset Bundle',
        amount: 29.99,
        fee: 0.03,
        currency: 'usd',
        status: 'paid',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        paid_at: new Date(Date.now() - 3000000).toISOString(),
        terminal_username: 'DigitalAssetStore',
        is_incoming: false
      },
      {
        invoice_id: 'inv-received-1',
        searchable_id: 'mock-item-2',
        searchable_title: 'Professional Design Templates',
        amount: 49.99,
        fee: 0.05,
        currency: 'usd',
        status: 'paid',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        paid_at: new Date(Date.now() - 6600000).toISOString(),
        terminal_username: 'buyer123',
        is_incoming: true
      }
    ];
    
    let filteredInvoices = mockInvoices;
    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
    
    return createMockResponse({
      invoices: paginatedInvoices,
      pagination: {
        current_page: page,
        page_size: pageSize,
        total_count: filteredInvoices.length,
        total_pages: Math.ceil(filteredInvoices.length / pageSize)
      }
    });
  },
  
  // Purchase ratings endpoint
  'v1/purchase-ratings': () => {
    console.log('[MOCK] Fetching purchase ratings');
    
    return createMockResponse({
      purchases: [
        {
          invoice_id: 'purchase-1',
          searchable_id: 'mock-item-1',
          searchable_title: 'Premium Digital Asset Bundle',
          seller_username: 'DigitalAssetStore',
          amount_paid: 29.99,
          purchase_date: new Date(Date.now() - 86400000).toISOString(),
          has_rated: false,
          rating: null
        },
        {
          invoice_id: 'purchase-2',
          searchable_id: 'mock-item-2',
          searchable_title: 'Professional Design Templates',
          seller_username: 'designer_pro',
          amount_paid: 49.99,
          purchase_date: new Date(Date.now() - 172800000).toISOString(),
          has_rated: true,
          rating: {
            rating: 5,
            comment: 'Excellent templates!',
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        }
      ]
    });
  },
  
  // Download file endpoint
  'v1/download-file/': (url) => {
    const fileId = url.split('/').pop();
    console.log('[MOCK] Downloading file:', fileId);
    
    // In a real app, this would return file data
    // For mock, we'll return a success response
    return createMockResponse({
      success: true,
      file_url: `/mock-files/${fileId}`,
      filename: `Mock_File_${fileId}.zip`
    });
  },
  
  // User paid files endpoint
  'v1/user-paid-files/': (url) => {
    const searchableId = url.split('/').pop();
    console.log('[MOCK] Fetching user paid files for searchable:', searchableId);
    
    return createMockResponse({
      paid_files: [
        {
          file_id: 'file-1',
          name: 'Design_Templates_Pack.zip',
          price: 29.99,
          purchase_date: new Date(Date.now() - 86400000).toISOString(),
          download_url: '/api/v1/download-file/file-1'
        }
      ]
    });
  },
  
  // User paid items endpoint (for offline searchables)
  'v1/user-paid-items/': (url) => {
    const searchableId = url.split('/').pop();
    console.log('[MOCK] Fetching user paid items for searchable:', searchableId);
    
    return createMockResponse({
      paid_items: [
        {
          invoice_id: 'purchase-offline-1',
          items: [
            { name: 'Cappuccino', price: '4.50', quantity: 2 },
            { name: 'Croissant', price: '3.25', quantity: 2 }
          ],
          total_amount: 15.50,
          purchase_date: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    });
  },
  
  // Invoice note endpoints
  'v1/invoice-note/count/': (url) => {
    const invoiceId = url.split('/')[url.split('/').indexOf('count') + 1];
    console.log('[MOCK] Getting note count for invoice:', invoiceId);
    
    return createMockResponse({
      count: Math.floor(Math.random() * 5) // Random count 0-4
    });
  },
  
  'v1/invoice-notes/': (url) => {
    const invoiceId = url.split('/').pop();
    console.log('[MOCK] Fetching notes for invoice:', invoiceId);
    
    const mockNotes = [
      {
        note_id: 'note-1',
        invoice_id: invoiceId,
        content: 'Thank you for your purchase! Here are some tips to get started...',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        created_by: 'seller',
        username: 'DigitalAssetStore'
      },
      {
        note_id: 'note-2',
        invoice_id: invoiceId,
        content: 'Thanks! The files are exactly what I needed.',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        created_by: 'buyer',
        username: 'test_user'
      }
    ];
    
    return createMockResponse({
      notes: mockNotes,
      count: mockNotes.length
    });
  },
  
  'v1/invoice-note/create': (url, config) => {
    const data = JSON.parse(config.data);
    console.log('[MOCK] Creating invoice note:', data);
    
    return createMockResponse({
      success: true,
      note_id: `note-${Date.now()}`,
      msg: 'Note added successfully!'
    });
  },
  
  // Invoices by searchable endpoint
  'v1/invoices-by-searchable/': (url) => {
    const searchableId = url.split('/').pop();
    console.log('[MOCK] Fetching invoices for searchable:', searchableId);
    
    // Find the searchable to determine user role
    const searchable = allMockSearchables.find(s => s.searchable_id === searchableId);
    const userRole = searchable && searchable.user_id === '1' ? 'seller' : 'buyer';
    
    // Generate some mock invoices
    const mockInvoices = [];
    
    if (userRole === 'buyer') {
      // User has bought this item
      mockInvoices.push({
        id: `inv-${searchableId}-1`,
        invoice_id: `inv-${searchableId}-1`,
        searchable_id: searchableId,
        amount: 29.99,
        currency: 'usd',
        status: 'paid',
        payment_status: 'complete',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        paid_at: new Date(Date.now() - 86000000).toISOString(),
        buyer_id: '1',
        seller_id: searchable?.user_id || '2',
        other_party_username: searchable?.username || 'seller_user',
        metadata: {
          selections: (() => {
            const type = searchable?.payloads?.public?.type;
            if (type === 'downloadable') {
              return searchable?.payloads?.public?.downloadableFiles?.map(f => ({
                id: f.fileId,
                type: 'downloadable',
                name: f.name,
                price: f.price
              })) || [];
            } else if (type === 'offline') {
              return searchable?.payloads?.public?.offlineItems?.slice(0, 2).map(item => ({
                id: item.itemId,
                type: 'offline',
                name: item.name,
                price: item.price,
                count: 1
              })) || [];
            } else if (type === 'direct') {
              return [{
                id: 'direct-payment',
                type: 'direct',
                name: 'Direct Payment',
                price: searchable?.payloads?.public?.defaultAmount || 25.00
              }];
            }
            return [];
          })()
        }
      });
    } else {
      // User is selling this item - show sales
      mockInvoices.push({
        id: `inv-${searchableId}-2`,
        invoice_id: `inv-${searchableId}-2`,
        searchable_id: searchableId,
        amount: 49.99,
        currency: 'usd',
        status: 'paid',
        payment_status: 'complete',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        paid_at: new Date(Date.now() - 172000000).toISOString(),
        buyer_id: '3',
        seller_id: '1',
        other_party_username: 'buyer_user',
        metadata: {}
      });
    }
    
    return createMockResponse({
      invoices: mockInvoices,
      user_role: userRole
    });
  },
  
  // Withdrawals endpoint
  'v1/withdrawals': () => {
    console.log('[MOCK] Fetching withdrawals');
    
    return createMockResponse({
      withdrawals: [
        {
          id: 1,
          amount: 50.00,
          fee: 0.05, // 0.1% withdrawal fee
          currency: 'usd',
          status: 'complete',
          type: 'bank_transfer',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          metadata: {
            address: '****1234',
            bank_name: 'Mock Bank'
          }
        },
        {
          id: 2,
          amount: 30.00,
          fee: 0.03,
          currency: 'usd',
          status: 'pending',
          type: 'lightning',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          metadata: {
            address: 'lnbc30u1p3h4c7...'
          }
        },
        {
          id: 3,
          amount: 100.00,
          fee: 0.10,
          currency: 'usd',
          status: 'complete',
          type: 'usdt',
          created_at: new Date(Date.now() - 604800000).toISOString(),
          metadata: {
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f89234'
          }
        }
      ],
      total: 3
    });
  },
  
  // Deposits endpoint
  'v1/deposits': () => {
    console.log('[MOCK] Fetching deposits');
    
    return createMockResponse({
      deposits: [
        {
          deposit_id: 1,
          amount: '100.00',
          currency: 'usd',
          type: 'stripe',
          status: 'complete',
          created_at: new Date(Date.now() - 432000000).toISOString(),
          address: null,
          tx_hash: null,
          metadata: {
            last_four: '4242'
          }
        },
        {
          deposit_id: 2,
          amount: '50.00',
          currency: 'usdt',
          type: 'usdt',
          status: 'complete',
          created_at: new Date(Date.now() - 864000000).toISOString(),
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f89234',
          tx_hash: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          metadata: {}
        },
        {
          deposit_id: 3,
          amount: '0.00000000',
          currency: 'usdt',
          type: 'usdt',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          address: '0x123456789abcdef123456789abcdef123456789a',
          tx_hash: null,
          metadata: {}
        }
      ],
      total: 3
    });
  },
  
  // User profile endpoint (for dashboard)
  'v1/profile': () => {
    console.log('[MOCK] Fetching user profile for dashboard');
    
    return createMockResponse({
      profile: {
        user_id: '1',
        username: 'test_user',
        email: 'test@example.com',
        displayName: 'Test User',
        profile_image_url: '/api/v1/media/profile-mock-1',
        introduction: 'Welcome to my store! I create digital assets and templates.',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        seller_rating: 4.5,
        seller_total_ratings: 25,
        buyer_rating: 4.8,
        buyer_total_ratings: 15,
        total_sales: 45,
        total_purchases: 23,
        metadata: {
          verified: true,
          location: 'United States',
          languages: ['English', 'Spanish']
        }
      }
    });
  },
  
  // AI Content endpoint
  'v1/ai-content': () => {
    console.log('[MOCK] Fetching AI content');
    
    return createMockResponse({
      success: true,
      ai_contents: [
        {
          id: 'ai-content-1',
          title: 'AI Generated Blog Post',
          status: 'processed',
          type: 'blog_post',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          processed_at: new Date(Date.now() - 82800000).toISOString(),
          content_preview: 'This is an AI generated blog post about digital marketing...',
          metadata: {
            word_count: 1500,
            language: 'en'
          }
        },
        {
          id: 'ai-content-2',
          title: 'Product Description Generator',
          status: 'processed',
          type: 'product_description',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          processed_at: new Date(Date.now() - 169200000).toISOString(),
          content_preview: 'Professional product descriptions for your e-commerce store...',
          metadata: {
            word_count: 300,
            language: 'en'
          }
        }
      ]
    });
  }
};

// Create a proper mock response
const createMockResponse = (data) => {
  return {
    data: data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
  };
};

// Export the mock backend interceptor
const mockBackend = {
  // Add defaults property to match axios structure
  defaults: {
    headers: {
      common: {}
    }
  },
  
  get: (url, config) => {
    console.log('[MOCK] GET request:', url, config);
    
    // Check each handler pattern
    for (const [pattern, handler] of Object.entries(mockHandlers)) {
      if (url.includes(pattern)) {
        return Promise.resolve(handler(url, config));
      }
    }
    
    console.warn('[MOCK] No handler found for:', url);
    return Promise.reject(new Error(`No mock handler for ${url}`));
  },
  
  post: (url, data, config) => {
    console.log('[MOCK] POST request:', url, data);
    
    // Check each handler pattern
    for (const [pattern, handler] of Object.entries(mockHandlers)) {
      if (url.includes(pattern)) {
        return Promise.resolve(handler(url, { ...config, data }));
      }
    }
    
    console.warn('[MOCK] No handler found for:', url);
    return Promise.reject(new Error(`No mock handler for ${url}`));
  },
  
  put: (url, data, config) => {
    console.log('[MOCK] PUT request:', url, data);
    
    // Check each handler pattern
    for (const [pattern, handler] of Object.entries(mockHandlers)) {
      if (url.includes(pattern)) {
        return Promise.resolve(handler(url, { ...config, data }));
      }
    }
    
    console.warn('[MOCK] No handler found for:', url);
    return Promise.reject(new Error(`No mock handler for ${url}`));
  },
  
  delete: (url, config) => {
    console.log('[MOCK] DELETE request:', url);
    
    // Check each handler pattern
    for (const [pattern, handler] of Object.entries(mockHandlers)) {
      if (url.includes(pattern)) {
        return Promise.resolve(handler(url, config));
      }
    }
    
    console.warn('[MOCK] No handler found for:', url);
    return Promise.reject(new Error(`No mock handler for ${url}`));
  }
};

export default mockBackend;