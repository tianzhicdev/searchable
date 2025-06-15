import React, { useState } from 'react';
import { 
  Paper, Box, Typography, Button, Divider, Dialog, DialogTitle, 
  DialogContent, DialogActions, CircularProgress
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import CheckIcon from '@material-ui/icons/Check';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import InvoiceList from '../../views/payments/InvoiceList';
import useComponentStyles from '../../themes/componentStyles';

const SearchableDetailsActions = ({
  searchableItem,
  isOwner,
  totalPrice,
  currency = 'usd',
  hasSelections = false,
  creatingInvoice = false,
  onCreateInvoice,
  onRemoveItem,
  isRemoving = false,
  children // For custom selection UI (downloadable files or offline items)
}) => {
  const classes = useComponentStyles();
  const [showInvoices, setShowInvoices] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  const formatPrice = (price) => {
    if (currency === 'usdt') {
      return `${price.toFixed(2)} USDT`;
    }
    return `$${price.toFixed(2)}`;
  };

  const handleCreateInvoice = async () => {
    try {
      await onCreateInvoice();
      setAlertMessage('Invoice created successfully!');
      setAlertSeverity('success');
      setAlertOpen(true);
    } catch (error) {
      setAlertMessage(error.message || 'Failed to create invoice');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  const handleRemoveItem = async () => {
    try {
      await onRemoveItem();
      setRemoveDialogOpen(false);
      setAlertMessage('Item removed successfully!');
      setAlertSeverity('success');
      setAlertOpen(true);
    } catch (error) {
      setAlertMessage(error.message || 'Failed to remove item');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  if (!searchableItem) {
    return null;
  }

  return (
    <>
      {/* Selection and Purchase Section */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle} gutterBottom>
          {isOwner ? 'Item Management' : 'Make Purchase'}
        </Typography>

        {/* Custom selection UI (passed as children) */}
        {children}

        {!isOwner && (
          <>
            <Divider className={classes.divider} />
            
            {/* Total Price Display */}
            <Box display="flex" justifyContent="space-between" alignItems="center" className={classes.marginMd}>
              <Typography variant="h6">
                Total: {formatPrice(totalPrice)}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                disabled={!hasSelections || creatingInvoice}
                onClick={handleCreateInvoice}
                className={classes.purchaseButton}
              >
                {creatingInvoice ? (
                  <>
                    <CircularProgress size={20} style={{ marginRight: 8 }} />
                    Creating Invoice...
                  </>
                ) : (
                  'Create Invoice'
                )}
              </Button>
            </Box>
          </>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <Box display="flex" gap={2} className={classes.marginMd}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setRemoveDialogOpen(true)}
              disabled={isRemoving}
              className={classes.removeButton}
            >
              {isRemoving ? (
                <>
                  <CircularProgress size={20} style={{ marginRight: 8 }} />
                  Removing...
                </>
              ) : (
                'Remove Item'
              )}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Invoice History Section */}
      {(isOwner || showInvoices) && (
        <Paper className={classes.paper}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" className={classes.sectionTitle}>
              {isOwner ? 'Sales History' : 'Your Purchases'}
            </Typography>
            {!isOwner && (
              <Button
                onClick={() => setShowInvoices(!showInvoices)}
                className={classes.toggleButton}
              >
                {showInvoices ? 'Hide' : 'Show'} Purchase History
              </Button>
            )}
          </Box>
          
          <Collapse in={isOwner || showInvoices}>
            <InvoiceList 
              searchableId={searchableItem.searchable_id} 
              onRatingSubmitted={() => {
                // Could refresh ratings here if needed
              }}
            />
          </Collapse>
        </Paper>
      )}

      {/* Alert Display */}
      <Collapse in={alertOpen}>
        <Alert 
          severity={alertSeverity}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setAlertOpen(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          className={classes.alert}
        >
          {alertMessage}
        </Alert>
      </Collapse>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onClose={() => setRemoveDialogOpen(false)}>
        <DialogTitle>Remove Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this item? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleRemoveItem} 
            color="secondary" 
            disabled={isRemoving}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SearchableDetailsActions;