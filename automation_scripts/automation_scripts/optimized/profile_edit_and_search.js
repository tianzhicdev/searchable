const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const {
    createNewListing,
    fillBasicInfo,
    selectTags,
    uploadMainImage,
    setupDigitalDownload,
    publishListing
} = require('./listingHelpersScenario4');

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

async function registerUser1(page) {
    const random1 = Math.floor(Math.random() * 100000);
    const registered_email1 = `user1_${random1}@gmail.com`;
    const username = `user1_${random1}`;
    const password = `Pass1_${random1}`;

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
    console.log('📝 Filling registration form for User1...');
    
    //Step 5: Fill the form and submit
    await smart_type_with_pause(page, "input[id='input-rest-register-email-field']", registered_email1, 1000);
    await smart_type_with_pause(page, "input[id='input-rest-register-username-field']", username, 1000);
    await smart_click_with_pause(page, "svg[data-testid='VisibilityOffIcon']", 1000);
    await smart_type_with_pause(page, "input[id='input-rest-register-password-field']", password, 1000);
    await smart_click_by_text(page, "Sign Up", 3000);

    const userInfo = {
        username: username,
        email: registered_email1,
        password: password
    };
    
    const outputPath = path.join(__dirname, 'registered_user1_info.json');
    
    try {
        fs.writeFileSync(outputPath, JSON.stringify(userInfo, null, 2));  // overwrite
        console.log("📝 Saved user info to ${outputPath}");
    } catch (err) {
        console.error('❌ Failed to save user1 info JSON:', err.message);
    }    
    console.log(`✅ User1 registered: ${registered_email1}`);
}


async function loginWithStoredUser1(page) {
    const filePath = path.join(__dirname, 'registered_user1_info.json');

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
    await smart_type_with_pause(page, "input[id='input-rest-login-email-field']", email, 1000);
    await smart_type_with_pause(page, "input[id='input-rest-login-password-field']", password, 1000);
    await smart_click_by_text(page, "Sign In", 2000);

    console.log('✅ Login successful for User1 using stored credentials');
}

async function editProfileUser1(page) {
    console.log('💰 Navigating to account section...');
    await smart_click_with_pause(page, "button[id='button-floating-bottom-bar-account']", 2000);
    await smart_click_with_pause(page, "li[id='menuitem-floating-bottom-bar-account-edit-profile']", 2000);

    const randomText = `This is a random bio generated at ${new Date().toLocaleString()}.
    It has multiple lines to test text area input.
    Hope you like it!`;

    await smart_type_with_pause(page, "textarea[name='introduction']", randomText, 2000);

    await selectTagsInUser1Profile(page);

    await smart_type_with_pause(page, "input[name='instagram']", "instagram", 1000);
    await smart_type_with_pause(page, "input[name='x']", "x", 1000);
    await smart_type_with_pause(page, "input[name='youtube']", "youtube", 1000);

    console.log('📤 Uploading file...');
    await uploadFile(page);

    await delay(3000);

    await smart_click_by_text(page, "Save Profile", 1000);
    console.log('✅ Profile details edited successfully');

    await delay(5000);

}

async function createListingForUser1(page) {
    console.log("📝 Creating listing for User1...");
    await createNewListing(page);
    await fillBasicInfo(page);
    await selectTags(page);
    await uploadMainImage(page);
    await setupDigitalDownload(page);
    await publishListing(page);
    console.log("✅ Listing created successfully for User1");
}

async function registerUser2(page) {
    const random2 = Math.floor(Math.random() * 100000);
    const registered_email2 = `user2_${random2}@gmail.com`;
    const username = `user2_${random2}`;
    const password = `Pass2_${random2}`;

    await smart_click_with_pause(page, "button[id='button-floating-bottom-bar-account']", 2000);
    await smart_click_with_pause(page, "li[id='menuitem-floating-bottom-bar-account-log-out']", 2000);
    await delay(2000);

    await smart_click_with_pause(page, "a[id='link-login-register']", 2000);
    await smart_type_with_pause(page, "input[id='input-rest-register-email-field']", registered_email2, 1000);
    await smart_type_with_pause(page, "input[id='input-rest-register-username-field']", username, 1000);
    await smart_click_with_pause(page, "svg[data-testid='VisibilityOffIcon']", 1000);
    await smart_type_with_pause(page, "input[id='input-rest-register-password-field']", password, 1000);
    await smart_click_by_text(page, "Sign Up", 3000);

    const userInfo = {
        username: username,
        email: registered_email2,
        password: password
    };
    
    const outputPath = path.join(__dirname, 'registered_user2_info.json');
    
    try {
        fs.writeFileSync(outputPath, JSON.stringify(userInfo, null, 2));  // overwrite
        console.log("📝 Saved user info to ${outputPath}");
    } catch (err) {
        console.error('❌ Failed to save user2 info JSON:', err.message);
    }    
    console.log(`✅ User2 registered: ${registered_email2}`);
}

async function loginWithStoredUser2(page) {
    const filePath = path.join(__dirname, 'registered_user2_info.json');

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
    await smart_type_with_pause(page, "input[id='input-rest-login-email-field']", email, 1000);
    await smart_type_with_pause(page, "input[id='input-rest-login-password-field']", password, 1000);
    await smart_click_by_text(page, "Sign In", 2000);

    console.log('✅ Login successful for User2 using stored credentials');
}

async function selectTagsInUser1Profile(page) {
    const tags = ["community", "blogger", "freelancer"];
    let selectedTags = [];

    for (const tag of tags) {
        try {
            await page.waitForSelector("div[aria-haspopup='listbox']", { timeout: 10000 });
            await page.click("div[aria-haspopup='listbox']");
            await page.waitForSelector("ul[role='listbox'] li[role='option']", { timeout: 5000 });

            const options = await page.$$("ul[role='listbox'] li[role='option']");
            for (const option of options) {
                const text = await option.evaluate(el => el.textContent.trim().toLowerCase());
                if (text.includes(tag.toLowerCase())) {
                    await option.click();
                    selectedTags.push(tag);
                    await delay(300);
                    break;
                }
            }
        } catch (err) {
            console.error(`❌ Failed to select tag "${tag}": ${err.message}`);
        }
    }

    // Save selected tags to JSON so User2 can use them
    const filePath = path.join(__dirname, 'registered_user1_info.json');
    const user1Data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    user1Data.tags = selectedTags;
    fs.writeFileSync(filePath, JSON.stringify(user1Data, null, 2));

    try { await page.keyboard.press("Escape"); } catch {}
    await delay(300);
}

async function uploadFile(page) {
  console.log('📤 Uploading file...');
  const filePath = path.resolve(__dirname, 'maxresdefault.jpg');

  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click('svg[data-testid="AddPhotoAlternateIcon"]') // Replace with your pink box selector
  ]);

  await fileChooser.accept([filePath]);
  console.log('✅ Image uploaded');
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

async function searchByTags(page) {
    const user1Data = JSON.parse(fs.readFileSync(
        path.join(__dirname, 'registered_user1_info.json'),
        'utf-8'
    ));
    const partialName = user1Data.username.slice(-6);

    const clicked = await searchAndClickProfile(page, partialName);
    if (clicked) {
        await verifyProfileDetails(page, user1Data);
    } else {
        console.log(`❌ User1 NOT clicked from partial name search`);
    }
}

async function searchAndClickProfile(page, usernameOrPartial) {
    try {
        // Focus and clear search bar
        await page.waitForSelector("input[placeholder*='Search']", { timeout: 5000 });
        await page.focus("input[placeholder*='Search']");
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');

        // Type query & search
        await page.type("input[placeholder*='Search']", usernameOrPartial, { delay: 100 });
        await page.keyboard.press('Enter');

        // Wait until a matching profile card appears
        await page.waitForFunction(
            (username) => {
                return Array.from(document.querySelectorAll("div.MuiPaper-root.MuiPaper-elevation1"))
                    .some(el => el.textContent.includes(username));
            },
            { timeout: 10000 },
            usernameOrPartial
        );

        // Find the exact element and click it
        const profileCards = await page.$$("div.MuiPaper-root.MuiPaper-elevation1");
        for (const card of profileCards) {
            const textContent = await card.evaluate(el => el.textContent || "");
            if (textContent.includes(usernameOrPartial)) {
                await card.hover();
                await delay(200);
                await card.click();
                console.log(`✅ Clicked on profile: ${usernameOrPartial}`);
                await delay(1500);
                return true;
            }
        }

        console.warn(`❌ No clickable profile found for: ${usernameOrPartial}`);
        return false;

    } catch (error) {
        console.error(`❌ Error searching/clicking profile "${usernameOrPartial}":`, error.message);
        return false;
    }
}

async function verifyProfileDetails(page, user1Data) {
    console.log(`🕵️ Verifying profile for ${user1Data.username}...`);

    const introMatches = await page.evaluate((introText) => {
        const introEl = document.querySelector("p[id='text-profile-introduction-text']");
        return introEl && introEl.innerText.includes(introText);
    }, "This is a random bio"); // partial match

    const tagsPresent = await page.evaluate((expectedTags) => {
        const tagEls = Array.from(document.querySelectorAll("div[id='section-profile-tags']"));
        return expectedTags.every(tag => tagEls.some(el => el.textContent.toLowerCase().includes(tag.toLowerCase())));
    }, user1Data.tags);

    const socialsPresent = await page.evaluate(() => {
        return ['instagram', 'x', 'youtube'].every(platform =>
            Array.from(document.querySelectorAll('a')).some(a => a.href.includes(platform))
        );
    });

    const imagesPresent = await page.evaluate(() => document.querySelectorAll("img").length > 1);

    console.log(`📄 Intro is present: ${introMatches ? '✅' : '❌'}`);
    console.log(`🏷️ Tags are present: ${tagsPresent ? '✅' : '❌'}`);
    console.log(`🔗 Socials are present: ${socialsPresent ? '✅' : '❌'}`);
    console.log(`🖼️ Images is present: ${imagesPresent ? '✅' : '❌'}`);
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
        await registerUser1(page);
        await loginWithStoredUser1(page);
        await editProfileUser1(page);
        await createListingForUser1(page);
        await registerUser2(page);
        await loginWithStoredUser2(page);
        await searchByTags(page);

}

automate();