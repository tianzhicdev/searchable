import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress, 
  Accordion, AccordionSummary, AccordionDetails,
  TextField, IconButton
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import InvoiceList from '../payments/InvoiceList';
import BaseSearchableDetails from '../../components/BaseSearchableDetails';
import useSearchableDetails from '../../hooks/useSearchableDetails';
import RatingDisplay from '../../components/Rating/RatingDisplay';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';

const OfflineSearchableDetails = () => {
  const classes = useComponentStyles();
  
  const {
    SearchableItem,
    searchableRating,
    loadingRatings,
    fetchRatings,
    createInvoice,
    createBalancePayment,
    formatCurrency,
    id
  } = useSearchableDetails();
  
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
  
  // Handle payment creation with offline-specific logic
  const handlePayment = async () => {
    if (!SearchableItem) return;
    
    // Validate if we have any item selections
    const hasSelections = Object.values(selectedItems).some(count => count > 0);
    
    if (!hasSelections) {
      showAlert("Please select at least one item to purchase", "warning");
      return;
    }
    
    try {
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
      
      await createInvoice({
        selections,
        total_price: totalPrice
      });
    } catch (err) {
      console.error('Error creating invoice:', err);
      showAlert('Failed to create payment invoice. Please try again.', 'error');
    }
  };

  const handleStripePayButtonClick = async () => {
    // Check if price meets minimum payment requirement
    if (totalPrice < 1) {
      showAlert("Amount too low for payment. Minimum amount is $1.00", "warning");
      return;
    }
    
    // Create payment
    handlePayment();
  };

  const handleDepositPayment = async (depositData) => {
    // Check if price meets minimum payment requirement
    if (totalPrice < 1) {
      showAlert("Amount too low for payment. Minimum amount is $1.00", "warning");
      return;
    }

    // For deposit payments, we show a success message and let the user know to deposit
    showAlert(`Deposit address created! Send $${totalPrice.toFixed(2)} USDT to complete your purchase.`, "info");
    
    // Optionally, you can store the deposit information for tracking
    
  };
  
  const handleBalancePayment = async () => {
    // Check if price meets minimum payment requirement
    if (totalPrice < 1) {
      showAlert("Amount too low for payment. Minimum amount is $1.00", "warning");
      return;
    }
    
    // Validate if we have any item selections
    const hasSelections = Object.values(selectedItems).some(count => count > 0);
    
    if (!hasSelections) {
      showAlert("Please select at least one item to purchase", "warning");
      return;
    }
    
    try {
      // Create selections array for balance payment
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
      
      await createBalancePayment({
        selections,
        total_price: totalPrice
      });
    } catch (err) {
      console.error('Error creating balance payment:', err);
      showAlert(err.message || 'Failed to process balance payment. Please try again.', 'error');
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
                      <Typography variant="caption" className={classes.userText} color="primary">
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
                        inputProps={{ min: 0 }}
                        variant="outlined"
                        size="small"
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
  
  // Render type-specific content for offline items
  const renderOfflineContent = ({ SearchableItem }) => (
    <Box>
      {/* Alert notification */}
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
          icon={alertSeverity === 'success' ? <CheckIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
        >
          {alertMessage}
        </Alert>
      </Collapse>

      {/* Items Section */}
      {renderOfflineItems()}
    </Box>
  );

  // Render reviews content separately
  const renderReviewsContent = ({ searchableRating, loadingRatings }) => {
    if (!searchableRating || !searchableRating.individual_ratings || searchableRating.individual_ratings.length === 0) {
      return null;
    }
    
    return (
      <Paper>
        <Typography variant="h6" className={classes.staticText} gutterBottom>
          Recent Reviews ({searchableRating.individual_ratings.length})
        </Typography>
        <Box width="100%">
          <RatingDisplay
            averageRating={searchableRating.average_rating || 0}
            totalRatings={searchableRating.total_ratings || 0}
            individualRatings={searchableRating.individual_ratings || []}
            showIndividualRatings={true}
            maxIndividualRatings={10}
          />
        </Box>
      </Paper>
    );
  };

  // Render receipts content separately
  const renderReceiptsContent = ({ id }) => (
    <InvoiceList 
      searchableId={id} 
      onRatingSubmitted={() => {
        fetchRatings();
      }}
    />
  );

  return (
    <BaseSearchableDetails
      renderTypeSpecificContent={renderOfflineContent}
      renderReviewsContent={renderReviewsContent}
      renderReceiptsContent={renderReceiptsContent}
      onPayment={handleStripePayButtonClick}
      onDepositPayment={handleDepositPayment}
      onBalancePayment={handleBalancePayment}
      totalPrice={totalPrice}
      payButtonText="Pay"
      disabled={totalPrice === 0}
    />
  );
};

export default OfflineSearchableDetails;