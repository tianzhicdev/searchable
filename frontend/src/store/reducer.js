import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// reducer import
import customizationReducer from './customizationReducer';
import accountReducer from './accountReducer';
import locationReducer from './locationReducer';

//-----------------------|| COMBINE REDUCER ||-----------------------//

const reducer = combineReducers({
    account: persistReducer(
        {
            key: 'account',
            storage,
            keyPrefix: 'ungovernable-'
        },
        accountReducer
    ),
    customization: customizationReducer,
    location: persistReducer(
        {
            key: 'location',
            storage,
            keyPrefix: 'ungovernable-'
        },
        locationReducer
    )
});

export default reducer;
