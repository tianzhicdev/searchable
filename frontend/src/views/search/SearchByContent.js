import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import SearchCommon from './SearchCommon';
import SearchableList from '../searchables/SearchableList';

const SearchByContent = () => {
  const history = useHistory();
  
  // State variables
  const [searchTerm, setSearchTerm] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('searchTerm') || localStorage.getItem('searchTerm') || '';
  });

  const [filters, setFilters] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters = urlParams.get('filters');
    
    if (urlFilters) {
      try {
        return JSON.parse(decodeURIComponent(urlFilters));
      } catch (e) {
        console.error("Error parsing filters from URL:", e);
      }
    }
    
    const storedFilters = localStorage.getItem('searchablesFilters');
    if (storedFilters) {
      try {
        return JSON.parse(storedFilters);
      } catch (e) {
        console.error("Error parsing filters from localStorage:", e);
      }
    }
    
    return {};
  });

  // State for tag filtering
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [loading, setLoading] = useState(false);

  // Handle search
  const handleSearch = () => {
    // Create new filters object, removing tags from existing filters
    const { tags, ...otherFilters } = filters;
    
    // Only add tags if there are selected tags
    const tagFilters = selectedTags.length > 0 ? { tags: selectedTags.map(tag => tag.id) } : {};
    const updatedFilters = { ...otherFilters, ...tagFilters };
    
    localStorage.setItem('searchTerm', searchTerm);
    localStorage.setItem('searchablesFilters', JSON.stringify(updatedFilters));
    localStorage.removeItem('searchablesPage'); // Reset to page 1 on new search
    
    setFilters(updatedFilters);
    setSearchTrigger(prev => prev + 1); // Trigger a new search
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedTags([]);
    const clearedFilters = {};
    
    localStorage.setItem('searchTerm', '');
    localStorage.setItem('searchablesFilters', JSON.stringify(clearedFilters));
    localStorage.removeItem('searchablesPage');
    
    setFilters(clearedFilters);
    setSearchTrigger(prev => prev + 1);
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
      onSearch={handleSearch}
      onClearSearch={handleClearSearch}
    >
      <SearchableList 
        criteria={{
          searchTerm: searchTerm,
          filters: filters,
          searchTrigger: searchTrigger
        }}
      />
    </SearchCommon>
  );
};

export default SearchByContent;