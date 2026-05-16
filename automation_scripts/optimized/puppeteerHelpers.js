// puppeteerHelpers.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

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

async function smart_click_with_pause(page, selector, pause) {
    try {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.evaluate(s => {
            const el = document.querySelector(s);
            if (el) el.click();
        }, selector);
        await delay(pause);
        return true;
    } catch (err) {
        console.error(`❌ Click failed for ${selector}: ${err.message}`);
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
        if (clicked) await delay(pause);
        return clicked;
    } catch (err) {
        console.error(`❌ Click by text failed for "${text}": ${err.message}`);
        return false;
    }
}

async function smart_type_with_pause(page, selector, text, pause) {
    try {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.click(selector, { clickCount: 3 });
        await page.type(selector, text);
        await delay(pause);
        return true;
    } catch (err) {
        console.error(`❌ Type failed for ${selector}: ${err.message}`);
        return false;
    }
}

async function uploadFile(page, filePath) {
    try {
        await page.waitForSelector("input[type='file']", { visible: true, timeout: 15000 });
        const fileInputHandle = await page.$("input[type='file']");
        await fileInputHandle.uploadFile(filePath);
        console.log('✅ File uploaded successfully');
        return true;
    } catch (error) {
        console.error('❌ File upload failed:', error.message);
        return false;
    }
}

module.exports = {
    puppeteer,
    delay,
    givePage,
    smart_click_with_pause,
    smart_click_by_text,
    smart_type_with_pause,
    uploadFile
};
