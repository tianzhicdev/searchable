// Simple check to see if mock mode environment is working
console.log('Environment check:');
console.log('REACT_APP_MOCK_MODE:', process.env.REACT_APP_MOCK_MODE);

// Check if we can require the mock backend
try {
  const mockBackend = require('./src/mocks/mockBackend');
  console.log('Mock backend loaded successfully');
  console.log('Mock backend has methods:', Object.keys(mockBackend.default));
} catch (error) {
  console.log('Error loading mock backend:', error.message);
}

// Check config
try {
  const config = require('./src/config');
  console.log('Config loaded, API_SERVER:', config.default.API_SERVER);
} catch (error) {
  console.log('Error loading config:', error.message);
}