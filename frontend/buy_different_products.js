const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const product_url = "https://silkroadonlightning.com/landing";
const summaryLog = [];

async function givePage() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  return page;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function landingPage(page) {
  await page.goto(product_url);
  await delay(1500);
  await page.waitForSelector("button[class='MuiTypography-root MuiTypography-body2 MuiLink-root MuiLink-underlineAlways MuiLink-button css-hpy1oi-MuiTypography-root-MuiLink-root']");
  await page.click("button[class='MuiTypography-root MuiTypography-body2 MuiLink-root MuiLink-underlineAlways MuiLink-button css-hpy1oi-MuiTypography-root-MuiLink-root']");
  await delay(1000);
}

async function login(page) {
  await page.type("input[id='input-rest-login-email-field']", 'reg7@testingautomation.com');
  await delay(1000);
  await page.type("input[id='input-rest-login-password-field']", 'password@1');
  await delay(1000);
  await page.click("button[id='button-rest-login-submit']");
  await delay(1000);
}

async function selectProductFromLandingPage(page) {
  await page.waitForSelector("hr[class='MuiDivider-root MuiDivider-fullWidth css-15lqyj6-MuiDivider-root']");
  await page.click("hr[class='MuiDivider-root MuiDivider-fullWidth css-15lqyj6-MuiDivider-root']");
  await delay(1000);
}

async function selectProductByTitle(page, titleText) {
  console.log(`\n🔍 Searching for product: "${titleText}"`);

  await page.waitForSelector("div.MuiPaper-root");
  const productCards = await page.$$('div.MuiPaper-root.MuiPaper-elevation1');

  for (const card of productCards) {
    const textContent = await card.evaluate(el => el.textContent);
    if (textContent.toLowerCase().includes(titleText.toLowerCase())) {
      await card.click();
      console.log(`✅ Product found: "${titleText}"`);
      await delay(1500);
      return true;
    }
  }

  console.log(`⚠️ Product not found: "${titleText}"`);
  return false;
}

async function selectItemsInProduct(page) {
  try {
    await page.waitForSelector("div[class='MuiBox-root css-nb2z2f']", { timeout: 3000 });
    await page.click("div[class='MuiBox-root css-nb2z2f']");
    await delay(1000);
  } catch (err) {
    console.warn("⚠️ Item selection skipped:", err.message);
  }
}

async function selectBackFromProduct(page) {
  try {
    await page.waitForSelector("button[class='MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root css-xnbea2-MuiButtonBase-root-MuiButton-root']");
    await page.click("button[class='MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root css-xnbea2-MuiButtonBase-root-MuiButton-root']");
    await delay(1000);
  } catch (err) {
    console.warn("⚠️ Could not return to product list:", err.message);
  }
}

async function selectSecondProductByTitle(page, titleText) {
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

  console.error(`❌ Second product with title "${titleText}" not found`);
}

async function selectItemsInSecondProduct(page) {
  try {
    await page.waitForSelector("div[class='MuiBox-root css-nb2z2f']", { timeout: 3000 });
    await page.click("div[class='MuiBox-root css-nb2z2f']");
    await delay(1000);
  } catch (err) {
    console.warn("⚠️ Second product item selection skipped:", err.message);
  }
}

async function waitForStripeFrame(page, timeout = 7000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const frames = page.frames();
    for (const frame of frames) {
      if (frame.url().includes("stripe")) {
        return frame;
      }
    }
    await delay(500);
  }
  return null;
}

async function payWithStripe(page) {
  try {
    console.log("🧾 Checking purchase status...");

    const isAlreadyPurchased = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.some(btn => btn.innerText.trim().toLowerCase() === 'download');
    });

    if (isAlreadyPurchased) {
      console.log("✅ Already purchased.");
      return false;
    }

    const payButtonSelector = "button[class='MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButtonBase-root css-hkny9w-MuiButtonBase-root-MuiButton-root']";
    await page.waitForSelector(payButtonSelector, { timeout: 5000 });

    const payButton = await page.$(payButtonSelector);
    if (!payButton) {
      console.log("⚠️ Pay button not found — possibly already purchased.");
      return false;
    }

    const isDisabled = await page.evaluate(btn => btn.disabled, payButton);
    const buttonText = await page.evaluate(btn => btn.innerText, payButton);

    if (isDisabled || buttonText.toLowerCase().includes("paid") || buttonText.toLowerCase().includes("completed")) {
      console.log("✅ Already purchased.");
      return false;
    }

    await payButton.click();
    console.log("💳 Proceeding to payment...");

    const stripeFrame = await waitForStripeFrame(page);
    if (stripeFrame) {
      console.log("✅ Stripe form detected.");
      return true;
    } else {
      console.log("❌ Stripe not detected.");
      return false;
    }

  } catch (err) {
    console.error("❌ Error in payWithStripe:", err.message);
    return false;
  }
}

async function stripeForm(page) {
  try {
    console.log("📝 Filling Stripe form...");

    await page.waitForSelector("input[id='email']", { timeout: 10000 });
    await page.type("input[id='email']", 'test@gmail.com');
    await delay(1000);

    await page.waitForSelector("div[class='AccordionItemHeader-content']", { timeout: 5000 });
    await page.click("div[class='AccordionItemHeader-content']");
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

    await page.click("input[id='enableStripePass']");
    await delay(2000);

    await page.waitForSelector("button[class='SubmitButton SubmitButton--complete']", { timeout: 5000 });
    await page.click("button[class='SubmitButton SubmitButton--complete']");
    console.log("✅ Stripe submitted.");
  } catch (err) {
    console.error("❌ Stripe form not submitted. Possibly already paid or not available:", err.message);
  }
}

async function automate() {
  const page = await givePage();
  await landingPage(page);
  await login(page);

  // FIRST PRODUCT
  const product1 = 'download test 1';
  await selectProductFromLandingPage(page);
  const found1 = await selectProductByTitle(page, product1);

  if (found1) {
    await selectItemsInProduct(page);
    const shouldPay1 = await payWithStripe(page);

    if (shouldPay1) {
      await stripeForm(page);
      summaryLog.push({ name: product1, status: 'Stripe Submitted' });
    } else {
      summaryLog.push({ name: product1, status: 'Already Purchased' });
    }

    await selectBackFromProduct(page);
  } else {
    summaryLog.push({ name: product1, status: 'Product Not Found' });
  }

  // SECOND PRODUCT
  const product2 = 'the second store';
  await selectProductFromLandingPage(page);
  const found2 = await selectSecondProductByTitle(page, product2);

  if (found2) {
    await selectItemsInSecondProduct(page);
    const shouldPay2 = await payWithStripe(page);

    if (shouldPay2) {
      await stripeForm(page);
      summaryLog.push({ name: product2, status: 'Stripe Submitted' });
    } else {
      summaryLog.push({ name: product2, status: 'Already Purchased' });
    }

  } else {
    summaryLog.push({ name: product2, status: 'Product Not Found' });
  }

  // PRINT FINAL TABLE
  console.log('\n📦 Purchase Summary:\n');
  console.table(summaryLog);
}

automate();
