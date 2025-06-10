// Mock authentication setup for development
import { isMockMode } from './mockBackend';

export const mockAccount = {
  isLoggedIn: true,
  token: 'mock-token-123',
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
    // Redux persist uses a specific key format
    const persistKey = 'persist:ungovernable-account';
    const existingAuth = localStorage.getItem(persistKey);
    
    if (!existingAuth) {
      // Set mock auth in redux-persist format
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
      
      // Force page reload to pick up the auth state
      window.location.reload();
    }
  }
};

// Auto-setup mock auth when module loads
if (typeof window !== 'undefined') {
  setupMockAuth();
}