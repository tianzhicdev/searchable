import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import config from '../../config';

// redux
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import { getVisitorId } from '../visitorUtils';

// ==============================|| OPTIONAL AUTH GUARD ||============================== //

/**
 * Optional authentication guard - allows both authenticated users and guests
 * Ensures visitor ID is generated for guest users
 */
const OptionalAuthGuard = ({ children }) => {
    const account = useSelector((state) => state.account);
    const history = useHistory();

    useEffect(() => {
        // Check if in mock mode
        if (config.isMockMode) {
            return;
        }

        // If user is logged in, check token validity
        if (account.isLoggedIn && account.token) {
            try {
                const decoded = jwtDecode(account.token);
                const currentTime = Date.now() / 1000;
                
                if (decoded.exp < currentTime) {
                    // Token expired, redirect to login
                    history.push('/login');
                }
            } catch (error) {
                console.error('Invalid token:', error);
                history.push('/login');
            }
        } else {
            // Guest user - ensure visitor ID exists
            getVisitorId();
        }
    }, [account, history]);

    return children;
};

OptionalAuthGuard.propTypes = {
    children: PropTypes.node
};

export default OptionalAuthGuard;