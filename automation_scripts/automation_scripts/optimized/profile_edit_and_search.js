const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const RANDOM_SUFFIX = Math.floor(Math.random() * 10000);
let registered_email = `testuser${RANDOM_SUFFIX}@gmail.com`;
let username = `testUser${RANDOM_SUFFIX}`;                 
const password = `testUser${RANDOM_SUFFIX}`;
const CONFIG = {files: {
        image: 'automation_scripts/automation_scripts/optimized/maxresdefault.jpg',    
    }
};

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

async function registerUser(page) {
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

    // Step 2: Click "I want to shop" (Storefront icon)
    console.log('💰 Clicking "I want to shop"...');
    const earnSuccess = await smart_click_with_pause(page, "svg[data-testid='ShoppingCartIcon']", 2000);
    if (!earnSuccess) {
        await smart_click_with_pause(page, "button:has(svg[data-testid='ShoppingCartIcon'])", 2000);
    }
    console.log("✅ 'I want to shop' clicked");

   //Step 3: REGISTER
   await page.waitForSelector("button.MuiButton-root");
   const clicked = await page.evaluate(() => {
       const buttons = Array.from(document.querySelectorAll("button.MuiButton-root"));
       for (const btn of buttons) {
       if (btn.innerText.trim().toUpperCase() === "REGISTER") {
           btn.click();
           return true;
       }
   }
   return false;
   });
   
   await delay(1000);
   console.log("✅ 'REGISTER' clicked");

    // Step 4: Fill registration form
    console.log('📝 Filling registration form...');

    //Create Account
    await smart_type_with_pause(page, "input[id='input-rest-register-email-field']", registered_email, 1000);
    await smart_type_with_pause(page, "input[id='input-rest-register-username-field']", username, 1000);
    await smart_click_with_pause(page, "svg[data-testid='VisibilityOffIcon']", 1000);
    await smart_type_with_pause(page, "input[id='input-rest-register-password-field']", password, 1000);
    await smart_click_by_text(page, "Sign Up", 3000);
    console.log("✅ User Registered");
    
    const userInfo = {
        username: username,
        email: registered_email,
        password: password
    };
    
    const outputPath = path.join(__dirname, 'registered_user_info.json');
    
    try {
        fs.writeFileSync(outputPath, JSON.stringify(userInfo, null, 2));  // overwrite
        console.log(`📝 Saved user info to ${outputPath}`);
    } catch (err) {
        console.error('❌ Failed to save user info JSON:', err.message);
    }    
    console.log('✅ username, email, and password stored into a JSON file');    
}

async function loginWithStoredUser(page) {
    const filePath = path.join(__dirname, 'registered_user_info.json');

    let email, password;

    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const parsedData = JSON.parse(data);
        email = parsedData.email;
        password = parsedData.password;
        console.log(`🔐 Logging in with: ${email}`);
    } catch (err) {
        console.error('❌ Failed to read user info JSON:', err.message);
        return;
    }

    // Enter credentials and login
    await smart_type_with_pause(page, "input[id='input-rest-login-email-field']", registered_email, 1000);
    await smart_type_with_pause(page, "input[id='input-rest-login-password-field']", password, 1000);
    await smart_click_by_text(page, "Sign In", 2000);

    console.log('✅ Login successful using stored credentials');
}

async function editProfile(page) {
    console.log('💰 Navigating to account section...');
    await smart_click_with_pause(page, "button[id='button-floating-bottom-bar-account']", 2000);
    await smart_click_with_pause(page, "li[id='menuitem-floating-bottom-bar-account-edit-profile']", 2000);

    const randomText = `This is a random bio generated at ${new Date().toLocaleString()}.
    It has multiple lines to test text area input.
    Hope you like it!`;

    await smart_type_with_pause(page, "textarea[name='introduction']", randomText, 2000);

    await smart_click_with_pause(page, "svg[data-testid='ArrowDropDownIcon']", 1000);

    // await smart_type_with_pause(page, "input[name='instagram']", "instagram", 1000);
    // await smart_type_with_pause(page, "input[name='x']", "x", 1000);
    // await smart_type_with_pause(page, "input[name='youtube']", "youtube", 1000);

    // console.log('📤 Uploading file...');
    // await uploadFile(page);

    // await smart_click_by_text(page, "Save Profile", 1000);
    // console.log('✅ Profile details edited successfully');

}

async function selectTags(page) {
    // Click tags dropdown
    await smart_click_with_pause(page, "svg[data-testid='ArrowDropDownIcon']", 1000);

    // // Wait for options and select tags
    // await page.waitForSelector("ul[role='listbox']", { timeout: 10000 }); // Increased timeout

    const tags = ["community", "freelancer", "coaching"];
    for (const tag of tags) {
        const options = await page.$$("li[role='option']");
        for (const option of options) {
            const text = await option.evaluate(el => el.textContent.toLowerCase());
            if (text.includes(tag)) {
                try {
                    await option.click();
                    await delay(500);
                    break;
                } catch (error) {
                    console.warn(`⚠️ Could not click option ${text}: ${error.message}`);
                }
            }
        }
    }

    // Close dropdown
    await page.keyboard.press('Escape');
    await delay(500);
}

async function uploadFile(page) {
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
    console.log('✅ image uploaded');
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
        await registerUser(page);
        await loginWithStoredUser(page);
        await editProfile(page);

}

automate();