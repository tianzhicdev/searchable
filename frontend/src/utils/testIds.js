/**
 * Test ID Utilities for Component Testing
 * Provides consistent test ID generation for Puppeteer QA testing
 */

/**
 * Generate a test ID following the standard naming convention
 * @param {string} componentType - Type of component (page, dialog, button, input, etc.)
 * @param {string} componentName - Name/context of the component
 * @param {string} elementType - Type of element (container, field, submit, etc.)
 * @returns {string} Formatted test ID
 */
export const generateTestId = (componentType, componentName, elementType) => {
  const parts = [componentType, componentName, elementType].filter(Boolean);
  return parts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
};

/**
 * Common test ID builders for frequent patterns
 */
export const testIds = {
  // Button patterns
  button: {
    submit: (context) => generateTestId('button', context, 'submit'),
    cancel: (context) => generateTestId('button', context, 'cancel'),
    save: (context) => generateTestId('button', context, 'save'),
    edit: (context) => generateTestId('button', context, 'edit'),
    delete: (context) => generateTestId('button', context, 'delete'),
    back: (context) => generateTestId('button', context, 'back'),
    create: (context) => generateTestId('button', context, 'create'),
    pay: (method) => generateTestId('button', 'pay', method),
    nav: (destination) => generateTestId('button', 'nav', destination)
  },

  // Input field patterns
  input: {
    field: (form, field) => generateTestId('input', form, `${field}-field`),
    email: (context = 'auth') => generateTestId('input', context, 'email-field'),
    password: (context = 'auth') => generateTestId('input', context, 'password-field'),
    search: (type = 'main') => generateTestId('input', type, 'search-field')
  },

  // Form patterns
  form: {
    container: (purpose) => generateTestId('form', purpose, 'container'),
    error: (field) => generateTestId('error', field, 'message')
  },

  // Dialog patterns
  dialog: {
    container: (type) => generateTestId('dialog', type, 'container'),
    header: (type) => generateTestId('dialog', type, 'header'),
    content: (type) => generateTestId('dialog', type, 'content'),
    footer: (type) => generateTestId('dialog', type, 'footer')
  },

  // Page patterns
  page: {
    container: (name) => generateTestId('page', name, 'container'),
    header: (name) => generateTestId('page', name, 'header'),
    content: (name) => generateTestId('page', name, 'content'),
    footer: (name) => generateTestId('page', name, 'footer')
  },

  // Navigation patterns
  nav: {
    menu: (type) => generateTestId('nav', type, 'menu'),
    item: (destination) => generateTestId('nav', destination, 'item'),
    link: (destination) => generateTestId('nav', destination, 'link')
  },

  // List patterns
  list: {
    container: (type) => generateTestId('list', type, 'container'),
    item: (type, id) => generateTestId('list', type, `item-${id}`),
    empty: (type) => generateTestId('list', type, 'empty-state')
  },

  // Card patterns
  card: {
    container: (type) => generateTestId('card', type, 'container'),
    header: (type) => generateTestId('card', type, 'header'),
    content: (type) => generateTestId('card', type, 'content'),
    actions: (type) => generateTestId('card', type, 'actions')
  },

  // Loading states
  loading: {
    spinner: (context) => generateTestId('spinner', context, 'loading'),
    overlay: (context) => generateTestId('overlay', context, 'loading'),
    skeleton: (context) => generateTestId('skeleton', context, 'loading')
  }
};

/**
 * Validation utility to check if test ID follows convention
 * @param {string} testId - Test ID to validate
 * @returns {boolean} Whether the test ID follows the convention
 */
export const isValidTestId = (testId) => {
  if (!testId || typeof testId !== 'string') return false;
  
  // Check format: component-type-element with optional additional parts
  const parts = testId.split('-');
  if (parts.length < 3) return false;
  
  // Check for invalid characters
  const validPattern = /^[a-z0-9-]+$/;
  return validPattern.test(testId) && !testId.includes('--');
};

/**
 * Development helper to extract test IDs from a component tree
 * @param {HTMLElement} element - Root element to scan
 * @returns {string[]} Array of found test IDs
 */
export const extractTestIds = (element) => {
  if (!element) return [];
  
  const testIds = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  let node = walker.currentNode;
  while (node) {
    const testId = node.getAttribute('data-testid');
    if (testId) {
      testIds.push(testId);
    }
    node = walker.nextNode();
  }
  
  return testIds;
};

/**
 * Development helper to find duplicate test IDs
 * @param {HTMLElement} element - Root element to scan
 * @returns {string[]} Array of duplicate test IDs
 */
export const findDuplicateTestIds = (element) => {
  const testIds = extractTestIds(element);
  const seen = new Set();
  const duplicates = new Set();
  
  testIds.forEach(id => {
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  });
  
  return Array.from(duplicates);
};

/**
 * Create test ID props object for spreading into components
 * @param {string} componentType - Type of component
 * @param {string} componentName - Name/context of the component  
 * @param {string} elementType - Type of element
 * @returns {object} Props object with data-testid
 */
export const testIdProps = (componentType, componentName, elementType) => ({
  'data-testid': generateTestId(componentType, componentName, elementType)
});

// Export common test ID constants for high-usage components
export const commonTestIds = {
  // Authentication
  AUTH_LOGIN_FORM: 'form-auth-login-container',
  AUTH_LOGIN_EMAIL: 'input-auth-email-field',
  AUTH_LOGIN_PASSWORD: 'input-auth-password-field',
  AUTH_LOGIN_SUBMIT: 'button-auth-login-submit',
  
  // Navigation
  NAV_HEADER_MENU: 'nav-header-menu',
  NAV_USER_DROPDOWN: 'nav-user-dropdown',
  NAV_LOGOUT_BUTTON: 'button-nav-logout',
  
  // Payment
  PAY_BUTTON_STRIPE: 'button-pay-stripe',
  PAY_BUTTON_USDT: 'button-pay-usdt', 
  PAY_BUTTON_BALANCE: 'button-pay-balance',
  
  // Search
  SEARCH_INPUT: 'input-main-search-field',
  SEARCH_RESULTS: 'list-search-results-container',
  SEARCH_EMPTY: 'list-search-empty-state'
};

export default {
  generateTestId,
  testIds,
  isValidTestId,
  extractTestIds,
  findDuplicateTestIds,
  testIdProps,
  commonTestIds
};