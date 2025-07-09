import React from 'react';
import { Typography, Box, Button, CircularProgress } from '@material-ui/core';
import useComponentStyles from '../themes/componentStyles';
import PayButton from './Payment/PayButton';

const SearchableDetailsPriceDisplay = ({
  totalPrice,
  processing,
  onPayButtonClick,
  onDepositPayment,
  onBalancePayment,
  userBalance = 0,
  isOwner,
  onRemoveItem,
  isRemoving,
  payButtonText = "Pay",
  showPaymentSummary = true,
  disabled = false
}) => {
  const classes = useComponentStyles();
  
  // Debug logging
  console.log("SearchableDetailsPriceDisplay - onBalancePayment:", onBalancePayment);
  console.log("SearchableDetailsPriceDisplay - typeof onBalancePayment:", typeof onBalancePayment);
  console.log("SearchableDetailsPriceDisplay - userBalance:", userBalance);

  return (
    <Box>
      {/* Payment Button - Only show for non-owners */}
      {!isOwner && (
        <PayButton
          totalPrice={totalPrice}
          processing={processing}
          onCreditCardPayment={onPayButtonClick}
          onDepositPayment={onDepositPayment}
          onBalancePayment={onBalancePayment}
          userBalance={userBalance}
          disabled={disabled}
          payButtonText={payButtonText}
          showPaymentSummary={showPaymentSummary}
          variant="contained"
          fullWidth={false}
        />
      )}
      
      {/* Remove Button for Owner */}
      {isOwner && onRemoveItem && (
        <Box mt={2} display="flex" justifyContent="center">
          <Button
            variant="contained"
            onClick={onRemoveItem}
            disabled={isRemoving}
            fullWidth
            startIcon={isRemoving ? <CircularProgress size={20} /> : null}
          >
            {isRemoving ? 'Removing...' : 'Remove Item'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SearchableDetailsPriceDisplay;