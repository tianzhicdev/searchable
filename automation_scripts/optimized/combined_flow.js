const { givePage: giveSellerPage, onboarding } = require('./seller_onboarding');
const { givePage: giveBuyerPage, buyerOnboardingAsGuest, buyerResgisterAsUser, addBalance, searchAndOpenStore } = require('./guest_journey');
const { givePage: giveSellerWithdrawalPage, loginAsSeller, verifyBalance, initiateWithdrawal, verifyWithdrawalStatus } = require('./seller_withdrawal');
const { givePage: giveProfileEditAndSearch, registerUser1, loginWithStoredUser1, editProfileUser1, createListingForUser1, registerUser2, loginWithStoredUser2, searchByTags, verifyTagsSearchInUser2 } = require('./profile_edit_and_search');

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

async function sellerWithdrawal() {
    console.log("\n🛒 Seller Withdrawal Journey Started...");
    const { browser, page } = await giveSellerWithdrawalPage();
    await loginAsSeller(page);
    await verifyBalance(page);
    await initiateWithdrawal(page);
    await verifyWithdrawalStatus(page);
    await browser.close();
    console.log("✅ Seller Withdrawal Journey Finished!");
}

async function profileEditAndSearch() {
    console.log("\n👤 Profile Edit and Search Journey Started...");
    const { browser, page } = await giveProfileEditAndSearch();
    
    await registerUser1(page);
    await loginWithStoredUser1(page);
    await editProfileUser1(page);
    await createListingForUser1(page);
    await registerUser2(page);
    await loginWithStoredUser2(page);
    await searchByTags(page);
    await verifyTagsSearchInUser2(page);
    
    await browser.close();
    console.log("✅ Profile Edit and Search Journey Finished!");
}

(async () => {
    await sellerSetup();
    await guestJourney();
    await sellerWithdrawal();
    await profileEditAndSearch();
})();
