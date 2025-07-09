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
    
    // Update tags
    const urlTags = params.get('tags');
    if (urlTags) {
      const tagIds = urlTags.split(',').filter(Boolean);
      setSelectedTags(tagIds.map(id => ({ id })));
    } else {
      setSelectedTags([]);
    }
  }, [location.search]);
  
  // Trigger search when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearchTerm = params.get('searchTerm') || '';
    const urlPage = parseInt(params.get('page')) || 1;
    const urlTags = params.get('tags') || '';
    
    // Perform search with current URL state
    performSearch(urlSearchTerm, urlPage, urlTags);
  }, [location.search]);
  
  // Perform the actual search
  const performSearch = async (term, page, tags) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        limit: 20
      };
      
      // Add search term if provided
      if (term) {
        params.username = term;
      }
      
      // Add tags if provided
      if (tags) {
        const tagList = tags.split(',').filter(Boolean);
        if (tagList.length > 0) {
          params['tags[]'] = tagList;
        }
      }
      
      const response = await backend.get('v1/search/users', {
        params: params
      });

      setSearchResults(response.data.users || response.data.results || []);
      const paginationData = response.data.pagination || {};
      setPagination({
        page: paginationData.page || paginationData.current_page || 1,
        pageSize: paginationData.limit || paginationData.page_size || 20,
        totalCount: paginationData.total || paginationData.total_count || 0,
        totalPages: paginationData.pages || paginationData.total_pages || 1
      });
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
    history.replace(`/search?${params.toString()}`, location.state);
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
  const handleNavigateToProfile = (username) => {
    navigateWithStack(history, `/terminal/${username}`);
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
        onUserClick={(user) => handleNavigateToProfile(user.username)}
        onPageChange={handlePageChange}
      />
    </SearchCommon>
  );
};

export default SearchByUser;