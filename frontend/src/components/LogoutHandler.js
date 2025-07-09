import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import configData from '../config';
import { LOGOUT } from '../store/actions';
import { isGuestUser } from '../utils/guestUtils';

/**
 * Custom hook for handling logout functionality
 * @returns {Function} handleLogout function
 */
export const useLogout = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const account = useSelector((state) => state.account);

    const handleLogout = () => {

        // Check if user is a guest user
        const userIsGuest = account.user && isGuestUser(account.user.email);
        
        // Clear any stored state
        localStorage.removeItem('searchablesPage');
        localStorage.removeItem('searchTerm');
        localStorage.removeItem('searchablesFilters');
        
        // Set a flag to prevent auto guest creation after logout
        sessionStorage.setItem('userLoggedOut', 'true');
        
        if (userIsGuest) {
            
            // For guest users, just clear the state immediately
            dispatch({ type: LOGOUT });
            history.push('/login');
        } else {
            
            // For regular users, call the backend logout endpoint
            axios
                .post(configData.API_SERVER + 'users/logout', 
                    { token: `${account.token}` }, 
                    { headers: { Authorization: `${account.token}` } }
                )
                .then(function (response) {
                    dispatch({ type: LOGOUT });
                    history.push('/login');
                })
                .catch(function (error) {
                    
                    dispatch({ type: LOGOUT }); // log out anyway
                    history.push('/login');
                });
        }
    };

    return handleLogout;
};