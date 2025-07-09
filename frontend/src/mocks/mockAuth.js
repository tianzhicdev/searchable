// Mock authentication setup for development
import { isMockMode } from './mockBackend';
import { store } from '../store';
import { ACCOUNT_INITIALIZE } from '../store/actions';

export const mockAccount = {
  isLoggedIn: true,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibW9jay11c2VyLTEiLCJ1c2VybmFtZSI6InRlc3RfdXNlciIsImV4cCI6OTk5OTk5OTk5OX0.mock-signature',
  user: {
    _id: 'mock-user-1',
    username: 'test_user',
    email: 'test@example.com',
    address: '123 Mock Street, Test City',
    tel: '+1234567890'
  }
};

// Function to inject mock auth into Redux store
export const setupMockAuth = () => {
  if (isMockMode) {

    // Dispatch ACCOUNT_INITIALIZE action to set up the mock user in Redux
    store.dispatch({
      type: ACCOUNT_INITIALIZE,
      payload: {
        isLoggedIn: mockAccount.isLoggedIn,
        token: mockAccount.token,
        user: mockAccount.user
      }
    });

    .account);
  }
};

// Function to get mock user data for Redux
export const getMockUser = () => {
  if (isMockMode) {
    return mockAccount.user;
  }
  return null;
};

// Hook to ensure mock auth is set up properly in React components
export const useMockAuth = () => {
  if (isMockMode && typeof window !== 'undefined') {
    setupMockAuth();
  }
};

// Auto-setup mock auth when module loads
if (typeof window !== 'undefined') {
  setTimeout(() => {
    setupMockAuth();
  }, 100); // Small delay to ensure Redux store is ready
}