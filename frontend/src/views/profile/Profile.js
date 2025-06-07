import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles'; // Import shared component styles
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert,
  Menu, MenuItem, IconButton
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import axios from 'axios';
import PaymentList from '../payments/PaymentList';
import ProfileEditor, { openProfileEditor } from './ProfileEditor';
import backend from '../utilities/Backend';
import { formatDate } from '../utilities/Date';
const Profile = () => {
  const classes = useComponentStyles(); // Use shared component styles
  const [balance, setBalance] = useState({ usd: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [transformedWithdrawals, setTransformedWithdrawals] = useState([]);
  
  // Add USDT withdrawal states
  const [usdtWithdrawDialogOpen, setUsdtWithdrawDialogOpen] = useState(false);
  const [usdtWithdrawalAddress, setUsdtWithdrawalAddress] = useState('');
  const [usdtWithdrawalAmount, setUsdtWithdrawalAmount] = useState('');
  const [usdtWithdrawalLoading, setUsdtWithdrawalLoading] = useState(false);
  const [usdtWithdrawalError, setUsdtWithdrawalError] = useState(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  useEffect(() => {
    fetchBalance();
    fetchProfileData();
  }, [account.user, account.token]);
  
  const fetchBalance = async () => {
    if (!account.user || !account.user._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user payments using the payments-by-terminal endpoint
      const paymentsResponse = await backend.get(`v1/payments-by-terminal`);

      console.log("Payments response:", paymentsResponse.data);
      
      // Fetch user withdrawals using the withdrawals-by-terminal endpoint
      const withdrawalsResponse = await backend.get(`v1/withdrawals-by-terminal`);
      
      console.log("Withdrawals response:", withdrawalsResponse.data);

      const allTransactions = [
        ...(paymentsResponse.data.receipts || []),
        ...(withdrawalsResponse.data.withdrawals || []),
      ];

      console.log("allTransactions", allTransactions);

      setTransactions(allTransactions);
      
      // Fetch balance directly from the balance endpoint
      const balanceResponse = await backend.get('balance');
      console.log("Balance response:", balanceResponse.data);
      
      // Update to store USD value from the response
      setBalance({
        usd: balanceResponse.data.balance?.usd || 0
      });
    } catch (err) {
      console.error('Error fetching user payment data:', err);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProfileData = async () => {
    if (!account.user || !account.user._id) return;
    
    setProfileLoading(true);
    
    try {
      const response = await backend.get('v1/terminal');
      
      console.log("Profile data response:", response.data);
      setProfileData(response.data);
    } catch (err) {
      console.error('Error fetching user profile data:', err);
      // We don't set global error here to avoid affecting other components
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleWithdrawalUSDTClick = () => {
    setUsdtWithdrawDialogOpen(true);
    setUsdtWithdrawalAddress('');
    setUsdtWithdrawalAmount('');
    setUsdtWithdrawalError(null);
  };
  
  const handleCloseSuccessMessage = () => {
    setWithdrawalSuccess(false);
  };
  
  const handleEditClick = () => {
    openProfileEditor();
    handleMenuClose();
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleCloseUsdtWithdrawDialog = () => {
    setUsdtWithdrawDialogOpen(false);
  };
  
  const handleUsdtAddressChange = (e) => {
    setUsdtWithdrawalAddress(e.target.value);
  };
  
  const handleUsdtAmountChange = (e) => {
    // Only allow numeric input with at most 2 decimal places
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setUsdtWithdrawalAmount(value);
    }
  };
  
  const handleSubmitUsdtWithdrawal = async () => {
    // Validate inputs
    if (!usdtWithdrawalAddress || usdtWithdrawalAddress.trim() === '') {
      setUsdtWithdrawalError('Please enter a valid withdrawal address');
      return;
    }
    
    if (!usdtWithdrawalAmount || parseFloat(usdtWithdrawalAmount) <= 0) {
      setUsdtWithdrawalError('Please enter a valid amount greater than 0');
      return;
    }
    
    if (parseFloat(usdtWithdrawalAmount) > balance.usd) {
      setUsdtWithdrawalError(`Insufficient funds. Available balance: $${balance.usd} USD`);
      return;
    }
    
    setUsdtWithdrawalLoading(true);
    setUsdtWithdrawalError(null);
    
    try {
      const response = await backend.post(
        'v1/withdrawal-usd',
        { 
          address: usdtWithdrawalAddress.trim(),
          amount: parseFloat(usdtWithdrawalAmount)
        }
      );
      
      console.log('USDT Withdrawal response:', response.data);
      setWithdrawalSuccess(true);
      setUsdtWithdrawDialogOpen(false);
      
      // Refresh balance after successful withdrawal
      fetchBalance();
      
    } catch (err) {
      console.error('Error processing USDT withdrawal:', err);
      
      // Handle error response
      if (err.response?.status === 400 && 
          err.response?.data?.error === "Insufficient funds") {
        const errorMsg = `Insufficient funds. Available balance: $${balance.usd} USD`;
        setUsdtWithdrawalError(errorMsg);
      } else {
        setUsdtWithdrawalError(err.response?.data?.message || 'Failed to process withdrawal. Please try again.');
      }
    } finally {
      setUsdtWithdrawalLoading(false);
    }
  };
  
  return (
    <Grid container className={classes.container}>
      {/* Header Section with updated styles */}
      <Grid item xs={12} className={classes.header} style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div>
          <Button 
            variant="contained" 
            className={classes.iconButton}
            onClick={() => history.push('/searchables')}
          >
            <ArrowBackIcon />
          </Button>
        </div>
        <div>
          <Button 
            onClick={handleMenuOpen}
          >
            <MoreVertIcon />
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              handleMenuClose();
              history.push('/searchables?filters=' + encodeURIComponent(JSON.stringify({ terminal_id: account.user._id })));
            }}>
              View Your Items
            </MenuItem>
            {balance.usd > 0 && !loading && (
              <MenuItem onClick={() => {
                handleMenuClose();
                handleWithdrawalUSDTClick();
              }}>
                Withdraw USD as USDT
              </MenuItem>
            )}
            <MenuItem onClick={() => {
              handleMenuClose();
              handleEditClick();
            }}>
              Edit Profile
            </MenuItem>
          </Menu>
        </div>
      </Grid>
      
      {/* Personal Information Section */}
      <Grid item xs={12} className={classes.gridItem}>
        <Paper elevation={3} className={classes.paper}>
          <Box display="flex" justifyContent="space-between" alignItems="center" style={{ padding: 0, margin: 0 }}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Personal Information
            </Typography>
          </Box>
          <Box >
            <Typography variant="body1">
              <span className={classes.infoLabel}>Username:</span>
              <span className={classes.infoValue}>{account.user.username}</span>
            </Typography>
          </Box>
          <Box>
            <Typography variant="body1">
              <span className={classes.infoLabel}>Email:</span>
              <span className={classes.infoValue}>{account.user.email}</span>
            </Typography>
          </Box>
          
          {profileLoading ? (
            <CircularProgress size={18} />
          ) : profileData && (
            <>
              <Box>
                <Typography variant="body1">
                  <span className={classes.infoLabel}>Address:</span>
                  <span className={classes.infoValue}>{profileData.address || 'Not provided'}</span>
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1">
                  <span className={classes.infoLabel}>Telephone:</span>
                  <span className={classes.infoValue}>{profileData.tel || 'Not provided'}</span>
                </Typography>
              </Box>
            </>
          )}
          <Box>
            {loading ? (
              <CircularProgress size={18} />
            ) : error ? (
              <Typography variant="body1" color="error">{error}</Typography>
            ) : (
              <Typography variant="body1">
                <span className={classes.infoLabel}>USD Balance:</span>
                <span className={classes.infoValue}>
                  ${balance.usd} USD
                </span>
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>
      
      {/* Transaction History Section */}
      <Grid item xs={12} className={classes.gridItem}>
          
            <PaymentList receipts={transactions}  />

      </Grid>
    
      
      {/* USDT Withdrawal Dialog */}
      <Dialog open={usdtWithdrawDialogOpen} onClose={handleCloseUsdtWithdrawDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Withdraw USDT</DialogTitle>
        <DialogContent>
          <TextField
            id="usdt-address"
            type="text"
            value={usdtWithdrawalAddress}
            onChange={handleUsdtAddressChange}
            placeholder="Enter USDT wallet address"
            variant="outlined"
            fullWidth
            margin="normal"
          />
          <TextField
            id="usdt-amount"
            type="text"
            value={usdtWithdrawalAmount}
            onChange={handleUsdtAmountChange}
            placeholder="Enter amount to withdraw"
            variant="outlined"
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: <span style={{ marginRight: 8 }}>$</span>,
            }}
          />
          {usdtWithdrawalError && (
            <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
              {usdtWithdrawalError}
            </Typography>
          )}
          <Typography variant="body2" style={{ marginTop: 16 }}>
            Available balance: ${balance.usd} USD
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUsdtWithdrawDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitUsdtWithdrawal} 
            variant="contained"
            color="primary"
            disabled={usdtWithdrawalLoading}
          >
            {usdtWithdrawalLoading ? <CircularProgress size={24} /> : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Message */}
      <Snackbar 
        open={withdrawalSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success">
          Withdrawal successful! Your funds have been sent.
        </Alert>
      </Snackbar>
      
      {/* ProfileEditor component now has no props */}
      <ProfileEditor />
    </Grid>
  );
};

export default Profile; 