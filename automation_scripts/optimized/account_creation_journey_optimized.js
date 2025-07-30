const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const product_url = "https://silkroadonlightning.com/landing";

// Email generation functions
function generateRandomString(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateRandomEmail(domain = 'testingautomation.com') {
    const timestamp = Date.now();
    const randomString = generateRandomString(6);
    return `test_${randomString}_${timestamp}@${domain}`;
}

function generateRandomUsername() {
    const timestamp = Date.now();
    const randomString = generateRandomString(4);
    return `user_${randomString}_${timestamp}`;
}

// Generate dynamic credentials at runtime
function generateSignupCredentials() {
    return {
        email: generateRandomEmail(),
        username: generateRandomUsername(),
        password: 'password@1'
    };
}

async function givePage() {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();
    return { browser, page };
}

async function run() {
    // Generate fresh credentials each time the script runs
    const signupCredentials = generateSignupCredentials();
    console.log('🎯 Generated new credentials:', signupCredentials);
    
    const { browser, page } = await givePage();
    try {
        await createAccount(page);
        await signUpForm(page, signupCredentials);
        await loginAfterSignup(page, signupCredentials);
        await selectProductFromTitle(page, 'download test 1');
        await selectItemsInProduct(page);
        await payWithStripe(page, signupCredentials.email); // Pass email to payment
        console.log('✅ Script completed successfully!');
    } catch (error) {
        console.error('❌ An error occurred:', error);
        
        // Take screenshot for debugging
        try {
            await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
            console.log('📸 Error screenshot saved as error_screenshot.png');
        } catch (screenshotError) {
            console.log('Could not take screenshot');
        }
    } finally {
        await delay(3000); // Wait to see results
        await browser.close(); // Ensure the browser closes
    }
}

async function createAccount(page) {
    await page.goto(product_url);
    await delay(1500);
    console.log('✅ Landing Page loaded');
  
    //I'm back
    await smart_click_with_pause(page, "button[class='MuiTypography-root MuiTypography-body2 MuiLink-root MuiLink-underlineAlways MuiLink-button css-hpy1oi-MuiTypography-root-MuiLink-root']", 1000);

    // Navigate to account creation
    await smart_click_with_pause(page, "a[id='link-login-register']", 1000);
    console.log('✅ Account Creation Page loaded');
}

async function signUpForm(page, credentials) {
    console.log('📝 Filling signup form with:', credentials);
    
    const fields = [
        { selector: "input[id='input-rest-register-email-field']", value: credentials.email },
        { selector: "input[id='input-rest-register-username-field']", value: credentials.username },
        { selector: "input[id='input-rest-register-password-field']", value: credentials.password }
    ];

    for (const field of fields) {
        if (field.value) { // Ensure value is defined
            await smart_type_with_pause(page, field.selector, field.value, 500);
        }
    }

    await smart_click_with_pause(page, "button[id='button-rest-register-password-visibility-toggle']", 500);

    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(btn => btn.textContent.trim().toUpperCase() === 'SIGN UP');
        if (target) target.click();
    });
    console.log('✅ Account Created with email:', credentials.email);
}

async function loginAfterSignup(page, credentials) {
    console.log('🔐 Logging in with:', credentials.email);
    
    const loginFields = [
        { selector: "input[id='input-rest-login-email-field']", value: credentials.email },
        { selector: "input[id='input-rest-login-password-field']", value: credentials.password }
    ];

    for (const field of loginFields) {
        await smart_click_with_pause(page, field.selector, 500);
        await smart_type_with_pause(page, field.selector, field.value, 500);
    }

    await smart_click_with_pause(page, "button[id='button-rest-login-submit']", 2000);
    console.log('✅ Logged in after Signup');
}

async function selectProductFromTitle(page, titleText) {
    // Navigate to product selection - selectProduct from Dashboard
    await smart_click_with_pause(page, "hr[class='MuiDivider-root MuiDivider-fullWidth css-15lqyj6-MuiDivider-root']", 1000);
    console.log('✅ Product Selection from Dashboard done.');

    // Wait for product cards to load
    await page.waitForSelector("div.MuiPaper-root");
  
    const productCards = await page.$$('div.MuiPaper-root.MuiPaper-elevation1');
  
    for (const card of productCards) {
        const textContent = await card.evaluate(el => el.textContent);
        
        if (textContent.toLowerCase().includes(titleText.toLowerCase())) {
            await card.click();
            console.log(`✅ Clicked sub-product: ${titleText}`);
            await delay(1500);
            return;
        }
    }
  
    console.error(`❌ Sub-Product with title "${titleText}" not found`);
}

async function selectItemsInProduct(page) {
    //Select item/s after selecting product/s
    await smart_click_with_pause(page, "div[class='MuiBox-root css-nb2z2f']", 1000);
    console.log('✅ Item/s selected from Product.');

    // Click the payment button
    await smart_click_with_pause(page, "button[data-testid='button-pay-stripe']", 4000);
    console.log('✅ Pay With Stripe clicked.');
}

async function payWithStripe(page, userEmail) {
    console.log('💳 Processing payment with email:', userEmail);
    
    try {
        // Fill email field - use the same email from signup for consistency
        await smart_type_with_pause(page, "input[id='email']", userEmail, 1000);
        
        // Click accordion to expand payment details
        await smart_click_with_pause(page, "button[data-testid='card-accordion-item-button']", 1000);
        
        // Fill card details
        await smart_type_with_pause(page, "input[id='cardNumber']", '4242424242424242', 1000);
        await smart_type_with_pause(page, "input[id='cardExpiry']", '0329', 1000);
        await smart_type_with_pause(page, "input[id='cardCvc']", '321', 1000);
        
        // Fill billing information
        await smart_type_with_pause(page, "input[id='billingName']", 'Sajan Singh Shergill', 1000);
        await smart_type_with_pause(page, "input[id='billingPostalCode']", '07306', 1000);
        
        // Enable Stripe Pass (optional)
        try {
            await smart_click_with_pause(page, "input[id='enableStripePass']", 2000);
        } catch (error) {
            console.log('⚠️ Stripe Pass checkbox not found, continuing...');
        }
        
        // Submit payment
        await smart_click_with_pause(page, "button[class='SubmitButton SubmitButton--complete']", 1000);
        console.log('✅ Payment With Stripe completed.');
        
    } catch (error) {
        console.error('❌ Payment failed:', error.message);
        throw error;
    }
}

//Helper Functions
async function smart_click_with_pause(page, selector, pause) {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.evaluate((s) => document.querySelector(s).click(), selector);
    await delay(pause);
}

async function smart_type_with_pause(page, selector, text, pause) {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector);
    
    // Clear field first (in case there's existing text)
    await page.evaluate((s) => {
        const element = document.querySelector(s);
        element.value = '';
        element.focus();
    }, selector);
    
    await page.type(selector, text);
    await delay(pause);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

run();