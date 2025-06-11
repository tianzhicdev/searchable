import axios from 'axios';
import configData from '../../config';
import { useSelector } from 'react-redux';

// Check if we're in mock mode (only use environment variable)
const isMockMode = process.env.REACT_APP_MOCK_MODE === 'true';

// Import mock backend if in mock mode
let backend;
if (isMockMode) {
  const mockBackend = require('../../mocks/mockBackend').default;
  backend = mockBackend;
  console.log('[BACKEND] Using mock backend');
} else {
  // Create an Axios instance for real backend
  backend = axios.create({
    baseURL: configData.API_SERVER,
  });
  console.log('[BACKEND] Using real backend:', configData.API_SERVER);
}

// Only add interceptors for real backend, not mock backend
if (!isMockMode) {
  // Create a request interceptor that gets the token from localStorage or other sources
  backend.interceptors.request.use(
    (config) => {
      // Get token from Redux persist storage
      const persistedData = localStorage.getItem('persist:ungovernable-account');
      console.log('[AUTH DEBUG] Persisted data exists:', !!persistedData);
      
      let token = null;
      let isLoggedIn = false;
      
      if (persistedData) {
        try {
          const parsedData = JSON.parse(persistedData);
          console.log('[AUTH DEBUG] Parsed data:', parsedData);
          
          // Redux persist stores values as JSON strings
          isLoggedIn = JSON.parse(parsedData.isLoggedIn || 'false');
          
          // Parse token - it might be double-encoded
          const tokenString = parsedData.token || '""';
          try {
            token = JSON.parse(tokenString);
            // If token is still wrapped in quotes, remove them
            if (typeof token === 'string') {
              token = token.replace(/^["']|["']$/g, '');
            }
          } catch (e) {
            // If parsing fails, just use the string as-is
            token = tokenString.replace(/^["']|["']$/g, '');
          }
          
          console.log('[AUTH DEBUG] isLoggedIn:', isLoggedIn);
          console.log('[AUTH DEBUG] token exists:', !!token);
          console.log('[AUTH DEBUG] token length:', token?.length);
        } catch (e) {
          console.error('Error parsing persisted auth data:', e);
        }
      }

      if (isLoggedIn && token) {
        console.log("[AUTH DEBUG] Setting auth token in headers");
        // Backend expects lowercase 'authorization' header
        config.headers.authorization = token;
        console.log('[AUTH DEBUG] Final headers:', config.headers);
      } else {
        console.log('[AUTH DEBUG] Not setting auth - isLoggedIn:', isLoggedIn, 'token:', !!token);
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
}

// Export a function to update headers with current account state
export const updateBackendAuth = (account) => {
  if (account && account.token) {
    // Backend expects lowercase 'authorization' header
    backend.defaults.headers.common['authorization'] = account.token;
  }
};

// // Response interceptor to handle errors or token expiration
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       // Handle token expiration or unauthorized access
//       const refreshToken = localStorage.getItem('refreshToken');
//       if (refreshToken) {
//         try {
//           const { data } = await axios.post('/auth/refresh', { refreshToken });
//           localStorage.setItem('token', data.token);
//           error.config.headers.Authorization = `Bearer ${data.token}`;
//           return api.request(error.config); // Retry the original request
//         } catch (refreshError) {
//           console.error('Token refresh failed:', refreshError);
//         }
//       }
//     }
//     return Promise.reject(error);
//   }
// );

export default backend;
