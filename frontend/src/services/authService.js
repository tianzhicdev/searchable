import axios from 'axios';
import configData from '../config';
import backend from '../views/utilities/Backend';
import { ACCOUNT_INITIALIZE } from '../store/actions';

/**
 * Shared authentication service for login and registration
 * Ensures consistent behavior across all authentication flows
 */

export const loginUser = async (email, password) => {
  const response = await axios.post(configData.API_SERVER + 'users/login', {
    email,
    password
  });
  
  if (!response.data.success) {
    throw new Error(response.data.msg || 'Login failed');
  }
  
  return response.data;
};

export const registerUser = async (username, email, password) => {
  const response = await axios.post(configData.API_SERVER + 'users/register', {
    username,
    password,
    email
  });
  
  if (!response.data.success) {
    throw new Error(response.data.msg || 'Registration failed');
  }
  
  return response.data;
};

export const handleSuccessfulAuth = (dispatch, responseData) => {
  console.log("Auth Service: Handling successful auth", responseData);
  
  // Store token
  const token = responseData.token;
  localStorage.setItem('serviceToken', token);
  
  // Clear any logout flags
  sessionStorage.removeItem('userLoggedOut');
  
  // Configure backend with token (use lowercase 'authorization')
  // Check if backend has defaults property (axios instance)
  if (backend.defaults && backend.defaults.headers) {
    backend.defaults.headers.common['authorization'] = token;
  }
  
  // Update Redux store with the full user object from response
  const reduxPayload = { 
    isLoggedIn: true, 
    user: responseData.user, 
    token: responseData.token 
  };
  
  console.log("Auth Service: Dispatching to Redux", reduxPayload);
  dispatch({
    type: ACCOUNT_INITIALIZE,
    payload: reduxPayload
  });
  
  // Extract user ID properly (backend returns _id with underscore)
  const userId = responseData.user?._id || responseData.user?.id || responseData.user_id;
  const username = responseData.user?.username || responseData.username;
  const email = responseData.user?.email;
  
  console.log("Auth Service: Extracted user data", { userId, username, email });
  
  return {
    userId: userId,
    username: username,
    email: email,
    token: token,
    user: responseData.user
  };
};

export const performLogin = async (dispatch, email, password) => {
  const loginData = await loginUser(email, password);
  return handleSuccessfulAuth(dispatch, loginData);
};

export const performRegistrationAndLogin = async (dispatch, username, email, password) => {
  // First register
  await registerUser(username, email, password);
  
  // Then login to get full user data and token
  const loginData = await loginUser(email, password);
  return handleSuccessfulAuth(dispatch, loginData);
};