import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import configData from '../../config';
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress, Divider,
  TextField, IconButton, Collapse
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import Alert from '@material-ui/lab/Alert';
import PostedBy from '../../components/PostedBy';
import ZoomableImage from '../../components/ZoomableImage';
import RatingDisplay from '../../components/Rating/RatingDisplay';
import InvoiceList from '../payments/InvoiceList';
import { useDispatch } from 'react-redux';
import { SET_USER } from '../../store/actions';
import backend from '../utilities/Backend';
import useComponentStyles from '../../themes/componentStyles';
import { 
  SearchableDetailsHeader,
  SearchableDetailsInfo,
  SearchableDetailsActions
} from '../../components/SearchableDetails';

const OfflineSearchableDetails = () => {
  const classes = useComponentStyles();
  const dispatch = useDispatch();

  // Item data
  const [SearchableItem, setSearchableItem] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [searchablePayments, setSearchablePayments] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  
  // Rating states
  const [searchableRating, setSearchableRating] = useState(null);
  const [terminalRating, setTerminalRating] = useState(null);
  const [loadingRatings, setLoadingRatings] = useState(true);
  
  const { id } = useParams();
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  const paymentCheckRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Alert states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  
  // Item selection states for offline products (with count)
  const [selectedItems, setSelectedItems] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Currency state
  const [currency, setCurrency] = useState('usd');

  useEffect(() => {
    fetchItemDetails();
    refreshPaymentsBySearchable();
    fetchRatings();
  }, [id]);
  
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        if (account && account.user && SearchableItem && SearchableItem.terminal_id === String(account.user._id)) {
          setIsOwner(true);
        } 
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };

    if (SearchableItem) {
      checkOwnership();
    }
  }, [SearchableItem, account]);
  
  useEffect(() => {
    if (SearchableItem) {
      // Set the currency based on the item's configuration
      if (SearchableItem.payloads.public.currency === 'usdt') {
        setCurrency('usdt');
      } else {
        setCurrency('usd');
      }
    }
  }, [SearchableItem]);

  useEffect(() => {
    // Calculate total price when selections change
    let total = 0;
    Object.entries(selectedItems).forEach(([itemId, count]) => {
      if (count > 0) {
        const offlineItem = SearchableItem?.payloads.public.offlineItems?.find(
          item => item.itemId.toString() === itemId
        );
        if (offlineItem) {
          total += offlineItem.price * count;
        }
      }
    });
    setTotalPrice(total);
  }, [selectedItems, SearchableItem]);

  const fetchItemDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await backend.get(`v1/searchable/${id}`);
      console.log('[OFFLINE DETAILS] Item details:', response.data);
      setSearchableItem(response.data);
    } catch (err) {
      console.error("Error fetching item details:", err);
      setError("Failed to load item details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const refreshPaymentsBySearchable = async () => {
    try {
      const response = await backend.get(`v1/payments-by-searchable/${id}`);
      setSearchablePayments(response.data.receipts || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
    }
  };

  const fetchRatings = async () => {
    setLoadingRatings(true);
    try {
      const [searchableRatingResponse, terminalRatingResponse] = await Promise.all([
        backend.get(`v1/rating/searchable/${id}`),
        backend.get(`v1/rating/terminal/${SearchableItem?.terminal_id}`)
      ]);
      
      if (searchableRatingResponse.data) {
        setSearchableRating(searchableRatingResponse.data);
      }
      
      if (terminalRatingResponse.data) {
        setTerminalRating(terminalRatingResponse.data);
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
    } finally {
      setLoadingRatings(false);
    }
  };
  
  const handleItemCountChange = (itemId, newCount) => {
    if (newCount < 0) return;
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: newCount
    }));
  };

  const incrementCount = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const decrementCount = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1)
    }));
  };

  const createInvoice = async (invoiceType = 'stripe') => {
    if (!SearchableItem) return;
    
    // Validate if we have any selections
    const hasSelections = Object.values(selectedItems).some(count => count > 0);
    
    if (!hasSelections) {
      showAlert("Please select at least one item to purchase", "warning");
      return;
    }
    
    setCreatingInvoice(true);
    try {
      const payload = {
        searchable_id: id,
        invoice_type: invoiceType,
      };
      
      // Add selected items with counts
      const selections = [];
      Object.entries(selectedItems).forEach(([itemId, count]) => {
        if (count > 0) {
          const offlineItem = SearchableItem.payloads.public.offlineItems.find(
            item => item.itemId.toString() === itemId
          );
          if (offlineItem) {
            selections.push({
              id: offlineItem.itemId,
              name: offlineItem.name,
              price: offlineItem.price,
              count: count,
              type: 'offline'
            });
          }
        }
      });
      
      payload.selections = selections;
      
      if (SearchableItem.payloads.public.require_address) {
        payload.address = account?.user?.address || '';
        payload.tel = account?.user?.tel || '';
      }

      console.log('[OFFLINE DETAILS] Creating invoice with payload:', payload);
      const response = await backend.post('v1/create-invoice', payload);

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        showAlert("Invoice created successfully", "success");
        refreshPaymentsBySearchable();
      }
    } catch (err) {
      console.error("Error creating invoice:", err);
      showAlert(err.response?.data?.msg || "Failed to create invoice", "error");
    } finally {
      setCreatingInvoice(false);
    }
  };

  const showAlert = (message, severity = 'success') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const handleGoBack = () => {
    history.goBack();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" height="200px">
        <ErrorIcon color="error" style={{ fontSize: 48, marginBottom: 16 }} />
        <Typography variant="h6" color="error">{error}</Typography>
        <Button onClick={fetchItemDetails} variant="contained" style={{ marginTop: 16 }}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!SearchableItem) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Typography>Item not found</Typography>
      </Box>
    );
  }

  const publicData = SearchableItem.payloads?.public || {};

  return (
    <Box>
      <Collapse in={alertOpen}>
        <Alert 
          severity={alertSeverity}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setAlertOpen(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {alertMessage}
        </Alert>
      </Collapse>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Button 
            startIcon={<ChevronLeftIcon />}
            onClick={handleGoBack}
            variant="outlined"
          >
            Back to Search
          </Button>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3}>
            <Box p={3}>
              <Typography variant="h4" gutterBottom>
                {publicData.title}
              </Typography>
              
              <PostedBy 
                username={SearchableItem.username} 
                terminalId={SearchableItem.terminal_id} 
              />
              
              <Divider style={{ margin: '16px 0' }} />
              
              <Typography variant="body1" paragraph>
                {publicData.description}
              </Typography>

              {/* Display images */}
              {publicData.images && publicData.images.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>Images</Typography>
                  <Grid container spacing={2}>
                    {publicData.images.map((image, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <ZoomableImage 
                          src={image} 
                          alt={`${publicData.title} - Image ${index + 1}`}
                          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Offline Items Menu */}
              <Typography variant="h6" gutterBottom>
                Available Items
              </Typography>
              
              {publicData.offlineItems && publicData.offlineItems.length > 0 ? (
                <Box>
                  {publicData.offlineItems.map((item, index) => (
                    <Paper key={item.itemId} elevation={1} style={{ marginBottom: 16, padding: 16 }}>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="h6">{item.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {item.description}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ${item.price.toFixed(2)} {currency?.toUpperCase()}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            <IconButton 
                              onClick={() => decrementCount(item.itemId)}
                              disabled={!selectedItems[item.itemId] || selectedItems[item.itemId] === 0}
                            >
                              <RemoveIcon />
                            </IconButton>
                            
                            <TextField
                              type="number"
                              value={selectedItems[item.itemId] || 0}
                              onChange={(e) => handleItemCountChange(item.itemId, parseInt(e.target.value) || 0)}
                              inputProps={{ min: 0, style: { textAlign: 'center', width: '60px' } }}
                              variant="outlined"
                              size="small"
                            />
                            
                            <IconButton onClick={() => incrementCount(item.itemId)}>
                              <AddIcon />
                            </IconButton>
                          </Box>
                          
                          {selectedItems[item.itemId] > 0 && (
                            <Typography variant="body2" align="right" color="primary">
                              Subtotal: ${(item.price * selectedItems[item.itemId]).toFixed(2)}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  {totalPrice > 0 && (
                    <Paper elevation={2} style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
                      <Typography variant="h6" align="right">
                        Total: ${totalPrice.toFixed(2)} {currency?.toUpperCase()}
                      </Typography>
                      
                      <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => createInvoice('stripe')}
                          disabled={creatingInvoice}
                          startIcon={creatingInvoice ? <CircularProgress size={20} /> : null}
                        >
                          {creatingInvoice ? 'Creating...' : 'Purchase with Card'}
                        </Button>
                        
                        {currency === 'usdt' && (
                          <Button
                            variant="outlined"
                            onClick={() => createInvoice('usdt')}
                            disabled={creatingInvoice}
                          >
                            Pay with USDT
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  )}
                </Box>
              ) : (
                <Typography color="textSecondary">
                  No items available for purchase.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Ratings Section */}
          <Paper elevation={3}>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>Ratings</Typography>
              {loadingRatings ? (
                <Box display="flex" justifyContent="center">
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  {searchableRating && (
                    <RatingDisplay 
                      title="Item Rating"
                      rating={searchableRating}
                    />
                  )}
                  {terminalRating && (
                    <RatingDisplay 
                      title="Seller Rating"
                      rating={terminalRating}
                    />
                  )}
                </>
              )}
            </Box>
          </Paper>

          {/* Owner's Invoice History */}
          {isOwner && (
            <Paper elevation={3} style={{ marginTop: 16 }}>
              <Box p={2}>
                <Typography variant="h6" gutterBottom>Sales History</Typography>
                <InvoiceList 
                  invoices={searchablePayments} 
                  showBuyerInfo={true}
                  userRole="seller"
                />
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OfflineSearchableDetails;