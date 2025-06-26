import React from 'react';
import { Typography, Box, Button, Divider, CircularProgress } from '@material-ui/core';
import useComponentStyles from '../themes/componentStyles';

const SearchableDetailsPriceDisplay = ({
  totalPrice,
  processing,
  onPayButtonClick,
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
          <Button
            variant="outlined"
            onClick={onPayButtonClick}
            disabled={processing || disabled || totalPrice === 0}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            <Typography variant="body2" className={classes.staticText}>
              {processing ? 'Processing...' : payButtonText}
            </Typography>
          </Button>
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