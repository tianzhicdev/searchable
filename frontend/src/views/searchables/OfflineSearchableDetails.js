import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import configData from '../../config';
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress, Divider, 
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, 
  Checkbox, FormControlLabel, Accordion, AccordionSummary, AccordionDetails,
  TextField, IconButton
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import CheckIcon from '@material-ui/icons/Check';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import InvoiceList from '../payments/InvoiceList';
import { useDispatch } from 'react-redux';
import { SET_USER } from '../../store/actions';
import backend from '../utilities/Backend';
import SearchableDetailsTop from '../../components/SearchableDetailsTop';
import SearchableDetailsPriceDisplay from '../../components/SearchableDetailsPriceDisplay';
import RatingDisplay from '../../components/Rating/RatingDisplay';
import useComponentStyles from '../../themes/componentStyles';
import { navigateBack, getBackButtonText } from '../../utils/navigationUtils';

const OfflineSearchableDetails = () => {
  const classes = useComponentStyles();
  const dispatch = useDispatch();

  // Item data
  const [SearchableItem, setSearchableItem] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  
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
  const location = useLocation();
  
  const paymentCheckRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Alert states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  
  // Item selection states for offline products (with count)
  const [selectedItems, setSelectedItems] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Purchased items tracking
  const [userPaidItems, setUserPaidItems] = useState(new Set());

  useEffect(() => {
    // User must be logged in to access this page (enforced by AuthGuard)
    fetchItemDetails();
    refreshPaymentsBySearchable();
    fetchRatings();
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
      fetchUserPaidItems();
    }
  }, [SearchableItem]);
  
  useEffect(() => {
    // Calculate total price based on selected items
    if (SearchableItem && SearchableItem.payloads.public.offlineItems) {
      let total = 0;
      Object.entries(selectedItems).forEach(([itemId, count]) => {
        const offlineItem = SearchableItem.payloads.public.offlineItems.find(
          item => item.itemId.toString() === itemId
        );
        if (offlineItem && count > 0) {
          total += offlineItem.price * count;
        }
      });
      setTotalPrice(total);
    }
  }, [selectedItems, SearchableItem]);
  
  useEffect(() => {
    // Initialize selectedItems when SearchableItem is loaded
    if (SearchableItem && SearchableItem.payloads.public.offlineItems) {
      const initialSelections = {};
      SearchableItem.payloads.public.offlineItems.forEach(item => {
        initialSelections[item.itemId] = 0;
      });
      setSelectedItems(initialSelections);
    }
  }, [SearchableItem]);
  
  useEffect(() => {
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
      if (SearchableItem && SearchableItem.terminal_id) {
        try {
          const terminalResponse = await backend.get(`v1/rating/terminal/${SearchableItem.terminal_id}`);
          setTerminalRating(terminalResponse.data);
        } catch (terminalErr) {
          console.error("Error fetching terminal ratings:", terminalErr);
          // Set empty rating data if fetch fails
          setTerminalRating({ average_rating: 0, total_ratings: 0 });
        }
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
      // Don't set an error state, as this is not critical functionality
    } finally {
      setLoadingRatings(false);
    }
  };
  
  const handleItemSelection = (itemId, count) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: Math.max(0, count) }));
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
    
    // Validate if we have any item selections
    const hasSelections = Object.values(selectedItems).some(count => count > 0);
    
    if (!hasSelections) {
      showAlert("Please select at least one item to purchase", "warning");
      return;
    }
    
    setCreatingInvoice(true);
    try {
      // Get buyer ID - use account.user._id if available, otherwise use visitor ID
      const buyerId = account?.user?._id;
      
      // Prepare common payload properties
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
      
      if (invoiceType === 'stripe' && response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error(`Error creating ${invoiceType} invoice:`, err);
      showAlert(`Failed to create payment invoice. Please try again.`, "error");
    } finally {
      setCreatingInvoice(false);
    }
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
      navigateBack(history, '/searchables');
    } catch (error) {
      console.error("Error removing item:", error);
      showAlert("Failed to remove the item", "error");
    } finally {
      setIsRemoving(false);
    }
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
  
  const handleStripePayButtonClick = async () => {
    // Check if user is logged in
    const isUserLoggedIn = !!account?.user;
    
    if (isUserLoggedIn) {
      fetchProfileData();
      
      // Check if price meets minimum payment requirement
      if (totalPrice < 1) {
        showAlert("Amount too low for payment. Minimum amount is $1.00", "warning");
        return;
      }
    }
    
    // Create Stripe checkout session
    createInvoice('stripe');
  };
  
  // Add this new function to refresh payments by searchable id
  const refreshPaymentsBySearchable = async () => {
    try {
      await backend.get(`v1/refresh-payments-by-searchable/${id}`);
      
    } catch (err) {
      console.error("Error refreshing payments for searchable:", err);
      // Don't show an alert as this is a background operation
    }
  };
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
      return `$${amount.toFixed(2)}`;
  };
  
  // Add new function to fetch user-specific paid items
  const fetchUserPaidItems = async () => {
    try {
      const response = await backend.get(`v1/user-paid-items/${id}`);
      const userPaidItemIds = new Set(response.data.paid_item_ids);
      setUserPaidItems(userPaidItemIds);
    } catch (err) {
      console.error("Error fetching user paid items:", err);
      // Set empty set if there's an error (user probably hasn't paid)
      setUserPaidItems(new Set());
    }
  };
  
  // Render offline items selection UI
  const renderOfflineItems = () => {
    if (!SearchableItem || !SearchableItem.payloads.public.offlineItems) {
      return null;
    }
    
    return (
      <Box>
        {SearchableItem.payloads.public.offlineItems.map((item) => {
          const isPaidByCurrentUser = userPaidItems.has(item.itemId.toString());
          const currentCount = selectedItems[item.itemId] || 0;
          
          return (
            <Paper key={item.itemId} >
              <Box flex={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography variant="body1" className={classes.staticText}>{item.name}</Typography>
                    <Typography variant="body2" className={classes.userText}>
                      {item.description}
                    </Typography>
                    <Typography variant="body2" className={classes.userText}>{formatCurrency(item.price)}</Typography>
                    {isPaidByCurrentUser && (
                      <Typography variant="caption" className={classes.userText} style={{ color: 'green' }}>
                        ✓ Purchased
                      </Typography>
                    )}
                  </Box>
                  
                  {!isPaidByCurrentUser && (
                    <Box display="flex" alignItems="center">
                      <IconButton 
                        size="small"
                        onClick={() => decrementCount(item.itemId)}
                        disabled={currentCount === 0}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        type="number"
                        value={currentCount}
                        onChange={(e) => handleItemSelection(item.itemId, parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0, style: { textAlign: 'center', width: '60px' } }}
                        variant="outlined"
                        size="small"
                        style={{ margin: '0 8px' }}
                      />
                      <IconButton 
                        size="small"
                        onClick={() => incrementCount(item.itemId)}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          );
        })}
        
        {totalPrice > 0 && (
          <Box mt={2} display="flex" justifyContent="flex-end" width="100%">
            <Typography variant="h6">
              Total: {formatCurrency(totalPrice)}
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
                variant='contained'
                onClick={() => navigateBack(history, '/searchables')}
                startIcon={<ChevronLeftIcon />}
              >
                {getBackButtonText(location)}
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
          <Paper>
            {/* Top section: Title, ratings, description, images */}
            <SearchableDetailsTop
              searchableItem={SearchableItem}
              searchableRating={searchableRating}
              loadingRatings={loadingRatings}
              searchableId={id}
            />

            
            {/* Items Section */}
            {renderOfflineItems()}
            
            {/* Payment display and button */}
            <SearchableDetailsPriceDisplay
              totalPrice={totalPrice * 1.035}
              processing={creatingInvoice}
              onPayButtonClick={handleStripePayButtonClick}
              isOwner={isOwner}
              onRemoveItem={handleRemoveItem}
              isRemoving={isRemoving}
              payButtonText={`Pay ${formatCurrency(totalPrice * 1.035)}`}
              showPaymentSummary={true}
              disabled={totalPrice === 0}
            />
          </Paper>
          
          {/* Collapsible Reviews Section */}
          {!loadingRatings && searchableRating && searchableRating.individual_ratings && searchableRating.individual_ratings.length > 0 && (
            
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className={classes.iconColor} />}
                aria-controls="reviews-content"
                id="reviews-header"
              >
                <Typography className={classes.staticText}>
                  Recent Reviews ({searchableRating.individual_ratings.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box width="100%">
                  <RatingDisplay
                    averageRating={searchableRating.average_rating || 0}
                    totalRatings={searchableRating.total_ratings || 0}
                    individualRatings={searchableRating.individual_ratings || []}
                    showIndividualRatings={true}
                    maxIndividualRatings={10}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
          
          <InvoiceList 
            searchableId={id} 
            onRatingSubmitted={() => {
              fetchRatings();
            }}
          />
        </Grid>
      )}

    </Grid>
  );
};

export default OfflineSearchableDetails;