import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Alert
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import backend from '../views/utilities/Backend';
import { componentSpacing } from '../utils/spacing';
import {
  CRYPTO_PAYMENT_ASSET,
  CRYPTO_PAYMENT_NETWORK,
  CRYPTO_PAYMENT_RAIL,
  CRYPTO_PAYMENT_WALLET_LABEL,
  isValidSolanaAddress,
} from '../utils/cryptoPaymentConfig';

// Singleton pattern to manage dialog state
const withdrawalDialogState = {
  isOpen: false,
  openDialog: () => {},
  closeDialog: () => {}
};

const useStyles = makeStyles((theme) => ({
  dialogContent: componentSpacing.dialog(theme),
  button: componentSpacing.button(theme),
  dialog: {
    '& .MuiDialog-paper': {
      [theme.breakpoints.down('sm')]: {
        margin: theme.spacing(2),
        maxHeight: '90vh'
      }
    }
  }
}));

const WithdrawalDialog = () => {
  const styles = useStyles();
  const account = useSelector((state) => state.account);
  
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState({ usd: 0 });
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Initialize the singleton functions
  useEffect(() => {
    withdrawalDialogState.openDialog = () => setOpen(true);
    withdrawalDialogState.closeDialog = () => setOpen(false);
    withdrawalDialogState.isOpen = open;
  }, [open]);
  
  // Fetch balance when dialog opens
  useEffect(() => {
    if (open && account.user?._id) {
      fetchBalance();
    }
  }, [open, account.user, account.token]);
  
  const fetchBalance = async () => {
    try {
      const response = await backend.get('balance');
      setBalance({
        usd: response.data.balance?.usd || 0
      });
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to load balance');
    }
  };
  
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    if (error) {
      setError(null);
    }
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

    if (!isValidSolanaAddress(address.trim())) {
      setError('Please enter a valid Solana wallet or token account address');
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
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await backend.post(
        'v1/withdrawal-usd',
        { 
          type: CRYPTO_PAYMENT_RAIL,
          address: address.trim(),
          amount: parseFloat(amount)
        }
      );
      
      console.log('USDC withdrawal response:', response.data);
      setSuccess(true);
      setAddress('');
      setAmount('');
      
      // Refresh balance
      fetchBalance();
      
      // Close dialog after delay
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error processing crypto withdrawal:', err);
      
      if (err.response?.status === 400 && 
          err.response?.data?.error === "Insufficient funds") {
        setError(`Insufficient funds. Available balance: $${balance.usd} USD`);
      } else {
        setError(err.response?.data?.error || err.response?.data?.msg || 'Failed to process withdrawal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setError(null);
    setAddress('');
    setAmount('');
    setOpen(false);
  };
  
  const handleSuccessClose = () => {
    setSuccess(false);
  };
  
  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth className={styles.dialog}>
        <DialogTitle>Withdraw {CRYPTO_PAYMENT_ASSET}</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <TextField
            id="crypto-address"
            label={CRYPTO_PAYMENT_WALLET_LABEL}
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder={`Enter the ${CRYPTO_PAYMENT_NETWORK} wallet or token account that should receive ${CRYPTO_PAYMENT_ASSET}`}
            variant="outlined"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            InputProps={{
              style: {
                wordBreak: 'break-all'
              }
            }}
          />
          <TextField
            id="crypto-amount"
            label="Amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount to withdraw"
            variant="outlined"
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: <Typography style={{ marginRight: 8 }}>$</Typography>,
            }}
          />
          {error && (
            <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
              {error}
            </Typography>
          )}
          <Typography variant="body2" style={{ marginTop: 16 }}>
            Available balance: ${balance.usd} USD
          </Typography>
          <Typography variant="body2" style={{ marginTop: 8 }}>
            Sent as {CRYPTO_PAYMENT_ASSET} on {CRYPTO_PAYMENT_NETWORK}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className={styles.button}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            color="primary"
            disabled={loading}
            className={styles.button}
          >
            {loading ? <CircularProgress size={24} /> : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSuccessClose} severity="success">
          Your funds have been sent.
        </Alert>
      </Snackbar>
    </>
  );
};

// Export both the component and functions to control it
export default WithdrawalDialog;

// Export a function to open the withdrawal dialog from anywhere
export const openWithdrawalDialog = () => {
  withdrawalDialogState.openDialog();
};
