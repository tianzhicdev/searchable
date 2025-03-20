import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

// project imports
import config from '../../config';

//-----------------------|| GUEST GUARD ||-----------------------//

/**
 * Guest guard for routes having no auth required
 * @param {PropTypes.node} children children element/node
 */
const GuestGuard = ({ children }) => {
    const account = useSelector((state) => state.account);
    const { isLoggedIn, token } = account;

    // Function to check if JWT is expired
    const isTokenExpired = (token) => {
        if (!token) return true;
        const [, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        const expiryTime = decodedPayload.exp * 1000; // Convert to milliseconds
        return Date.now() > expiryTime;
    };

    const tokenExpired = isTokenExpired(token);
    // Log token status for debugging
    console.log('GuestGuard Token status:', {
        isLoggedIn,
        hasToken: !!token,
        tokenExpired,
        currentTime: Date.now(),
        expiryTime: token ? JSON.parse(atob(token.split('.')[1])).exp * 1000 : null
    });
    
    if (isLoggedIn && !tokenExpired) {
        console.log('User is logged in and token is valid, redirecting to dashboard');
        return <Redirect to={config.dashboard} />;
    }

    return children;
};

GuestGuard.propTypes = {
    children: PropTypes.node
};

export default GuestGuard;
