import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
// Remove Profile.css import
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles'; // Import shared component styles
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress, Divider 
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

const Profile = () => {
  const classes = useComponentStyles(); // Use shared component styles
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
    <Grid container className={classes.container}>
      {/* Header Section */}
      <Grid item xs={12} className={classes.header}>
        <div className={classes.leftButtons}>
          <Button 
            variant="contained" 
            className={classes.iconButton}
            onClick={() => history.push('/searchables')}
          >
            <ArrowBackIcon />
          </Button>
        </div>
      </Grid>
      
      {/* Personal Information Section */}
      <Grid item xs={12} className={classes.gridItem}>
        <Paper elevation={3} className={classes.paper}>
          <Typography variant="h6" className={classes.sectionTitle}>
            Personal Information
          </Typography>
          <Box className={classes.infoRow}>
            <Typography variant="body1">
              <span className={classes.infoLabel}>Username:</span>
              <span className={classes.infoValue}>{account.user.username}</span>
            </Typography>
          </Box>
          <Box className={classes.infoRow}>
            <Typography variant="body1">
              <span className={classes.infoLabel}>Email:</span>
              <span className={classes.infoValue}>{account.user.email}</span>
            </Typography>
          </Box>
        </Paper>
      </Grid>
      
      {/* Posted Items Section */}
      <Grid item xs={12} className={classes.gridItem}>
        <Paper elevation={3} className={classes.paper}>
          <Typography variant="h6" className={classes.sectionTitle}>
            Your Posted Items
          </Typography>
          
          {loading && (
            <Box className={classes.loading}>
              <CircularProgress size={24} style={{ marginRight: 16 }} />
              <Typography variant="body1">Loading your items...</Typography>
            </Box>
          )}
          
          {error && (
            <Box className={classes.errorMessage}>
              <Typography variant="body1">{error}</Typography>
            </Box>
          )}
          
          {!loading && userSearchables.length === 0 && (
            <Box className={classes.noResults}>
              <Typography variant="body1" gutterBottom>
                You haven't posted any items yet.
              </Typography>
              <Button
                variant="contained"
                className={`${classes.button} ${classes.primaryButton}`}
                onClick={() => history.push('/publish-searchables')}
              >
                Post an Item
              </Button>
            </Box>
          )}
          
          {userSearchables.length > 0 && (
            <Grid container spacing={2}>
              {userSearchables.map((item) => (
                <Grid item xs={12} key={item.searchable_id}>
                  <Box 
                    className={classes.searchableItem}
                    onClick={() => handleItemClick(item.searchable_id)}
                  >
                    <Typography variant="h6" className={classes.itemTitle}>
                      {item.title || `Item #${item.searchable_id}`}
                    </Typography>
                    
                    {item.description && (
                      <Typography variant="body2" className={classes.itemDescription}>
                        {item.description}
                      </Typography>
                    )}
                    
                    <Box className={classes.itemInfo}>
                      {item.distance && (
                        <Typography variant="body2" className={classes.infoItem}>
                          Distance: {formatDistance(item.distance)}
                        </Typography>
                      )}
                      
                      {item.category && (
                        <Typography variant="body2" className={classes.infoItem}>
                          Category: {item.category}
                        </Typography>
                      )}
                      
                      {item.price && (
                        <Typography variant="body2" className={classes.infoItem}>
                          Price: ${item.price}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Profile; 