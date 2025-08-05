const { givePage: giveSellerPage, onboarding } = require('./seller_onboarding');
const { givePage: giveBuyerPage, buyerOnboardingAsGuest, buyerResgisterAsUser, addBalance, searchAndOpenStore } = require('./guest_journey');

async function sellerSetup() {
    console.log("\n🚀 Seller Onboarding Started...");
    const { browser, page } = await giveSellerPage();
    await onboarding(page);
    await browser.close();
    console.log("✅ Seller Onboarding Finished!");
}

async function guestJourney() {
    console.log("\n🛒 Guest Journey Started...");
    const { browser, page } = await giveBuyerPage();
    await buyerOnboardingAsGuest(page);
    await buyerResgisterAsUser(page);
    await addBalance(page);
    await searchAndOpenStore(page);
    await browser.close();
    console.log("✅ Guest Journey Finished!");
}

(async () => {
    await sellerSetup();
    await guestJourney();
})();
