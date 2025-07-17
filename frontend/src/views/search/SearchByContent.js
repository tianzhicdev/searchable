import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import SearchCommon from './SearchCommon';
import SearchableList from '../searchables/SearchableList';
import { testIds } from '../../utils/testIds';

const SearchByContent = () => {
  const history = useHistory();
  const location = useLocation();
  const isInitialMount = useRef(true);
  
  // State derived from URL
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading] = useState(false);
  
  // Sync state with URL on mount and URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Update search term
    const urlSearchTerm = params.get('searchTerm') || '';
    setSearchTerm(urlSearchTerm);
    
    // Update page
    const urlPage = parseInt(params.get('page')) || 1;
    setCurrentPage(urlPage);
    
    // Update filters
    const urlFilters = params.get('filters');
    if (urlFilters) {
      try {
        const parsedFilters = JSON.parse(decodeURIComponent(urlFilters));
        setFilters(parsedFilters);
        
        // Extract tags from filters for UI
        if (parsedFilters.tags && Array.isArray(parsedFilters.tags)) {
          // Convert tag IDs back to tag objects for the UI
          setSelectedTags(parsedFilters.tags.map(id => ({ id })));
        } else {
          setSelectedTags([]);
        }
      } catch (e) {
        console.error("Error parsing filters from URL:", e);
        setFilters({});
        setSelectedTags([]);
      }
    } else {
      setFilters({});
      setSelectedTags([]);
    }
    
    // After initial mount, we don't need to track this anymore
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [location.search]);

  // Handle search - updates URL which triggers the effect above
  const handleSearch = (resetToFirstPage = true) => {
    // Create new filters object
    const { tags, ...otherFilters } = filters;
    
    // Only add tags if there are selected tags
    const tagFilters = selectedTags.length > 0 ? { tags: selectedTags.map(tag => tag.id) } : {};
    const updatedFilters = { ...otherFilters, ...tagFilters };
    
    // Build URL parameters
    const params = new URLSearchParams();
    params.set('tab', 'content');
    if (searchTerm) params.set('searchTerm', searchTerm);
    if (Object.keys(updatedFilters).length > 0) {
      params.set('filters', encodeURIComponent(JSON.stringify(updatedFilters)));
    }
    params.set('page', resetToFirstPage ? '1' : currentPage.toString());
    
    // Update URL - use replace to maintain navigation stack
    history.replace(`/search?${params.toString()}`, location.state);
  };

  // Handle pagination - updates URL without resetting filters
  const handlePageChange = (newPage) => {
    console.log('[SEARCH BY CONTENT] handlePageChange called with:', newPage);
    const params = new URLSearchParams(location.search);
    params.set('page', newPage.toString());
    const newUrl = `/search?${params.toString()}`;
    console.log('[SEARCH BY CONTENT] Updating URL to:', newUrl);
    history.replace(newUrl, location.state);
  };

  // Handle clear search
  const handleClearSearch = () => {
    // Reset local state
    setSearchTerm('');
    setSelectedTags([]);
    setFilters({});
    
    // Clear URL parameters
    const params = new URLSearchParams();
    params.set('tab', 'content');
    params.set('page', '1');
    history.replace(`/search?${params.toString()}`, location.state);
  };

  return (
    <SearchCommon
      searchType="content"
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
      <SearchableList 
        criteria={{
          searchTerm: searchTerm,
          filters: filters,
          currentPage: currentPage
        }}
        onPageChange={handlePageChange}
      />
    </SearchCommon>
  );
};

export default SearchByContent;