/**
 * Navigation utilities for handling back button navigation with stack-based tracking
 * Provides systematic solution for maintaining navigation context and preventing loops
 */

/**
 * Get navigation stack from current location or create new one
 * @param {object} location - React Router location object
 * @returns {Array} - Navigation stack
 */
const getNavigationStack = (location) => {
  return location.state?.navigationStack || [];
};

/**
 * Navigate to a page with stack-based navigation tracking
 * @param {object} history - React Router history object
 * @param {string} targetPath - Path to navigate to
 * @param {object} options - Navigation options
 * @param {boolean} options.addToStack - Whether to add current page to stack (default: true)
 * @param {boolean} options.replaceStack - Whether to replace the entire stack (default: false)
 * @param {object} options.additionalState - Additional state to pass
 */
export const navigateWithStack = (history, targetPath, options = {}) => {
  const { 
    addToStack = true, 
    replaceStack = false, 
    additionalState = {} 
  } = options;
  
  // Include query parameters in the current path
  const currentPath = history.location.pathname + history.location.search;
  let navigationStack = getNavigationStack(history.location);
  
  if (replaceStack) {
    // Start fresh navigation stack
    navigationStack = [];
  } else if (addToStack) {
    // Add current page to stack, but avoid duplicates and loops
    const lastInStack = navigationStack[navigationStack.length - 1];
    
    // Only add to stack if:
    // 1. Stack is empty, OR
    // 2. Current path is different from the last item in stack
    if (navigationStack.length === 0 || lastInStack !== currentPath) {
      navigationStack = [...navigationStack, currentPath];
    }
  }
  
  history.push(targetPath, {
    navigationStack,
    ...additionalState
  });
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use navigateWithStack instead
 */
export const navigateWithReferrer = (history, targetPath, referrer = null, additionalState = {}) => {
  navigateWithStack(history, targetPath, { additionalState });
};

/**
 * Navigate back using the navigation stack to prevent loops
 * @param {object} history - React Router history object
 * @param {string} fallbackPath - Default path if no navigation history is found
 */
export const navigateBack = (history, fallbackPath = '/search') => {
  const navigationStack = getNavigationStack(history.location);
  const currentPath = history.location.pathname + history.location.search;
  
  // Find the last page in the stack that is different from current page
  let targetPath = null;
  for (let i = navigationStack.length - 1; i >= 0; i--) {
    if (navigationStack[i] !== currentPath) {
      targetPath = navigationStack[i];
      break;
    }
  }
  
  if (targetPath) {
    // Remove the pages from stack up to and including the target
    const targetIndex = navigationStack.lastIndexOf(targetPath);
    const newStack = navigationStack.slice(0, targetIndex);
    
    history.push(targetPath, {
      navigationStack: newStack
    });
  } else {
    // No valid back navigation found, go to fallback
    history.push(fallbackPath, {
      navigationStack: []
    });
  }
};

/**
 * Navigate back to the original entry point (first page in stack)
 * @param {object} history - React Router history object
 * @param {string} fallbackPath - Default path if no navigation history is found
 */
export const navigateToOrigin = (history, fallbackPath = '/search') => {
  const navigationStack = getNavigationStack(history.location);
  
  if (navigationStack.length > 0) {
    const originPath = navigationStack[0];
    history.push(originPath, {
      navigationStack: []
    });
  } else {
    history.push(fallbackPath, {
      navigationStack: []
    });
  }
};

/**
 * Get the immediate referrer from navigation stack
 * @param {object} location - React Router location object
 * @returns {string|null} - The referrer path or null
 */
export const getReferrer = (location) => {
  const navigationStack = getNavigationStack(location);
  const currentPath = location.pathname + location.search;
  
  // Find the last page in the stack that is different from current page
  for (let i = navigationStack.length - 1; i >= 0; i--) {
    if (navigationStack[i] !== currentPath) {
      return navigationStack[i];
    }
  }
  
  return null;
};

/**
 * Get the original entry point from navigation stack
 * @param {object} location - React Router location object
 * @returns {string|null} - The original entry path or null
 */
export const getOriginPath = (location) => {
  const navigationStack = getNavigationStack(location);
  return navigationStack.length > 0 ? navigationStack[0] : null;
};

/**
 * Check if the current page was navigated to from a specific path
 * @param {object} location - React Router location object
 * @param {string} expectedReferrer - Expected referrer path
 * @returns {boolean} - True if navigated from the expected referrer
 */
export const isReferredFrom = (location, expectedReferrer) => {
  const referrer = getReferrer(location);
  return referrer === expectedReferrer;
};

/**
 * Check if the current page originated from a specific path
 * @param {object} location - React Router location object
 * @param {string} expectedOrigin - Expected origin path
 * @returns {boolean} - True if navigation originated from the expected path
 */
export const isOriginatedFrom = (location, expectedOrigin) => {
  const originPath = getOriginPath(location);
  return originPath === expectedOrigin;
};

/**
 * Get appropriate back button text based on navigation stack
 * @param {object} location - React Router location object
 * @returns {string} - Back button text
 */
export const getBackButtonText = (location) => {
  return 'Back';
};

/**
 * Get appropriate fallback path based on navigation stack
 * @param {object} location - React Router location object
 * @returns {string} - Fallback path
 */
export const getFallbackPath = (location) => {
  const referrer = getReferrer(location);
  
  if (referrer) {
    return referrer;
  }
  
  return '/search';
};

/**
 * Debug function to log navigation stack
 * @param {object} location - React Router location object
 * @param {string} label - Label for the debug log
 */
export const debugNavigationStack = (location, label = 'Navigation Stack') => {
  const navigationStack = getNavigationStack(location);
  const currentPath = location.pathname;
  console.log(`${label}:`, {
    currentPath,
    navigationStack,
    referrer: getReferrer(location),
    origin: getOriginPath(location)
  });
};