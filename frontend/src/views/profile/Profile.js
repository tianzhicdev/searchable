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

const Profile = () => {
  const classes = useComponentStyles(); // Use shared component styles
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
      // Fetch withdrawal records
      const balanceResponse = await axios.get(`${configData.API_SERVER}balance`, {
        params: {
        },
        headers: { Authorization: `${account.token}` }
      });
      // Set balance from response
      setBalance(balanceResponse.data.balance);
    } catch (err) {
      console.error('Error fetching balance data:', err);
      setError('Failed to load balance information');
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
        `${configData.API_SERVER}withdraw`,
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
      setWithdrawalError(err.response?.data?.message || 'Failed to process withdrawal. Please try again.');
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
            <Button
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleWithdrawalClick}
              disabled={!balance || balance <= 0 || loading}
              style={{ marginLeft: '10px' }}
            >
              Withdraw
            </Button>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdrawDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitWithdrawal} 
            variant="contained"
            // disabled={!invoice || withdrawalLoading}
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