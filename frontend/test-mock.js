const axios = require('axios');

// Test if mock endpoints work
async function testMockMode() {
  try {
    // Test the specific endpoint that was failing
    const response = await axios.get('http://localhost:3000/api/v1/searchable/search', {
      params: {
        page: 1,
        page_size: 10,
        q: '',
        filters: '{}'
      }
    });
    
    console.log('Mock API Response:', response.data);
  } catch (error) {
    console.log('Error:', error.message);
    console.log('This is expected if the frontend app doesn\'t serve API routes directly');
  }
}

testMockMode();