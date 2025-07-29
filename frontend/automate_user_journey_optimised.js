const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const product_url = "https://silkroadonlightning.com/landing";

async function givePage() {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();
    return { browser, page };
}

async function run() {
    const { browser, page } = await givePage();
    await login(page);
    await selectProductFromTitle(page, 'download test 1');
    await selectItemsInProduct(page);
    await payWithStripe(page);
}

async function login(page) {
    await page.goto(product_url);
    await new Promise(r => setTimeout(r, 1500));
    console.log('✅ Page loaded');
  
    //I'm back
    await smart_click_with_pause(page, "button[class='MuiTypography-root MuiTypography-body2 MuiLink-root MuiLink-underlineAlways MuiLink-button css-hpy1oi-MuiTypography-root-MuiLink-root']", 1000);

    //Credentials
    await smart_type_with_pause(page, "input[id='input-rest-login-email-field']", 'abctest@gmail.com', 1000);
    await smart_type_with_pause(page, "input[id='input-rest-login-password-field']", 'password@1', 1000);
    await smart_click_with_pause(page, "button[id='button-rest-login-submit']", 1000);
    console.log('✅ Dashboard loaded');

    // Dashboard - selectProduct
    await smart_click_with_pause(page, "hr[class='MuiDivider-root MuiDivider-fullWidth css-15lqyj6-MuiDivider-root']", 1000);
    console.log('✅ Product Selection from Dashboard done.');
}

async function selectProductFromTitle(page, titleText) {
    // Wait for product cards to load
    await page.waitForSelector("div.MuiPaper-root");
  
    const productCards = await page.$$('div.MuiPaper-root.MuiPaper-elevation1');
  
    for (const card of productCards) {
      const textContent = await card.evaluate(el => el.textContent);
      
      if (textContent.toLowerCase().includes(titleText.toLowerCase())) {
        await card.click();
        console.log(`✅ Clicked sub-product: ${titleText}`);
        await delay(1500);
        return;
      }
    }
  
    console.error(`❌ Sub-Product with title "${titleText}" not found`);
}

async function selectItemsInProduct(page) {
    //Select item/s after selecting product/s
    await smart_click_with_pause(page, "div[class='MuiBox-root css-nb2z2f']", 1000);
    console.log('✅ Item/s selected from Product.');

    // Click the payment button
    await smart_click_with_pause(page, "button[data-testid='button-pay-stripe']", 4000);
    console.log('✅ Pay With Stripe clicked.');
  }

async function payWithStripe(page) {
    // Fill email field
    await smart_type_with_pause(page, "input[id='email']", 'test@gmail.com', 1000);
    
    // Click accordion to expand payment details
    await smart_click_with_pause(page, "button[data-testid='card-accordion-item-button']", 1000);
    
    // Fill card details
    await smart_type_with_pause(page, "input[id='cardNumber']", '4242424242424242', 1000);
    await smart_type_with_pause(page, "input[id='cardExpiry']", '0329', 1000);
    await smart_type_with_pause(page, "input[id='cardCvc']", '321', 1000);
    
    // Fill billing information
    await smart_type_with_pause(page, "input[id='billingName']", 'Sajan Singh Shergill', 1000);
    await smart_type_with_pause(page, "input[id='billingPostalCode']", '07306', 1000);
    
    // Enable Stripe Pass
    await smart_click_with_pause(page, "input[id='enableStripePass']", 2000);
    
    // Submit payment
    await smart_click_with_pause(page, "button[class='SubmitButton SubmitButton--complete']", 1000);
    console.log('✅ Payment With Stripe done.');
}

//Helper Functions
async function smart_click_with_pause(page, selector, pause) {
    await page.waitForSelector(selector);
    await page.evaluate((s) => document.querySelector(s).click(), selector);
    await new Promise(r => setTimeout(r, pause));
}

async function smart_type_with_pause(page, selector, text, pause) {
    await page.waitForSelector(selector);
    await page.click(selector);
    await page.type(selector, text);
    await delay(pause);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

run();