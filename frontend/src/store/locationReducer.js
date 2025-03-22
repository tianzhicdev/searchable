// Action Types
export const SET_LOCATION = 'SET_LOCATION';
export const SET_LOCATION_ERROR = 'SET_LOCATION_ERROR';
export const SET_LOCATION_LOADING = 'SET_LOCATION_LOADING';

// Action Creators
export const setLocation = (latitude, longitude) => ({
    type: SET_LOCATION,
    payload: { latitude, longitude }
});

export const setLocationError = (error) => ({
    type: SET_LOCATION_ERROR,
    payload: { error }
});

export const setLocationLoading = (isLoading) => ({
    type: SET_LOCATION_LOADING,
    payload: { isLoading }
});

// Initial State
const initialState = {
    latitude: null,
    longitude: null,
    error: null,
    isLoading: false
};

// Reducer
const locationReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_LOCATION:
            return {
                ...state,
                latitude: action.payload.latitude,
                longitude: action.payload.longitude,
                error: null,
                isLoading: false
            };
        case SET_LOCATION_ERROR:
            return {
                ...state,
                error: action.payload.error,
                isLoading: false
            };
        case SET_LOCATION_LOADING:
            return {
                ...state,
                isLoading: action.payload.isLoading
            };
        default:
            return state;
    }
};

export default locationReducer; 