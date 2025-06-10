// Utility to clear mock auth for testing
const clearMockAuth = () => {
  localStorage.removeItem('persist:ungovernable-account');
  localStorage.removeItem('ungovernable-account');
  localStorage.removeItem('visitorId');
  console.log('Mock auth cleared. Refresh the page to see login state.');
};

// Run if called directly
if (typeof window !== 'undefined') {
  window.clearMockAuth = clearMockAuth;
  console.log('To clear mock auth, run: clearMockAuth() in the browser console');
}

clearMockAuth();