import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import configData from '../../config';
import SearchablesProfile from './SearchablesProfile';

const SearchableList = ({ criteria }) => {
    
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: parseInt(localStorage.getItem('searchablesPage')) || 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [initialItemsLoaded, setInitialItemsLoaded] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const account = useSelector((state) => state.account);
  const location = useSelector((state) => state.location);
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
  //todo: need to understand this 
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

  // Load initial random items when location is available
  useEffect(() => {
    if (location.latitude && location.longitude) {
      if (localStorage.getItem('searchablesPage')) {
        handleSearch(parseInt(localStorage.getItem('searchablesPage')));
      } else {
        handleSearch(1)
      }
    }
  }, [location.latitude, location.longitude, criteria.searchTerm, criteria.distance, criteria.internalSearchTerm]);

  // Function to handle search
  const handleSearch = async (page = 1) => {
    if (!location.latitude || !location.longitude) {
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
          max_distance: criteria.distance,
          page_number: page,
          page_size: calculateOptimalPageSize(),
          query_term: criteria.searchTerm,
          internal_search_term: criteria.internalSearchTerm
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
      
      // Save current search state to localStorage
      localStorage.setItem('searchablesPage', response.data.pagination.page);
      localStorage.setItem('searchablesTerm', criteria.searchTerm);
      localStorage.setItem('searchablesMaxDistance', criteria.distance);
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

  // Handle clicking on an item
  const handleItemClick = (itemId) => {
    history.push(`/searchable-item/${itemId}`);
  };

  return (
    <>
      {error && (
        <Grid item xs={12}>
          <Paper>
            <Typography variant="body1">{error}</Typography>
          </Paper>
        </Grid>
      )}

      {loading && (
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
    </>
  );
};

export default SearchableList; 