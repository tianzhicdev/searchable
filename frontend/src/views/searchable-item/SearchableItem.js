import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import './SearchableItem.css';
import configData from '../../config';

const SearchableItem = () => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const { id } = useParams();
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  useEffect(() => {
    fetchItemDetails();
  }, [id]);
  
  useEffect(() => {
    // Check if current user is the owner
    const checkOwnership = async () => {
      try {
        console.log("User:", account.user);
        console.log("Item:", item);
        if (account && item && item.user_id === account.user._id) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };

    if (item) {
      checkOwnership();
    }
  }, [item, account]);
  
  const fetchItemDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${configData.API_SERVER}searchable-item/${id}`,
        {
          headers: {
            Authorization: `${account.token}`
          }
        }
      );
      
      setItem(response.data);
    } catch (err) {
      console.error("Error fetching item details:", err);
      setError("Failed to load item details. Please try again later.");
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
  
  const handleRemoveItem = async () => {
    if (!window.confirm("Are you sure you want to remove this item?")) {
      return;
    }
    
    setIsRemoving(true);
    try {
      await axios.put(
        `${configData.API_SERVER}remove-searchable-item/${id}`,
        {},
        {
          headers: {
            Authorization: `${account.token}`
          }
        }
      );
      alert("Item removed successfully");
      // Redirect to searchables list page
      history.push('/searchables');
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove the item");
    } finally {
      setIsRemoving(false);
    }
  };
  
  return (
    <div className="item-container">
      <div className="item-header">
        <button className="back-button" onClick={() => history.goBack()}>
          Back
        </button>
        <h1>Item Details</h1>
      </div>
      
      {loading && <div className="loading">Loading item details...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && item && (
        <div className="item-content">
          <h2 className="item-title">{item.title || `Item #${item.searchable_id}`}</h2>
          
          {/* Display images if available */}
          {item.images && item.images.length > 0 && (
            <div className="item-images">
              {item.images.map((image, index) => (
                <img 
                  key={index} 
                  src={`data:image/jpeg;base64,${image}`} 
                  alt={`${item.title} - image ${index + 1}`} 
                />
              ))}
            </div>
          )}
          
          <div className="item-info">
            {item.distance && (
              <div className="info-row">
                <span className="info-label">Distance:</span>
                <span className="info-value">{formatDistance(item.distance)}</span>
              </div>
            )}
            
            {item.description && (
              <div className="info-row description">
                <span className="info-label">Description:</span>
                <p className="info-value">{item.description}</p>
              </div>
            )}
            
            {item.category && (
              <div className="info-row">
                <span className="info-label">Category:</span>
                <span className="info-value">{item.category}</span>
              </div>
            )}
            
            {item.price && (
              <div className="info-row">
                <span className="info-label">Price:</span>
                <span className="info-value">${item.price}</span>
              </div>
            )}
            
            {item.address && (
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{item.address}</span>
              </div>
            )}
            
            <div className="info-row">
              <span className="info-label">Location:</span>
              <span className="info-value">
                {item.latitude}, {item.longitude}
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Item ID:</span>
              <span className="info-value">{item.searchable_id}</span>
            </div>
          </div>
          
          {isOwner && (
            <div className="item-actions">
              <button 
                className="remove-item-btn" 
                onClick={handleRemoveItem}
                disabled={isRemoving}
              >
                {isRemoving ? "Removing..." : "Remove Item"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableItem; 