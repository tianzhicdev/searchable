import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { SET_USER } from '../../store/actions';
import configData from '../../config';

const Terminal = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.account);
  const { isLoggedIn, token } = account;

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Only call the terminal API endpoint for logged in users
        if (isLoggedIn && token) {
          const response = await axios.get(configData.API_SERVER + 'v1/terminal', {
            headers: {
              authorization: `${token}`
            }
          });
          
          if (response.data && !response.data.error) {
            // Store terminal data in Redux
            dispatch({
                type: SET_USER,
                payload: response.data
            });
          } else {
            console.warn('Terminal API returned error:', response.data?.error || 'Unknown error');
          }
        }
      } catch (error) {
        console.error('Error initializing terminal:', error);
      }
    };

    initializeData();
  }, [dispatch, isLoggedIn, token]);

  return <></>;
};

export default Terminal;
