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
 * @returns {Object} Object containing email, password, and username for guest account
 */
export const generateGuestCredentials = () => {
    const randomString = generateRandomString(7);
    return {
        email: `guest${randomString}@guest.com`,
        password: '12345',
        username: `guest${randomString}`
    };
};

/**
 * Checks if a user is a guest user based on email pattern
 * @param {string} email - User email
 * @returns {boolean} True if user is a guest
 */
export const isGuestUser = (email) => {
    return email && email.includes('@guest.com') && email.startsWith('guest');
};