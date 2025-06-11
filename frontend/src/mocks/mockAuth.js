// Mock authentication setup for development
import { isMockMode } from './mockBackend';

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

// Function to inject mock auth into localStorage
export const setupMockAuth = () => {
  if (isMockMode) {
    console.log('[MOCK] Setting up mock authentication...');
    
    // Redux persist uses a specific key format
    const persistKey = 'persist:ungovernable-account';
    
    // Always set mock auth state for consistent behavior
    const mockAuthState = {
      token: JSON.stringify(mockAccount.token),
      isLoggedIn: JSON.stringify(mockAccount.isLoggedIn),
      isInitialized: JSON.stringify(true),
      user: JSON.stringify(mockAccount.user),
      _persist: JSON.stringify({ version: -1, rehydrated: true })
    };
    
    localStorage.setItem(persistKey, JSON.stringify(mockAuthState));
    console.log('[MOCK] Auth state injected into Redux persist');
    
    // Also set the old format for backward compatibility
    localStorage.setItem('ungovernable-account', JSON.stringify(mockAccount));
    
    console.log('[MOCK] Mock authentication setup complete');
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
  setupMockAuth();
}