import configData from '../config';

// Check if we're in mock mode
const isMockMode = process.env.REACT_APP_MOCK_MODE === 'true';

/**
 * Convert a media URI to a full URL
 * @param {string} mediaUri - The media URI (e.g., "/api/v1/media/12345")
 * @returns {string} - Full URL to the media
 */
export const getMediaUrl = (mediaUri) => {
  if (!mediaUri) return null;
  
  // If it's already a full URL or data URL, return as is
  if (mediaUri.startsWith('http') || mediaUri.startsWith('data:')) {
    return mediaUri;
  }
  
  // In mock mode, handle media URIs differently
  if (isMockMode && mediaUri.startsWith('/api/v1/media/')) {
    // Extract media ID and map to mock images
    const mediaId = mediaUri.split('/').pop();
    
    // Import mock images dynamically
    try {
      const mockData = require('../mocks/mockData');
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
      
      return mediaMap[mediaId] || mockData.mockImage1;
    } catch (error) {
      console.warn('Could not load mock images for media URI:', mediaUri);
    }
  }
  
  // If it's a relative URI, prepend the API server URL
  if (mediaUri.startsWith('/api/v1/media/')) {
    return `${configData.API_SERVER}${mediaUri}`;
  }
  
  return mediaUri;
};

/**
 * Process an array of media URIs to full URLs
 * @param {Array} mediaUris - Array of media URIs
 * @returns {Array} - Array of full URLs
 */
export const processMediaUrls = (mediaUris) => {
  if (!Array.isArray(mediaUris)) return [];
  
  return mediaUris.map(uri => getMediaUrl(uri)).filter(Boolean);
};

/**
 * Check if an image URI is a media URI
 * @param {string} uri - The URI to check
 * @returns {boolean} - True if it's a media URI
 */
export const isMediaUri = (uri) => {
  return uri && uri.startsWith('/api/v1/media/');
};