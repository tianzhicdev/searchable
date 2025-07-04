import React, { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Divider
} from '@material-ui/core';
import CreditCardIcon from '@material-ui/icons/CreditCard';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';

const PayButton = ({ 
  onCreditCardClick, 
  onDepositClick, 
  loading = false, 
  disabled = false,
  buttonText = "Pay",
  variant = "contained"
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCreditCardSelect = () => {
    handleClose();
    if (onCreditCardClick) {
      onCreditCardClick();
    }
  };

  const handleDepositSelect = () => {
    handleClose();
    if (onDepositClick) {
      onDepositClick();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleClick}
        disabled={disabled || loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Processing...' : buttonText}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem onClick={handleCreditCardSelect}>
          <ListItemIcon>
            <CreditCardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Credit Card" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDepositSelect}>
          <ListItemIcon>
            <AccountBalanceWalletIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Deposit USDT" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default PayButton;