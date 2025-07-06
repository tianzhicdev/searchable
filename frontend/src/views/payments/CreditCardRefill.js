import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  InputAdornment,
  Alert
} from '@material-ui/core';
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon
} from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';

const CreditCardRefill = () => {
  const classes = useComponentStyles();
  const history = useHistory();
  const location = useLocation();
  
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Check for deposit status in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const depositStatus = params.get('deposit');
    
    if (depositStatus === 'success') {
      setSuccess('Deposit successful! Your balance will be updated shortly.');
      // Optionally redirect to dashboard after a delay
      setTimeout(() => {
        history.push('/dashboard');
      }, 3000);
    } else if (depositStatus === 'cancelled') {
      setError('Deposit cancelled. You can try again when ready.');
    }
  }, [location, history]);
  
  const handleAmountChange = (event) => {
    const value = event.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };
  
  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    
    // Validation
    if (!amount || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amountNum < 1) {
      setError('Minimum deposit amount is $1.00');
      return;
    }
    
    if (amountNum > 10000) {
      setError('Maximum deposit amount is $10,000.00');
      return;
    }
    
    try {
      setProcessing(true);
      setError('');
      
      // Get current URL for success/cancel redirects
      const currentUrl = window.location.origin + window.location.pathname;
      const successUrl = `${currentUrl}?deposit=success`;
      const cancelUrl = `${currentUrl}?deposit=cancelled`;
      
      // Create a Stripe deposit
      const response = await backend.post('/v1/deposit/create', {
        amount: amountNum.toFixed(2),
        type: 'stripe',
        success_url: successUrl,
        cancel_url: cancelUrl
      });
      
      if (response.data.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        setError('Failed to create payment session');
      }
    } catch (err) {
      console.error('Error creating Stripe deposit:', err);
      setError(err.response?.data?.error || 'Failed to create deposit. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };
  
  const stripeFee = amount ? parseFloat(amount) * 0.035 : 0;
  const totalAmount = amount ? parseFloat(amount) + stripeFee : 0;
  
  return (
    <Grid container spacing={2} flexDirection={'column'} >
      <Grid item xs={12}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => history.goBack()}
          className={classes.backButton}
        >
          Back
        </Button>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper className={classes.paper}>
          <Box mb={3}>
            <Typography variant="h5" className={classes.staticText} gutterBottom>
              Refill Balance with Credit Card
            </Typography>
            <Typography variant="body2" className={classes.userText}>
              Add funds to your account balance using a credit or debit card
            </Typography>
          </Box>
          
          {error && (
            <Box mb={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
          
          {success && (
            <Box mb={2}>
              <Alert severity="success">{success}</Alert>
            </Box>
          )}
          
          <Box mb={3}>
            <TextField
              fullWidth
              // placeholder="Amount to Add"
              variant="outlined"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              // InputProps={{
              //   startAdornment: <InputAdornment position="start">$</InputAdornment>,
              // }}
              helperText="Minimum: $1.00, Maximum: $10,000.00"
            />
          </Box>
          
          {amount && parseFloat(amount) > 0 && (
            <Box mb={3} p={2} bgcolor="background.default" borderRadius={1}>
              <Typography variant="body2" className={classes.staticText} gutterBottom>
                Payment Summary:
              </Typography>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" className={classes.userText}>
                  Amount to add:
                </Typography>
                <Typography variant="body2" className={classes.userText}>
                  {formatCurrency(amount)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" className={classes.userText}>
                  Stripe fee (3.5%):
                </Typography>
                <Typography variant="body2" className={classes.userText}>
                  {formatCurrency(stripeFee)}
                </Typography>
              </Box>
              <Box mt={1} pt={1} borderTop={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1" className={classes.staticText}>
                    Total charge:
                  </Typography>
                  <Typography variant="body1" className={classes.staticText}>
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
          
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CreditCardIcon />}
          >
            {processing ? 'Processing...' : `Continue to Payment ${amount ? formatCurrency(totalAmount) : ''}`}
          </Button>
          
          <Box mt={2}>
            <Typography variant="caption" className={classes.userText}>
              You will be redirected to Stripe's secure payment page to complete your transaction.
              Your balance will be credited once the payment is confirmed.
            </Typography>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper className={classes.paper}>
          <Typography variant="h6" className={classes.staticText} gutterBottom>
            Why Add Balance?
          </Typography>
          <Box component="ul" pl={2}>
            <Typography component="li" variant="body2" className={classes.userText} gutterBottom>
              No transaction fees when paying with balance
            </Typography>
            <Typography component="li" variant="body2" className={classes.userText} gutterBottom>
              Faster checkout for future purchases
            </Typography>
            <Typography component="li" variant="body2" className={classes.userText} gutterBottom>
              Secure payment processing by Stripe
            </Typography>
            <Typography component="li" variant="body2" className={classes.userText} gutterBottom>
              Balance never expires
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default CreditCardRefill;