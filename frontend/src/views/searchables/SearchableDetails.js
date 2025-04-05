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
    if (SearchableItem && SearchableItem.payloads && SearchableItem.payloads.public && SearchableItem.payloads.public.price) {
      convertSatsToUSD(SearchableItem.payloads.public.price);
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
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      
      if (response.data && response.data.bitcoin && response.data.bitcoin.usd) {
        const btcPrice = response.data.bitcoin.usd;
        const usdValue = (sats / 100000000) * btcPrice;
        setUsdPrice(usdValue);
      }
    } catch (error) {
      console.error("Error fetching BTC price:", error);
    } finally {
      setPriceLoading(false);
    }
  };
  
  const createInvoice = async (invoiceType = 'lightning') => {
    if (!SearchableItem || !SearchableItem.payloads.public.price) return;
    
    setCreatingInvoice(true);
    setPaymentStatus(null);
    try {
      // Get buyer ID - use account.user._id if available, otherwise use visitor ID
      const buyerId = account?.user?._id || getOrCreateVisitorId();
      
      // Prepare common payload properties
      const payload = {
        searchable_id: id,
        business_type: SearchableItem.payloads.public.businessType,
        invoice_type: invoiceType,
      };
      
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
        // Open Stripe checkout URL in a new tab
        window.open(response.data.url, '_blank');
        
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
      const response = await axios.get(`${configData.API_SERVER}profile`, {
        headers: { Authorization: `${account.token}` }
      });
      
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
      
      // Only require address and telephone for non-online business types
      if (SearchableItem.payloads.public.businessType === "online" && 
          (!account.user.address || !account.user.tel)) {
        showAlert("Please log in or update your profile with address and telephone before making a payment", "warning");
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
      
      // Check if price is too low for credit card payment
      if (SearchableItem.payloads.public.price < 1000) {
        showAlert("Amount too low for credit card payment. Please use Lightning instead.", "warning");
        return;
      }
      // Only require address and telephone for non-online business types
      if (SearchableItem.payloads.public.businessType !== "online" && 
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
  
  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Box mb={2}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => history.goBack()}
            >
              <ChevronLeftIcon /> 
            </Button>
        </Box>
      </Grid>
      
      {/* Alert notification */}
      <Grid item xs={12}>
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
                    
                    {SearchableItem.payloads.public && SearchableItem.payloads.public.price && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Price: </span>
                          <span>{SearchableItem.payloads.public.price} Sats</span>
                          
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
                    
                    {SearchableItem.username && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Posted by: </span>
                          <Tooltip title={SearchableItem.username}>
                            <span>{truncateText(SearchableItem.username, 25)}</span>
                          </Tooltip>
                        </Typography>
                        
                        {/* Display seller rating */}
                      </Grid>
                    )}

                    {SearchableItem.distance && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Distance: </span>
                          <span>{formatDistance(SearchableItem.distance)}</span>
                        </Typography>
                      </Grid>
                    )}

                    
                    {SearchableItem.payloads.public.description && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          Description:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          style={{ 
                            whiteSpace: 'pre-line', 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word' 
                          }}
                        >
                          {SearchableItem.payloads.public.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Only display map if businessType is not online */}
                  {SearchableItem.payloads.public.latitude && 
                   SearchableItem.payloads.public.longitude && 
                   SearchableItem.payloads.public.businessType !== "online" && (
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
                   SearchableItem.payloads.public.businessType !== "online" && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                            <span>{SearchableItem.payloads.public.meetupLocation}</span>
                        </Typography>
                      </Grid>
                    )}
                  
                  { SearchableItem.payloads.public && SearchableItem.payloads.public.price && (
                    <Grid item xs={12}>
                      <Box mt={3} display="flex" flexDirection="column" justifyContent="center" gap={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handlePayButtonClick}
                          disabled={creatingInvoice}
                        >
                            Pay with ⚡ (0% fee)
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleStripePayButtonClick}
                          disabled={creatingInvoice || usdPrice === null}
                        >
                            Pay with 💳 (3.5% fee)
                        </Button>
                      </Box>
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
        
        <PaymentList payments={searchablePayments} />
        </Grid>
      )}

      {/* Payment Dialog - Updated to conditionally show address/tel based on business type */}
      <Dialog open={paymentDialogOpen} maxWidth="md">
        <DialogContent>
          {invoice ? (
            <Box sx={{ border: '1px solid', borderColor: 'divider', padding: 2, marginTop: 2, width: '100%' }}>
              
              <Typography variant="body1" gutterBottom align="left">
                Amount: {SearchableItem?.payloads?.public?.price || invoice.amount} Sats
              </Typography>
              
              <Typography variant="body1" gutterBottom align="left">
                Invoice ID: {invoice.id.substring(0, 3).toUpperCase()}
              </Typography>
              
              {/* Only display address and telephone for non-online business types and logged-in users */}
              {SearchableItem && SearchableItem.payloads.public.businessType !== "online" && account?.user && (
                <>
                  <Typography variant="body2" align="left">
                    Address: {account.user?.address || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" align="left">
                    Telephone: {account.user?.tel || 'Not provided'}
                  </Typography>
                </>
              )}
              
              {/* If visitor, prompt to register for non-online business types */}
              {SearchableItem && SearchableItem.payloads.public.businessType !== "online" && !account?.user && (
                <Typography variant="body2" color="error" style={{ marginTop: 8 }} align="left">
                  Note: Create an account to provide delivery details for physical items.
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