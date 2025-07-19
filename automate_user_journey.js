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
  await page.type("input[id='input-rest-login-email-field']", 'test@testing.com');
  await delay(1000);
  await page.type("input[id='input-rest-login-password-field']", 'password@1');
  await delay(1000);
  await page.waitForSelector("button[id='button-rest-login-submit']", elem => elem.click());
  await page.click("button[id='button-rest-login-submit']", elem => elem.click());
  await delay(1000);
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

// async function stripeForm(page) {
//   await delay(2000); // Wait for Stripe iframes to load

//   const frames = page.frames();

//   // Get the correct iframes
//   const emailFrame = frames.find(f => f.url().includes('email'));
//   const cardNumberFrame = frames.find(f => f.url().includes('cardNumber'));
//   const expDateFrame = frames.find(f => f.url().includes('cardExpiry'));
//   const cvcFrame = frames.find(f => f.url().includes('cardCv'));

//   // Fill email
//   if (emailFrame) {
//     const emailInput = await emailFrame.waitForSelector("input[name='email']");
//     await emailInput.type("test@gmail.com", {delay: 100});
//     console.log("✅ Email Id Entered");
//   }

//   // Fill Card Number
//   if (cardNumberFrame) {
//     const cardInput = await cardNumberFrame.waitForSelector("input[name='cardNumber']");
//     await cardInput.type("4242424242424242", {delay: 100});
//     console.log("✅ Card Number Entered");
//   }

//   // Fill Expiry Date
//   if (expDateFrame) {
//     const expInput = await expDateFrame.waitForSelector("input[name='cardExpiry']");
//     await expInput.type("0329", {delay: 100});
//     console.log("✅ Expiry Date Entered");
//   }

//   // Fill CVC
//   if (cvcFrame) {
//     const cvcInput = await cvcFrame.waitForSelector("input[name='cardCv']");
//     await cvcInput.type("321", {delay: 100});
//     console.log("✅ CVC Entered");
//   }

//   // Fill billing name and postal code from main frame
//   const nameInput = await page.$("input[name='billingName']");
//   if (nameInput) {
//     await nameInput.type("Sajan Singh Shergill", {delay: 100});
//     console.log("✅ Name Entered");
//   }

//   const zipInput = await page.$("input[name='postalCode']");
//   if (zipInput) {
//     await zipInput.type("07306", {delay: 100});
//     console.log("✅ ZIP Code Entered");
//   }

//   // Submit the form
//   const payBtn = await page.waitForSelector("button[type='submit']");
//   await payBtn.click();
//   console.log("✅ Payment Submitted");
// }

async function automate() {
    var page = await givePage();
    await landingPage(page);
    await login(page);
    await selectProductFromLandingPage(page);
    await selectProductByTitle(page, 'download test 1');
    await selectItemsInProduct(page);
    await payWithStripe(page);
    await stripeForm(page);
  }

automate();
