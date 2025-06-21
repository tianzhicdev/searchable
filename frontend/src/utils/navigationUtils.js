/**
 * Navigation utilities for handling back button navigation
 * Provides systematic solution for maintaining navigation context
 */

/**
 * Navigate to a page with reference to the current page
 * @param {object} history - React Router history object
 * @param {string} targetPath - Path to navigate to
 * @param {string} referrer - Current page path (optional, will use current location if not provided)
 * @param {object} additionalState - Additional state to pass
 */
export const navigateWithReferrer = (history, targetPath, referrer = null, additionalState = {}) => {
  const currentPath = referrer || history.location.pathname;
  
  history.push(targetPath, {
    referrer: currentPath,
    ...additionalState
  });
};

/**
 * Navigate back to the referrer page or fallback
 * @param {object} history - React Router history object
 * @param {string} fallbackPath - Default path if no referrer is found
 */
export const navigateBack = (history, fallbackPath = '/searchables') => {
  const state = history.location.state;
  const referrer = state?.referrer;
  
  if (referrer) {
    history.push(referrer);
  } else {
    history.push(fallbackPath);
  }
};

/**
 * Get the referrer from the current location state
 * @param {object} location - React Router location object
 * @returns {string|null} - The referrer path or null
 */
export const getReferrer = (location) => {
  return location.state?.referrer || null;
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
 * Get appropriate back button text based on referrer
 * @param {object} location - React Router location object
 * @returns {string} - Back button text
 */
export const getBackButtonText = (location) => {
  const referrer = getReferrer(location);
  
  switch (referrer) {
    case '/my-downloads':
      return 'Back to Downloads';
    case '/my-purchases':
      return 'Back to Purchases';
    case '/profile':
      return 'Back to Profile';
    case '/searchables':
      return 'Back to Browse';
    default:
      return 'Back';
  }
};

/**
 * Get appropriate fallback path based on referrer
 * @param {object} location - React Router location object
 * @returns {string} - Fallback path
 */
export const getFallbackPath = (location) => {
  const referrer = getReferrer(location);
  
  if (referrer) {
    return referrer;
  }
  
  return '/searchables';
};