// Utility to clear mock auth for testing
const clearMockAuth = () => {
  localStorage.removeItem('persist:ungovernable-account');
  localStorage.removeItem('ungovernable-account');
  localStorage.removeItem('visitorId');
  
};

// Run if called directly
if (typeof window !== 'undefined') {
  window.clearMockAuth = clearMockAuth;
   in the browser console');
}

clearMockAuth();