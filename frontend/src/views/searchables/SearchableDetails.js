import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import configData from '../../config';
import { getOrCreateVisitorId } from '../utilities/Visitor';
import { Grid, Typography, Button, Paper, Box, CircularProgress, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import CheckIcon from '@material-ui/icons/Check';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import Alert from '@material-ui/lab/Alert';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import PaymentList from '../payments/PaymentList';
import { useDispatch } from 'react-redux';
import { SET_USER } from '../../store/actions';
import backend from '../utilities/Backend';
import ZoomableImage from '../../components/ZoomableImage';
import RemoveIcon from '@material-ui/icons/Remove';
import AddIcon from '@material-ui/icons/Add';
import Logo from '../../ui-component/Logo';

const SearchableDetails = () => {

  const dispatch = useDispatch();

  // Item data
  const [SearchableItem, setSearchableItem] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [searchablePayments, setSearchablePayments] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false); // todo: maybe not use it
  const [priceLoading, setPriceLoading] = useState(false); // todo: maybe not use it
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const [checkingPayment, setCheckingPayment] = useState(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [usdPrice, setUsdPrice] = useState(null); //todo: perhaps we cache it in the backend
  
  // Payment related
  const [invoice, setInvoice] = useState(null);
  
  // Rating states
  const [searchableRating, setSearchableRating] = useState(null);
  const [terminalRating, setTerminalRating] = useState(null);
  const [loadingRatings, setLoadingRatings] = useState(true);
  
  const { id } = useParams();
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  const paymentCheckRef = useRef(null);
  const isMountedRef = useRef(true); //todo: what?
  
  // Alert states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  
  // Add new state for variation selections
  const [selectedVariations, setSelectedVariations] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Add new state to track the currency
  const [currency, setCurrency] = useState('sats');
  
  useEffect(() => {
    fetchItemDetails();
  }, [id]);
  
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        console.log("User:", account.user);
        console.log("Item:", SearchableItem);
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
        setCurrency('sats');
      }
      
      // Only convert sats to USD if we're not using USDT
      if (SearchableItem.payloads.public.price && currency !== 'usdt') {
        convertSatsToUSD(SearchableItem.payloads.public.price);
      }
    }
  }, [SearchableItem]);
  
  useEffect(() => {
    if (SearchableItem) {
      fetchPayments();
      fetchRatings();
      refreshPaymentsBySearchable();
    }
  }, [SearchableItem]);
  
  useEffect(() => {
    // Calculate total price based on selected variations
    if (SearchableItem && SearchableItem.payloads.public.selectables) {
      let total = 0;
      Object.entries(selectedVariations).forEach(([id, quantity]) => {
        const selectable = SearchableItem.payloads.public.selectables.find(
          item => item.id.toString() === id
        );
        if (selectable && quantity > 0) {
          total += selectable.price * quantity;
        }
      });
      setTotalPrice(total);
      
      // Update USD price based on total, only if not using USDT
      if (total > 0 && currency !== 'usdt') {
        convertSatsToUSD(total);
      }
    }
  }, [selectedVariations, SearchableItem, currency]);
  
  useEffect(() => {
    // Initialize selectedVariations when SearchableItem is loaded
    if (SearchableItem && SearchableItem.payloads.public.selectables) {
      const initialSelections = {};
      SearchableItem.payloads.public.selectables.forEach(item => {
        initialSelections[item.id] = 0;
      });
      setSelectedVariations(initialSelections);
    }
  }, [SearchableItem]);
  
  useEffect(() => {
    // todo: what?
    return () => {
      isMountedRef.current = false;
      if (paymentCheckRef.current) {
        clearTimeout(paymentCheckRef.current);
      }
    };
  }, []);
  
  const fetchItemDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await backend.get(`v1/searchable/${id}`);
      
      setSearchableItem(response.data);
    } catch (err) {
      console.error("Error fetching item details:", err);
      setError("Failed to load item details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch ratings for both the searchable item and the seller
  const fetchRatings = async () => {
    setLoadingRatings(true);
    try {
      // Fetch searchable item rating
      const searchableResponse = await backend.get(`v1/rating/searchable/${id}`);
      setSearchableRating(searchableResponse.data);
      
      // Fetch terminal (seller) rating if terminal_id is available
      if (SearchableItem.terminal_id) {
        const terminalResponse = await backend.get(`v1/rating/terminal/${SearchableItem.terminal_id}`);
        setTerminalRating(terminalResponse.data);
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
      // Don't set an error state, as this is not critical functionality
    } finally {
      setLoadingRatings(false);
    }
  };
  
  // Helper function to render text ratings instead of stars
  const renderStarRating = (rating, count = null) => {
    if (rating === null || rating === undefined) return null;
    
    return  `${rating.toFixed(1)}/5(${count})`
  };
  
  const convertSatsToUSD = async (sats) => {
    setPriceLoading(true);
    try {
      const response = await backend.get('v1/get-btc-price');
      
      if (response.data && response.data.price) {
        const btcPrice = response.data.price;
        const usdValue = (sats / 100000000) * btcPrice;
        setUsdPrice(usdValue);
      }
    } catch (error) {
      console.error("Error fetching BTC price:", error);
    } finally {
      setPriceLoading(false);
    }
  };
  
  const handleQuantityChange = (id, change) => {
    setSelectedVariations(prev => {
      const currentValue = prev[id] || 0;
      const newValue = Math.max(0, currentValue + change);
      return { ...prev, [id]: newValue };
    });
  };
  
  const createInvoice = async (invoiceType = 'lightning') => {
    if (!SearchableItem) return;
    
    // Validate if we have any selections
    const hasSelections = Object.values(selectedVariations).some(qty => qty > 0);
    
    if (!hasSelections) {
      showAlert("Please select at least one item variation", "warning");
      return;
    }
    
    setCreatingInvoice(true);
    setPaymentStatus(null);
    try {
      // Get buyer ID - use account.user._id if available, otherwise use visitor ID
      const buyerId = account?.user?._id || getOrCreateVisitorId();
      
      // Prepare common payload properties
      const payload = {
        searchable_id: id,
        invoice_type: invoiceType,
      };
      // Add selected variations
      const selections = [];
      Object.entries(selectedVariations).forEach(([id, quantity]) => {
        if (quantity > 0) {
          const selectable = SearchableItem.payloads.public.selectables.find(
            item => item.id.toString() === id
          );
          if (selectable) {
            selections.push({
              id: selectable.id,
              name: selectable.name,
              price: selectable.price,
              quantity: quantity
            });
          }
        }
      });
      payload.selections = selections;
      payload.total_price = totalPrice;
      
      // Add Stripe-specific properties if needed
      if (invoiceType === 'stripe') {
        payload.success_url = `${window.location.origin}${window.location.pathname}`;
        payload.cancel_url = `${window.location.origin}${window.location.pathname}`;
      }
      
      // Add address and tel for logged-in users
      if (account?.user) {
        payload.address = account.user.address;
        payload.tel = account.user.tel;
      }
      
      const response = await backend.post('v1/create-invoice', payload);
      
      if (invoiceType === 'lightning') {
        setInvoice(response.data);
        setPaymentDialogOpen(true);
        checkPaymentStatus(response.data.id);
      } else if (invoiceType === 'stripe' && response.data.url) {
        window.location.href = response.data.url;
        
        // If we have a session_id, set up polling for Stripe payment status
        if (response.data.session_id) {
          // Start checking Stripe payment status
          checkStripePaymentStatus(response.data.session_id);
        }
      }
    } catch (err) {
      console.error(`Error creating ${invoiceType} invoice:`, err);
      showAlert(`Failed to create payment invoice. Please try again.`, "error");
    } finally {
      setCreatingInvoice(false);
    }
  };
  
  const checkPaymentStatus = async (invoiceId) => {
    if (!invoiceId || !isMountedRef.current) return;
    
    console.log("Starting payment status check for invoice:", invoiceId);
    
    if (!paymentCheckRef.current) {
      console.log("First check, setting checkingPayment state to true");
      setCheckingPayment(true);
    }
    
    try {
      // Use the new refresh-payment endpoint
      const response = await backend.post('v1/refresh-payment', {
        invoice_type: 'lightning',
        invoice_id: invoiceId
      });
      
      console.log("Received payment status:", response.data.status);
      
      if (isMountedRef.current) {
        console.log("Component still mounted, updating payment status state");
        setPaymentStatus(response.data.status);
        
        if (response.data.status === 'New' || response.data.status === 'Processing') {
          console.log("Payment still in progress, scheduling next check in 3 seconds");
          paymentCheckRef.current = setTimeout(() => checkPaymentStatus(invoiceId), 3000);
        } else if (response.data.status === 'Settled' || response.data.status === 'Complete') {
          console.log("Payment completed successfully");
          showAlert("Payment successful!");
          setPaymentDialogOpen(false);
          
          // Refresh payments list after successful payment
          fetchPayments();
        } else {
          console.log("Payment in final state (not successful)");
        }
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      if (isMountedRef.current) {
        console.log("Error occurred, cleaning up payment check");
      }
    } finally {
      setCheckingPayment(false);
      paymentCheckRef.current = null;
    }
  };
  
  const handleClosePaymentDialog = () => {
    // Log payment dialog closing
    console.log("Closing payment dialog");
    
    // If there's an invoice, log its details
    if (invoice) {
      console.log("Abandoning invoice:", invoice.id);
    }
    if (paymentCheckRef.current) {
      clearTimeout(paymentCheckRef.current);
      paymentCheckRef.current = null;
    }
    setPaymentDialogOpen(false);
    setInvoice(null);
    setPaymentStatus(null);
    setCheckingPayment(false);
  };
  
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };
  
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
      await backend.put(
        `v1/searchable/remove/${id}`,
        {}
      );
      showAlert("Item removed successfully");
      history.push('/searchables');
    } catch (error) {
      console.error("Error removing item:", error);
      showAlert("Failed to remove the item", "error");
    } finally {
      setIsRemoving(false);
    }
  };
  
  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  const fetchProfileData = async () => {
    if (!account.user || !account.token) return;
    
    try {
      const response = await backend.get('profile');
      
      // Update Redux store with new profile data
      dispatch({
        type: SET_USER,
        payload: {
          ...account.user,
          address: response.data.address,
          tel: response.data.tel
        }
      });

    } catch (err) {
      console.error('Error fetching user profile data:', err);
      // setError('Failed to load profile information');
    }
  };

  // Function to show alerts
  const showAlert = (message, severity = 'success') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setAlertOpen(false);
    }, 5000);
  };
  
  // Update both button click handlers to use the same createInvoice function
  const handlePayButtonClick = () => {
    // Check if user is logged in
    const isUserLoggedIn = !!account?.user;
    
    if (isUserLoggedIn) {
      fetchProfileData();
      
      // Check if address and telephone are required and provided
      if (SearchableItem.payloads.public.require_address && 
          (!account.user.address || !account.user.tel)) {
        showAlert("Please update your profile with address and telephone before making a payment", "warning");
        return;
      }
    }
    
    // Proceed with Lightning invoice creation
    createInvoice('lightning');
  };
  
  const handleStripePayButtonClick = async () => {
    // Check if user is logged in - same validation as Lightning payment
    const isUserLoggedIn = !!account?.user;
    
    if (isUserLoggedIn) {
      fetchProfileData();
      
      // Check if price is too low for credit card payment (only for sats)
      if (
        (currency !== 'usdt' && totalPrice < 1000 ) || (currency === 'usdt' && totalPrice < 1)
      ) {
        showAlert("Amount too low for credit card payment. Please use Lightning instead.", "warning");
        return;
      }

      
      // Check if address and telephone are required and provided
      if (SearchableItem.payloads.public.require_address && 
          (!account.user.address || !account.user.tel)) {
        showAlert("Please update your profile with address and telephone before making a payment", "warning");
        return;
      }
    }
    
    // Create Stripe checkout session
    createInvoice('stripe');
  };
  
  const fetchPayments = async () => {
    try {
      const response = await backend.get(`v1/payments-by-searchable/${id}`);
      setSearchablePayments(response.data.payments);
    } catch (err) {
      console.error("Error fetching payments:", err);
      showAlert("Failed to load payment history", "error");
    }
  };
  
  // Add this new function to refresh payments by searchable id
  const refreshPaymentsBySearchable = async () => {
    try {
      await backend.get(`v1/refresh-payments-by-searchable/${id}`);
      // After refreshing, fetch the updated payments
      fetchPayments();
    } catch (err) {
      console.error("Error refreshing payments for searchable:", err);
      // Don't show an alert as this is a background operation
    }
  };
  
  // Add new function to check Stripe payment status
  const checkStripePaymentStatus = async (sessionId) => {
    if (!sessionId || !isMountedRef.current) return;
    
    console.log("Starting Stripe payment status check for session:", sessionId);
    
    if (!paymentCheckRef.current) {
      setCheckingPayment(true);
    }
    
    try {
      const response = await backend.post('v1/refresh-payment', {
        invoice_type: 'stripe',
        session_id: sessionId
      });
      
      if (isMountedRef.current) {
        const paymentStatus = response.data.status;
        console.log("Received Stripe payment status:", paymentStatus);
        
        if (paymentStatus === 'complete' || paymentStatus === 'paid') {
          console.log("Stripe payment completed successfully");
          showAlert("Credit card payment successful!");
          // Refresh payments list after successful payment
          fetchPayments();
        } else if (paymentStatus === 'open' || paymentStatus === 'processing') {
          console.log("Stripe payment still in progress, scheduling next check in 3 seconds");
          paymentCheckRef.current = setTimeout(() => checkStripePaymentStatus(sessionId), 3000);
        } else {
          console.log("Stripe payment in final state (not successful)");
        }
      }
    } catch (err) {
      console.error("Error checking Stripe payment status:", err);
    } finally {
      if (!paymentCheckRef.current) {
        setCheckingPayment(false);
      }
    }
  };
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    // todo: we should display sats on lightning dialog
    if (currency === 'usdt') {
      return `${amount.toFixed(2)} USDT`;
    } else {
      return `${amount} Sats`;
    }
  };
  
  // Render variations selection UI - simplified to assume variations always exist
  const renderVariations = () => {
    if (!SearchableItem || !SearchableItem.payloads.public.selectables) {
      return null;
    }
    
    return (
      <Box p={1} width="100%">
        {SearchableItem.payloads.public.selectables.map((item) => (
          <Box 
            key={item.id} 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
            py={1}
            width="100%"
          >
            <Box flex={1}>
              <Typography variant="body1">{item.name}</Typography>
              <Typography variant="body2">{formatCurrency(item.price)}</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <IconButton 
                size="small" 
                onClick={() => handleQuantityChange(item.id, -1)}
                disabled={!selectedVariations[item.id] || selectedVariations[item.id] <= 0}
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="body1" style={{ margin: '0 10px' }}>
                {selectedVariations[item.id] || 0}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleQuantityChange(item.id, 1)}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        ))}
        
        {totalPrice > 0 && (
          <Box mt={2} display="flex" justifyContent="flex-end" width="100%">
            <Typography variant="h6">
              Total: {formatCurrency(totalPrice)}
              {usdPrice !== null && !priceLoading && currency !== 'usdt' && (
                <Typography variant="body2" component="span" style={{ marginLeft: 8 }}>
                  (≈ {formatUSD(usdPrice)})
                </Typography>
              )}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box>
              <Button 
                color="primary" 
                onClick={() => history.push('/searchables')}
              >
                <ChevronLeftIcon />
              </Button>
        </Box>
      </Grid>
      
      {/* Alert notification */}
      <Box>
        <Collapse in={alertOpen}>
          <Alert
            severity={alertSeverity}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setAlertOpen(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            icon={alertSeverity === 'success' ? <CheckIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
          >
            {alertMessage}
          </Alert>
        </Collapse>
      </Box>
      
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
      
      {!loading && SearchableItem && (
        <Grid item xs={12}>
        <Paper elevation={3}>
        <Grid item xs={12}>
            <Box p={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      '@media (max-width:600px)': {
                        padding: '4px',
                      },
                    }}
                  >
                      
                      <Typography variant="h3" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {SearchableItem.payloads.public.title || `Item #${SearchableItem.searchable_id}`}
                      </Typography>
                    
                    {/* Display item rating */}
                    <Box mt={1} display="flex" alignItems="center">
                    {!loadingRatings && searchableRating && (
                        <Typography variant="body1" style={{ marginRight: 8 }}>
                         Rating {renderStarRating(searchableRating.average_rating, searchableRating.rating_count)}
                     </Typography>

                    )}
                    {!loadingRatings && terminalRating && (
                            <Typography variant="body1" style={{ marginRight: 8 }}>
                               User Rating: {renderStarRating(terminalRating.average_rating, terminalRating.rating_count)}
                            </Typography>
                            
                        )}</Box>

                    
                    <Divider style={{ width: '100%' }} />
                  </Box>
                </Grid>
                
                {SearchableItem.payloads.public.images && SearchableItem.payloads.public.images.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={1}>
                      {SearchableItem.payloads.public.images.map((image, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <ZoomableImage 
                            src={`data:image/jpeg;base64,${image}`} 
                            alt={`${SearchableItem.payloads.public.title} - image ${index + 1}`} 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
                
                <Grid item xs={12} md={SearchableItem.payloads.public.images && SearchableItem.payloads.public.images.length > 0 ? 6 : 12}>
                  <Grid container spacing={2}>
                    {renderVariations()}
                  
                    <Grid item xs={12}>
                      <Box mt={3} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="center" gap={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handlePayButtonClick}
                          disabled={creatingInvoice}
                          fullWidth
                        >
                          Pay with ⚡ (0% fee)
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleStripePayButtonClick}
                          disabled={creatingInvoice}
                          fullWidth
                        >
                          Pay with 💳 (3.5% fee)
                        </Button>
                      </Box>
                    </Grid>
                    
                    {/* Only display map if businessType is not online */}
                    {SearchableItem.payloads.public.latitude && 
                     SearchableItem.payloads.public.longitude && 
                     SearchableItem.payloads.public.use_location && (
                        <Grid item xs={12}>
                          <Box mt={1} height="200px" width="100%" border="1px solid #ccc">
                            <iframe
                              title="Item Location"
                              width="100%"
                              height="100%"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${SearchableItem.payloads.public.longitude}%2C${SearchableItem.payloads.public.latitude}%2C${SearchableItem.payloads.public.longitude}%2C${SearchableItem.payloads.public.latitude}&layer=mapnik&marker=${SearchableItem.payloads.public.latitude}%2C${SearchableItem.payloads.public.longitude}&zoom=17`}
                              scrolling="no"
                              frameBorder="0"
                              style={{ pointerEvents: 'none' }}
                            />
                          </Box>
                        </Grid>
                      )}
                    
                    {/* Only display meetup location if businessType is not online */}
                    {SearchableItem.payloads.public.meetupLocation && 
                     SearchableItem.payloads.public.use_location && (
                        <Grid item xs={12}>
                          <Typography variant="body1">
                              <span>{SearchableItem.payloads.public.meetupLocation}</span>
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
              </Grid>
            </Box>
        </Grid>
        </Paper>
        
        <PaymentList payments={searchablePayments} />
        </Grid>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} maxWidth="md">
        <DialogContent>
          {invoice ? (
            <Box sx={{ border: '1px solid', borderColor: 'divider', padding: 2, marginTop: 2, width: '100%' }}>
              
              <Typography variant="body1" gutterBottom align="left">
                Amount: {formatCurrency(totalPrice)}
              </Typography>
              
              <Typography variant="body1" gutterBottom align="left">
                Invoice ID: {invoice.id.substring(0, 3).toUpperCase()}
              </Typography>
              
              {/* Always show selected variations */}
              <Box mt={2} mb={2}>
                <Typography variant="body1" gutterBottom align="left">
                  Selected items:
                </Typography>
                {Object.entries(selectedVariations).map(([id, qty]) => {
                  if (qty <= 0) return null;
                  const item = SearchableItem.payloads.public.selectables.find(
                    selectable => selectable.id.toString() === id
                  );
                  if (!item) return null;
                  return (
                    <Typography key={id} variant="body2" align="left">
                      {item.name} x {qty} ({formatCurrency(item.price * qty)})
                    </Typography>
                  );
                })}
              </Box>
              
              {/* Only display address and telephone for items requiring address and logged-in users */}
              {SearchableItem && SearchableItem.payloads.public.require_address && account?.user && (
                <>
                  <Typography variant="body2" align="left">
                    Address: {account.user?.address || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" align="left">
                    Telephone: {account.user?.tel || 'Not provided'}
                  </Typography>
                </>
              )}
              
              {/* If visitor, prompt to register for items requiring address */}
              {SearchableItem && SearchableItem.payloads.public.require_address && !account?.user && (
                <Typography variant="body2" color="error" style={{ marginTop: 8 }} align="left">
                  Note: Create an account to provide delivery details for this item.
                </Typography>
              )}
              
              {paymentStatus && (
                <Typography variant="body1" gutterBottom style={{ marginTop: 16 }} align="left">
                  Status: {paymentStatus}
                </Typography>
              )}
              
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }} align="left">
                TRANSACTION IS IRRERVERSIBLE
              </Typography>
              {invoice.checkoutLink && (
                <Button 
                  variant="contained" 
                  color="primary"
                  href={invoice.checkoutLink}
                  target="_blank"
                  style={{ marginTop: 16 }}
                  align="left"
                >
                  Pay with ⚡
                </Button>
              )}
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default SearchableDetails; 