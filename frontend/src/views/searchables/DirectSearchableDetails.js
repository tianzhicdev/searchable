import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useLocation, useHistory } from 'react-router-dom';
import {
  Grid, Typography, Button, Paper, Box, CircularProgress, Divider,
  TextField, InputAdornment, ButtonGroup
} from '@material-ui/core';
import { AttachMoney, Payment } from '@material-ui/icons';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import Alert from '@material-ui/lab/Alert';
import backend from '../utilities/Backend';
import SearchableDetailsTop from '../../components/SearchableDetailsTop';
import SearchableDetailsPriceDisplay from '../../components/SearchableDetailsPriceDisplay';
import useComponentStyles from '../../themes/componentStyles';
import { navigateBack, getBackButtonText } from '../../utils/navigationUtils';

const DirectSearchableDetails = () => {
  const classes = useComponentStyles();
  
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
  const [loadingRatings, setLoadingRatings] = useState(true);
  
  // Direct payment specific states
  const [paymentAmount, setPaymentAmount] = useState(9.99);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isAmountFixed, setIsAmountFixed] = useState(false); // Whether amount is fixed from URL

  // Quick amount options
  const quickAmounts = [4.99, 9.99, 19.99];

  const { id } = useParams();
  const account = useSelector((state) => state.account);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    fetchSearchableDetails();
    fetchRatings();
  }, [id]);

  useEffect(() => {
    // Check for amount parameter in URL
    const params = new URLSearchParams(location.search);
    const amountParam = params.get('amount');
    
    if (amountParam && !isNaN(parseFloat(amountParam))) {
      const fixedAmount = parseFloat(amountParam);
      setPaymentAmount(fixedAmount);
      setIsAmountFixed(true); // Amount is fixed from URL
    } else if (SearchableItem?.payloads?.public?.defaultAmount) {
      setPaymentAmount(SearchableItem.payloads.public.defaultAmount);
      setIsAmountFixed(false); // Amount can be modified
    } else {
      setPaymentAmount(9.99); // Default fallback
      setIsAmountFixed(false); // Amount can be modified
    }
  }, [location.search, SearchableItem]);

  const fetchSearchableDetails = async () => {
    try {
      const response = await backend.get(`v1/searchable/${id}`);
      setSearchableItem(response.data);
      
      // Check if current user is the owner
      if (account && account.user && account.user._id === response.data.terminal_id) {
        setIsOwner(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch item details');
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
    } catch (err) {
      console.error("Error fetching ratings:", err);
      // Don't set an error state, as this is not critical functionality
    } finally {
      setLoadingRatings(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      // Create invoice with the selected amount
      const invoiceData = {
        searchable_id: parseInt(id),
        type: 'stripe',
        currency: 'usd',
        selections: [{
          amount: paymentAmount,
          type: 'direct'
        }]
      };

      const response = await backend.post('v1/payment/create_invoice', invoiceData);

      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else if (response.data.session_id) {
        // In a real implementation, you would use Stripe here
        // For mock mode, we'll just redirect to a success page
        window.location.href = `${window.location.origin}${window.location.pathname}?payment=success&amount=${paymentAmount}`;
      }
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveItem = async () => {
    if (!window.confirm('Are you sure you want to remove this item?')) {
      return;
    }

    setIsRemoving(true);
    try {
      await backend.delete(`v1/searchable/${id}`);
      navigateBack(history);
    } catch (err) {
      setError(err.message || 'Failed to remove item');
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
          </Box>
        </Grid>
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper className={classes.paper} style={{ backgroundColor: '#ffebee' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  if (!SearchableItem) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper className={classes.paper} style={{ backgroundColor: '#ffebee' }}>
            <Typography color="error">Item not found</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  const publicData = SearchableItem.payloads?.public || {};

  return (
    <Grid container spacing={2}>
      {/* Back button */}
      <Grid item xs={12}>
        <Button
          startIcon={<ChevronLeftIcon />}
          onClick={() => navigateBack(history)}
          className={classes.backButton}
        >
          {getBackButtonText(location)}
        </Button>
      </Grid>

      {/* Main content */}
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          {/* Top section: Title, ratings, description, images */}
          <SearchableDetailsTop
            searchableItem={SearchableItem}
            searchableRating={searchableRating}
            loadingRatings={loadingRatings}
            searchableId={id}
          />

          {/* Direct payment middle section */}
          {!isOwner && (
            <Box>
              {isAmountFixed ? (
                <Box>
                  <Typography variant="h4" color="primary">
                    ${paymentAmount.toFixed(2)}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Choose Payment Amount
                  </Typography>

                  {/* Quick amount buttons */}
                  <ButtonGroup fullWidth style={{ marginBottom: 16 }}>
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={paymentAmount === amount ? 'contained' : 'outlined'}
                        onClick={() => setPaymentAmount(amount)}
                        startIcon={<AttachMoney />}
                      >
                        ${amount.toFixed(2)}
                      </Button>
                    ))}
                  </ButtonGroup>

                  {/* Custom amount input */}
                  <TextField
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 0.01, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    style={{ marginBottom: 24 }}
                  />
                </Box>
              )}

              {paymentError && (
                <Alert severity="error" style={{ marginBottom: 16 }}>
                  {paymentError}
                </Alert>
              )}
            </Box>
          )}

          {/* Payment display and button */}
          <SearchableDetailsPriceDisplay
            totalPrice={paymentAmount}
            processing={processing}
            onPayButtonClick={handlePayment}
            isOwner={isOwner}
            onRemoveItem={handleRemoveItem}
            isRemoving={isRemoving}
            payButtonText={`Pay $${(paymentAmount * 1.035).toFixed(2)}`}
            showPaymentSummary={true}
            disabled={!paymentAmount || paymentAmount <= 0}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DirectSearchableDetails;