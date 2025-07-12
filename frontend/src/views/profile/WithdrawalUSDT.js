import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';
import { componentSpacing } from '../../utils/spacing';
import { navigateBack } from '../../utils/navigationUtils';
import PageHeaderButton from '../../components/Navigation/PageHeaderButton';

const useStyles = makeStyles((theme) => ({
  formContainer: {
    '& .MuiTextField-root': {
      marginBottom: theme.spacing(2)
    }
  },
  balanceDisplay: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(3),
    textAlign: 'center'
  },
  submitButton: {
    marginTop: theme.spacing(2)
  }
}));

const WithdrawalUSDT = () => {
  const classes = useComponentStyles();
  const styles = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const account = useSelector((state) => state.account);
  
  const [balance, setBalance] = useState({ usd: 0 });
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  useEffect(() => {
    if (account.user?._id) {
      fetchBalance();
    }
  }, [account.user, account.token]);
  
  const fetchBalance = async () => {
    setFetchingBalance(true);
    try {
      const response = await backend.get('balance');
      setBalance({
        usd: response.data.balance?.usd || 0
      });
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to load balance');
    } finally {
      setFetchingBalance(false);
    }
  };
  
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    if (submitError) {
      setSubmitError('');
    }
  };
  
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
      if (submitError) {
        setSubmitError('');
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!address || address.trim() === '') {
      setSubmitError('Please enter a valid withdrawal address');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setSubmitError('Please enter a valid amount greater than 0');
      return;
    }
    
    if (parseFloat(amount) > balance.usd) {
      setSubmitError(`Insufficient funds. Available balance: $${balance.usd} USD`);
      return;
    }
    
    setLoading(true);
    setSubmitError('');
    
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
      
      // Refresh balance
      fetchBalance();
      
      // Navigate back after delay
      setTimeout(() => {
        navigateBack(history, '/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error processing USDT withdrawal:', err);
      
      if (err.response?.status === 400 && 
          err.response?.data?.error === "Insufficient funds") {
        setSubmitError(`Insufficient funds. Available balance: $${balance.usd} USD`);
      } else {
        setSubmitError(err.response?.data?.message || 'Failed to process withdrawal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccessClose = () => {
    setSuccess(false);
  };
  
  if (fetchingBalance) {
    return (
      <Grid container sx={componentSpacing.pageContainer(theme)}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
          </Box>
        </Grid>
      </Grid>
    );
  }
  
  return (
    <Grid container sx={componentSpacing.pageContainer(theme)}>
      <Grid item xs={12} sx={componentSpacing.pageHeader(theme)}>
        <PageHeaderButton
          onClick={() => navigateBack(history, '/dashboard')}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper className={classes.paperNoBorder}>
          <Typography variant="h4" gutterBottom>
            Withdraw USDT
          </Typography>
          
          {/* Balance Display */}
          <Box className={styles.balanceDisplay}>
            <Typography variant="h6">
              Available Balance
            </Typography>
            <Typography variant="h4" color="primary">
              ${balance.usd} USD
            </Typography>
          </Box>
          
          <form onSubmit={handleSubmit} className={styles.formContainer}>
            {/* Ethereum Address */}
            <TextField
              id="usdt-address"
              label="Ethereum Wallet Address"
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="Enter Ethereum wallet address to receive USDT"
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              InputProps={{
                style: {
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }
              }}
              error={Boolean(submitError && submitError.includes('address'))}
              helperText="Enter the Ethereum address where you want to receive USDT"
            />
            
            {/* Amount */}
            <TextField
              id="usdt-amount"
              label="Amount (USD)"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount to withdraw"
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: <Typography style={{ marginRight: 8 }}>$</Typography>,
              }}
              error={Boolean(submitError && (submitError.includes('amount') || submitError.includes('Insufficient')))}
              helperText="Amount will be converted to USDT at current exchange rate"
            />
            
            {/* Error Display */}
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
            
            {/* Info Section */}
            <Box mt={2} mb={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                • USDT will be sent on the Ethereum network
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                • Processing time: 1-2 business days
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Network fees may apply
              </Typography>
            </Box>
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !address || !amount}
              className={styles.submitButton}
              fullWidth
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : 'Withdraw USDT'}
            </Button>
          </form>
        </Paper>
      </Grid>
      
      {/* Success Snackbar */}
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSuccessClose} severity="success">
          Your funds have been sent. You will receive a confirmation email shortly.
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default WithdrawalUSDT;