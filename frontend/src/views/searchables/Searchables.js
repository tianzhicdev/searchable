import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import './Searchables.css';
import { useHistory } from 'react-router-dom';

import { LOGOUT } from './../../store/actions';
import configData from '../../config';

const Searchables = () => {
  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [maxDistance, setMaxDistance] = useState(100000); // Default 100km
  const [initialItemsLoaded, setInitialItemsLoaded] = useState(false);

  const account = useSelector((state) => state.account);
  const dispatcher = useDispatch();
  const history = useHistory();

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
          page_size: pagination.pageSize,
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
          page_size: pagination.pageSize,
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

    // Previous button
    buttons.push(
      <button 
        key="prev" 
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
      >
        &laquo;
      </button>
    );

    // Page number buttons
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    if (startPage > 1) {
      buttons.push(<button key={1} onClick={() => handlePageChange(1)}>1</button>);
      if (startPage > 2) {
        buttons.push(<button key="ellipsis1" disabled>...</button>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i} 
          onClick={() => handlePageChange(i)}
          className={page === i ? 'active' : ''}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<button key="ellipsis2" disabled>...</button>);
      }
      buttons.push(
        <button 
          key={totalPages} 
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button 
        key="next" 
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
      >
        &raquo;
      </button>
    );

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
    <div className="searchables-container">
      <div className="user-info">
        <span>Welcome, {account.user.username}</span>
        <button onClick={handleLogout}>
          Logout
        </button>
        <button className="profile-button" onClick={handleProfileClick}>
          Profile
        </button>
        <button className="add-new-button" onClick={handleAddNew}>
          Add New
        </button>
      </div>
      <div className="search-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            value={maxDistance} 
            onChange={(e) => setMaxDistance(Number(e.target.value))}
          >
            <option value={1000}>1 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={50000}>50 km</option>
            <option value={100000}>100 km</option>
          </select>
          <button 
            onClick={() => handleSearch(1)} 
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        <div className="location-display">
          <i className="fas fa-map-marker-alt"></i>
          {location ? (
            <span>
              Your location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </span>
          ) : (
            <span>Detecting your location...</span>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {searchResults.length > 0 && (
        <>
          <div className="pagination">
            {renderPaginationButtons()}
          </div>

          <div className="searchable-items">
            {searchResults.map((item) => (
              <div 
                key={item.searchable_id} 
                className="searchable-item"
                onClick={() => handleItemClick(item.searchable_id)}
              >
                <h3>{item.title || `Item #${item.searchable_id}`}</h3>
                {item.description && <p>{item.description}</p>}
                <p className="distance">
                  Distance: {formatDistance(item.distance)}
                </p>
                {item.category && <p>Category: {item.category}</p>}
                {item.price && <p>Price: ${item.price}</p>}
              </div>
            ))}
          </div>

          <div className="pagination">
            {renderPaginationButtons()}
          </div>
        </>
      )}

      {!loading && searchResults.length === 0 && !initialItemsLoaded && (
        <div className="no-results">
          {pagination.totalCount === 0 ? 
            "No items found. Try adjusting your search criteria or increasing the distance." : 
            "Use the search button to find items near you."}
        </div>
      )}

      {loading && <div className="loading">Loading results...</div>}
    </div>
  );
};

export default Searchables;
