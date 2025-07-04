import React from 'react';
import { Typography, Box, Button, Divider, CircularProgress } from '@material-ui/core';
import useComponentStyles from '../themes/componentStyles';
import PayButton from './PayButton';

const SearchableDetailsPriceDisplay = ({
  totalPrice,
  processing,
  onPayButtonClick,
  onDepositClick,
  isOwner,
  onRemoveItem,
  isRemoving,
  payButtonText = "Pay",
  showPaymentSummary = true,
  disabled = false
}) => {
  const classes = useComponentStyles();

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Box>
      {/* Payment Summary and Button */}
      {showPaymentSummary && totalPrice > 0 && (
        <Box mt={2} p={2} bgcolor="background.paper">
          <Typography variant="subtitle2" className={classes.staticText}>
            Payment Summary:
          </Typography>
          <Typography variant="body2" className={classes.userText}>
            Subtotal: {formatCurrency(totalPrice)}
          </Typography>
          <Typography variant="body2" className={classes.userText}>
            Stripe Fee (3.5%): {formatCurrency(totalPrice * 0.035)}
          </Typography>
          <Divider style={{ margin: '8px 0' }} />
          <Typography variant="body1" className={classes.userText} style={{ fontWeight: 'bold' }}>
            Total to Pay: {formatCurrency(totalPrice * 1.035)}
          </Typography>
        </Box>
      )}
      
      {/* Payment Button */}
      {!isOwner && (
        <div style={{ margin: '8px', display: 'flex', justifyContent: 'center' }}>
          <PayButton
            onCreditCardClick={onPayButtonClick}
            onDepositClick={onDepositClick}
            loading={processing}
            disabled={disabled || totalPrice === 0}
            buttonText={payButtonText}
          />
        </div>
      )}
      
      {/* Remove Button for Owner */}
      {isOwner && onRemoveItem && (
        <div style={{ margin: '4px', display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={onRemoveItem}
            disabled={isRemoving}
            fullWidth
            startIcon={isRemoving ? <CircularProgress size={20} /> : null}
          >
            {isRemoving ? 'Removing...' : 'Remove Item'}
          </Button>
        </div>
      )}
    </Box>
  );
};

export default SearchableDetailsPriceDisplay;