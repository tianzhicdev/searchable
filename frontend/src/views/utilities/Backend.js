import axios from 'axios';
import configData from '../../config';
import { store } from '../../store';

// Check if we're in mock mode (only use environment variable)
const isMockMode = process.env.REACT_APP_MOCK_MODE === 'true';

// Import mock backend if in mock mode
let backend;
if (isMockMode) {
  const mockBackend = require('../../mocks/mockBackend').default;
  backend = mockBackend;
  
} else {
  // Create an Axios instance for real backend
  backend = axios.create({
    baseURL: configData.API_SERVER,
  });
  
}

// Only add interceptors for real backend, not mock backend
if (!isMockMode) {
  // Create a request interceptor that gets the token from Redux store
  backend.interceptors.request.use(
    (config) => {
      // Get current state from Redux store
      const state = store.getState();
      const account = state.account;

      // Also check localStorage for debugging
      const persistedData = localStorage.getItem('persist:ungovernable-account');

      if (account?.isLoggedIn && account?.token) {
        
        // Backend expects lowercase 'authorization' header
        config.headers.authorization = account.token;
        
      } else {
        
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
}

// Export a function to update headers with current account state
export const updateBackendAuth = (account) => {
  if (!isMockMode && account && account.token) {
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
