// Quick test script to verify mock mode
const axios = require('axios');

async function testMockMode() {
  try {

    // Test 1: Check if server is running
    const response = await axios.get('http://localhost:3000');

    // Test 2: Check if mock mode indicator would be visible

    ');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
  }
}

testMockMode();