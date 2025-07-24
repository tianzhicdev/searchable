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

async function createAccount(page) {
    await page.waitForSelector("a[id='link-login-register']", elem => elem.click());
    await page.click("a[id='link-login-register']", elem => elem.click());
    await delay(1000);
}

const signupCredentials = {
    email: 'reg7@testingautomation.com',
    username: 'sajantest123',
    password: 'password@1'
};
  
async function signUpForm(page, credentials) {

    await page.type("input[id='input-rest-register-email-field']", credentials.email);
    await delay(500);

    await page.type("input[id='input-rest-register-username-field']", credentials.username);
    await delay(500);

    await page.click("button[id='button-rest-register-password-visibility-toggle']");
    await delay(500);

    await page.type("input[id='input-rest-register-password-field']", credentials.password);
    await delay(500);

    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(btn => btn.textContent.trim().toUpperCase() === 'SIGN UP');
        if (target) target.click();
      });
      
}

async function loginAfterSignup(page, credentials) {
    await page.waitForSelector("input[id='input-rest-login-email-field']");
    await page.click("input[id='input-rest-login-email-field']");
    await page.type("input[id='input-rest-login-email-field']", credentials.email);
    await delay(500);

    await page.waitForSelector("input[id='input-rest-login-password-field']");
    await page.type("input[id='input-rest-login-password-field']", credentials.password);
    await delay(500);

    await page.waitForSelector("button[id='button-rest-login-submit']");
    await page.click("button[id='button-rest-login-submit']");
    await delay(2000);
}


async function selectProductFromLandingPage(page) {
    // await page.waitForSelector("div[class='MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation1 jss67 css-1qemsao-MuiPaper-root']", elem => elem.click());
    // await page.click("div[class='MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation1 jss67 css-1qemsao-MuiPaper-root']", elem => elem.click());
    // await delay(1000);

    await page.waitForSelector("hr[class='MuiDivider-root MuiDivider-fullWidth css-15lqyj6-MuiDivider-root']", elem => elem.click());
    await page.click("hr[class='MuiDivider-root MuiDivider-fullWidth css-15lqyj6-MuiDivider-root']", elem => elem.click());
    await delay(1000);
}

async function selectProductByTitle(page, titleText) {
    // Wait for product cards to load
    await page.waitForSelector("div.MuiPaper-root");

    const productCards = await page.$$('div.MuiPaper-root.MuiPaper-elevation1');

    for (const card of productCards) {
        const textContent = await card.evaluate(el => el.textContent);
        
        if (textContent.toLowerCase().includes(titleText.toLowerCase())) {
        await card.click();
        console.log(`✅ Clicked product: ${titleText}`);
        await delay(1500);
        return;
        }
    }

    console.error(`❌ Product with title "${titleText}" not found`);
}

async function selectItemsInProduct(page) {
    //Select item/s
    await page.waitForSelector("div[class='MuiBox-root css-nb2z2f']", elem => elem.click()); //need to change
    await page.click("div[class='MuiBox-root css-nb2z2f']", elem => elem.click());
    await delay(1000);
}

// async function selectItemsInProduct(page, itemName) {
//   // Wait for item containers to load
//   await page.waitForSelector("div.MuiBox-root");

//   const itemBoxes = await page.$$('div.MuiBox-root');

//   for (const box of itemBoxes) {
//     const text = await box.evaluate(el => el.textContent);

//     if (text.toLowerCase().includes(itemName.toLowerCase())) {
//       await box.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
//       await delay(500);

//       await box.click();
//       console.log(`✅ Clicked item: ${itemName}`);
//       await delay(1000);
//       return;
//     }
//   }

//   console.error(`❌ Item with name "${itemName}" not found`);
// }

async function payWithStripe(page) {
    await page.waitForSelector("button[class='MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButtonBase-root css-hkny9w-MuiButtonBase-root-MuiButton-root']", elem => elem.click());
    await page.click("button[class='MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButtonBase-root css-hkny9w-MuiButtonBase-root-MuiButton-root']", elem => elem.click());
    await delay(4000);
}

async function stripeForm(page) {
    await page.waitForSelector("input[id='email']", elem => elem.click());
    await page.click("input[id='email']", elem => elem.click());
    await page.type("input[id='email']", 'test@gmail.com');
    await delay(1000);
    await page.waitForSelector("div[class='AccordionItemHeader-content']", elem => elem.click()); //need to change
    await page.click("div[class='AccordionItemHeader-content']", elem => elem.click());
    await delay(1000);
    await page.type("input[id='cardNumber']", '4242424242424242');
    await delay(1000);
    await page.type("input[id='cardExpiry']", '0329');
    await delay(1000);
    await page.type("input[id='cardCvc']", '321');
    await delay(1000);
    await page.type("input[id='billingName']", 'Sajan Singh Shergill');
    await delay(1000);
    await page.type("input[id='billingPostalCode']", '07306');
    await delay(1000);
    await page.waitForSelector("input[id='enableStripePass']", elem => elem.click());
    await page.click("input[id='enableStripePass']", elem => elem.click());
    await delay(2000);
    await page.waitForSelector("button[class='SubmitButton SubmitButton--complete']", elem => elem.click());
    await page.click("button[class='SubmitButton SubmitButton--complete']", elem => elem.click());

}

  
async function automate() {
    var page = await givePage();
    await landingPage(page);
    await createAccount(page);
    await signUpForm(page, signupCredentials);
    await loginAfterSignup(page, signupCredentials);
    await selectProductFromLandingPage(page);
    await selectProductByTitle(page, 'download test 1');
    await selectItemsInProduct(page);
    await payWithStripe(page);
    await stripeForm(page);
}

automate();