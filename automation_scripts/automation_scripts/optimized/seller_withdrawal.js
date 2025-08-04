const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

//const product_url = "https://silkroadonlightning.com/landing";
const product_url = "http://localhost/landing"; // For local testing

const withdrawalWalletAddress = "0x2a9f6e28Ee3501C32c65937170B44a72A71baB62";

const userInfoPath = path.join(__dirname, 'store_user_info.json');
//let username = '';
let email = '';
let password = '';
//let productPrice = 4;

try {
    const data = fs.readFileSync(userInfoPath, 'utf-8');
    const parsed = JSON.parse(data);
    email = parsed.email;
    password = parsed.password;
    console.log(`✅ Loaded seller info: ${email}`);
} catch (e) {
    console.error('❌ Failed to read seller info:', e.message);
    process.exit(1);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function givePage() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    return { browser, page };
}

async function loginAsSeller(page) {
    await page.goto(product_url);
    await delay(2000);
    await smart_click_by_text(page, "I'm back", 2000);
    //await smart_click_with_pause(page, "svg[data-testid='AccountCircleIcon']", 2000);

    await smart_type_with_pause(page, "input[id='input-rest-login-email-field']", email, 1000);
    await smart_type_with_pause(page, "input[id='input-rest-login-password-field']", password, 1000);

    await smart_click_by_text(page, "Sign In", 3000);
    console.log("✅ Logged in successfully.");
}

async function verifyBalance(page) {
    console.log('💰 Navigating to account section...');
    await smart_click_with_pause(page, "button[id='button-floating-bottom-bar-account']", 2000);    await smart_click_with_pause(page, "li[id='menuitem-floating-bottom-bar-account-edit-profile']", 2000);
    
    const randomText = `This is a random bio generated at ${new Date().toLocaleString()}.
    It has multiple lines to test text area input.
    Hope you like it!`;

    await smart_type_with_pause(page, "textarea[name='introduction']", randomText, 2000);
    await smart_click_with_pause(page, "button[id='button-edit-profile-save']", 2000);
    console.log('✅ Profile bio updated with random text.');
    await smart_click_with_pause(page, "button[data-testid='button-nav-back']", 2500);


    const balanceAmount = await page.evaluate(() => {
        const h4s = Array.from(document.querySelectorAll("h4"));
        for (const h4 of h4s) {
            if (h4.innerText.includes("USD") && h4.innerText.includes("$")) {
                const span = h4.querySelector("span");
                if (span) {
                    const value = span.textContent.replace(/[^0-9.]/g, '');
                    return parseFloat(value);
                }
            }
        }
        return null;
    });

    if (balanceAmount !== null && !isNaN(balanceAmount)) {
        console.log(`💰 Seller balance: $${balanceAmount.toFixed(2)}`);

        if (balanceAmount >= 4.9) {
            console.log('✅ Balance is sufficient for withdrawal.');
        } else {
            console.warn('⚠️ Balance is less than expected.');
        }
    } else {
        console.error('❌ Failed to extract balance amount.');
    }
}

async function initiateWithdrawal(page) {
    await smart_click_with_pause(page, "li[id='menuitem-floating-bottom-bar-account-withdraw-usdt']", 2000);
    console.log('🏦 Navigated to withdrawal screen');

    await smart_type_with_pause(page, "textarea[id='usdt-address']", withdrawalWalletAddress, 1000);
    await smart_type_with_pause(page, "input[id='usdt-amount']", "4", 1000);
    await smart_click_by_text(page, "Withdraw USDT", 3000);
    console.log(`🚀 Withdrawal initiated to ${withdrawalWalletAddress}`);
}

async function verifyWithdrawalStatus(page) {
    console.log('⏳ Waiting 3 minutes for withdrawal confirmation...');
    
    await smart_click_with_pause(page, "span[class='MuiButton-endIcon MuiButton-iconSizeMedium css-1gnd1fd-MuiButton-endIcon']", 2000);
    await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll("li.MuiMenuItem-root"));
        const withdrawalItem = items.find(el => el.innerText.trim().toLowerCase().includes("withdrawals"));
        if (withdrawalItem) withdrawalItem.click();
    });
    await delay(2000);    

    // const statusText = await page.evaluate(() => {
    //     const el = document.querySelector("span.status"); // Replace with correct selector
    //     return el ? el.innerText.trim() : null;
    // });
    await delay(180000);


    // if (statusText?.toLowerCase() === "complete") {
    //     console.log("✅ Withdrawal status: COMPLETE");
    // } else {
    //     console.warn(`⚠️ Withdrawal status not complete: ${statusText}`);
    // }
}

// Reuse helper functions
async function smart_click_with_pause(page, selector, pause) {
    try {
        await page.waitForSelector(selector, { timeout: 10000 });
        const elementExists = await page.evaluate((s) => {
            const el = document.querySelector(s);
            if (!el) return false;
            el.click?.();
            return true;
        }, selector);
        if (elementExists) await delay(pause);
        return elementExists;
    } catch (err) {
        console.error(`❌ Click failed for ${selector}:`, err.message);
        return false;
    }
}

async function smart_click_by_text(page, text, pause = 2000) {
    const clicked = await page.evaluate((txt) => {
        const el = Array.from(document.querySelectorAll("button, a, [role='button']")).find(el =>
            el.innerText?.trim().toLowerCase().includes(txt.toLowerCase())
        );
        el?.click?.();
        return !!el;
    }, text);
    if (clicked) await delay(pause);
    return clicked;
}

async function smart_type_with_pause(page, selector, text, pause) {
    try {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.click(selector, { clickCount: 3 });
        await page.type(selector, text);
        await delay(pause);
        return true;
    } catch (err) {
        console.error(`❌ Type failed for ${selector}:`, err.message);
        return false;
    }
}

async function automate() {
    const { browser, page } = await givePage();
    try {
        await loginAsSeller(page);
        await verifyBalance(page);
        await initiateWithdrawal(page);
        await verifyWithdrawalStatus(page);
    } catch (err) {
        console.error('❌ Seller withdrawal flow failed:', err.message);
    } finally {
        console.log('🔍 Inspection time. Close browser manually.');
    }
}

automate();
