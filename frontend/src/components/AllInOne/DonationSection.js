import React, { useState, useEffect } from 'react';
import { 
  Paper, Box, Typography, Button, TextField, InputAdornment, FormHelperText
} from '@material-ui/core';
import { Favorite } from '@material-ui/icons';
import { formatCurrency } from '../../utils/searchableUtils';
import { validatePaymentAmount } from '../../utils/paymentCalculations';
import { testIdProps } from '../../utils/testIds';

const DonationSection = ({
  components,
  donationAmount,
  setDonationAmount,
  selectedDonation,
  setSelectedDonation,
  handleDonationSelect,
  theme,
  classes
}) => {
  const [validationError, setValidationError] = useState(null);
  
  // Validate donation amount on change
  useEffect(() => {
    if (donationAmount) {
      const validation = validatePaymentAmount(donationAmount, 'donation');
      setValidationError(!validation.isValid ? validation.error : null);
    } else {
      setValidationError(null);
    }
  }, [donationAmount]);
  
  if (!components.donation?.enabled) return null;

  return (
    <Paper 
      elevation={1} 
      style={{ marginBottom: 16, padding: 16, backgroundColor: theme.palette.background.paper }}
      {...testIdProps('section', 'allinone-donation', 'container')}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <Favorite style={{ marginRight: 8, color: theme.palette.primary.main }} />
        <Typography variant="h6" color="primary">
          Support the Creator
        </Typography>
      </Box>

      {components.donation.pricingMode === 'fixed' && (
        <Box>
          <Typography variant="body1" paragraph>
            Fixed donation amount:
          </Typography>
          <Typography variant="h4" className={classes.priceTag}>
            {formatCurrency(components.donation.fixedAmount)}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setSelectedDonation(parseFloat(components.donation.fixedAmount))}
            style={{ marginTop: 16 }}
            {...testIdProps('button', 'donation-fixed', 'select')}
          >
            Select Amount
          </Button>
        </Box>
      )}

      {(components.donation.pricingMode === 'flexible' || components.donation.pricingMode === 'preset') && (
        <Box>
          <Typography variant="body1" paragraph>
            Choose or enter a donation amount:
          </Typography>
          
          {/* Quick amount buttons */}
          {components.donation.presetAmounts?.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Quick Selection:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {components.donation.presetAmounts.map((amount, index) => (
                  <Button
                    key={index}
                    variant={donationAmount === amount.toString() ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => setDonationAmount(amount.toString())}
                    style={{ marginRight: 8, marginBottom: 8 }}
                    {...testIdProps('button', 'donation-preset', amount)}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
          
          {/* Custom amount input */}
          <Typography variant="subtitle2" gutterBottom>
            Or enter custom amount:
          </Typography>
          <TextField
            type="number"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            variant="outlined"
            fullWidth
            error={!!validationError}
            helperText={validationError}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0.01, step: 0.01 }}
            placeholder="Enter any amount"
            {...testIdProps('input', 'donation-custom', 'amount')}
          />
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleDonationSelect}
            disabled={!donationAmount || parseFloat(donationAmount) <= 0 || !!validationError}
            style={{ marginTop: 16 }}
            fullWidth
            {...testIdProps('button', 'donation-custom', 'select')}
          >
            Select Amount: {donationAmount ? formatCurrency(parseFloat(donationAmount)) : formatCurrency(0)}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default DonationSection;