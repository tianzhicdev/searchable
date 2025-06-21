import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import SearchablesProfile from './SearchablesProfile';
import backend from '../utilities/Backend';
import { navigateWithReferrer } from '../../utils/navigationUtils';

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
  const history = useHistory();

  // Calculate optimal page size based on viewport height
  const calculateOptimalPageSize = () => {
    // Estimate the height of a single item (including margins)
    const estimatedItemHeight = 180; // pixels, adjust based on your actual item heights
    // Calculate how many items can fit in viewport with some padding for header and footer
    const availableHeight = viewportHeight - 200; // subtract space for header, search bar, pagination
    let optimalPageSize = Math.max(10, Math.floor(availableHeight / estimatedItemHeight));
    
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

  // Load initial items
  useEffect(() => {
    if (localStorage.getItem('searchablesPage')) {
      handleSearch(parseInt(localStorage.getItem('searchablesPage')));
    } else {
      handleSearch(1)
    }
  }, [criteria.searchTerm, criteria.filters]);

  // Function to handle search
  const handleSearch = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await backend.get('v1/searchable/search', {
        params: {
          page: page,
          page_size: calculateOptimalPageSize(),
          q: criteria.searchTerm || '',
          filters: JSON.stringify(criteria.filters || {})
        }
      });

      console.log('[SEARCHABLE LIST] Response received:', response.data);
      
      // Ensure results is always an array
      const results = response.data.results || [];
      setSearchResults(results);
      
      // Ensure pagination exists
      const pagination = response.data.pagination || {};
      setPagination({
        page: pagination.current_page || 1,
        pageSize: pagination.page_size || 10,
        totalCount: pagination.total_count || 0,
        totalPages: pagination.total_pages || 1
      });
      setInitialItemsLoaded(true);
      
      // Save current search state to localStorage
      localStorage.setItem('searchablesPage', response.data.pagination.current_page);
      localStorage.setItem('searchablesTerm', criteria.searchTerm);
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
  const handleItemClick = (item) => {
    // Use the type field from the backend if available, fallback to payload type
    const itemType = item.type || item.payloads?.public?.type || 'downloadable';
    if (itemType === 'offline') {
      navigateWithReferrer(history, `/offline-item/${item.searchable_id}`, '/searchables');
    } else {
      navigateWithReferrer(history, `/searchable-item/${item.searchable_id}`, '/searchables');
    }
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

      {searchResults && searchResults.length > 0 && (
        <>
          <Grid item xs={12} >
            {searchResults && searchResults.map((item) => (
              <SearchablesProfile 
                key={item.searchable_id}
                item={item}
                onClick={() => handleItemClick(item)} 
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

      {!loading && searchResults && searchResults.length === 0 && !initialItemsLoaded && (
        <Grid item xs={12}>
          <Paper elevation={2}>
            <Typography variant="body1">
              {pagination.totalCount === 0 ? 
                "No items found. Try adjusting your search criteria." : 
                "Use the search button to find items."}
            </Typography>
          </Paper>
        </Grid>
      )}
    </>
  );
};

export default SearchableList; 