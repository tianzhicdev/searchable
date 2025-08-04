const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');
const RANDOM_SUFFIX = Math.floor(Math.random() * 10000);                 
const buyer_email = `testuser${RANDOM_SUFFIX}@gmail.com`;          
const password = `testuser${RANDOM_SUFFIX}`;                          
const addBalanceAmount = "20";  
const userInfoPath = path.join(__dirname, 'store_user_info.json');
let username = '';
let storeName = '';

try {
    const data = fs.readFileSync(userInfoPath, 'utf-8');
    const parsedData = JSON.parse(data);
    username = parsedData.username;
    storeName = parsedData.storeName;
    console.log(`📦 Seller info loaded: username = ${username}, storeName = ${storeName}`);
} catch (error) {
    console.error('❌ Failed to read seller info JSON:', error.message);
    process.exit(1); // Exit early if seller data isn't available
}

//const product_url = "https://silkroadonlightning.com/landing";
const product_url = "http://localhost/landing"; // For local testing

async function givePage() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    return { browser, page };
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function buyerOnboardingAsGuest(page) {
    await page.goto(product_url);
    await delay(2000);
    console.log('✅ Page loaded');

    // Step 1: Warp to the future
    console.log('🔮 Clicking "Warp to the future"...');
    const warpSuccess = await smart_click_with_pause(page, "button[class*='MuiButton-contained'][class*='MuiButton-containedPrimary']", 2000);
    if (!warpSuccess) {
        console.log('⚠️ Trying alternative warp button selector...');
        await smart_click_with_pause(page, "button[class*='MuiButton-root'][class*='MuiButton-contained']", 2000);
    }
    console.log('✅ Warp to the future done');

    // Step 2: Click "I want to earn" (Storefront icon)
    console.log('💰 Clicking "I want to shop"...');
    const earnSuccess = await smart_click_with_pause(page, "svg[data-testid='ShoppingCartIcon']", 2000);
    if (!earnSuccess) {
        await smart_click_with_pause(page, "button:has(svg[data-testid='ShoppingCartIcon'])", 2000);
    }
    console.log("✅ 'I want to shop' clicked");

    //Step 3: Visit As Guest
    await page.waitForSelector("button.MuiButton-root");
    const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button.MuiButton-root"));
        for (const btn of buttons) {
        if (btn.innerText.trim().toUpperCase() === "VISIT AS GUEST") {
            btn.click();
            return true;
        }
    }
    return false;
    });
    
    await delay(1000);
    console.log("✅ 'View As Guest' clicked");

}

async function buyerResgisterAsUser(page) {
    await smart_click_by_text(page, "Click here to register", 2000);
    console.log("✅ 'Guest register to a User' clicked");
    //Create Account
    await smart_type_with_pause(page, "input[name='newPassword']", password, 1000);
    await smart_click_with_pause(page, "svg[data-testid='VisibilityIcon']", 1000);

    await smart_type_with_pause(page, "input[name='confirmPassword']", password, 1000);
    await smart_click_with_pause(page, "svg[data-testid='VisibilityIcon']", 1000);

    await smart_click_by_text(page, "Complete Registration", 3000);
    console.log("✅ 'Guest converted into a user' clicked");

}

async function addBalance(page) {
    await smart_click_with_pause(page, "button[id='button-floating-bottom-bar-account']", 2000);
    await smart_click_with_pause(page, "li[id='menuitem-floating-bottom-bar-account-refill-with-credit-card']", 2000);
    console.log("✅ 'Add balance' process started");

    await page.focus("div[class='MuiOutlinedInput-root MuiInputBase-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-1nggkca-MuiInputBase-root-MuiOutlinedInput-root']");
    await page.click("div[class='MuiOutlinedInput-root MuiInputBase-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-1nggkca-MuiInputBase-root-MuiOutlinedInput-root']", { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await smart_type_with_pause(page, "div[class='MuiOutlinedInput-root MuiInputBase-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-1nggkca-MuiInputBase-root-MuiOutlinedInput-root']", addBalanceAmount, 1000);
   //await smart_type_with_pause(page, "div[class='MuiOutlinedInput-root MuiInputBase-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl css-1nggkca-MuiInputBase-root-MuiOutlinedInput-root']", "25", 1000);

    console.log('✅ Price set successfully');

    await smart_click_with_pause(page, "button[class='MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeLarge MuiButton-containedSizeLarge MuiButton-fullWidth MuiButtonBase-root css-23erxl-MuiButtonBase-root-MuiButton-root']", 3000);
    console.log("✅ 'Open stripe form inititated'");

    await payWithStripe(page);

    console.log("✅ 'Add balance' process completed");
    await smart_click_with_pause(page, "button[data-testid='button-nav-back']", 2500);
}

async function payWithStripe(page) {
    console.log('💳 Processing payment with email:', buyer_email);
    
    try {
        // Fill email field - use the same email from signup for consistency
        await smart_type_with_pause(page, "input[id='email']", buyer_email, 1000);
        
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

// Function to search for the store or product created by the seller
async function searchAndOpenStore(page) {
    console.log(`🔍 Searching for seller store: ${username}`);

    // Already uses username and storeName
    await page.type("input[placeholder='Search by username...']", username, { delay: 100 });

    await page.keyboard.press('Enter');
    //await smart_click_by_text(page, "h3[class='${username}']", 2000);
    const selector = `h3`;
    await page.waitForSelector(selector, { timeout: 10000 });

    const clicked = await page.evaluate((username) => {
        const elements = Array.from(document.querySelectorAll("h3"));
        for (const el of elements) {
            if (el.textContent.trim().toLowerCase().includes(username.toLowerCase())) {
                el.click();
                return true;
            }
        }
        return false;
    }, username);

    console.log(`🔍 Searching for product available in the store: ${storeName}`);
    //await smart_click_by_text(page, storeName, 2000);
    const selectorProduct = `h3`;
    await page.waitForSelector(selectorProduct, { timeout: 10000 });

    const clickedProduct = await page.evaluate((storeName) => {
        const elements = Array.from(document.querySelectorAll("h3"));
        for (const el of elements) {
            if (el.textContent.trim().toLowerCase().includes(storeName.toLowerCase())) {
                el.click();
                return true;
            }
        }
        return false;
    }, storeName);

    //Select item/s after selecting product/s
    await smart_click_with_pause(page, "div[class='MuiBox-root css-nb2z2f']", 1000);
    console.log('✅ Item/s selected from Product.');

    // Click the payment button
    await smart_click_with_pause(page, "button[data-testid='button-pay-stripe']", 4000);
    console.log('✅ Pay With Stripe clicked.');

    await payWithStripe(page);
    console.log('✅ Payment completed successfully.');

    // Download the file after payment
    console.log('✅ File download initiated.');
    await smart_click_with_pause(page, "button[class='MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButtonBase-root css-hkny9w-MuiButtonBase-root-MuiButton-root']", 2000);
    console.log('✅ File download completed.');
}

async function smart_click_with_pause(page, selector, pause) {
    try {
        await page.waitForSelector(selector, { timeout: 10000 });
        
        const elementExists = await page.evaluate((s) => {
            const element = document.querySelector(s);
            if (!element) return false;
            
            if (typeof element.click === 'function') {
                element.click();
                return true;
            }
            
            const clickableParent = element.closest('button, a, [onclick], [role="button"]');
            if (clickableParent && typeof clickableParent.click === 'function') {
                clickableParent.click();
                return true;
            }
            
            return false;
        }, selector);
        
        if (elementExists) {
            await delay(pause);
            return true;
        } else {
            console.warn(`⚠️ Element not clickable: ${selector}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Click failed for ${selector}:`, error.message);
        return false;
    }
}

async function smart_type_with_pause(page, selector, text, pause) {
    try {
        await page.waitForSelector(selector, { timeout: 10000 });
        await smart_click_with_pause(page, selector, 500);
        
        await page.evaluate(s => {
            const element = document.querySelector(s);
            if (element) element.value = '';
        }, selector);
        
        await page.type(selector, text);
        await delay(pause);
        return true;
    } catch (error) {
        console.error(`❌ Type failed for ${selector}:`, error.message);
        return false;
    }
}

async function smart_click_by_text(page, text, pause = 2000) {
    try {
        const clicked = await page.evaluate((buttonText) => {
            const elements = Array.from(document.querySelectorAll('button, a, [onclick], [role="button"]'));
            
            for (const element of elements) {
                if (element.textContent.trim().toLowerCase().includes(buttonText.toLowerCase())) {
                    element.click();
                    return true;
                }
            }
            return false;
        }, text);
        
        if (clicked) {
            await delay(pause);
            return true;
        }
        return false;
        
    } catch (error) {
        console.error(`❌ Click by text failed for "${text}":`, error.message);
        return false;
    }
 }

 async function automate() {
    const { browser, page } = await givePage();
    await buyerOnboardingAsGuest(page);
    await buyerResgisterAsUser(page);
    await addBalance(page);
    await searchAndOpenStore(page);
}

automate();