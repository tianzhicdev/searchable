// listingHelpers.js
const path = require('path');

// ✅ Copy delay, click, and type helpers from your listing file
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

// ✅ CONFIG only for file paths
const CONFIG = {
    files: {
        image: path.resolve(__dirname, 'maxresdefault.jpg'),
        download: path.resolve(__dirname, 'file3.txt')
    }
};

// ✅ Your required functions
async function createNewListing(page) {
    await click(page, "button[id='button-floating-bottom-bar-create']");
}

async function fillBasicInfo(page) {
    await type(page, "input[id='title']", 'Ambient Musics');
    await type(page, "textarea[id='description']", 'Ambient Music listing created using Automation Testing');
}

async function selectTags(page) {
    await click(page, "p[class*='MuiTypography-root'][class*='css-2zsgom']");
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
    await page.keyboard.press('Escape');
    await delay(500);
}

async function uploadMainImage(page) {
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
    await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const digitalLabel = labels.find(label => label.textContent.includes('Digital Downloads'));
        if (digitalLabel) digitalLabel.click();
    });

    await delay(1000);

    const downloadInput = await page.$("label#button-publish-allinone-downloadable-upload input[type='file']");
    await downloadInput.uploadFile(CONFIG.files.download);
    console.log('✅ Download file uploaded');

    await delay(2000);

    await type(page, "textarea[id='input-publish-allinone-file-description']", 'Ambient Music available as Digital Download');
    await type(page, "input[id='input-publish-allinone-file-price']", '4.99');

    await click(page, "button[id='button-publish-allinone-file-add']");
    await delay(3000);
}

async function publishListing(page) {
    await click(page, "button[type='submit']");
    console.log('🚀 Listing published');
    await delay(3000);
}

// Export the ones you need
module.exports = {
    createNewListing,
    fillBasicInfo,
    selectTags,
    uploadMainImage,
    setupDigitalDownload,
    publishListing
};
