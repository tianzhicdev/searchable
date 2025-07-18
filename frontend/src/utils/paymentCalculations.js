/**
 * Payment calculation utilities
 * Centralizes all payment-related business logic
 */

// Constants for fees and limits
export const PAYMENT_CONSTANTS = {
  STRIPE_FEE_PERCENTAGE: 0.035, // 3.5%
  PLATFORM_FEE_PERCENTAGE: 0.001, // 0.1%
  MIN_PAYMENT_AMOUNT: 0.01,
  MAX_PAYMENT_AMOUNT: 999999.99,
  MIN_DONATION_AMOUNT: 1.00,
  DEFAULT_DONATION_AMOUNT: 10.00,
};

/**
 * Calculate the total price for an AllInOne searchable
 * @param {Object} searchableItem - The searchable item data
 * @param {Object} selectedFiles - Object with file IDs as keys and boolean selection as values
 * @param {Object} selectedOfflineItems - Object with item IDs as keys and quantities as values
 * @param {number|null} selectedDonation - Selected donation amount
 * @returns {number} Total price
 */
export const calculateAllInOneTotal = (searchableItem, selectedFiles = {}, selectedOfflineItems = {}, selectedDonation = null) => {
  if (!searchableItem) return 0;
  
  const publicData = searchableItem.payloads?.public || {};
  const components = publicData.components;
  
  if (!components) return 0;
  
  let total = 0;
  
  // Add downloadable files
  if (components.downloadable?.enabled && components.downloadable?.files) {
    components.downloadable.files.forEach(file => {
      if (selectedFiles[file.id]) {
        total += parseFloat(file.price) || 0;
      }
    });
  }
  
  // Add offline items with quantities
  if (components.offline?.enabled && components.offline?.items) {
    components.offline.items.forEach(item => {
      const quantity = selectedOfflineItems[item.id] || 0;
      if (quantity > 0) {
        total += (parseFloat(item.price) || 0) * quantity;
      }
    });
  }
  
  // Add donation
  if (components.donation?.enabled && selectedDonation) {
    total += parseFloat(selectedDonation) || 0;
  }
  
  return Math.round(total * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate fees for a payment
 * @param {number} amount - Base amount
 * @param {string} paymentType - 'stripe' or 'balance'
 * @returns {Object} Fee breakdown
 */
export const calculatePaymentFees = (amount, paymentType = 'stripe') => {
  const baseAmount = parseFloat(amount) || 0;
  
  if (paymentType === 'balance') {
    return {
      baseAmount,
      platformFee: 0,
      processingFee: 0,
      totalAmount: baseAmount,
      sellerReceives: baseAmount
    };
  }
  
  // Stripe payment
  const platformFee = baseAmount * PAYMENT_CONSTANTS.PLATFORM_FEE_PERCENTAGE;
  const processingFee = baseAmount * PAYMENT_CONSTANTS.STRIPE_FEE_PERCENTAGE;
  const totalAmount = baseAmount + processingFee;
  const sellerReceives = baseAmount - platformFee;
  
  return {
    baseAmount: Math.round(baseAmount * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    processingFee: Math.round(processingFee * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    sellerReceives: Math.round(sellerReceives * 100) / 100
  };
};

/**
 * Validate payment amount
 * @param {number} amount - Amount to validate
 * @param {string} type - Payment type for specific validation
 * @returns {Object} Validation result with isValid and error message
 */
export const validatePaymentAmount = (amount, type = 'general') => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }
  
  if (numAmount < PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT) {
    return { isValid: false, error: `Minimum amount is $${PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT.toFixed(2)}` };
  }
  
  if (numAmount > PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT) {
    return { isValid: false, error: `Maximum amount is $${PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT.toFixed(2)}` };
  }
  
  if (type === 'donation' && numAmount < PAYMENT_CONSTANTS.MIN_DONATION_AMOUNT) {
    return { isValid: false, error: `Minimum donation is $${PAYMENT_CONSTANTS.MIN_DONATION_AMOUNT.toFixed(2)}` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Build selections array for invoice creation
 * @param {Object} components - AllInOne searchable components
 * @param {Object} selectedFiles - Selected file IDs
 * @param {Object} selectedOfflineItems - Selected offline items with quantities
 * @param {number|null} selectedDonation - Donation amount
 * @returns {Array} Formatted selections array
 */
export const buildAllInOneSelections = (components, selectedFiles = {}, selectedOfflineItems = {}, selectedDonation = null) => {
  const selections = [];
  
  // Add downloadable files
  if (components.downloadable?.enabled) {
    Object.entries(selectedFiles).forEach(([fileId, isSelected]) => {
      if (isSelected) {
        const file = components.downloadable.files.find(f => String(f.id) === String(fileId));
        if (file) {
          selections.push({
            id: file.id,
            component: 'downloadable',
            count: 1
          });
        }
      }
    });
  }
  
  // Add offline items
  if (components.offline?.enabled) {
    Object.entries(selectedOfflineItems).forEach(([itemId, count]) => {
      if (count > 0) {
        const item = components.offline.items.find(i => String(i.id) === String(itemId));
        if (item) {
          selections.push({
            id: item.id,
            component: 'offline',
            count: count
          });
        }
      }
    });
  }
  
  // Add donation
  if (components.donation?.enabled && selectedDonation) {
    selections.push({
      component: 'donation',
      amount: selectedDonation
    });
  }
  
  return selections;
};

/**
 * Calculate simple searchable total (downloadable, offline, direct)
 * @param {Object} publicData - Searchable public data
 * @param {Array} selections - Selected items
 * @returns {number} Total price
 */
export const calculateSimpleSearchableTotal = (publicData, selections) => {
  if (!publicData || !selections || selections.length === 0) return 0;
  
  const searchableType = publicData.type || 'downloadable';
  let total = 0;
  
  switch (searchableType) {
    case 'downloadable':
      const files = publicData.downloadableFiles || [];
      selections.forEach(sel => {
        const file = files.find(f => f.fileId === sel.id);
        if (file) {
          total += parseFloat(file.price) || 0;
        }
      });
      break;
      
    case 'offline':
      const items = publicData.offlineItems || [];
      selections.forEach(sel => {
        const item = items.find(i => i.itemId === sel.id);
        if (item) {
          total += (parseFloat(item.price) || 0) * (sel.count || 1);
        }
      });
      break;
      
    case 'direct':
      selections.forEach(sel => {
        total += parseFloat(sel.amount) || 0;
      });
      break;
  }
  
  return Math.round(total * 100) / 100;
};

/**
 * Format selections for balance payment
 * @param {Object} searchableData - Full searchable data
 * @param {Array} selections - Raw selections
 * @returns {Array} Formatted selections with names and prices
 */
export const formatSelectionsForBalancePayment = (searchableData, selections) => {
  const publicData = searchableData.payloads?.public || {};
  const searchableType = publicData.type || 'downloadable';
  const formattedSelections = [];
  
  if (searchableType === 'allinone') {
    const components = publicData.components || {};
    
    selections.forEach(sel => {
      if (sel.component === 'downloadable' && components.downloadable?.files) {
        const file = components.downloadable.files.find(f => String(f.id) === String(sel.id));
        if (file) {
          formattedSelections.push({
            id: file.id,
            name: file.name,
            price: parseFloat(file.price) || 0,
            type: 'downloadable'
          });
        }
      } else if (sel.component === 'offline' && components.offline?.items) {
        const item = components.offline.items.find(i => String(i.id) === String(sel.id));
        if (item) {
          // Add one entry per quantity for proper receipt display
          for (let i = 0; i < sel.count; i++) {
            formattedSelections.push({
              id: item.id,
              name: item.name,
              price: parseFloat(item.price) || 0,
              type: 'offline'
            });
          }
        }
      } else if (sel.component === 'donation') {
        formattedSelections.push({
          id: 'donation',
          name: 'Support Creator',
          price: parseFloat(sel.amount) || 0,
          type: 'donation'
        });
      }
    });
  } else {
    // Handle legacy searchable types
    selections.forEach(sel => {
      formattedSelections.push({
        id: sel.id,
        name: sel.name || `Item ${sel.id}`,
        price: parseFloat(sel.price) || 0,
        type: searchableType
      });
    });
  }
  
  return formattedSelections;
};