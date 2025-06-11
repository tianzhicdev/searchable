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
      // Get token from Redux store or localStorage
      const localAccount = localStorage.getItem('ungovernable-account');
      const account = JSON.parse(localAccount);
      const isLoggedIn = account?.isLoggedIn === "true" || account?.isLoggedIn === true;

      if (isLoggedIn) {

        const token = account?.token ? account.token.replace(/['"]/g, '') : '';
        console.log("using auth token", token);
        config.headers.Authorization = token;
        config.headers['use-jwt'] = "true";
      } else {
        const visitorId = localStorage.getItem('visitorId');
        console.log("using visitorId", visitorId);
        config.headers['X-Visitor-ID'] = visitorId;
        config.headers['use-jwt'] = "false";
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
}

// Export a function to update headers with current account state
export const updateBackendAuth = (account) => {
  if (account && account.token) {
    backend.defaults.headers.common['Authorization'] = account.token;
  } else if (account && account.visitorId) {
    backend.defaults.headers.common['X-Visitor-ID'] = account.visitorId;
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
