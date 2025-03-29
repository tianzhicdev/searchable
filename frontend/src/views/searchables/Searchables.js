import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { 
  Grid, Typography, Button, Box, TextField, MenuItem, Select
} from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PersonIcon from '@material-ui/icons/Person';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';

import { LOGOUT } from './../../store/actions';
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles';
import { setLocation, setLocationError, setLocationLoading } from '../../store/locationReducer';
import SearchableList from './SearchableList';

const Searchables = () => {
  
  // State variables
  const [searchTerm, setSearchTerm] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('searchTerm') || localStorage.getItem('searchTerm') || '';
  });

  const [internalSearchTerm, setInternalSearchTerm] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('internalSearchTerm') || localStorage.getItem('internalSearchTerm') || '';
  });

  const [maxDistance, setMaxDistance] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlDistance = urlParams.get('maxDistance');
    return urlDistance ? parseInt(urlDistance) : 100000000;
  });
  // Get location from Redux store instead of local state
  const account = useSelector((state) => state.account);
  const dispatch = useDispatch();
  const history = useHistory();

  const classes = useComponentStyles();

  // Get user's location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Function to get user's geolocation
  const getUserLocation = () => {
    dispatch(setLocationError(null));
    dispatch(setLocationLoading(true));
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch(setLocation(
            position.coords.latitude,
            position.coords.longitude
          ));
        },
        (error) => {
          console.error("Error getting location:", error);
          // Only set error message, don't change the existing location
          dispatch(setLocationError("Unable to update your location. Using existing location data if available."));
          dispatch(setLocationLoading(false));
        }
      );
    } else {
      // Only set error message, don't change the existing location
      dispatch(setLocationError("Geolocation is not supported by your browser. Using existing location data if available."));
      dispatch(setLocationLoading(false));
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    console.log(account.token);
    
    axios
        .post(configData.API_SERVER + 'users/logout', {token: `${account.token}`}, { headers: { Authorization: `${account.token}` } })
        .then(function (response) {
            // Clear search state on logout
            localStorage.removeItem('searchablesPage');
            localStorage.removeItem('searchTerm');
            localStorage.removeItem('searchablesMaxDistance');
            dispatch({ type: LOGOUT });
        })
        .catch(function (error) {
            console.log('error - ', error);
            // Clear search state on logout
            localStorage.removeItem('searchablesPage');
            localStorage.removeItem('searchTerm');
            localStorage.removeItem('searchablesMaxDistance');
            dispatch({ type: LOGOUT }); // log out anyway
        });
  };

  // Handle navigation to publish page
  const handleAddNew = () => {
    history.push('/publish-searchables');
  };

  // Handle navigation to profile page
  const handleProfileClick = () => {
    history.push('/profile');
  };

  // Handle search button click
  const handleSearchButtonClick = () => {
    localStorage.setItem('searchTerm', searchTerm);
    localStorage.setItem('internalSearchTerm', internalSearchTerm);
    localStorage.setItem('searchablesMaxDistance', maxDistance);
    // Force re-render of SearchableList by updating the search criteria
    setSearchTerm(prevTerm => {
      // This is a trick to force the re-render even if the term didn't change
      const currentTerm = prevTerm;
      return currentTerm;
    });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box mb={2}>
            <Button 
              variant="contained" 
              onClick={handleProfileClick}
            >
              <PersonIcon />
            </Button>
            
            <Button 
              variant="contained" 
              onClick={handleLogout}
            >
              <ExitToAppIcon />
            </Button>
            
            <Button 
              variant="contained" 
              onClick={handleAddNew}
              style={{ float: 'right' }}
            >
              <AddIcon />
            </Button>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <TextField
            placeholder="Search for items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, marginRight: '16px' }}
            InputProps={{
              endAdornment: (
                <Button 
                  onClick={handleSearchButtonClick} 
                  style={{ padding: '4px', minWidth: 'unset' }}
                >
                  <SearchIcon/>
                </Button>
              ),
            }}
          />
          
          <Select
            labelId="distance-select-label"
            value={maxDistance}
            onChange={(e) => {
              const newDistance = Number(e.target.value);
              setMaxDistance(newDistance);
              localStorage.setItem('searchablesMaxDistance', newDistance);
            }}
            style={{ minWidth: '100px' }}
          >
            <MenuItem value={1000}>1 km</MenuItem>
            <MenuItem value={10000}>10 km</MenuItem>
            <MenuItem value={100000}>100 km</MenuItem>
            <MenuItem value={1000000}>1000 km</MenuItem>
            <MenuItem value={100000000}>Unlimited</MenuItem>
          </Select>
        </Box>
      </Grid>

      <SearchableList 
        criteria={{
          searchTerm: searchTerm,
          distance: maxDistance,
          internalSearchTerm: internalSearchTerm
        }}
      />
    </Grid>
  );
};

export default Searchables;
