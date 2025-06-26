import React from 'react';
import { Grid, Typography, Button, Paper, Box, CircularProgress } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import SearchableDetailsTop from './SearchableDetailsTop';
import SearchableDetailsPriceDisplay from './SearchableDetailsPriceDisplay';
import useComponentStyles from '../themes/componentStyles';
import { navigateBack, getBackButtonText } from '../utils/navigationUtils';
import useSearchableDetails from '../hooks/useSearchableDetails';

/**
 * Base component for all SearchableDetails components
 * Provides common layout, state management, and shared functionality
 */
const BaseSearchableDetails = ({
  // Type-specific content
  renderTypeSpecificContent,
  
  // Type-specific handlers
  onPayment,
  
  // Type-specific props for price display
  totalPrice = 0,
  payButtonText = "Pay",
  disabled = false,
  
  // Optional overrides
  customErrorMessage,
  customLoadingComponent,
}) => {
  const classes = useComponentStyles();
  
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
    id,
    history,
    location
  } = useSearchableDetails();

  // Custom loading component or default
  if (loading) {
    if (customLoadingComponent) {
      return customLoadingComponent;
    }
    
    return (
      <Grid container spacing={2}>
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
      <Grid container spacing={2}>
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
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper className={classes.paper} style={{ backgroundColor: '#ffebee' }}>
            <Typography color="error">Item not found</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {/* Back button */}
      <Grid item xs={12}>
        <Button
          startIcon={<ChevronLeftIcon />}
          onClick={() => navigateBack(history)}
          className={classes.backButton}
        >
          {getBackButtonText(location)}
        </Button>
      </Grid>

      {/* Main content */}
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          {/* Top section: Title, ratings, description, images */}
          <SearchableDetailsTop
            searchableItem={SearchableItem}
            searchableRating={searchableRating}
            loadingRatings={loadingRatings}
            searchableId={id}
          />

          {/* Type-specific content (items, files, payment options, etc.) */}
          {renderTypeSpecificContent && renderTypeSpecificContent({
            SearchableItem,
            isOwner,
            searchableRating,
            loadingRatings
          })}

          {/* Payment display and button */}
          <SearchableDetailsPriceDisplay
            totalPrice={totalPrice}
            processing={creatingInvoice}
            onPayButtonClick={onPayment}
            isOwner={isOwner}
            onRemoveItem={handleRemoveItem}
            isRemoving={isRemoving}
            payButtonText={payButtonText}
            showPaymentSummary={true}
            disabled={disabled}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default BaseSearchableDetails;