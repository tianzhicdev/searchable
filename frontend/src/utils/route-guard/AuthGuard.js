import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { LOGOUT } from '../../store/actions';


//-----------------------|| AUTH GUARD ||-----------------------//

/**
 * Authentication guard for routes
 * @param {PropTypes.node} children children element/node
 */
const AuthGuard = ({ children }) => {

    const account = useSelector((state) => state.account);
    const dispatcher = useDispatch();
    // Log the account state for debugging
    console.log('AuthGuard: Account state:', account);
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

    // Log user authentication attempt
    console.log('AuthGuard: Authentication check', { 
        isLoggedIn, 
        tokenExpired,
        timestamp: new Date().toISOString(),
        path: window.location.pathname
    });

    if (!isLoggedIn || tokenExpired) { 
        dispatcher({ type: LOGOUT });
        return <Redirect to="/login" />;
    }

    return children;
};

AuthGuard.propTypes = {
    children: PropTypes.node
};

export default AuthGuard;
