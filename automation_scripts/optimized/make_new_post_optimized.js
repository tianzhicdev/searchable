const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');

puppeteer.use(StealthPlugin());

// Configuration
const CONFIG = {
    //url: "https://silkroadonlightning.com/landing",
    url: "http://localhost/landing", // Use localhost for local testing
    credentials: {
        email: 'testuser5404@gmail.com',
        password: 'testUser5404'
    },
    files: {
        image: 'automation_scripts/optimized/maxresdefault.jpg',
        download: 'automation_scripts/optimized/file3.txt'
    }
};

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function click(page, selector, timeout = 10000) {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    await delay(1000);
}

async function type(page, selector, text, timeout = 10000) {
    await page.waitForSelector(selector, { timeout });
    await page.type(selector, text);
    await delay(500);
}

async function initBrowser() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    return { browser, page };
}

// Main functions
async function navigateAndLogin(page) {
    await page.goto(CONFIG.url);
    await delay(1500);
    
    // Click "I'm back" button
    await click(page, "button[class*='MuiTypography-root'][class*='MuiLink-button']");
    
    // Login
    await type(page, "input[id='input-rest-login-email-field']", CONFIG.credentials.email);
    await type(page, "input[id='input-rest-login-password-field']", CONFIG.credentials.password);
    await click(page, "button[id='button-rest-login-submit']");
}

async function createNewListing(page) {
    await click(page, "button[id='button-floating-bottom-bar-create']");
}

async function fillBasicInfo(page) {
    await type(page, "input[id='title']", 'Ambient Musics');
    await type(page, "textarea[id='description']", 'Ambient Music listing created using Automation Testing');
}

async function selectTags(page) {
    // Click tags dropdown
    await click(page, "p[class*='MuiTypography-root'][class*='css-2zsgom']");
    
    // Wait for options and select tags
    await page.waitForSelector("ul[role='listbox']");
    
    const tags = ["art", "assets", "coaching"];
    for (const tag of tags) {
        const options = await page.$$("li[role='option']");
        for (const option of options) {
            const text = await option.evaluate(el => el.textContent.toLowerCase());
            if (text.includes(tag)) {
                await option.click();
                await delay(500);
                break;
            }
        }
    }
    
    // Close dropdown
    await page.keyboard.press('Escape');
    await delay(500);
}

async function uploadMainImage(page) {
    // Make file input visible
    await page.evaluate(() => {
        const input = document.querySelector("input[type='file']");
        if (input) {
            input.style.display = 'block';
            input.style.opacity = '1';
            input.style.position = 'static';
        }
    });
    
    const fileInput = await page.$("input[type='file']");
    await fileInput.uploadFile(CONFIG.files.image);
    console.log('✅ Main image uploaded');
}

async function setupDigitalDownload(page) {
    // Enable digital downloads
    await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const digitalLabel = labels.find(label => label.textContent.includes('Digital Downloads'));
        if (digitalLabel) digitalLabel.click();
    });
    
    await delay(1000);
    
    // Upload download file
    const downloadInput = await page.$("label#button-publish-allinone-downloadable-upload input[type='file']");
    await downloadInput.uploadFile(CONFIG.files.download);
    console.log('✅ Download file uploaded');
    
    await delay(2000);
    
    // Fill download details
    await type(page, "textarea[id='input-publish-allinone-file-description']", 'Ambient Music available as Digital Download');
    await type(page, "input[id='input-publish-allinone-file-price']", '4.99');
    
    // Add file
    await click(page, "button[id='button-publish-allinone-file-add']");
    await delay(3000);
}

async function publishListing(page) {
    await click(page, "button[type='submit']");
    console.log('🚀 Listing published');
    await delay(3000);
}

// Main execution
async function createListing() {
    const { browser, page } = await initBrowser();
    
    try {
        console.log('🚀 Starting listing creation...');
        
        await navigateAndLogin(page);
        await createNewListing(page);
        await fillBasicInfo(page);
        await selectTags(page);
        await uploadMainImage(page);
        await setupDigitalDownload(page);
        await publishListing(page);
        
        console.log('✅ Listing created successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await page.screenshot({ path: 'error.png' });
    } finally {
        await delay(2000);
        await browser.close();
    }
}

// Run the script
createListing();