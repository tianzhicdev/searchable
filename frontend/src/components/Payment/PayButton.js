import React, { useState, useEffect } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Divider
} from '@material-ui/core';
import {
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon,
  AccountBalance as BalanceIcon,
  ExpandMore as ExpandMoreIcon
} from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';
import DepositComponent from '../Deposit/DepositComponent';

/**
 * PayButton Component
 * Provides three payment options: Credit Card (Stripe), USDT Deposit, and Balance
 * Used across all searchable details pages
 */
const PayButton = ({
  totalPrice = 0,
  processing = false,
  onCreditCardPayment,
  onDepositPayment,
  onBalancePayment,
  userBalance = 0,
  disabled = false,
  payButtonText = "Pay",
  showPaymentSummary = true,
  variant = "contained",
  fullWidth = false,
  size = "medium"
}) => {
  const classes = useComponentStyles();
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreditCardClick = () => {
    handleMenuClose();
    if (onCreditCardPayment) {
      onCreditCardPayment();
    }
  };

  const handleDepositClick = () => {
    handleMenuClose();
    setDepositDialogOpen(true);
  };

  const handleBalanceClick = () => {
    handleMenuClose();
    if (onBalancePayment) {
      onBalancePayment();
    }
  };

  const handleDepositCreated = (depositData) => {
    if (onDepositPayment) {
      onDepositPayment(depositData);
    }
  };

  // Check if user can pay with balance
  const canPayWithBalance = userBalance >= totalPrice;
  
  // Always show balance option if user is logged in
  const showBalanceOption = onBalancePayment !== undefined;
  
  // Debug logging
  console.log("PayButton - userBalance:", userBalance, "totalPrice:", totalPrice, "canPayWithBalance:", canPayWithBalance);
  console.log("PayButton - onBalancePayment prop:", onBalancePayment);
  console.log("PayButton - showBalanceOption:", showBalanceOption);

  // If totalPrice is 0 or disabled, show disabled button
  if (totalPrice === 0 || disabled) {
    return (
      <Button
        variant={variant}
        disabled={true}
        fullWidth={fullWidth}
        size={size}
        startIcon={processing ? <CircularProgress size={20} /> : null}
      >
        <Typography variant="body2" className={classes.staticText}>
          {processing ? 'Processing...' : payButtonText}
        </Typography>
      </Button>
    );
  }

  return (
    <>
      {/* Payment Summary */}
      {showPaymentSummary && totalPrice > 0 && (
        <Box mt={2} p={2} bgcolor="background.paper">
          <Typography variant="subtitle2" className={classes.staticText} gutterBottom>
            Payment Summary:
          </Typography>
          <Typography variant="body2" className={classes.userText}>
            Subtotal: {formatCurrency(totalPrice)}
          </Typography>
          <Typography variant="body2" className={classes.userText}>
            Stripe Fee (3.5%): {formatCurrency(totalPrice * 0.035)}
          </Typography>
          <Divider />
          <Typography variant="body1" className={classes.userText}>
            Total with Card: {formatCurrency(totalPrice * 1.035)}
          </Typography>
          <Box mt={1}>
            <Typography variant="body2" className={classes.userText} color={canPayWithBalance ? "primary" : "textSecondary"}>
              Your Balance: {formatCurrency(userBalance)}
              {canPayWithBalance ? " ✓ Sufficient for this purchase" : " (Need " + formatCurrency(totalPrice - userBalance) + " more)"}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Payment Button with Dropdown */}
      <Box mt={2} display="flex" justifyContent="center">
        <Button
          variant={variant}
          onClick={handleMenuOpen}
          disabled={processing}
          fullWidth={fullWidth}
          size={size}
          endIcon={<ExpandMoreIcon />}
          startIcon={processing ? <CircularProgress size={20} /> : null}
        >
          <Typography variant="body2" className={classes.staticText}>
            {processing ? 'Processing...' : `${payButtonText} ${formatCurrency(totalPrice * 1.035)}`}
          </Typography>
        </Button>
      </Box>

      {/* Payment Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem onClick={handleCreditCardClick}>
          <CreditCardIcon />
          <Box ml={1}>
            <Typography variant="body2" className={classes.staticText}>
              Credit Card (Stripe)
            </Typography>
            <Typography variant="caption" className={classes.userText}>
              Pay with credit/debit card
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem onClick={handleDepositClick}>
          <WalletIcon />
          <Box ml={1}>
            <Typography variant="body2" className={classes.staticText}>
              USDT Deposit
            </Typography>
            <Typography variant="caption" className={classes.userText}>
              Pay with USDT cryptocurrency
            </Typography>
          </Box>
        </MenuItem>
        
        {showBalanceOption && (
          <>
            <Divider />
            <MenuItem 
              onClick={handleBalanceClick}
              disabled={!canPayWithBalance}
            >
              <BalanceIcon color={canPayWithBalance ? "primary" : "disabled"} />
              <Box ml={1}>
                <Typography variant="body2" className={classes.staticText}>
                  Pay with Balance
                </Typography>
                <Typography variant="caption" className={classes.userText}>
                  Available: {formatCurrency(userBalance)} {canPayWithBalance ? '(No fees!)' : '(Insufficient)'}
                </Typography>
              </Box>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Deposit Dialog */}
      <DepositComponent
        open={depositDialogOpen}
        onClose={() => setDepositDialogOpen(false)}
        onDepositCreated={handleDepositCreated}
        title="Pay with USDT Deposit"
        showInstructions={true}
      />
    </>
  );
};

export default PayButton;