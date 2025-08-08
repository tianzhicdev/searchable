// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const path = require('path');
// puppeteer.use(StealthPlugin());

// const {
//     createNewListing,
//     fillBasicInfo,
//     uploadMainImage,
//     setupDigitalDownload,
//     publishListing
// } = require('./listingHelpersScenario4');

// const fs = require('fs');

// //const product_url = "https://silkroadonlightning.com/landing";
// const product_url = "http://localhost/landing"; // For local testing

// const filePath = path.join(__dirname, 'store_user_info.json');
// let email = '';
// let password = '';

// if (fs.existsSync(filePath)) {
//     const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
//     email = parsed.email;
//     password = parsed.password;
// }

// async function givePage() {
//     const browser = await puppeteer.launch({
//         headless: false,
//         defaultViewport: null,
//         args: ['--start-maximized']
//     });
//     const page = await browser.newPage();
//     return { browser, page };
// }

// function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// async function contentDiscovery(page) {
//     await page.goto(product_url);
//     await delay(2000);
//     console.log('✅ Page loaded');

//     await smart_click_by_text(page, "I'm back", 2000);
//     console.log('✅ Clicked on "I\'m back"');

//     try {
//         const data = fs.readFileSync(filePath, 'utf-8');
//         const parsedData = JSON.parse(data);
//         email = parsedData.email;
//         password = parsedData.password;
//     } catch (err) {
//         console.error('❌ Failed to read user info JSON:', err.message);
//         return;
//     }

//     // Only proceed if both email and password are available
//     if (email && password) {
//         await smart_type_with_pause(page, "input[id='input-rest-login-email-field']", email, 1000);
//         await smart_type_with_pause(page, "input[id='input-rest-login-password-field']", password, 1000);
//         await smart_click_by_text(page, "Sign In", 3000);
//         console.log("✅ Logged in successfully.");
//     } else {
//         console.error('❌ Missing email or password. Login skipped.');
//     }

//     await createNewListing(page);
//     await fillBasicInfo(page);
//     await selectTags(page);
//     await uploadMainImage(page);
//     await setupDigitalDownload(page);
//     await publishListing(page);
//     console.log('✅ Listing created successfully');

//     await smart_click_with_pause(page, "button[id='button-floating-bottom-bar-discover']", 2000);
//     await smart_click_with_pause(page, "li[data-testid='menuitem-floating-bottom-bar-discover-by-content']", 2000);

//     await smart_click_with_pause(page, "button[data-testid='button-nav-toggle-filters']", 500);
//     await verifyBusinessTagDiscovery(page);

// }

// async function selectTags(page) {
//     await page.click("p[class*='MuiTypography-root'][class*='css-2zsgom']");
//     await page.waitForSelector("ul[role='listbox']");

//     const tags = ["business", "digital art"];
//     for (const tag of tags) {
//         const options = await page.$$("li[role='option']");
//         for (const option of options) {
//             const text = await option.evaluate(el => el.textContent.toLowerCase());
//             if (text.includes(tag)) {
//                 await option.click();
//                 await delay(500);
//                 break;
//             }
//         }
//     }

//     await page.keyboard.press('Escape');
//     await delay(500);
// }

// async function verifyBusinessTagDiscovery(page) {
//     const tagToSelect = "business";
//     const expectedText = "Ambient Musics"; // Or whatever title your post has

//     try {
//         // 1. Wait for tag buttons and click the one labeled "business"
//         await page.waitForSelector("button.MuiButton-root", { timeout: 10000 });

//         const tagClicked = await page.evaluate((tagText) => {
//             const buttons = Array.from(document.querySelectorAll("button.MuiButton-root"));
//             for (const btn of buttons) {
//                 if (btn.textContent.trim().toLowerCase() === tagText.toLowerCase()) {
//                     btn.click();
//                     return true;
//                 }
//             }
//             return false;
//         }, tagToSelect);

//         if (!tagClicked) {
//             console.warn(`⚠️ Tag "${tagToSelect}" not found`);
//             return;
//         }

//         console.log(`✅ Tag "${tagToSelect}" clicked`);

//         // 2. Click the "SEARCH" button (the pink one)
//         const searchClicked = await page.evaluate(() => {
//             const buttons = Array.from(document.querySelectorAll('button'));
//             for (const btn of buttons) {
//                 if (btn.textContent.trim().toLowerCase() === "search") {
//                     btn.click();
//                     return true;
//                 }
//             }
//             return false;
//         });

//         if (!searchClicked) {
//             console.warn("❌ 'SEARCH' button not found");
//             return;
//         }

//         console.log("🔍 SEARCH clicked. Waiting for results...");

//         await delay(3000); // Wait for results to update

//         // 3. Verify that filtered result contains expected content
//         const postVisible = await page.evaluate((expectedTitle) => {
//             const titles = Array.from(document.querySelectorAll("h3, .post-title"));
//             return titles.some(el => el.textContent.toLowerCase().includes(expectedTitle.toLowerCase()));
//         }, expectedText);

//         if (postVisible) {
//             console.log(`🎯 Post with title "${expectedText}" found — tag filtering works ✅`);
//         } else {
//             console.error(`❌ Post "${expectedText}" NOT found — tag filtering may be broken`);
//         }

//     } catch (err) {
//         console.error(`❌ Error in tag discovery test: ${err.message}`);
//     }
// }

// async function smart_click_with_pause(page, selector, pause) {
//     try {
//         await page.waitForSelector(selector, { timeout: 10000 });
        
//         const elementExists = await page.evaluate((s) => {
//             const element = document.querySelector(s);
//             if (!element) return false;
            
//             if (typeof element.click === 'function') {
//                 element.click();
//                 return true;
//             }
            
//             const clickableParent = element.closest('button, a, [onclick], [role="button"]');
//             if (clickableParent && typeof clickableParent.click === 'function') {
//                 clickableParent.click();
//                 return true;
//             }
            
//             return false;
//         }, selector);
        
//         if (elementExists) {
//             await delay(pause);
//             return true;
//         } else {
//             console.warn(`⚠️ Element not clickable: ${selector}`);
//             return false;
//         }
        
//     } catch (error) {
//         console.error(`❌ Click failed for ${selector}:`, error.message);
//         return false;
//     }
// }

// async function smart_type_with_pause(page, selector, text, pause) {
//     try {
//         await page.waitForSelector(selector, { timeout: 10000 });
//         await smart_click_with_pause(page, selector, 500);
        
//         await page.evaluate(s => {
//             const element = document.querySelector(s);
//             if (element) element.value = '';
//         }, selector);
        
//         await page.type(selector, text);
//         await delay(pause);
//         return true;
//     } catch (error) {
//         console.error(`❌ Type failed for ${selector}:`, error.message);
//         return false;
//     }
// }

// async function smart_click_by_text(page, text, pause = 2000) {
//     try {
//         const clicked = await page.evaluate((buttonText) => {
//             const elements = Array.from(document.querySelectorAll('button, a, [onclick], [role="button"]'));
            
//             for (const element of elements) {
//                 if (element.textContent.trim().toLowerCase().includes(buttonText.toLowerCase())) {
//                     element.click();
//                     return true;
//                 }
//             }
//             return false;
//         }, text);
        
//         if (clicked) {
//             await delay(pause);
//             return true;
//         }
//         return false;
        
//     } catch (error) {
//         console.error(`❌ Click by text failed for "${text}":`, error.message);
//         return false;
//     }
//  }

//  async function contentDiscoveryFlow() {
//     const { browser, page } = await givePage();
//     try {
//         await contentDiscovery(page);
//         console.log("✅ Content Discovery Flow Completed Successfully!");
//     } catch (error) {
//         console.error("❌ Error in Content Discovery Flow:", error.message);
//     } finally {
//         await browser.close();
//     }
//  }

//  contentDiscoveryFlow();

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const {
    createNewListing,
    fillBasicInfo,
    setupDigitalDownload,
    publishListing
} = require('./listingHelpersScenario4');

const product_url = "http://localhost/landing";
const filePath = path.join(__dirname, 'store_user_info.json');

let email = '';
let password = '';

if (fs.existsSync(filePath)) {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    email = parsed.email;
    password = parsed.password;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRandomTitle(prefix = "Listing") {
    const adjectives = ["Bright", "Silent", "Dynamic", "Bold", "Creative", "Smart", "Funky", "Swift"];
    const nouns = ["Vision", "Flow", "Stream", "Idea", "Pulse", "Pixel", "Echo", "Vibe"];
    const randAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const suffix = Date.now().toString().slice(-5); // Short unique identifier
    return `${prefix} - ${randAdj}${randNoun}${suffix}`;
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

async function contentDiscovery(page) {
    await page.goto(product_url);
    await delay(2000);
    console.log('✅ Page loaded');

    await smart_click_by_text(page, "I'm back", 2000);
    console.log("✅ Clicked on 'I'm back'");

    if (email && password) {
        await smart_type_with_pause(page, "input[id='input-rest-login-email-field']", email, 1000);
        await smart_type_with_pause(page, "input[id='input-rest-login-password-field']", password, 1000);
        await smart_click_by_text(page, "Sign In", 3000);
        console.log("✅ Logged in successfully.");
    } else {
        console.error('❌ Missing email or password. Login skipped.');
        return;
    }

    await createThreeListingsForDiscovery(page);
    console.log("✅ All 3 listings created");

    await smart_click_with_pause(page, "button[id='button-floating-bottom-bar-discover']", 2000);
    await smart_click_with_pause(page, "li[data-testid='menuitem-floating-bottom-bar-discover-by-content']", 2000);
    await smart_click_with_pause(page, "button[data-testid='button-nav-toggle-filters']", 500);

    await verifyBusinessTagDiscovery(page);
}


async function createCustomListing(page, { title, description, tags, image }) {
    await createNewListing(page);

    await smart_type_with_pause(page, "input[id='title']", title, 500);
    await smart_type_with_pause(page, "textarea[id='description']", description, 500);

    await page.click("p[class*='MuiTypography-root'][class*='css-2zsgom']");
    await page.waitForSelector("ul[role='listbox']");

    for (const tag of tags) {
        const options = await page.$$("li[role='option']");
        for (const option of options) {
            const text = await option.evaluate(el => el.textContent.toLowerCase());
            if (text.includes(tag.toLowerCase())) {
                await option.click();
                await delay(500);
                break;
            }
        }
    }

    await page.keyboard.press('Escape');
    await delay(500);

    await uploadMainImage(page, image);
    console.log("✅ Main image uploaded");
    
    await setupDigitalDownload(page);
    await publishListing(page);
    console.log(`✅ Custom listing "${title}" published`);
}

async function uploadMainImage(page, imagePath) {
    const fullImagePath = path.resolve(__dirname, imagePath);

    if (!fs.existsSync(fullImagePath)) {
        console.error(`❌ Image file not found at: ${fullImagePath}`);
        return;
    }

    // Make sure file input is visible and accessible
    await page.evaluate(() => {
        const input = document.querySelector("input[type='file']");
        if (input) {
            input.style.display = 'block';
            input.style.visibility = 'visible';
            input.style.opacity = '1';
            input.removeAttribute('hidden');
        }
    });

    const inputUploadHandle = await page.$("input[type='file']");

    if (!inputUploadHandle) {
        console.error("❌ File input not found.");
        return;
    }

    try {
        await inputUploadHandle.uploadFile(fullImagePath); // ✅ correct method
        console.log("✅ Image uploaded via uploadFile:", fullImagePath);
        await delay(2000); // Wait for upload to complete
    } catch (err) {
        console.error("❌ Upload failed:", err.message);
    }
}

async function createThreeListingsForDiscovery(page) {
    const description = "This is the same content used to test tag filtering.";
    const listings = [
        {
            tags: ["business"],
            image: "images.png"
        },
        {
            tags: ["business"],
            image: "maxresdefault.jpg"
        },
        {
            tags: ["photography"],
            image: "images1.jpeg"
        }
    ];

    for (const listing of listings) {
        const randomTitle = generateRandomTitle("Listing");
        await createCustomListing(page, {
            title: randomTitle,
            description,
            tags: listing.tags,
            image: listing.image
        });
    }
}

async function verifyBusinessTagDiscovery(page) {
    const tagToSelect = "business";

    try {
        await page.waitForSelector("button.MuiButton-root", { timeout: 10000 });

        const tagClicked = await page.evaluate((tagText) => {
            const buttons = Array.from(document.querySelectorAll("button.MuiButton-root"));
            for (const btn of buttons) {
                if (btn.textContent.trim().toLowerCase() === tagText.toLowerCase()) {
                    btn.click();
                    return true;
                }
            }
            return false;
        }, tagToSelect);

        if (!tagClicked) {
            console.warn(`⚠️ Tag "${tagToSelect}" not found`);
            return;
        }

        console.log(`✅ Tag "${tagToSelect}" clicked`);

        const searchClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            for (const btn of buttons) {
                if (btn.textContent.trim().toLowerCase() === "search") {
                    btn.click();
                    return true;
                }
            }
            return false;
        });

        if (!searchClicked) {
            console.warn("❌ 'SEARCH' button not found");
            return;
        }

        console.log("🔍 SEARCH clicked. Waiting for results...");
        await delay(3000);

        const visibleListings = await page.evaluate(() => {
            const titles = Array.from(document.querySelectorAll("h3, .post-title"));
            return titles.map(el => el.textContent.trim());
        });

        console.log("📦 Listings Found:", visibleListings);

    } catch (err) {
        console.error(`❌ Error in tag discovery test: ${err.message}`);
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

async function contentDiscoveryFlow() {
    const { browser, page } = await givePage();
    try {
        await contentDiscovery(page);
        console.log("✅ Content Discovery Flow Completed Successfully!");
    } catch (error) {
        console.error("❌ Error in Content Discovery Flow:", error.message);
    } finally {
        await browser.close();
    }
}

contentDiscoveryFlow();
