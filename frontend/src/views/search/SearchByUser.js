import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import SearchCommon from './SearchCommon';
import backend from '../utilities/Backend';
import UserSearchResults from '../../components/Search/UserSearchResults';
import { navigateWithStack } from '../../utils/navigationUtils';

const SearchByUser = () => {
  const history = useHistory();
  const location = useLocation();
  
  // State derived from URL
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Results state
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1
  });
  
  // Sync state with URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Update search term
    setSearchTerm(params.get('searchTerm') || '');
    
    // Update page
    setCurrentPage(parseInt(params.get('page')) || 1);
    
    // Update tags - preserve existing tag objects if IDs match
    const urlTags = params.get('tags');
    if (urlTags) {
      const tagIds = urlTags.split(',').filter(Boolean);
      // Try to preserve existing tag objects with names
      const newSelectedTags = tagIds.map(id => {
        const existingTag = selectedTags.find(tag => tag.id === id || tag.id?.toString() === id);
        return existingTag || { id };
      });
      setSelectedTags(newSelectedTags);
    } else {
      setSelectedTags([]);
    }
  }, [location.search]);
  
  // Trigger search when URL changes or on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    // Only perform search if we're on the creators tab
    if (tab === 'creators') {
      const urlSearchTerm = params.get('searchTerm') || '';
      const urlPage = parseInt(params.get('page')) || 1;
      const urlTags = params.get('tags') || '';
      
      // Perform search with current URL state
      performSearch(urlSearchTerm, urlPage, urlTags);
    }
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Perform the actual search
  const performSearch = async (term, page, tags) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        limit: 10  // Reduced to show more pages
      };
      
      // Add search term if provided
      if (term) {
        params.username = term;
      }
      
      // Add tags if provided
      if (tags) {
        params.tags = tags;
      }
      
      const response = await backend.get('v1/search/users', {
        params: params
      });

      const users = response.data.users || response.data.results || [];
      
      setSearchResults(users);
      const paginationData = response.data.pagination || {};
      const paginationState = {
        page: paginationData.page || paginationData.current_page || 1,
        pageSize: paginationData.limit || paginationData.page_size || 20,
        totalCount: paginationData.total || paginationData.total_count || 0,
        totalPages: paginationData.pages || paginationData.total_pages || 1
      };
      setPagination(paginationState);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search - always updates URL which triggers effect above
  const handleSearch = (resetToFirstPage = true) => {
    // Build URL parameters
    const params = new URLSearchParams();
    params.set('tab', 'creators');
    if (searchTerm) params.set('searchTerm', searchTerm);
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.map(tag => tag.id).join(','));
    }
    params.set('page', resetToFirstPage ? '1' : currentPage.toString());
    
    // Update URL - use replace to maintain navigation stack
    history.replace(`/search?${params.toString()}`, location.state);
  };

  // Handle pagination - updates URL without resetting filters
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set('page', newPage.toString());
    // Ensure tab parameter is preserved
    if (!params.has('tab')) {
      params.set('tab', 'creators');
    }
    const newUrl = `/search?${params.toString()}`;
    history.replace(newUrl, location.state);
  };

  // Handle clear search
  const handleClearSearch = () => {
    // Clear URL parameters
    const params = new URLSearchParams();
    params.set('tab', 'creators');
    params.set('page', '1');
    history.replace(`/search?${params.toString()}`, location.state);
  };
  
  // Handle navigation to user profile
  const handleNavigateToProfile = (user) => {
    navigateWithStack(history, `/profile/${user.id}`);
  };


  return (
    <SearchCommon
      searchType="user"
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      selectedTags={selectedTags}
      setSelectedTags={setSelectedTags}
      loading={loading}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      onSearch={() => handleSearch(true)}
      onClearSearch={handleClearSearch}
    >
      <UserSearchResults
        users={searchResults}
        loading={loading}
        pagination={pagination}
        onUserClick={(user) => handleNavigateToProfile(user)}
        onPageChange={handlePageChange}
      />
    </SearchCommon>
  );
};

export default SearchByUser;