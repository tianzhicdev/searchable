import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
import RefillBalanceDialog from './RefillBalanceDialog';
import BalancePaymentDialog from './BalancePaymentDialog';
import { formatUSD } from '../../utils/searchableUtils';

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
  const history = useHistory();
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [refillDialogOpen, setRefillDialogOpen] = useState(false);
  const [balanceConfirmOpen, setBalanceConfirmOpen] = useState(false);

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
    setBalanceConfirmOpen(true);
  };
  
  const handleBalanceConfirm = () => {
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

  // If totalPrice is 0 or disabled, show disabled button
  if (totalPrice === 0 || disabled) {
    return (
      <Box mt={2} display="flex" justifyContent="center">
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
      </Box>
    );
  }

  // If user has sufficient balance, show both "Buy with Balance" and "Pay with Stripe" buttons
  if (showBalanceOption && canPayWithBalance) {
    return (
      <>
        {/* Payment Summary */}
        {showPaymentSummary && totalPrice > 0 && (
          <Box mt={2} p={2}>
            <Typography variant="subtitle2" className={classes.staticText} gutterBottom>
              Payment Summary:
            </Typography>
            <Typography variant="body2" className={classes.userText}>
              Amount: {formatUSD(totalPrice)}
            </Typography>
            <Typography >
              Your Balance: {formatUSD(userBalance)} ✓
            </Typography>
            <Typography >
              No fees when paying with balance!
            </Typography>
          </Box>
        )}

        {/* Payment Buttons Container */}
        <Box mt={2} display="flex" flexDirection="row" gap={2} justifyContent="center">
          {/* Buy with Balance Button */}
          <Button
            variant={variant}
            onClick={handleBalanceClick}
            disabled={processing}
            size={size}
            startIcon={processing ? <CircularProgress size={20} /> : <BalanceIcon />}
          >
            <Typography variant="body2" className={classes.staticText}>
              {processing ? 'Processing...' : `Buy with Balance ${formatUSD(totalPrice)}`}
            </Typography>
          </Button>
          
          {/* Pay with Stripe Button */}
          <Button
            variant="outlined"
            onClick={handleCreditCardClick}
            disabled={processing}
            size={size}
            startIcon={processing ? <CircularProgress size={20} /> : <CreditCardIcon />}
          >
            <Typography variant="body2" className={classes.staticText}>
              {processing ? 'Processing...' : `Pay with Stripe(3.5% fee) ${formatUSD(totalPrice * 1.035)}`}
            </Typography>
          </Button>
        </Box>
        
        {/* Balance Payment Confirmation Dialog */}
        <BalancePaymentDialog
          open={balanceConfirmOpen}
          onClose={() => setBalanceConfirmOpen(false)}
          onConfirm={handleBalanceConfirm}
          totalPrice={totalPrice}
          userBalance={userBalance}
          processing={processing}
        />
        
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
  }

  // If user doesn't have sufficient balance, show "Refill Balance" and "Pay with Stripe" buttons
  if (showBalanceOption && !canPayWithBalance) {
    return (
      <>
        {/* Payment Summary */}
        {showPaymentSummary && totalPrice > 0 && (
          <Box mt={2} p={2} bgcolor="background.paper">
            <Typography variant="subtitle2" className={classes.staticText} gutterBottom>
              Payment Summary:
            </Typography>
            <Typography variant="body2" className={classes.userText}>
              Amount: {formatUSD(totalPrice)}
            </Typography>
            <Typography variant="body2" className={classes.userText} color="textSecondary">
              Your Balance: {formatUSD(userBalance)} (Need {formatUSD(totalPrice - userBalance)} more)
            </Typography>
          </Box>
        )}

        {/* Payment Buttons Container */}
        <Box mt={2} display="flex" flexDirection="row" gap={2} justifyContent="center">
          {/* Pay with Stripe Button */}
          <Button
            variant={variant}
            onClick={handleCreditCardClick}
            disabled={processing}
            size={size}
            startIcon={processing ? <CircularProgress size={20} /> : <CreditCardIcon />}
          >
            <Typography variant="body2" className={classes.staticText}>
              {processing ? 'Processing...' : `Pay with Stripe(3.5% fee) ${formatUSD(totalPrice * 1.035)}`}
            </Typography>
          </Button>
          
          {/* Refill Balance Button */}
          <Button
            variant="outlined"
            onClick={() => setRefillDialogOpen(true)}
            disabled={processing}
            size={size}
            startIcon={processing ? <CircularProgress size={20} /> : <WalletIcon />}
          >
            <Typography variant="body2" className={classes.staticText}>
              {processing ? 'Processing...' : 'Refill Balance'}
            </Typography>
          </Button>
        </Box>
        
        {/* Refill Balance Dialog */}
        <RefillBalanceDialog
          open={refillDialogOpen}
          onClose={() => setRefillDialogOpen(false)}
          currentBalance={userBalance}
          requiredAmount={totalPrice}
        />
        
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
  }

  // For non-logged-in users, show regular payment dropdown
  return (
    <>
      {/* Payment Summary */}
      {showPaymentSummary && totalPrice > 0 && (
        <Box mt={2} p={2} bgcolor="background.paper">
          <Typography variant="subtitle2" className={classes.staticText} gutterBottom>
            Payment Summary:
          </Typography>
          <Typography variant="body2" className={classes.userText}>
            Subtotal: {formatUSD(totalPrice)}
          </Typography>
          <Typography variant="body2" className={classes.userText}>
            Stripe Fee (3.5%): {formatUSD(totalPrice * 0.035)}
          </Typography>
          <Divider />
          <Typography variant="body1" className={classes.userText}>
            Total with Card: {formatUSD(totalPrice * 1.035)}
          </Typography>
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
            {processing ? 'Processing...' : `${payButtonText} ${formatUSD(totalPrice * 1.035)}`}
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
              <BalanceIcon color={canPayWithBalance ? "inherit" : "disabled"} />
              <Box ml={1}>
                <Typography variant="body2" className={classes.staticText}>
                  Pay with Balance
                </Typography>
                <Typography variant="caption" className={classes.userText}>
                  Available: {formatUSD(userBalance)} {canPayWithBalance ? '(No fees!)' : '(Insufficient)'}
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