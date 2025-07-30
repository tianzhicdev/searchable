const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const product_url = "https://silkroadonlightning.com/landing";
const summaryLog = [];

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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function givePage() {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();
    return { browser, page };
}

async function smart_click_with_pause(page, selector, pause) {
    await page.waitForSelector(selector, { visible: true, timeout: 10000 });
    await page.evaluate((s) => document.querySelector(s).click(), selector);
    await delay(pause);
}

async function smart_type_with_pause(page, selector, text, pause) {
    await page.waitForSelector(selector, { visible: true, timeout: 10000 });
    await page.click(selector);
    
    // Clear field first
    await page.evaluate((s) => {
        const element = document.querySelector(s);
        element.value = '';
        element.focus();
    }, selector);
    
    await page.type(selector, text);
    await delay(pause);
}

// New function to create account with dynamic credentials
async function createAccount(page, credentials) {
    console.log('🆕 Creating new account with:', credentials);
    
    await page.goto(product_url);
    await delay(1500);
    
    // Click "I'm back" button
    await smart_click_with_pause(page, "button[class*='MuiLink-button']", 1000);
    
    // Navigate to account creation
    await smart_click_with_pause(page, "a[id='link-login-register']", 1000);
    console.log('✅ Account Creation Page loaded');
    
    // Fill signup form
    await smart_type_with_pause(page, "input[id='input-rest-register-email-field']", credentials.email, 500);
    await smart_type_with_pause(page, "input[id='input-rest-register-username-field']", credentials.username, 500);
    await smart_type_with_pause(page, "input[id='input-rest-register-password-field']", credentials.password, 500);
    
    // Toggle password visibility (optional)
    try {
        await smart_click_with_pause(page, "button[id='button-rest-register-password-visibility-toggle']", 500);
    } catch (error) {
        console.log('⚠️ Password visibility toggle not found, continuing...');
    }
    
    // Click Sign Up button
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(btn => btn.textContent.trim().toUpperCase() === 'SIGN UP');
        if (target) target.click();
    });
    
    console.log('✅ Account created with email:', credentials.email);
    await delay(2000);
}

async function login(page, credentials) {
    console.log('🔐 Logging in with:', credentials.email);
    
    // Fill login form
    await smart_type_with_pause(page, "input[id='input-rest-login-email-field']", credentials.email, 1000);
    await smart_type_with_pause(page, "input[id='input-rest-login-password-field']", credentials.password, 1000);
    await smart_click_with_pause(page, "button[id='button-rest-login-submit']", 2000);
    
    console.log('✅ Logged in successfully with:', credentials.email);
}

async function selectProductByTitle(page, titleText) {
    try {
        await smart_click_with_pause(page, "hr[class*='MuiDivider-root']", 1000);
        await page.waitForSelector("div.MuiPaper-root", { visible: true, timeout: 10000 });

        const productCards = await page.$$('div.MuiPaper-root.MuiPaper-elevation1');
        for (const card of productCards) {
            const textContent = await card.evaluate(el => el.textContent);
            if (textContent.toLowerCase().includes(titleText.toLowerCase())) {
                await card.click();
                console.log(`✅ Clicked on product: ${titleText}`);
                await delay(1500);
                return true;
            }
        }
        console.warn(`❌ Product not found: ${titleText}`);
        return false;
    } catch (error) {
        console.error(`❌ Error selecting product ${titleText}:`, error.message);
        return false;
    }
}

async function selectItemsInProduct(page) {
    try {
        await smart_click_with_pause(page, "div[class*='css-nb2z2f']", 1000);
        console.log("✅ Selected item inside store");
        await smart_click_with_pause(page, "button[data-testid='button-pay-stripe']", 4000);
        console.log("✅ Pay With Stripe clicked.");
        return true;
    } catch (err) {
        console.error("❌ Failed to click item or pay:", err.message);
        return false;
    }
}

async function payWithStripe(page, productName, userEmail) {
    try {
        // Check if already purchased
        const isAlreadyPurchased = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("button"))
                .some(btn => btn.innerText.trim().toLowerCase() === 'download');
        });

        if (isAlreadyPurchased) {
            console.log(`✅ Already purchased: ${productName}`);
            return false;
        }

        console.log(`💳 Processing payment for ${productName} with email:`, userEmail);

        // Fill email field with the user's email
        await smart_type_with_pause(page, "input[id='email']", userEmail, 1000);
        
        // Click accordion to expand payment details
        try {
            await page.waitForSelector("div[class='AccordionItemHeader-content']", { timeout: 5000 });
            await page.click("div[class='AccordionItemHeader-content']");
            await delay(1000);
        } catch (error) {
            console.log('⚠️ Accordion not found, trying alternative selector...');
            try {
                await smart_click_with_pause(page, "button[data-testid='card-accordion-item-button']", 1000);
            } catch (altError) {
                console.log('⚠️ Alternative accordion selector also failed, continuing...');
            }
        }
        
        // Fill card details
        await smart_type_with_pause(page, "input[id='cardNumber']", '4242424242424242', 1000);
        await smart_type_with_pause(page, "input[id='cardExpiry']", '0329', 1000);
        await smart_type_with_pause(page, "input[id='cardCvc']", '321', 1000);
        await smart_type_with_pause(page, "input[id='billingName']", 'Sajan Singh Shergill', 1000);
        await smart_type_with_pause(page, "input[id='billingPostalCode']", '07306', 1000);

        // Enable Stripe Pass (optional)
        try {
            const stripePass = await page.$("input[id='enableStripePass']");
            if (stripePass) {
                await stripePass.click();
                await delay(1000);
            }
        } catch (error) {
            console.log('⚠️ Stripe Pass checkbox not found, continuing...');
        }

        // Submit payment
        await smart_click_with_pause(page, "button[class*='SubmitButton']", 2000);
        console.log(`✅ Payment submitted for ${productName}`);

        return true;
    } catch (err) {
        console.error(`❌ Error in payWithStripe for ${productName}:`, err.message);
        return false;
    }
}

async function selectBackFromProduct(page) {
    try {
        // Multiple possible selectors for back button
        const backSelectors = [
            "button[class*='MuiButton-textPrimary']",
            "button:has-text('Back')",
            "button[aria-label*='back']",
            "a[href*='dashboard']"
        ];
        
        for (const selector of backSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                await smart_click_with_pause(page, selector, 1000);
                console.log("↩️ Returned to product list");
                return;
            } catch (error) {
                continue;
            }
        }
        
        console.warn("⚠️ Could not find back button, trying browser back...");
        await page.goBack();
        await delay(2000);
        
    } catch (err) {
        console.warn("⚠️ Could not return to product list:", err.message);
    }
}

async function automate() {
    // Generate fresh credentials for this session
    const dynamicCredentials = generateSignupCredentials();
    console.log('🎯 Generated new session credentials:', dynamicCredentials);
    
    const { browser, page } = await givePage();
    const productsToBuy = ["download test 1", "the second store"];

    try {
        // Create account and login with dynamic credentials
        await createAccount(page, dynamicCredentials);
        await login(page, dynamicCredentials);

        // Process each product
        for (const product of productsToBuy) {
            console.log(`\n🛍️ Processing product: ${product}`);
            
            const found = await selectProductByTitle(page, product);
            if (found) {
                const itemSelected = await selectItemsInProduct(page);
                if (itemSelected) {
                    const paid = await payWithStripe(page, product, dynamicCredentials.email);
                    summaryLog.push({ 
                        name: product, 
                        status: paid ? 'Payment Submitted' : 'Already Purchased',
                        email: dynamicCredentials.email
                    });
                } else {
                    summaryLog.push({ 
                        name: product, 
                        status: 'Item Selection Failed',
                        email: dynamicCredentials.email
                    });
                }
                await selectBackFromProduct(page);
            } else {
                summaryLog.push({ 
                    name: product, 
                    status: 'Product Not Found',
                    email: dynamicCredentials.email
                });
            }
            
            // Small delay between products
            await delay(2000);
        }

        console.log('\n📦 Purchase Summary:');
        console.log('=' .repeat(60));
        console.log(`Session Email: ${dynamicCredentials.email}`);
        console.log('=' .repeat(60));
        console.table(summaryLog);
        
        console.log('\n✅ Multi-product automation completed successfully!');

    } catch (error) {
        console.error('❌ Automation failed:', error);
        
        // Take screenshot for debugging
        try {
            await page.screenshot({ path: 'automation_error.png', fullPage: true });
            console.log('📸 Error screenshot saved as automation_error.png');
        } catch (screenshotError) {
            console.log('Could not take screenshot');
        }
    } finally {
        await delay(3000); // Wait to see results
        await browser.close();
    }
}

automate();