import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles'; // Import shared component styles
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import axios from 'axios';
import { formatDate } from '../utilities/Date';
import PaymentList from '../payments/PaymentList';
const Profile = () => {
  const classes = useComponentStyles(); // Use shared component styles
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Withdrawal states
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [invoice, setInvoice] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState(null);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  useEffect(() => {
    fetchBalance();
  }, [account.user, account.token]);
  
  const fetchBalance = async () => {
    if (!account.user || !account.user._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user transactions (payments and withdrawals) using KV endpoint
      const transactionsResponse = await axios.get(`${configData.API_SERVER}transactions`, {
        params: {
          // fkey: account.user._id,
          // type: 'payment' // Get both payment and withdraw transactions
        },
        headers: { Authorization: `${account.token}` }
      });

      console.log("Transactions response:", transactionsResponse.data);
      
      // Set transactions data from KV response
      setTransactions(transactionsResponse.data.transactions || []);
      
      // Calculate balance from transactions
      const calculatedBalance = (transactionsResponse.data.transactions || []).reduce((total, tx) => {
        if (tx.type === 'payment') {
          return total + (parseInt(tx.amount) || 0);
        }
        if (tx.type === 'withdrawal') {
          return total - (parseInt(tx.amount) || 0);
        }
        return total;
      }, 0);
      
      // Set calculated balance
      setBalance(calculatedBalance);
    } catch (err) {
      console.error('Error fetching user transaction data:', err);
      setError('Failed to load transaction information');
    } finally {
      setLoading(false);
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
  
  return (
    <Grid container className={classes.container}>
      {/* Header Section */}
      <Grid item xs={12} className={classes.header}>
        <div className={classes.leftButtons}>
          <Button 
            variant="contained" 
            className={classes.iconButton}
            onClick={() => history.push('/searchables')}
          >
            <ArrowBackIcon />
          </Button>
        </div>
      </Grid>
      
      {/* Personal Information Section */}
      <Grid item xs={12} className={classes.gridItem}>
        <Paper elevation={3} className={classes.paper}>
          <Typography variant="h6" className={classes.sectionTitle}>
            Personal Information
          </Typography>
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
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography variant="body1" color="error" align="center">
              {error}
            </Typography>
          ) : transactions.length === 0 ? (
            <Typography variant="body1" align="center" p={2}>
              No transaction history found.
            </Typography>
          ) : (
            <PaymentList/>
          )}
      </Grid>
      
      {/* Posted Items Section */}
      <Grid item xs={12} className={classes.gridItem}>
          <Box className={classes.container}>
            <Button
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={() => history.push('/searchables?internalSearchTerm=terminal_id:' + account.user._id )}
            >
              View Your Items
            </Button>
            {balance > 0 && !loading && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleWithdrawalClick}
                style={{ marginLeft: '10px' }}
              >
                Withdraw
              </Button>
            )}
          </Box>
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
    </Grid>
  );
};

export default Profile; 