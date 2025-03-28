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
import CompactTable from '../../components/common/CompactTable'; // Import CompactTable component

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

  const formatDate = (epoch) => {
    // todo: use user timezone
    let date = new Date(epoch * 1000).toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2');
    return date;
  }

  
  // Format transactions for the CompactTable
  const formatTransactionsForTable = () => {

    // Map transactions to the format expected by CompactTable
    return transactions.map(transaction => {
      // Handle withdrawal status which is an array of [status, timestamp] pairs
      let status = 'unknown';
      // todo: move this out as a util function and we should use local timezone
      let date = formatDate(transaction.timestamp);
      
      if (transaction.type === 'withdrawal' && Array.isArray(transaction.status)) {
        // Find the status entry with the highest timestamp
        let highestTimestamp = 0;
        transaction.status.forEach(statusEntry => {
          if (Array.isArray(statusEntry) && statusEntry.length === 2 && statusEntry[1] > highestTimestamp) {
            highestTimestamp = statusEntry[1];
            status = statusEntry[0];
          }
        });
        
        // Convert the epoch timestamp to a readable date
        if (highestTimestamp > 0) {
          date = formatDate(highestTimestamp);
        }
      } else {
        status = transaction.status || 'unknown';
      }
      
      // Calculate amount for withdrawals (value_sat + fee_sat)
      let amount;
      if (transaction.type === 'withdrawal') {
        const valueSat = parseInt(transaction.value_sat) || 0;
        const feeSat = parseInt(transaction.fee_sat) || 0;
        amount = `-${valueSat + feeSat} (${feeSat} fee)`;
      } else {
        amount = `+${transaction.amount}`;
      }
      
      // Truncate ID based on transaction type
      let truncatedId;
      if (transaction.type === 'withdrawal') {
        truncatedId = transaction.invoice ? transaction.invoice.substring(0, 10) : 'missing';
      } else {
        truncatedId = transaction.invoice_id ? transaction.invoice_id.substring(0, 10) : 'missing';
      }
      transaction.type === 'withdrawal' ? transaction.type = 'out' : transaction.type = 'in';
      
      // Set transaction type based on status
      
      if(status === 'Settled' || status === 'SUCCEEDED') {
        status = 'ok';
      } else {
        status = 'pending';
      }

      return {
        invoice: truncatedId,
        type: transaction.type,
        amount: amount,
        status: status,
        date: date,
      };
    });
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
            <>
              <CompactTable 
                title="Transaction History"
                data={formatTransactionsForTable()} 
                size="small"
              />
            </>
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
            {balance && balance > 0 && !loading && (
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