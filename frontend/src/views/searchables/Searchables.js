import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress, Divider,
  TextField, MenuItem, Select, FormControl, InputLabel, Tooltip
} from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PersonIcon from '@material-ui/icons/Person';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';

import { LOGOUT } from './../../store/actions';
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import SearchablesProfile from './SearchablesProfile';

const Searchables = () => {
  
  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10, // This will be calculated dynamically
    totalCount: 0,
    totalPages: 0
  });
  const [maxDistance, setMaxDistance] = useState(100000); // Default 100km
  const [initialItemsLoaded, setInitialItemsLoaded] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const account = useSelector((state) => state.account);
  const dispatcher = useDispatch();
  const history = useHistory();

  const classes = useComponentStyles();

  // Calculate optimal page size based on viewport height
  const calculateOptimalPageSize = () => {
    // Estimate the height of a single item (including margins)
    const estimatedItemHeight = 180; // pixels, adjust based on your actual item heights
    // Calculate how many items can fit in viewport with some padding for header and footer
    const availableHeight = viewportHeight - 200; // subtract space for header, search bar, pagination
    let optimalPageSize = Math.max(3, Math.floor(availableHeight / estimatedItemHeight));
    
    // Cap it at reasonable limits
    if (optimalPageSize > 15) optimalPageSize = 15;
    if (optimalPageSize < 3) optimalPageSize = 3;
    
    return optimalPageSize;
  };

  // Update viewport height on resize
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update page size when viewport height changes
  useEffect(() => {
    const newPageSize = calculateOptimalPageSize();
    setPagination(prev => ({...prev, pageSize: newPageSize}));
  }, [viewportHeight]);

  // Get user's location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Load initial random items when location is available
  useEffect(() => {
    if (location && !initialItemsLoaded) {
      loadRandomItems();
    }
  }, [location, initialItemsLoaded]);

  // Function to get user's geolocation
  const getUserLocation = () => {
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to retrieve your location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Function to load random items initially
  const loadRandomItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(configData.API_SERVER + 'searchable/search', {
        params: {
          lat: location.latitude,
          long: location.longitude,
          max_distance: maxDistance,
          page_number: 1,
          page_size: calculateOptimalPageSize(), // Use calculated size instead of fixed
          query_term: '' // Empty query to get random items
        },
        headers: {
          Authorization: `${account.token}`
        }
      });

      setSearchResults(response.data.results);
      setPagination({
        page: response.data.pagination.page,
        pageSize: response.data.pagination.page_size,
        totalCount: response.data.pagination.total_count,
        totalPages: response.data.pagination.total_pages
      });
      setInitialItemsLoaded(true);
    } catch (err) {
      console.error("Error loading initial items:", err);
      setError("An error occurred while loading initial items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle search
  const handleSearch = async (page = 1) => {
    if (!location) {
      setError("Location is required to search. Please enable location services.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(configData.API_SERVER + 'searchable/search', {
        params: {
          lat: location.latitude,
          long: location.longitude,
          max_distance: maxDistance,
          page_number: page,
          page_size: calculateOptimalPageSize(), // Use calculated size instead of fixed
          query_term: searchTerm
        },
        headers: {
          Authorization: `${account.token}`
        }
      });

      setSearchResults(response.data.results);
      setPagination({
        page: response.data.pagination.page,
        pageSize: response.data.pagination.page_size,
        totalCount: response.data.pagination.total_count,
        totalPages: response.data.pagination.total_pages
      });
    } catch (err) {
      console.error("Error searching:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle page change
  const handlePageChange = (newPage) => {
    handleSearch(newPage);
  };

  // Function to format distance
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const { page, totalPages } = pagination;

    // Previous button - only show if not on first page
    if (page > 1) {
      buttons.push(
        <Button 
          key="prev" 
          onClick={() => handlePageChange(page - 1)}
          size="small"
        >
          <ChevronLeftIcon />
        </Button>
      );
    }

    // Current page button
    buttons.push(
      <Button 
        key={page} 
        size="small"
      >
        {page}
      </Button>
    );

    // Next button - only show if not on last page
    if (page < totalPages) {
      buttons.push(
        <Button 
          key="next" 
          onClick={() => handlePageChange(page + 1)}
          size="small"
        >
          <ChevronRightIcon />
        </Button>
      );
    }

    return buttons;
  };

  // Function to handle logout
  const handleLogout = () => {
    console.log(account.token);
    
    axios
        .post(configData.API_SERVER + 'users/logout', {token: `${account.token}`}, { headers: { Authorization: `${account.token}` } })
        .then(function (response) {
            dispatcher({ type: LOGOUT });
        })
        .catch(function (error) {
            console.log('error - ', error);
            dispatcher({ type: LOGOUT }); // log out anyway
        });
  };

  // Add this function to handle navigation to publish page
  const handleAddNew = () => {
    history.push('/publish-searchables');
  };

  // Add this function to handle navigation to profile page
  const handleProfileClick = () => {
    history.push('/profile');
  };

  // Inside the Searchables component
  // Add this function to handle clicking on an item
  const handleItemClick = (itemId) => {
    history.push(`/searchable-item/${itemId}`);
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
                  onClick={() => handleSearch(1)} 
                  disabled={loading}
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
              // Trigger search with page 1 when distance changes
              setTimeout(() => handleSearch(1), 0);
            }}
            style={{ minWidth: '100px' }}
          >
            <MenuItem value={1000}>1 km</MenuItem>
            <MenuItem value={5000}>5 km</MenuItem>
            <MenuItem value={10000}>10 km</MenuItem>
            <MenuItem value={50000}>50 km</MenuItem>
            <MenuItem value={100000}>100 km</MenuItem>
            <MenuItem value={1000000}>1000 km</MenuItem>
          </Select>
        </Box>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Paper>
            <Typography variant="body1">{error}</Typography>
          </Paper>
        </Grid>
      )}

      {
      loading &&
       (
        <Grid item xs={12}>
          <Box my={2} display="flex" alignItems="center" justifyContent="center">
            <CircularProgress />
          </Box>
        </Grid>
      )}

      {searchResults.length > 0 && (
        <>
          <Grid item xs={12} >
            {searchResults.map((item) => (
              <SearchablesProfile 
                key={item.searchable_id}
                item={item}
                onClick={() => handleItemClick(item.searchable_id)} 
                formatDistance={formatDistance}
              />
            ))}
          </Grid>

          <Grid item xs={12}>
            <Box mt={2} mb={3} display="flex" justifyContent="center">
              {renderPaginationButtons()}
            </Box>
          </Grid>
        </>
      )}

      {!loading && searchResults.length === 0 && !initialItemsLoaded && (
        <Grid item xs={12}>
          <Paper elevation={2}>
            <Typography variant="body1">
              {pagination.totalCount === 0 ? 
                "No items found. Try adjusting your search criteria or increasing the distance." : 
                "Use the search button to find items near you."}
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default Searchables;
