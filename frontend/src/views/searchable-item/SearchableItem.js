import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
// import './SearchableItem.css';
import configData from '../../config';
import { Grid, Typography, Button, Paper, Box, CircularProgress, Divider } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';

const SearchableItem = () => {
  const classes = useComponentStyles();
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
    <Grid container className={classes.container}>
      <Grid item xs={12} className={classes.header}>
        <Grid container alignItems="center">
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              className={classes.backButton} 
              onClick={() => history.goBack()}
            >
              Back
            </Button>
          </Grid>
        </Grid>
      </Grid>
      
      {loading && (
        <Grid item xs={12} className={classes.loading}>
          <CircularProgress />
          <Typography variant="body1" style={{ marginLeft: 16 }}>
            Loading item details...
          </Typography>
        </Grid>
      )}
      
      {error && (
        <Grid item xs={12}>
          <Paper className={classes.errorMessage}>
            <Typography variant="body1">{error}</Typography>
          </Paper>
        </Grid>
      )}
      
      {!loading && item && (
        <Grid item xs={12}>
          <Paper elevation={3} className={classes.paper}>
            <Box p={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h4" className={classes.itemTitle}>
                    {item.title || `Item #${item.searchable_id}`}
                  </Typography>
                  <Divider />
                </Grid>
                
                {/* Display images if available */}
                {item.images && item.images.length > 0 && (
                  <Grid item xs={12} md={6} className={classes.imagePreviewContainer}>
                    <Grid container spacing={1}>
                      {item.images.map((image, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <img 
                            className={classes.previewImage}
                            src={`data:image/jpeg;base64,${image}`} 
                            alt={`${item.title} - image ${index + 1}`} 
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
                
                <Grid item xs={12} md={item.images && item.images.length > 0 ? 6 : 12}>
                  <Grid container spacing={2}>
                    {item.distance && (
                      <Grid item xs={12} sm={6} className={classes.infoRow}>
                        <Typography variant="body1">
                          <span className={classes.infoLabel}>Distance:</span>
                          <span className={classes.infoValue}>{formatDistance(item.distance)}</span>
                        </Typography>
                      </Grid>
                    )}
                    
                    {item.category && (
                      <Grid item xs={12} sm={6} className={classes.infoRow}>
                        <Typography variant="body1">
                          <span className={classes.infoLabel}>Category:</span>
                          <span className={classes.infoValue}>{item.category}</span>
                        </Typography>
                      </Grid>
                    )}
                    
                    {item.price && (
                      <Grid item xs={12} sm={6} className={classes.infoRow}>
                        <Typography variant="body1">
                          <span className={classes.infoLabel}>Price:</span>
                          <span className={classes.infoValue}>${item.price}</span>
                        </Typography>
                      </Grid>
                    )}
                    
                    {item.address && (
                      <Grid item xs={12} className={classes.infoRow}>
                        <Typography variant="body1">
                          <span className={classes.infoLabel}>Address:</span>
                          <span className={classes.infoValue}>{item.address}</span>
                        </Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6} className={classes.infoRow}>
                      <Typography variant="body1">
                        <span className={classes.infoLabel}>Location:</span>
                        <span className={classes.infoValue}>
                          {item.latitude}, {item.longitude}
                        </span>
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} className={classes.infoRow}>
                      <Typography variant="body1">
                        <span className={classes.infoLabel}>Item ID:</span>
                        <span className={classes.infoValue}>{item.searchable_id}</span>
                      </Typography>
                    </Grid>
                    
                    {item.description && (
                      <Grid item xs={12} className={classes.infoRow}>
                        <Typography variant="body1" className={classes.infoLabel}>
                          Description:
                        </Typography>
                        <Typography variant="body2" className={classes.infoValue}>
                          {item.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                  
                  {isOwner && (
                    <Grid item xs={12} className={classes.formActions}>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleRemoveItem}
                        disabled={isRemoving}
                        className={classes.dangerButton}
                      >
                        {isRemoving ? "Removing..." : "Remove Item"}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default SearchableItem; 