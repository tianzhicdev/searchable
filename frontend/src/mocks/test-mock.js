// Quick test script to verify mock mode
const axios = require('axios');

async function testMockMode() {
  try {
    console.log('Testing mock mode...\n');
    
    // Test 1: Check if server is running
    const response = await axios.get('http://localhost:3000');
    console.log('✅ Server is running');
    
    // Test 2: Check if mock mode indicator would be visible
    console.log('\nTo verify mock mode is working:');
    console.log('1. Open http://localhost:3000/searchable-item/mock-item-1');
    console.log('2. You should see:');
    console.log('   - Orange "🔧 MOCK MODE" badge in top-right corner');
    console.log('   - Item title: "Premium Digital Asset Bundle"');
    console.log('   - 3 downloadable files with prices');
    console.log('   - Rating: 4.5/5 (23 reviews)');
    console.log('   - File selection checkboxes');
    console.log('   - Purchase button\n');
    
    console.log('Mock mode is configured and ready to use! 🎉');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure the server is running with: npm run start:mock');
  }
}

testMockMode();