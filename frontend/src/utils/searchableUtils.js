/**
 * Shared utility functions for searchable components
 */

/**
 * Format currency amount as USD
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format currency amount for any currency type
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (e.g., 'USD', 'EUR', 'BTC')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  // Handle null/undefined amounts
  if (amount == null || isNaN(amount)) {
    return formatUSD(0);
  }

  // Normalize currency code
  const currencyUpper = (currency || 'USD').toUpperCase();
  
  // Special handling for crypto currencies
  if (currencyUpper === 'BTC') {
    return `${parseFloat(amount).toFixed(8)} BTC`;
  }
  
  if (currencyUpper === 'USDT') {
    return `${parseFloat(amount).toFixed(2)} USDT`;
  }
  
  // For fiat currencies, use Intl.NumberFormat
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyUpper,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback to USD if currency is not supported
    return formatUSD(amount);
  }
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Common validation patterns for searchable forms
 */
export const validationRules = {
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },
  
  minLength: (value, minLength, fieldName) => {
    if (value && value.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`;
    }
    return null;
  },
  
  positiveNumber: (value, fieldName) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },
  
  minPrice: (value, minAmount = 0.01) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < minAmount) {
      return `Price must be at least $${minAmount.toFixed(2)}`;
    }
    return null;
  }
};

/**
 * Validate an array of items (files, offline items, etc.)
 * @param {Array} items - Array of items to validate
 * @param {string} itemType - Type of items for error messages
 * @returns {string|null} Error message or null if valid
 */
export const validateItemsArray = (items, itemType = 'items') => {
  if (!items || items.length === 0) {
    return `Please add at least one ${itemType}`;
  }
  return null;
};

/**
 * Common payload structure for searchable creation
 * @param {Object} formData - Form data
 * @param {string} type - Searchable type
 * @param {Array} images - Image URIs
 * @param {Object} typeSpecificData - Type-specific payload data
 * @returns {Object} Complete payload structure
 */
export const createSearchablePayload = (formData, type, images, typeSpecificData = {}) => {
  return {
    payloads: {
      public: {
        title: formData.title,
        description: formData.description,
        currency: formData.currency || 'usd',
        type: type,
        images: images,
        visibility: {
          udf: "always_true",
          data: {}
        },
        ...typeSpecificData
      }
    }
  };
};

/**
 * Common invoice creation payload
 * @param {number} searchableId - Searchable ID
 * @param {Array} selections - Selected items/files
 * @param {number} totalPrice - Total price
 * @param {Object} user - User object
 * @returns {Object} Invoice payload
 */
export const createInvoicePayload = (searchableId, selections, totalPrice, user = null) => {
  const payload = {
    searchable_id: parseInt(searchableId),
    invoice_type: 'stripe',
    currency: 'usd',
    selections,
    total_price: totalPrice,
    success_url: `${window.location.origin}${window.location.pathname}`,
    cancel_url: `${window.location.origin}${window.location.pathname}`
  };

  // Add user data if available
  if (user) {
    payload.address = user.address || '';
    payload.tel = user.tel || '';
  }

  return payload;
};

/**
 * Generate unique ID for temporary items
 * @returns {number} Timestamp-based ID
 */
export const generateTempId = () => Date.now();

/**
 * Safe number parsing with fallback
 * @param {any} value - Value to parse
 * @param {number} fallback - Fallback value if parsing fails
 * @returns {number} Parsed number or fallback
 */
export const safeParseFloat = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Debounce function for input handlers
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};