const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
puppeteer.use(StealthPlugin());

const globals = require('/Users/sajanshergill/Desktop/searchable/sharedGlobals.js');
const { filePath, username, email, password, storeName, productPrice } = globals;

const product_url = "https://silkroadonlightning.com/landing";

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

async function onboarding(page) {
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
    console.log('💰 Clicking "I want to earn"...');
    const earnSuccess = await smart_click_with_pause(page, "svg[data-testid='StorefrontIcon']", 2000);
    if (!earnSuccess) {
        await smart_click_with_pause(page, "button:has(svg[data-testid='StorefrontIcon'])", 2000);
    }
    console.log("✅ 'I want to earn' clicked");

    // Step 3: Click "Sell my Digital Content"
    console.log('📁 Clicking "Sell my Digital Content"...');
    const digitalSuccess = await smart_click_with_pause(page, "svg[data-testid='CloudDownloadIcon']", 2000);
    if (!digitalSuccess) {
        await smart_click_with_pause(page, "button:has(svg[data-testid='CloudDownloadIcon'])", 2000);
    }
    console.log("✅ 'Sell my Digital Content' clicked");

    // Step 4: Upload file
    console.log('📤 Uploading file...');
    await uploadFile(page, filePath);
    
    // Step 5: Click NEXT button
    console.log('▶️ Clicking NEXT button...');
    const nextSuccess = await smart_click_with_pause(page, "button.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeLarge.MuiButton-containedSizeLarge.MuiButton-fullWidth", 2000);
    if (!nextSuccess) {
        await smart_click_with_pause(page, "button.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeLarge.MuiButton-containedSizeLarge.MuiButton-fullWidth", 2000);
    }
    console.log("✅ File added as Digital content");
    await delay(4000);

    await smart_click_by_text(page, "NEXT", 1000);

    await smart_type_with_pause(page, "input[class='MuiOutlinedInput-input MuiInputBase-input css-1uf0eps-MuiInputBase-input-MuiOutlinedInput-input']", storeName, 1000);
    
    // Product Price
    await page.focus("input[class='MuiOutlinedInput-input MuiInputBase-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1a5vdbo-MuiInputBase-input-MuiOutlinedInput-input']");
    await page.click("input[class='MuiOutlinedInput-input MuiInputBase-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1a5vdbo-MuiInputBase-input-MuiOutlinedInput-input']", { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await smart_type_with_pause(page, "fieldset[class='MuiOutlinedInput-notchedOutline css-ndgkh8-MuiOutlinedInput-notchedOutline']", productPrice, 1000);
    console.log('✅ Price set successfully');

    await smart_click_by_text(page, "NEXT", 2000);

    //Create Account
    await smart_type_with_pause(page, "input[id='input-onboarding-auth-username-field']", username, 1000);
    await smart_type_with_pause(page, "input[id='input-onboarding-auth-email-field']", email, 1000);
    await smart_type_with_pause(page, "input[id='input-onboarding-auth-password-field']", password, 1000);
    await smart_click_by_text(page, "OPEN MY STORE", 5000);

    await smart_click_with_pause(page, "span[class='MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root']", 1000);
}

async function uploadFile(page, filePath) {
    try {
        await page.waitForSelector("input[type='file']", { timeout: 10000 });
        
        await page.evaluate(() => {
            const inputs = document.querySelectorAll("input[type='file']");
            inputs.forEach(input => {
                input.style.display = 'block';
                input.style.visibility = 'visible';
                input.style.opacity = '1';
                input.style.position = 'static';
                input.style.zIndex = '9999';
            });
        });
        
        const fileInputHandle = await page.$("input[type='file']");
        if (fileInputHandle) {
            await fileInputHandle.uploadFile(filePath);
            console.log('✅ File uploaded successfully');
            return true;
        } else {
            console.error('❌ File input not found');
            return false;
        }
    } catch (error) {
        console.error('❌ File upload failed:', error.message);
        return false;
    }
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
    
    try {
        await onboarding(page);
        console.log('🎉 Onboarding completed!');
    } catch (error) {
        console.error('❌ Onboarding failed:', error.message);
        await page.screenshot({ path: 'onboarding_error.png', fullPage: true });
        console.log('📸 Error screenshot saved as onboarding_error.png');
    } finally {
        console.log('🔍 Browser kept open for inspection. Close manually when done.');
    }
}

automate();