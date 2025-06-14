import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { LOGOUT, ACCOUNT_INITIALIZE } from '../../store/actions';
import { isMockMode } from '../../mocks/mockBackend';
import { generateGuestCredentials } from '../guestUtils';
import configData from '../../config';
import axios from 'axios';


//-----------------------|| AUTH GUARD ||-----------------------//

/**
 * Authentication guard for routes
 * @param {PropTypes.node} children children element/node
 */
const AuthGuard = ({ children }) => {
    const [isCreatingGuest, setIsCreatingGuest] = useState(false);

    const account = useSelector((state) => state.account);
    const dispatcher = useDispatch();
    const { isLoggedIn, token, isInitialized } = account;
    // In mock mode, always allow access
    if (isMockMode) {
        console.log('AuthGuard: Mock mode - allowing access', { 
            path: window.location.pathname,
            timestamp: new Date().toISOString()
        });
        return children;
    }    
    console.log('[AUTH GUARD DEBUG] Account state:', account);
    console.log('[AUTH GUARD DEBUG] isLoggedIn:', isLoggedIn);
    console.log('[AUTH GUARD DEBUG] token exists:', !!token);
    console.log('[AUTH GUARD DEBUG] isInitialized:', isInitialized);
    
    // Wait for Redux persist to load
    if (!isInitialized) {
        console.log('[AUTH GUARD DEBUG] Waiting for Redux persist to initialize...');
        return <Redirect to="/login" />;
    }

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
            console.log('[AUTH GUARD DEBUG] Token parsing error:', e);
            return true; // If token is malformed, consider it expired
        }
    };

    const tokenExpired = isTokenExpired(token);



    // Log user authentication attempt
    console.log('AuthGuard: Authentication check', { 
        isLoggedIn, 
        tokenExpired,
        timestamp: new Date().toISOString(),
        path: window.location.pathname
    });

    /**
     * Creates a guest account automatically for unauthenticated users
     */
    const createGuestAccount = async () => {
        if (isCreatingGuest) return; // Prevent multiple simultaneous calls
        
        setIsCreatingGuest(true);
        console.log('AuthGuard: Creating guest account automatically');
        
        try {
            const guestCredentials = generateGuestCredentials();
            
            // First try to register the guest user
            const registerResponse = await axios.post(configData.API_SERVER + 'users/register', {
                username: guestCredentials.username,
                email: guestCredentials.email,
                password: guestCredentials.password
            });
            
            if (registerResponse.data.success) {
                // Now login the guest user
                const loginResponse = await axios.post(configData.API_SERVER + 'users/login', {
                    email: guestCredentials.email,
                    password: guestCredentials.password
                });
                
                if (loginResponse.data.success) {
                    console.log('AuthGuard: Guest account created and logged in successfully', {
                        username: guestCredentials.username,
                        email: guestCredentials.email
                    });
                    
                    // Clear the logout flag since user is now logged in
                    sessionStorage.removeItem('userLoggedOut');
                    
                    dispatcher({
                        type: ACCOUNT_INITIALIZE,
                        payload: { 
                            isLoggedIn: true, 
                            user: loginResponse.data.user, 
                            token: loginResponse.data.token 
                        }
                    });
                } else {
                    console.error('AuthGuard: Failed to login guest user', loginResponse.data);
                    setIsCreatingGuest(false);
                }
            } else {
                console.error('AuthGuard: Failed to register guest user', registerResponse.data);
                setIsCreatingGuest(false);
            }
        } catch (error) {
            console.error('AuthGuard: Error creating guest account', error);
            setIsCreatingGuest(false);
        }
    };

    if (!isLoggedIn || tokenExpired) { 
        console.log('AuthGuard: User not authenticated', {
            reason: !isLoggedIn ? 'user not logged in' : 'token expired',
            timestamp: new Date().toISOString(),
            path: window.location.pathname
        });
        
        // Check if user explicitly logged out
        const userLoggedOut = sessionStorage.getItem('userLoggedOut');
        
        if (userLoggedOut === 'true') {
            console.log('AuthGuard: User explicitly logged out, redirecting to login');
            // Clear the flag for future visits
            sessionStorage.removeItem('userLoggedOut');
            return <Redirect to="/login" />;
        }
        
        // Create guest account only if user didn't explicitly log out
        console.log('AuthGuard: Creating guest account automatically');
        createGuestAccount();
        
        // Show loading state while creating guest account
        if (isCreatingGuest) {
            return <div>Creating guest session...</div>;
        }
        
        // Fallback to login redirect if guest creation fails
        return <Redirect to="/login" />;
    }

    return children;
};

AuthGuard.propTypes = {
    children: PropTypes.node
};

export default AuthGuard;
