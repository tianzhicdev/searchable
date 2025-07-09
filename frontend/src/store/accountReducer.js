// action - state management
import { ACCOUNT_INITIALIZE, LOGIN, LOGOUT, SET_USER } from './actions';

export const initialState = {
    token: '',
    isLoggedIn: false,
    isInitialized: false,
    user: null
};

//-----------------------|| ACCOUNT REDUCER ||-----------------------//

const accountReducer = (state = initialState, action) => {
    switch (action.type) {
        case ACCOUNT_INITIALIZE: {
            const { isLoggedIn, user, token } = action.payload;
            return {
                ...state,
                isLoggedIn,
                isInitialized: true,
                token,
                user
            };
        }
        case LOGIN: {
            const { user } = action.payload;
            // Extract token from payload if available
            // const { token } = user;
            // console.log("LOGIN user", user);
            
            // // Update localStorage with token
            // if (token) {
            //     localStorage.setItem('token', token);
            // }
            
            // // Update visitorId in localStorage if present in user object
            // if (user && user.visitorId) {
            //     localStorage.setItem('visitorId', user.visitorId);
            // }
            return {
                ...state,
                isLoggedIn: true,
                user
            };
        }
        case LOGOUT: {
            return {
                ...state,
                isLoggedIn: false,
                token: '',
                user: null
            };
        }
        case SET_USER: {
            const { payload } = action;
            // console.log("SET_USER payload", payload);
            // const { user } = action.payload;
            // const { token } = user;

            // console.log("SET_USER user", user);
            // // Update localStorage with token
            // if (token) {
            //     localStorage.setItem('token', token);
            // }
            
            // // Update visitorId in localStorage if present in user object
            // if (user && user.visitorId) {
            //     localStorage.setItem('visitorId', user.visitorId);
            // }

            state.user = {
                ...state.user,
                ...payload
            };
            return { ...state };
        }
        default: {
            return { ...state };
        }
    }
};

export default accountReducer;
