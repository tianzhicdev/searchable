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
  // Create a request interceptor that gets the token from Redux store
  backend.interceptors.request.use(
    (config) => {
      // Get current state from Redux store
      const state = store.getState();
      const account = state.account;
      
      console.log('[AUTH DEBUG] Redux state account:', account);
      console.log('[AUTH DEBUG] isLoggedIn:', account?.isLoggedIn);
      console.log('[AUTH DEBUG] token exists:', !!account?.token);
      console.log('[AUTH DEBUG] token length:', account?.token?.length);
      
      // Also check localStorage for debugging
      const persistedData = localStorage.getItem('persist:ungovernable-account');
      console.log('[AUTH DEBUG] Persisted data exists:', !!persistedData);

      if (account?.isLoggedIn && account?.token) {
        console.log("[AUTH DEBUG] Setting auth token in headers from Redux state");
        // Backend expects lowercase 'authorization' header
        config.headers.authorization = account.token;
        console.log('[AUTH DEBUG] Final headers:', config.headers);
      } else {
        console.log('[AUTH DEBUG] Not setting auth - isLoggedIn:', account?.isLoggedIn, 'token:', !!account?.token);
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
