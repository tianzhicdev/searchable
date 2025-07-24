const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const product_url = "https://silkroadonlightning.com/landing";

async function givePage() {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    return page;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function landingPage(page) {
    await page.goto(product_url);
    await delay(1500);

    //I'm back
    await page.waitForSelector("button[class='MuiTypography-root MuiTypography-body2 MuiLink-root MuiLink-underlineAlways MuiLink-button css-hpy1oi-MuiTypography-root-MuiLink-root']", elem => elem.click());
    await page.click("button[class='MuiTypography-root MuiTypography-body2 MuiLink-root MuiLink-underlineAlways MuiLink-button css-hpy1oi-MuiTypography-root-MuiLink-root']", elem => elem.click());
    await delay(1000);
    
}

async function login(page) {

    //Credentials
    await page.type("input[id='input-rest-login-email-field']", 'reg7@testingautomation.com');
    await delay(1000);
    await page.type("input[id='input-rest-login-password-field']", 'password@1');
    await delay(1000);
    await page.waitForSelector("button[id='button-rest-login-submit']", elem => elem.click());
    await page.click("button[id='button-rest-login-submit']", elem => elem.click());
    await delay(1000);
  }
  
async function createListing(page) {
    await page.waitForSelector("button[id='button-floating-bottom-bar-create']", elem => elem.click());
    await page.click("button[id='button-floating-bottom-bar-create']", elem => elem.click());
    await delay(1000);
}

async function fillListingDetails(page) {
    await page.type("input[id='title']", 'Ambient Music');
    await delay(1000);

    await page.type("textarea[id='description']", 'Ambient Music listing created using Automation Testing');
    await delay(1000);

    await page.waitForSelector("p[class='MuiTypography-root MuiTypography-body1 css-2zsgom-MuiTypography-root']", elem => elem.click());
    await page.click("p[class='MuiTypography-root MuiTypography-body1 css-2zsgom-MuiTypography-root']", elem => elem.click());

    // Wait for the dropdown menu to render
    await page.waitForSelector("ul[role='listbox']");

    // Select 3 tags by visible text: 'art', 'assets', 'coaching'
    const tagsToSelect = ["art", "assets", "coaching"];
    for (const tag of tagsToSelect) {
    await page.evaluate((tagText) => {
        const options = Array.from(document.querySelectorAll("li[role='option']"));
        const target = options.find(opt => opt.textContent.trim().toLowerCase().startsWith(tagText));
        if (target) target.click();
    }, tag);
    
    // Small wait between selections to mimic user interaction
    await delay(500);

    }

    // Confirm selected tags are visible in the field
    const selectedTags = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.MuiChip-label')).map(chip => chip.textContent);
    });
  
    console.log("Selected Tags:", selectedTags);

    await page.click('body');
    await delay(500);

    const path = require('path');

    // ✅ Step 1: Define full absolute file path
    const filePath = '/Users/sajanshergill/Downloads/maxresdefault.jpg'; // or image.jpg

    // ✅ Step 2: Wait for input[type="file"] to be present in DOM
    await page.waitForSelector("input[type='file']");

    // ✅ Step 3: Force hidden input to be visible using Puppeteer
    await page.evaluate(() => {
        const input = document.querySelector("input[type='file']");
        if (input) {
            input.style.display = 'block';
            input.style.visibility = 'visible';
            input.style.opacity = 1;
            input.style.position = 'fixed';
            input.style.left = '0';
            input.style.top = '0';
            input.style.zIndex = '9999';
        }
    });

    // ✅ Step 4: Upload file to the input
    const fileInputHandle = await page.$("input[type='file']");
    if (fileInputHandle) {
        await fileInputHandle.uploadFile(filePath);
        console.log('✅ File uploaded successfully');
    } else {
        console.error('❌ File input not found');
    }

    await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const digitalDownloadLabel = labels.find(label => label.textContent.includes('Digital Downloads'));
        if (digitalDownloadLabel) {
          digitalDownloadLabel.click();
        } else {
          throw new Error("❌ 'Digital Downloads' label not found");
        }
      });
      console.log('✅ Digital Downloads toggle clicked');


    const filePathDigitalDownloads = '/Users/sajanshergill/Downloads/eona-emotional-ambient-pop-351436.mp3';

    // Wait for the file input inside the label to exist (even if hidden)
    await page.waitForSelector("label#button-publish-allinone-downloadable-upload input[type='file']", {
    visible: false,
    });

    // Select the actual <input type="file">
    const inputHandle = await page.$("label#button-publish-allinone-downloadable-upload input[type='file']");

    if (inputHandle) {
    await inputHandle.uploadFile(filePathDigitalDownloads);
    console.log('✅ File uploaded to Digital Downloads');
    } else {
    console.error('❌ File input not found inside label');
    }

    // Optional delay to let upload complete
    await delay(2000);

    await page.type("textarea[id='input-publish-allinone-file-description']", 'Ambient Music listing created using Automation Testing available as Digital Download');
    await delay(1000);

    await page.type("input[id='input-publish-allinone-file-price']", '4.99');
    await delay(1000);

    // ✅ Wait for the PUBLISH button to be enabled
    await page.waitForSelector("button[type='submit']", { visible: true });

    // 👇 Ensure it's not disabled (often buttons are disabled until form is valid)
    await page.evaluate(() => {
    const publishBtn = document.querySelector("button[type='submit']");
    if (publishBtn && publishBtn.disabled) {
        publishBtn.disabled = false;
    }
    });

    // ✅ Click the button
    await page.click("button[type='submit']");
    console.log("🚀 Publish button clicked");

    // Optional delay for redirect or confirmation to load
    await delay(3000);

}

async function automate() {
    var page = await givePage();
    await landingPage(page);
    await login(page);
    await createListing(page);
    await fillListingDetails(page);
}
  
automate();




// async function createAccount(page) {
//     await page.waitForSelector("a[id='link-login-register']", elem => elem.click());
//     await page.click("a[id='link-login-register']", elem => elem.click());
//     await delay(1000);
// }

// const signupCredentials = {
//     email: 'reg4@testingautomation.com',
//     username: 'sajantest123',
//     password: 'password@1'
// };
  
// async function signUpForm(page, credentials) {

//     await page.type("input[id='input-rest-register-email-field']", credentials.email);
//     await delay(500);

//     await page.type("input[id='input-rest-register-username-field']", credentials.username);
//     await delay(500);

//     await page.click("button[id='button-rest-register-password-visibility-toggle']");
//     await delay(500);

//     await page.type("input[id='input-rest-register-password-field']", credentials.password);
//     await delay(500);

//     await page.evaluate(() => {
//         const buttons = Array.from(document.querySelectorAll('button'));
//         const target = buttons.find(btn => btn.textContent.trim().toUpperCase() === 'SIGN UP');
//         if (target) target.click();
//       });
      
// }

// async function loginAfterSignup(page, credentials) {
//     await page.waitForSelector("input[id='input-rest-login-email-field']");
//     await page.click("input[id='input-rest-login-email-field']");
//     await page.type("input[id='input-rest-login-email-field']", credentials.email);
//     await delay(500);

//     await page.waitForSelector("input[id='input-rest-login-password-field']");
//     await page.type("input[id='input-rest-login-password-field']", credentials.password);
//     await delay(500);

//     await page.waitForSelector("button[id='button-rest-login-submit']");
//     await page.click("button[id='button-rest-login-submit']");
//     await delay(2000);
// }

// async function automate() {
//     var page = await givePage();
//     await landingPage(page);
//     await createAccount(page);
//     await signUpForm(page, signupCredentials);
//     await loginAfterSignup(page, signupCredentials);
//     await selectProductFromLandingPage(page);
//     await selectProductByTitle(page, 'download test 1');
//     await selectItemsInProduct(page);
//     await payWithStripe(page);
//     await stripeForm(page);
// }

// automate();
