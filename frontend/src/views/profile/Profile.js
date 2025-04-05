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
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Withdrawal states
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [invoice, setInvoice] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState(null);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [transformedWithdrawals, setTransformedWithdrawals] = useState([]);
  
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
        ...(paymentsResponse.data.payments || []),
      ];

      setTransactions(allTransactions);
      const withdrawals = withdrawalsResponse.data.withdrawals.map(withdrawal => ({
        public: {
          invoice: withdrawal.invoice.substring(0, 20) + "...",
          amount: withdrawal.amount,
          fee: withdrawal.fee_sat,
          amount: withdrawal.value_sat,
          date: formatDate(withdrawal.timestamp),
          status: withdrawal.status,
        },
        private: {
          withdrawer_id: account.user._id.toString(),
        }
      }));
      setTransformedWithdrawals(withdrawals);
      
      // Fetch balance directly from the balance endpoint
      const balanceResponse = await backend.get('balance');
      console.log("Balance response:", balanceResponse.data);
      
      // Set balance from the API response
      setBalance(balanceResponse.data.balance || 0);
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
      const response = await axios.get(`${configData.API_SERVER}profile`, {
        headers: { Authorization: `${account.token}` }
      });
      
      console.log("Profile data response:", response.data);
      setProfileData(response.data);
    } catch (err) {
      console.error('Error fetching user profile data:', err);
      // We don't set global error here to avoid affecting other components
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleWithdrawalClick = () => {
    setWithdrawDialogOpen(true);
    setInvoice('');
    setWithdrawalError(null);
  };
  
  const handleCloseWithdrawDialog = () => {
    setWithdrawDialogOpen(false);
  };
  
  const handleInvoiceChange = (e) => {
    setInvoice(e.target.value);
  };
  
  const handleSubmitWithdrawal = async () => {
    if (!invoice || invoice.trim() === '') {
      setWithdrawalError('Please enter a valid Lightning invoice');
      return;
    }
    
    setWithdrawalLoading(true);
    setWithdrawalError(null);
    
    try {
      const response = await axios.post(
        `${configData.API_SERVER}withdrawal`,
        { invoice: invoice.trim() },
        {
          headers: {
            Authorization: `${account.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Withdrawal response:', response.data);
      setWithdrawalSuccess(true);
      setWithdrawDialogOpen(false);
      
      // Refresh balance after successful withdrawal
      fetchBalance();
      
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      
      // Check for specific insufficient funds error
      if (err.response?.status === 400 && 
          err.response?.data?.error === "Insufficient funds" &&
          err.response?.data?.available_balance !== undefined &&
          err.response?.data?.withdrawal_amount !== undefined) {
        
        // Format error message with balance information
        const errorMsg = `Insufficient funds. Available balance: ${err.response.data.available_balance} sats, 
                          Withdrawal amount: ${err.response.data.withdrawal_amount} sats`;
        setWithdrawalError(errorMsg);
      } else {
        setWithdrawalError(err.response?.data?.message || 'Failed to process withdrawal. Please try again.');
      }
    } finally {
      setWithdrawalLoading(false);
    }
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
          <IconButton 
            onClick={handleMenuOpen}
          >
            <MoreVertIcon />
          </IconButton>
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
            {balance > 0 && !loading && (
              <MenuItem onClick={() => {
                handleMenuClose();
                handleWithdrawalClick();
              }}>
                Withdraw
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
                <span className={classes.infoLabel}>Balance:</span>
                <span className={classes.infoValue}>
                  {balance} sats
                </span>
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>
      
      {/* Transaction History Section */}
      <Grid item xs={12} className={classes.gridItem}>
          
            <PaymentList payments={transactions} transformed_input={transformedWithdrawals} />

      </Grid>
    
      
      {/* Withdrawal Dialog */}
      <Dialog open={withdrawDialogOpen} onClose={handleCloseWithdrawDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Withdraw via Lightning Network</DialogTitle>
        <DialogContent>
          <TextField
            id="invoice"
            type="text"
            value={invoice}
            onChange={handleInvoiceChange}
            placeholder="lnbc..."
            variant="outlined"
            fullWidth
            margin="normal"
          />
          {withdrawalError && (
            <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
              {withdrawalError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdrawDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitWithdrawal} 
            variant="contained"
            color="primary"
            disabled={withdrawalLoading} // todo: need to remove this shit. it is ugly
          >
            {withdrawalLoading ? <CircularProgress size={24} /> : 'Withdraw'}
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