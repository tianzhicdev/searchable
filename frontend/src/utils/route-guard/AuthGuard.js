import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { LOGOUT, ACCOUNT_INITIALIZE } from '../../store/actions';
import { isMockMode } from '../../mocks/mockBackend';

//-----------------------|| AUTH GUARD ||-----------------------//

/**
 * Authentication guard for routes
 * @param {PropTypes.node} children children element/node
 */
const AuthGuard = ({ children }) => {
    const account = useSelector((state) => state.account);
    const dispatcher = useDispatch();
    const { isLoggedIn, token, isInitialized } = account;
    // In mock mode, always allow access
    if (isMockMode) {
        .toISOString()
        });
        return children;
    }    

    // Wait for Redux persist to load
    // if (!isInitialized) {
    //     
    //     return <Redirect to="/login" />;
    // }

    // Function to check if JWT is expired
    const isTokenExpired = (token) => {
        if (!token) return true;
        try {
            const [, payload] = token.split('.');
            if (!payload) return true;
            const decodedPayload = JSON.parse(atob(payload));
            const expiryTime = decodedPayload.exp * 1000; // Convert to milliseconds
            return Date.now() > expiryTime;
        } catch (e) {
            
            return true; // If token is malformed, consider it expired
        }
    };

    const tokenExpired = isTokenExpired(token);

    // Log user authentication attempt
    .toISOString(),
        path: window.location.pathname
    });

    if (!isLoggedIn || tokenExpired || !isInitialized) { 
        .toISOString(),
            path: window.location.pathname
        });
        
        // // Check if user explicitly logged out
        // const userLoggedOut = sessionStorage.getItem('userLoggedOut');
        
        // if (userLoggedOut === 'true') {
        //     
        //     // Clear the flag for future visits
        //     sessionStorage.removeItem('userLoggedOut');
        //     return <Redirect to="/login" />;
        // }
        
        // Redirect to visitor section, passing the current path as intended destination

        return (
            <Redirect 
                to={{
                    pathname: "/visitor",
                    state: { from: window.location.pathname }
                }} 
            />
        );
    }

    return children;
};

AuthGuard.propTypes = {
    children: PropTypes.node
};

export default AuthGuard;
