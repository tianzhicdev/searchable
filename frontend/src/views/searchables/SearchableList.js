import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { 
  Grid, Typography, Paper, Box, CircularProgress
} from '@material-ui/core';

import MiniProfile from '../../components/Profiles/MiniProfile';
import Pagination from '../../components/Pagination/Pagination';
import ColumnLayout from '../../components/Layout/ColumnLayout';
import backend from '../utilities/Backend';
import { navigateWithStack } from '../../utils/navigationUtils';

const SearchableList = ({ criteria, onPageChange }) => {
    
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const history = useHistory();
  const location = useLocation();
  
  const [pagination, setPagination] = useState({
    page: criteria.currentPage || 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });

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
  }, [viewportHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle search when parent tells us to via criteria changes
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      setError(null);

      try {
        const pageSize = calculateOptimalPageSize();
        const page = criteria.currentPage || 1;
        
        console.log('[SEARCHABLE LIST] Performing search:', { 
          page, 
          pageSize, 
          searchTerm: criteria.searchTerm,
          filters: criteria.filters 
        });
        
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
        setSearchResults(results);
        
        // Ensure pagination exists
        const paginationData = response.data.pagination || {};
        setPagination({
          page: paginationData.current_page || 1,
          pageSize: paginationData.page_size || 10,
          totalCount: paginationData.total_count || 0,
          totalPages: paginationData.total_pages || 1
        });
      } catch (err) {
        console.error("Error searching:", err);
        setError("An error occurred while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    // Perform search
    performSearch();
  }, [criteria.searchTerm, criteria.filters, criteria.currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to handle page change
  const handlePageChange = (newPage) => {
    console.log('[SEARCHABLE LIST] Page change requested:', newPage);
    if (onPageChange) {
      // Let parent handle the page change
      onPageChange(newPage);
    }
  };

  // Handle clicking on an item
  const handleItemClick = (item) => {
    // Use the type field from the backend if available, fallback to payload type
    const itemType = item.type || item.payloads?.public?.type || 'downloadable';
    if (itemType === 'offline') {
      navigateWithStack(history, `/offline-item/${item.searchable_id}`);
    } else if (itemType === 'direct') {
      navigateWithStack(history, `/direct-item/${item.searchable_id}`);
    } else {
      navigateWithStack(history, `/searchable-item/${item.searchable_id}`);
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

      {!loading && searchResults.length > 0 && (
        <>
          {/* Results in column layout - fills left column first, then right */}
          <ColumnLayout columns={2}>
            {searchResults.map((item) => (
              <MiniProfile 
                key={`${item.searchable_id}-${pagination.page}`}
                type="searchable"
                data={item}
                onClick={() => handleItemClick(item)} 
              />
            ))}
          </ColumnLayout>

          <Box mt={2}>
            {console.log('[SEARCHABLE LIST] Rendering pagination:', { 
              currentPage: pagination.page, 
              totalPages: pagination.totalPages,
              totalItems: pagination.totalCount,
              loading: loading 
            })}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalCount}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          </Box>
        </>
      )}

      {!loading && searchResults.length === 0 && criteria.searchTerm !== undefined && (
        <Grid item xs={12}>
          <Paper elevation={2}>
            <Typography variant="body1">
              No items found.
            </Typography>
          </Paper>
        </Grid>
      )}
    </>
  );
};

export default SearchableList;