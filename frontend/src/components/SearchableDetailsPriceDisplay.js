import React, { useState } from 'react';
import { Typography, Box, Button, CircularProgress, Grid } from '@material-ui/core';
import useComponentStyles from '../themes/componentStyles';
import { networkNodes, cursorPointer, closeX } from '../assets/images/icons';
import PayButton from './Payment/PayButton';
import ShareDialog from './ShareDialog';

const SearchableDetailsPriceDisplay = ({
  totalPrice,
  processing,
  onPayButtonClick,
  onDepositPayment,
  onBalancePayment,
  userBalance = 0,
  isOwner,
  onRemoveItem,
  onEditItem,
  isRemoving,
  payButtonText = "Pay",
  showPaymentSummary = true,
  disabled = false,
  searchableId,
  searchableTitle,
  searchableType
}) => {
  const classes = useComponentStyles();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
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
      
      {/* Owner Actions - Share, Edit, Delete */}
      {isOwner && (
        <Box mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShareDialogOpen(true)}
                fullWidth
                startIcon={<img src={networkNodes} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                disabled={processing}
              >
                Share
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                onClick={onEditItem}
                fullWidth
                startIcon={<img src={cursorPointer} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                disabled={processing}
              >
                Edit
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="secondary"
                onClick={onRemoveItem}
                disabled={isRemoving || processing}
                fullWidth
                startIcon={isRemoving ? <CircularProgress size={20} /> : <img src={closeX} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
              >
                {isRemoving ? 'Deleting...' : 'Delete'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        searchableId={searchableId}
        title={searchableTitle}
        searchableType={searchableType}
      />
    </Box>
  );
};

export default SearchableDetailsPriceDisplay;