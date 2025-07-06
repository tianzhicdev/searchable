import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress
} from '@material-ui/core';
import {
  Close as CloseIcon,
  AccountBalance as BalanceIcon,
  CheckCircle as CheckCircleIcon
} from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';

const BalancePaymentDialog = ({
  open,
  onClose,
  onConfirm,
  totalPrice = 0,
  userBalance = 0,
  itemDescription = '',
  processing = false
}) => {
  const classes = useComponentStyles();
  
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };
  
  const remainingBalance = userBalance - totalPrice;
  
  return (
    <Dialog
      open={open}
      onClose={!processing ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" className={classes.staticText}>
            Confirm Balance Payment
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            disabled={processing}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box mb={3} textAlign="center">
          <BalanceIcon style={{ fontSize: 48, color: '#4caf50', marginBottom: 16 }} />
          
          <Typography variant="body1" className={classes.staticText} gutterBottom>
            Are you sure you want to pay with your balance?
          </Typography>
          
          {itemDescription && (
            <Typography variant="body2" className={classes.userText} gutterBottom>
              {itemDescription}
            </Typography>
          )}
        </Box>
        
        <Box p={2} bgcolor="background.default" borderRadius={1}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" className={classes.userText}>
              Current Balance:
            </Typography>
            <Typography variant="body2" className={classes.userText}>
              {formatCurrency(userBalance)}
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" className={classes.userText}>
              Purchase Amount:
            </Typography>
            <Typography variant="body2" className={classes.userText}>
              {formatCurrency(totalPrice)}
            </Typography>
          </Box>
          
          <Box 
            display="flex" 
            justifyContent="space-between" 
            pt={1} 
            borderTop={1} 
            borderColor="divider"
          >
            <Typography variant="body1" className={classes.staticText}>
              Remaining Balance:
            </Typography>
            <Typography 
              variant="body1" 
              className={classes.staticText}
              style={{ color: remainingBalance >= 0 ? '#4caf50' : '#f44336' }}
            >
              {formatCurrency(remainingBalance)}
            </Typography>
          </Box>
        </Box>
        
        <Box mt={2} display="flex" alignItems="center" justifyContent="center">
          <CheckCircleIcon style={{ color: '#4caf50', marginRight: 8 }} />
          <Typography variant="body2" className={classes.userText}>
            No transaction fees when paying with balance!
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={processing}
          startIcon={processing ? <CircularProgress size={20} /> : <BalanceIcon />}
        >
          {processing ? 'Processing...' : 'Confirm Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BalancePaymentDialog;