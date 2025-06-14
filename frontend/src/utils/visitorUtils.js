import { v4 as uuidv4 } from 'uuid';

const VISITOR_ID_KEY = 'searchable_visitor_id';
const VISITOR_ID_EXPIRY_KEY = 'searchable_visitor_id_expiry';
const VISITOR_ID_LIFETIME = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export const getVisitorId = () => {
    const storedId = localStorage.getItem(VISITOR_ID_KEY);
    const storedExpiry = localStorage.getItem(VISITOR_ID_EXPIRY_KEY);
    
    // Check if visitor ID exists and is not expired
    if (storedId && storedExpiry) {
        const expiryTime = parseInt(storedExpiry);
        if (Date.now() < expiryTime) {
            return storedId;
        }
    }
    
    // Generate new visitor ID
    const newVisitorId = `visitor_${uuidv4()}`;
    const newExpiry = Date.now() + VISITOR_ID_LIFETIME;
    
    localStorage.setItem(VISITOR_ID_KEY, newVisitorId);
    localStorage.setItem(VISITOR_ID_EXPIRY_KEY, newExpiry.toString());
    
    return newVisitorId;
};

export const clearVisitorId = () => {
    localStorage.removeItem(VISITOR_ID_KEY);
    localStorage.removeItem(VISITOR_ID_EXPIRY_KEY);
};

export const isVisitorId = (id) => {
    return id && id.startsWith('visitor_');
};

export const getAuthIdentifier = (account) => {
    // If user is logged in, return their user info
    if (account?.isLoggedIn && account?.user) {
        return {
            type: 'user',
            id: account.user.id,
            token: account.token
        };
    }
    
    // Otherwise, return visitor info
    return {
        type: 'visitor',
        id: getVisitorId(),
        token: null
    };
};