import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { formatCurrency } from '../../utils/searchableUtils';
import { testIdProps } from '../../utils/testIds';

const CartSummary = ({
  selectedFiles,
  selectedOfflineItems,
  selectedDonation,
  classes
}) => {
  const hasSelectedFiles = Object.values(selectedFiles).some(selected => selected);
  const hasSelectedOfflineItems = Object.values(selectedOfflineItems).some(count => count > 0);
  const hasSelection = hasSelectedFiles || hasSelectedOfflineItems || selectedDonation;

  if (!hasSelection) return null;

  return (
    <Box className={classes.totalSection} mt={3} {...testIdProps('section', 'allinone-cart', 'summary')}>
      <Typography variant="h6" gutterBottom>
        Selected Items
      </Typography>
      
      {hasSelectedFiles && (
        <Typography variant="body2">
          {Object.values(selectedFiles).filter(selected => selected).length} file(s) selected
        </Typography>
      )}
      
      {hasSelectedOfflineItems && (
        <Typography variant="body2">
          {Object.entries(selectedOfflineItems)
            .filter(([id, count]) => count > 0)
            .reduce((total, [id, count]) => total + count, 0)} item(s) selected
        </Typography>
      )}
      
      {selectedDonation && (
        <Typography variant="body2">
          Donation: {formatCurrency(selectedDonation)}
        </Typography>
      )}
    </Box>
  );
};

export default CartSummary;