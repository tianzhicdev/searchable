import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Grid,
  Typography,
  Button,
  Paper,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Snackbar
} from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';
import { componentSpacing, spacing } from '../../utils/spacing';
import { useTheme } from '@material-ui/core/styles';
import backend from '../utilities/Backend';
import { navigateBack, debugNavigationStack } from '../../utils/navigationUtils';

const WithdrawalUSDT = () => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const history = useHistory();
  const location = history.location;
  
  const [balance, setBalance] = useState({ usd: 0 });
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    fetchBalance();
  }, []);
  
  const fetchBalance = async () => {
    try {
      const response = await backend.get('balance');
      setBalance({
        usd: response.data.balance?.usd || 0
      });
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };
  
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };
  
  const handleSubmit = async () => {
    if (!address || address.trim() === '') {
      setError('Please enter a valid withdrawal address');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    if (parseFloat(amount) > balance.usd) {
      setError(`Insufficient funds. Available balance: $${balance.usd} USD`);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await backend.post(
        'v1/withdrawal-usd',
        { 
          address: address.trim(),
          amount: parseFloat(amount)
        }
      );
      
      console.log('USDT Withdrawal response:', response.data);
      setSuccess(true);
      setAddress('');
      setAmount('');
      
      fetchBalance();
      
    } catch (err) {
      console.error('Error processing USDT withdrawal:', err);
      
      if (err.response?.status === 400 && 
          err.response?.data?.error === "Insufficient funds") {
        setError(`Insufficient funds. Available balance: $${balance.usd} USD`);
      } else {
        setError(err.response?.data?.message || 'Failed to process withdrawal. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleBackClick = () => {
    debugNavigationStack(location, 'WithdrawalUSDT Back Click');
    navigateBack(history, '/dashboard');
  };
  
  const handleCloseSuccess = () => {
    setSuccess(false);
  };
  
  return (
    <Grid container sx={componentSpacing.pageContainer(theme)}>
      {/* Header */}
      <Grid item xs={12} sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: theme.spacing(spacing.element.md),
        [theme.breakpoints.down('sm')]: {
          mb: theme.spacing(spacing.element.xs)
        }
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button 
            variant="contained" 
            className={classes.iconButton}
            onClick={handleBackClick}
          >
            <ArrowBack />
          </Button>
          <Typography variant="h5">Withdraw USDT</Typography>
        </Box>
      </Grid>
      
      {/* Main Content */}
      <Grid item xs={12} md={8} lg={6}>
        <Paper sx={componentSpacing.card(theme)}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" gutterBottom>
                Available balance: <strong>${balance.usd} USDT</strong>
              </Typography>
              
              <TextField
                fullWidth
                label="Ethereum Wallet Address"
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter Ethereum wallet address to receive USDT"
                variant="outlined"
                margin="normal"
                disabled={submitting}
              />
              
              <TextField
                fullWidth
                label="Amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount to withdraw"
                variant="outlined"
                margin="normal"
                disabled={submitting}
                InputProps={{
                  startAdornment: <Typography style={{ marginRight: 8 }}>$</Typography>,
                }}
              />
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                gap: theme.spacing(2),
                mt: theme.spacing(3) 
              }}>
                <Button 
                  onClick={handleBackClick}
                  disabled={submitting}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  disabled={submitting || loading}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Withdraw'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>
      
      {/* Success Message */}
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          Withdrawal successful! Your funds have been sent.
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default WithdrawalUSDT;