import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { 
  Grid, Typography, Paper, Box, CircularProgress
} from '@material-ui/core';

import MiniProfile from '../../components/Profiles/MiniProfile';
import Pagination from '../../components/Pagination/Pagination';
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

  // Load initial items on mount
  useEffect(() => {
    const savedPage = localStorage.getItem('searchablesPage');
    const pageToLoad = savedPage ? parseInt(savedPage) : 1;
    console.log('[SEARCHABLE LIST] Initial load - loading page:', pageToLoad);
    handleSearch(pageToLoad);
  }, []);

  // Handle search trigger from parent
  useEffect(() => {
    if (criteria.searchTrigger && criteria.searchTrigger > 0) {
      handleSearch(1); // Always start from page 1 on new search
    }
  }, [criteria.searchTrigger]);

  // Function to handle search
  const handleSearch = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const pageSize = calculateOptimalPageSize();
      console.log('[SEARCHABLE LIST] Requesting page:', page, 'pageSize:', pageSize);
      console.log('[SEARCHABLE LIST] Criteria:', criteria);
      
      // Extract tags from filters to send as separate parameter
      const { tags, ...otherFilters } = criteria.filters || {};
      
      const response = await backend.get('v1/searchable/search', {
        params: {
          page: page,
          page_size: pageSize,
          q: criteria.searchTerm || '',
          filters: JSON.stringify(otherFilters),
          tags: tags ? tags.join(',') : ''
        }
      });

      console.log('[SEARCHABLE LIST] Response received:', response.data);
      
      // Ensure results is always an array
      const results = response.data.results || [];
      console.log('[SEARCHABLE LIST] Setting search results:', results.length, 'items');
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
      localStorage.setItem('searchablesPage', pagination.current_page || page);
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
    console.log('[SEARCHABLE LIST] Page change requested:', newPage);
    handleSearch(newPage);
  };



  // Handle clicking on an item
  const handleItemClick = (item) => {
    // Use the type field from the backend if available, fallback to payload type
    const itemType = item.type || item.payloads?.public?.type || 'downloadable';
    if (itemType === 'offline') {
      navigateWithReferrer(history, `/offline-item/${item.searchable_id}`, '/landing');
    } else if (itemType === 'direct') {
      navigateWithReferrer(history, `/direct-item/${item.searchable_id}`, '/landing');
    } else {
      navigateWithReferrer(history, `/searchable-item/${item.searchable_id}`, '/landing');
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

      {searchResults.length > 0 && (
        <>
          {searchResults.map((item) => (
            <Grid item xs={12} key={`${item.searchable_id}-${pagination.page}`}>
              <MiniProfile 
                type="searchable"
                data={item}
                onClick={() => handleItemClick(item)} 
              />
            </Grid>
          ))}

          <Grid item xs={12}>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalCount}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          </Grid>
        </>
      )}

      {!loading && searchResults.length === 0 && initialItemsLoaded && (
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