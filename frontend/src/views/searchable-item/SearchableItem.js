import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import configData from '../../config';
import { Grid, Typography, Button, Paper, Box, CircularProgress, Divider } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';

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
    <Grid container>
      <Grid item xs={12}>
        <Grid container alignItems="center">
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => history.goBack()}
            >
              <ChevronLeftIcon /> 
            </Button>
          </Grid>
        </Grid>
      </Grid>
      
      {loading && (
        <Grid item xs={12}>
          <CircularProgress />
          <Typography variant="body1" style={{ marginLeft: 16 }}>
            Loading item details...
          </Typography>
        </Grid>
      )}
      
      {error && (
        <Grid item xs={12}>
          <Paper>
            <Typography variant="body1">{error}</Typography>
          </Paper>
        </Grid>
      )}
      
      {!loading && item && (
        <Grid item xs={12}>
            <Box p={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h4">
                    {item.title || `Item #${item.searchable_id}`}
                  </Typography>
                  <Divider />
                </Grid>
                
                {/* Display images if available */}
                {item.images && item.images.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={1}>
                      {item.images.map((image, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <img 
                            src={`data:image/jpeg;base64,${image}`} 
                            alt={`${item.title} - image ${index + 1}`} 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
                
                <Grid item xs={12} md={item.images && item.images.length > 0 ? 6 : 12}>
                  <Grid container spacing={2}>
                    {item.distance && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Distance:</span>
                          <span>{formatDistance(item.distance)}</span>
                        </Typography>
                      </Grid>
                    )}
                    
                    {item.price && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Price:</span>
                          <span>{item.price} Sats</span>
                        </Typography>
                      </Grid>
                    )}
                    {item.username && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Posted by:</span>
                          <span>{item.username}</span>
                        </Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <span>Location:</span>
                        <span>
                          {item.latitude}, {item.longitude}
                        </span>
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <span>Item ID:</span>
                        <span>{item.searchable_id}</span>
                      </Typography>
                    </Grid>
                    
                    {item.description && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          Description:
                        </Typography>
                        <Typography variant="body2">
                          {item.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {item.latitude && item.longitude && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <span>Map Location:</span>
                        </Typography>
                        <Box mt={1} height="200px" width="100%" border="1px solid #ccc">
                          <iframe
                            title="Item Location"
                            width="100%"
                            height="100%"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${item.longitude-0.002}%2C${item.latitude-0.002}%2C${item.longitude+0.002}%2C${item.latitude+0.002}&layer=mapnik&marker=${item.latitude}%2C${item.longitude}&zoom=17`}
                            scrolling="no"
                            frameBorder="0"
                            style={{ pointerEvents: 'none' }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {item.meetupLocation && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <span>Meeting Location:</span>
                          <span>{item.meetupLocation}</span>
                        </Typography>
                      </Grid>
                    )}
                  
                  {isOwner && (
                    <Grid item xs={12}>
                      <Box mt={3} display="flex" justifyContent="center">
                        <Button
                          variant="contained"
                          onClick={handleRemoveItem}
                          disabled={isRemoving}
                        >
                          Remove Item
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default SearchableItem; 