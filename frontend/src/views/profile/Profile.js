import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import './Profile.css';
import configData from '../../config';

const Profile = () => {
  const [userSearchables, setUserSearchables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  useEffect(() => {
    fetchUserSearchables();
  }, []);
  
  const fetchUserSearchables = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${configData.API_SERVER}searchable/user`,
        {
          headers: {
            Authorization: `${account.token}`
          }
        }
      );
      
      setUserSearchables(response.data.results || []);
    } catch (err) {
      console.error("Error fetching user searchables:", err);
      setError("Failed to load your posted items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Function to format distance
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };
  
  // Inside the Profile component
  // Add this function to handle clicking on an item
  const handleItemClick = (itemId) => {
    history.push(`/searchable-item/${itemId}`);
  };
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>User Profile</h1>
        <button className="back-button" onClick={() => history.push('/searchables')}>
          Back to Search
        </button>
      </div>
      
      <div className="profile-info">
        <h2>Personal Information</h2>
        <div className="info-item">
          <span className="info-label">Username:</span>
          <span className="info-value">{account.user.username}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Email:</span>
          <span className="info-value">{account.user.email}</span>
        </div>
      </div>
      
      <div className="user-searchables">
        <h2>Your Posted Items</h2>
        
        {loading && <div className="loading">Loading your items...</div>}
        
        {error && <div className="error-message">{error}</div>}
        
        {!loading && userSearchables.length === 0 && (
          <div className="no-items">
            You haven't posted any items yet. 
            <button onClick={() => history.push('/publish-searchables')}>
              Post an Item
            </button>
          </div>
        )}
        
        {userSearchables.length > 0 && (
          <div className="searchable-items">
            {userSearchables.map((item) => (
              <div 
                key={item.searchable_id} 
                className="searchable-item"
                onClick={() => handleItemClick(item.searchable_id)}
              >
                <h3>{item.title || `Item #${item.searchable_id}`}</h3>
                {item.description && <p>{item.description}</p>}
                {item.distance && (
                  <p className="distance">
                    Distance: {formatDistance(item.distance)}
                  </p>
                )}
                {item.category && <p>Category: {item.category}</p>}
                {item.price && <p>Price: ${item.price}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 