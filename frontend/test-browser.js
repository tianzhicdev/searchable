const puppeteer = require('puppeteer');

async function testMockMode() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.text().includes('[MOCK') || msg.text().includes('[BACKEND]')) {
      console.log('CONSOLE:', msg.text());
    }
  });
  
  try {
    console.log('Navigating to http://localhost:3000/searchables');
    await page.goto('http://localhost:3000/searchables', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Wait a bit for any async operations
    await page.waitForTimeout(3000);
    
    // Check if mock mode indicator is present
    const mockIndicator = await page.$('.mock-mode-indicator');
    console.log('Mock mode indicator found:', !!mockIndicator);
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testMockMode().catch(console.error);