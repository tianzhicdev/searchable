import React from 'react';
import { Grid, Typography, Button, Paper, Box, CircularProgress, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import SearchableDetailsTop from './SearchableDetailsTop';
import SearchableDetailsPriceDisplay from './SearchableDetailsPriceDisplay';
import useComponentStyles from '../themes/componentStyles';
import { navigateBack, getBackButtonText } from '../utils/navigationUtils';
import PageHeaderButton from './Navigation/PageHeaderButton';
import useSearchableDetails from '../hooks/useSearchableDetails';
import { detailPageStyles } from '../utils/detailPageSpacing';
import { componentSpacing } from '../utils/spacing';

// Create styles with detail page spacing
const useStyles = makeStyles((theme) => ({
  mainContent: {
    ...detailPageStyles.card(theme),
  },
  typeSpecificWrapper: {
    ...detailPageStyles.sectionWrapper(theme),
  },
  externalSection: {
    ...detailPageStyles.sectionWrapper(theme),
  }
}));

/**
 * Base component for all SearchableDetails components
 * Provides common layout, state management, and shared functionality
 */
const BaseSearchableDetails = ({
  // Type-specific content
  renderTypeSpecificContent,
  
  // Type-specific reviews content (rendered outside main Paper)
  renderReviewsContent,
  
  // Type-specific receipts content (rendered outside main Paper)
  renderReceiptsContent,
  
  // Type-specific handlers
  onPayment,
  onDepositPayment,
  onBalancePayment,
  
  // Type-specific props for price display
  totalPrice = 0,
  payButtonText = "Pay",
  disabled = false,
  
  // Optional overrides
  customErrorMessage,
  customLoadingComponent,
}) => {
  const classes = useComponentStyles();
  const detailClasses = useStyles();
  const theme = useTheme();
  
  const {
    SearchableItem,
    isOwner,
    loading,
    error,
    isRemoving,
    creatingInvoice,
    searchableRating,
    loadingRatings,
    handleRemoveItem,
    handleEditItem,
    userBalance,
    id,
    history,
    location
  } = useSearchableDetails();
  
  // Debug logging
  console.log("BaseSearchableDetails - userBalance:", userBalance);
  console.log("BaseSearchableDetails - onBalancePayment prop:", onBalancePayment);

  // Custom loading component or default
  if (loading) {
    if (customLoadingComponent) {
      return customLoadingComponent;
    }
    
    return (
      <Grid container sx={componentSpacing.pageContainer(theme)}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
          </Box>
        </Grid>
      </Grid>
    );
  }

  // Error handling
  if (error) {
    const errorMessage = customErrorMessage || error;
    return (
      <Grid container sx={componentSpacing.pageContainer(theme)}>
        <Grid item xs={12}>
          <Paper className={classes.paper} style={{ backgroundColor: '#ffebee' }}>
            <Typography color="error">{errorMessage}</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  // Item not found
  if (!SearchableItem) {
    return (
      <Grid container sx={componentSpacing.pageContainer(theme)}>
        <Grid item xs={12}>
          <Paper className={classes.paper} style={{ backgroundColor: '#ffebee' }}>
            <Typography color="error">Item not found</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container sx={componentSpacing.pageContainer(theme)}>
      {/* Back button */}
      <Grid item xs={12} sx={componentSpacing.pageHeader(theme)}>
        <PageHeaderButton
          onClick={() => navigateBack(history)}
        />
      </Grid>

      {/* Main content */}
      <Grid item xs={12}>
        <Paper className={detailClasses.mainContent}>
          {/* Top section: Title, ratings, description, images */}
          <SearchableDetailsTop
            searchableItem={SearchableItem}
            searchableRating={searchableRating}
            loadingRatings={loadingRatings}
            searchableId={id}
          />

          {/* Type-specific content (items, files, payment options, etc.) */}
          {renderTypeSpecificContent && (
            <Box className={detailClasses.typeSpecificWrapper}>
              {renderTypeSpecificContent({
                SearchableItem,
                isOwner,
                searchableRating,
                loadingRatings
              })}
            </Box>
          )}

          {/* Payment display and button */}
          <SearchableDetailsPriceDisplay
            totalPrice={totalPrice}
            processing={creatingInvoice}
            onPayButtonClick={onPayment}
            onDepositPayment={onDepositPayment}
            onBalancePayment={onBalancePayment}
            userBalance={userBalance}
            isOwner={isOwner}
            onRemoveItem={handleRemoveItem}
            onEditItem={handleEditItem}
            isRemoving={isRemoving}
            payButtonText={payButtonText}
            showPaymentSummary={true}
            disabled={disabled}
            searchableId={id}
            searchableTitle={SearchableItem?.payloads?.public?.title || 'Untitled'}
          />
        </Paper>
      </Grid>

      {/* Reviews section - rendered outside main Paper */}
      {renderReviewsContent && (
        <Grid item xs={12}>
          <Box className={detailClasses.externalSection}>
            {renderReviewsContent({
              SearchableItem,
              isOwner,
              searchableRating,
              loadingRatings,
              id
            })}
          </Box>
        </Grid>
      )}

      {/* Receipts section - rendered outside main Paper */}
      {renderReceiptsContent && (
        <Grid item xs={12}>
          <Box className={detailClasses.externalSection}>
            {renderReceiptsContent({
              SearchableItem,
              isOwner,
              searchableRating,
              loadingRatings,
              id
            })}
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default BaseSearchableDetails;