import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import SearchCommon from './SearchCommon';
import UserSearchResults from '../../components/Search/UserSearchResults';
import Backend from '../utilities/Backend';


const SearchByUser = () => {
  const history = useHistory();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const handleSearch = async (page = 1) => {
    setLoading(true);
    
    try {
      // Build search parameters
      const params = new URLSearchParams();
      
      if (searchTerm.trim()) {
        params.append('username', searchTerm.trim());
      }
      
      if (selectedTags.length > 0) {
        // Send only tag IDs, not full tag objects
        const tagIds = selectedTags.map(tag => tag.id).join(',');
        params.append('tags', tagIds);
      }
      
      params.append('page', page);
      params.append('limit', 20);
      
      const response = await Backend.get(`v1/search/users?${params.toString()}`);
      
      if (response.data && response.data.success) {
        setUsers(response.data.users || []);
        setPagination(response.data.pagination);
      } else {
        setUsers([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };
  
  const handleUserClick = (user) => {
    history.push(`/profile/${user.id}`);
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
      onSearch={handleSearch}
      onClearSearch={handleClearSearch}
    >
      <UserSearchResults
        users={users}
        loading={loading}
        pagination={pagination}
        onUserClick={handleUserClick}
        onPageChange={handleSearch}
        emptyMessage={
          selectedTags.length > 0 || searchTerm 
            ? "No users found matching your criteria"
            : "Start searching to find creators"
        }
        emptySubtext={
          selectedTags.length > 0 || searchTerm
            ? "Try adjusting your search filters or search terms."
            : "Use the search bar or tag filters to discover talented creators."
        }
      />
    </SearchCommon>
  );
};

export default SearchByUser;