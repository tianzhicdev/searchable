import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress, Divider,
  TextField, MenuItem, Select, FormControl, InputLabel, Tooltip
} from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PersonIcon from '@material-ui/icons/Person';
import AddIcon from '@material-ui/icons/Add';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import LocationOffIcon from '@material-ui/icons/LocationOff';

import { LOGOUT } from './../../store/actions';
import configData from '../../config';


const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(2)
  },
  header: {
    marginBottom: theme.spacing(3)
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(3)
  },
  welcomeText: {
    marginRight: theme.spacing(2),
    color: theme.palette.text.primary
  },
  actionButton: {
    color: theme.palette.text.primary,
    marginRight: theme.spacing(1),
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    minWidth: 'unset',
    padding: theme.spacing(1),
  },
  leftButtons: {
    display: 'flex',
  },
  rightButtons: {
    display: 'flex',
    marginLeft: 'auto',
  },
  searchHeader: {
    marginBottom: theme.spacing(3)
  },
  searchBar: {
    display: 'flex',
  },
  searchInput: {
    flexGrow: 1,
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      // border: '0px solid #000000',
    },
    '& .MuiOutlinedInput-input': {
      backgroundColor: theme.palette.background.paper,
      // padding: '10px',
      width: '100%',
      // fontSize: '16px',
      borderRadius: 0,
    },
    '& .MuiInputBase-root': {
      borderRadius: 0,
      border: theme.borders.main,
    },
    '& .css-snakna-MuiInputBase-root-MuiOutlinedInput-root': {
      borderRadius: 0,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
      // border: '1px solid #000000',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
      // border: '1px solid #000000',
    },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
      border: theme.borders.main,
    },
    '& input[type="text"], & input[type="number"], & textarea': {
      width: '100%',
      // padding: '10px',
      border: '0px solid #ddd',
      borderRadius: 0,
      // fontSize: '16px',
    }
  },
  distanceSelect: {
    // minWidth: 120,
    // marginRight: theme.spacing(2),
    '& .MuiFormControl-root': {
      borderRadius: 0,
      border: theme.borders.main,
    },
    '& .MuiOutlinedInput-input': {
      backgroundColor: theme.palette.background.paper,
      borderRadius: 0,
    },
    '& .MuiInputBase-root': {
      borderRadius: 0,
    },
    '& .MuiFormControl-root': {
      borderRadius: 0,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0
    },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderRadius: 0,
      border: theme.borders.main,
    },
    '& .css-1m5azdt-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input': {
      borderRadius: 0
    },
    '& .css-snakna-MuiInputBase-root-MuiOutlinedInput-root': {
      position: 'static'
    }
  },
  locationDisplay: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(1)
  },
  locationIcon: {
    marginRight: theme.spacing(1),
    border: theme.borders.main,
    borderRadius: '50%',
    padding: theme.spacing(0.5),
    backgroundColor: theme.palette.background.paper,
    // Make sure icon has proper contrast against background
    '& svg': {
      display: 'block'
    }
  },
  locationEnabled: {
    color: theme.palette.success.main
  },
  locationDisabled: {
    color: theme.palette.error.main
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4)
  },
  error: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
    border: theme.borders.main,
    marginBottom: theme.spacing(2)
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    margin: theme.spacing(2, 0)
  },
  paginationButton: {
    fontWeight: 'bold',
    color: theme.palette.text.primary,
    marginRight: theme.spacing(1),
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius
  },
  activeButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText
  },
  searchableItem: {
    cursor: 'pointer',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: theme.borders.main,
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },
  itemTitle: {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    fontWeight: 500
  },
  itemDescription: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1)
  },
  itemInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: theme.spacing(1)
  },
  infoItem: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  noResults: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.palette.text.secondary
  },
  componentBorder: {
    // border: theme.borders.main
  }
}));

const Searchables = () => {
  const classes = useStyles();
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
          className={classes.paginationButton}
          size="small"
        >
          &laquo;
        </Button>
      );
    }

    // Current page button
    buttons.push(
      <Button 
        key={page} 
        className={`${classes.paginationButton} ${classes.activeButton}`}
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
          className={classes.paginationButton}
          size="small"
        >
          &raquo;
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
            
            // Force the LOGOUT
            //if (response.data.success) {
                dispatcher({ type: LOGOUT });
            //} else {
            //    console.log('response - ', response.data.msg);
            //}
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
    <Grid container className={classes.container}>
      <Grid item xs={12} className={classes.header}>
        <Box className={classes.userInfo}>
          <Box className={classes.leftButtons}>
            <Button 
              variant="contained" 
              className={classes.actionButton} 
              onClick={handleProfileClick}
            >
              <PersonIcon />
            </Button>
            <Button 
              variant="contained" 
              className={classes.actionButton} 
              onClick={handleLogout}
            >
              <ExitToAppIcon />
            </Button>
          </Box>
          
          <Box className={classes.rightButtons}>
            <Button 
              variant="contained" 
              color="primary" 
              className={classes.actionButton} 
              onClick={handleAddNew}
            >
              <AddIcon />
            </Button>
          </Box>
        </Box>
      </Grid>
      
      <Grid item xs={12} className={classes.searchHeader}>
        <Paper elevation={2} className={classes.componentBorder}>
          <Box p={2}>
            <Box className={classes.searchBar}>
              <TextField
                className={classes.searchInput}
                size="small"
                placeholder="Search for items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button 
                onClick={() => handleSearch(1)} 
                disabled={loading}
                className={classes.actionButton}
              >
                Search
              </Button>
              <FormControl variant="outlined" size="small" className={classes.distanceSelect}>
                <Select
                  labelId="distance-select-label"
                  value={maxDistance}
                  onChange={(e) => {
                    const newDistance = Number(e.target.value);
                    setMaxDistance(newDistance);
                    // Trigger search with page 1 when distance changes
                    setTimeout(() => handleSearch(1), 0);
                  }}
                >
                  <MenuItem value={1000}>1 km</MenuItem>
                  <MenuItem value={5000}>5 km</MenuItem>
                  <MenuItem value={10000}>10 km</MenuItem>
                  <MenuItem value={50000}>50 km</MenuItem>
                  <MenuItem value={100000}>100 km</MenuItem>
                  <MenuItem value={1000000}>1000 km</MenuItem>
                </Select>
              </FormControl>
              
            </Box>
          </Box>
        </Paper>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Paper className={classes.error}>
            <Typography variant="body1">{error}</Typography>
          </Paper>
        </Grid>
      )}

      {loading && (
        <Grid item xs={12} className={classes.loading}>
          <CircularProgress className={classes.componentBorder} />
          <Typography variant="body1" style={{ marginLeft: 16 }}>
            Loading results...
          </Typography>
        </Grid>
      )}

      {searchResults.length > 0 && (
        <>
          <Grid item xs={12}>
            {searchResults.map((item) => (
              <Paper 
                key={item.searchable_id} 
                className={classes.searchableItem}
                onClick={() => handleItemClick(item.searchable_id)}
                elevation={2}
              >
                <Typography variant="h6" className={classes.itemTitle}>
                  {item.title || `Item #${item.searchable_id}`}
                </Typography>
                {item.description && (
                  <Typography variant="body2" className={classes.itemDescription}>
                    {item.description}
                  </Typography>
                )}
                <Divider className={classes.componentBorder} style={{ margin: '8px 0' }} />
                <Box className={classes.itemInfo}>
                  <Typography variant="body2" className={classes.infoItem}>
                    Distance: {formatDistance(item.distance)}
                  </Typography>
                  {item.category && (
                    <Typography variant="body2" className={classes.infoItem}>
                      Category: {item.category}
                    </Typography>
                  )}
                  {item.price && (
                    <Typography variant="body2" className={classes.infoItem}>
                      Price: ${item.price}
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Grid>

          <Grid item xs={12} className={classes.pagination}>
            {renderPaginationButtons()}
          </Grid>
        </>
      )}

      {!loading && searchResults.length === 0 && !initialItemsLoaded && (
        <Grid item xs={12}>
          <Paper className={classes.noResults} elevation={2}>
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
