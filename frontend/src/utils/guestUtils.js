// Utility functions for guest account management

/**
 * Generates a random string of specified length using alphanumeric characters
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 7) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

/**
 * Generates guest account credentials
 * @param {number} userId - Optional user ID to use for password generation
 * @returns {Object} Object containing email, password, and username for guest account
 */
export const generateGuestCredentials = (userId) => {
    const randomString = generateRandomString(7);
    return {
        email: `guest${randomString}@guest.com`,
        password: userId ? `guest_${userId}` : '12345',
        username: `guest${randomString}`
    };
};

/**
 * Checks if a user is a guest user based on profile data or email pattern
 * @param {Object} user - User object containing email and potentially profile data
 * @returns {boolean} True if user is a guest
 */
export const isGuestUser = (user) => {
    if (!user) return false;
    
    // First check the profile is_guest flag if available
    if (user.profile && typeof user.profile.is_guest === 'boolean') {
        return user.profile.is_guest;
    }
    
    // Fallback to email pattern for backward compatibility
    const email = typeof user === 'string' ? user : user.email;
    return email && (email.includes('@ec.com') && email.startsWith('guest_'));
};