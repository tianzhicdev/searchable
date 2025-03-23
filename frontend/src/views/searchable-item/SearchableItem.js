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
  const [usdPrice, setUsdPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  
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
        if (account && item && item.terminal_id === account.user._id) {
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
  
  useEffect(() => {
    if (item && item.payloads && item.payloads.public && item.payloads.public.price) {
      convertSatsToUSD(item.payloads.public.price);
    }
  }, [item]);
  
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
  
  // Function to convert sats to USD
  const convertSatsToUSD = async (sats) => {
    setPriceLoading(true);
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      
      if (response.data && response.data.bitcoin && response.data.bitcoin.usd) {
        const btcPrice = response.data.bitcoin.usd;
        // Convert satoshis to USD (1 BTC = 100,000,000 sats)
        const usdValue = (sats / 100000000) * btcPrice;
        setUsdPrice(usdValue);
      }
    } catch (error) {
      console.error("Error fetching BTC price:", error);
    } finally {
      setPriceLoading(false);
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
  
  // Function to format USD price
  const formatUSD = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
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
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
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
        <Paper>
        <Grid item xs={12}>
            <Box p={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h4">
                    {item.payloads.public.title || `Item #${item.searchable_id}`}
                  </Typography>
                  <Divider />
                </Grid>
                
                {/* Display images if available */}
                {item.payloads.public.images && item.payloads.public.images.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={1}>
                      {item.payloads.public.images.map((image, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <img 
                            src={`data:image/jpeg;base64,${image}`} 
                            alt={`${item.payloads.public.title} - image ${index + 1}`} 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
                
                <Grid item xs={12} md={item.payloads.public.images && item.payloads.public.images.length > 0 ? 6 : 12}>
                  <Grid container spacing={2}>
                    
                    {/* Only show price if user is owner or price is in public payload */}
                    {(isOwner && item.payloads.public && item.payloads.public.price) && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Price: </span>
                          <span>{item.payloads.public.price} Sats</span>
                          
                          {usdPrice !== null && (
                            <Typography variant="body2" style={{ marginTop: 4 }}>
                              {priceLoading ? (
                                <CircularProgress size={12} style={{ marginLeft: 8 }} />
                              ) : (
                                `≈ ${formatUSD(usdPrice)}`
                              )}
                            </Typography>
                          )}
                        </Typography>
                      </Grid>
                    )}
                    
                    {item.username && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Posted by: </span>
                          <span>{item.username}</span>
                        </Typography>
                      </Grid>
                    )}

                    {item.distance && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Distance: </span>
                          <span>{formatDistance(item.distance)}</span>
                        </Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <span>Item ID:</span>
                        <span>{item.searchable_id}</span>
                      </Typography>
                    </Grid>
                    
                    {item.payloads.public.description && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          Description:
                        </Typography>
                        <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                          {item.payloads.public.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {item.payloads.public.latitude && item.payloads.public.longitude && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <span>Proposed Meeting Location:</span>
                        </Typography>
                        <Box mt={1} height="200px" width="100%" border="1px solid #ccc">
                          <iframe
                            title="Item Location"
                            width="100%"
                            height="100%"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${item.payloads.public.longitude}%2C${item.payloads.public.latitude}%2C${item.payloads.public.longitude}%2C${item.payloads.public.latitude}&layer=mapnik&marker=${item.payloads.public.latitude}%2C${item.payloads.public.longitude}&zoom=17`}
                            scrolling="no"
                            frameBorder="0"
                            style={{ pointerEvents: 'none' }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {item.payloads.public.meetupLocation && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <span>{item.payloads.public.meetupLocation}</span>
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
        </Paper>
      )}

    </Grid>
  );
};

export default SearchableItem; 