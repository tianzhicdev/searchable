import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Typography, Box, TextField, InputAdornment, ButtonGroup, Button
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { AttachMoney } from '@material-ui/icons';
import Alert from '@material-ui/lab/Alert';
import BaseSearchableDetails from '../../components/BaseSearchableDetails';
import useSearchableDetails from '../../hooks/useSearchableDetails';
import { formatUSD } from '../../utils/searchableUtils';
import InvoiceList from '../payments/InvoiceList';
import { detailPageStyles } from '../../utils/detailPageSpacing';

// Create styles for direct payment details
const useStyles = makeStyles((theme) => ({
  amountSection: {
    ...detailPageStyles.subSection(theme),
    textAlign: 'center',
  },
  paymentTitle: {
    ...detailPageStyles.sectionTitle(theme),
  },
  fixedAmountLabel: {
    ...detailPageStyles.label(theme),
  },
  fixedAmountValue: {
    ...detailPageStyles.value(theme),
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.palette.primary.main,
  },
  buttonGroupSection: {
    ...detailPageStyles.buttonGroup(theme),
  },
  customAmountSection: {
    ...detailPageStyles.formField(theme),
  },
  alertSection: {
    ...detailPageStyles.alert(theme),
  }
}));

const DirectSearchableDetails = () => {
  const location = useLocation();
  const classes = useStyles();
  
  // Use the shared hook for common functionality
  const { 
    SearchableItem, 
    createInvoice,
    createBalancePayment,
    formatCurrency,
    publicData,
    fetchRatings 
  } = useSearchableDetails();
  
  console.log("DirectSearchableDetails - createBalancePayment:", createBalancePayment);
  console.log("DirectSearchableDetails - typeof createBalancePayment:", typeof createBalancePayment);
  
  // Direct payment specific states
  const [paymentAmount, setPaymentAmount] = useState(9.99);
  const [paymentError, setPaymentError] = useState(null);
  const [isAmountFixed, setIsAmountFixed] = useState(false); // Whether amount is fixed from URL or pricing mode
  const [availableAmounts, setAvailableAmounts] = useState([4.99, 9.99, 14.99]); // Available amounts based on pricing mode
  const [allowCustomAmount, setAllowCustomAmount] = useState(true); // Whether custom amount input is allowed

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const amountParam = params.get('amount');
    
    if (amountParam && !isNaN(parseFloat(amountParam))) {
      // URL parameter takes precedence - fixed amount, no choice
      const fixedAmount = parseFloat(amountParam);
      setPaymentAmount(fixedAmount);
      setIsAmountFixed(true);
      setAllowCustomAmount(false);
      setAvailableAmounts([fixedAmount]);
    } else if (publicData?.pricingMode) {
      // Handle new pricing modes
      if (publicData.pricingMode === 'fixed') {
        // Fixed pricing - one amount, no choice
        const fixedAmount = publicData.fixedAmount || publicData.defaultAmount || 9.99;
        setPaymentAmount(fixedAmount);
        setIsAmountFixed(true);
        setAllowCustomAmount(false);
        setAvailableAmounts([fixedAmount]);
      } else if (publicData.pricingMode === 'preset') {
        // Preset options - specific amounts only, no custom input
        const amounts = publicData.presetAmounts || [4.99, 9.99, 14.99];
        setAvailableAmounts(amounts);
        setPaymentAmount(amounts[0]); // Default to first option
        setIsAmountFixed(false);
        setAllowCustomAmount(false);
      } else if (publicData.pricingMode === 'flexible') {
        // Flexible pricing - default amounts plus custom input
        setAvailableAmounts([4.99, 9.99, 14.99]);
        setPaymentAmount(9.99);
        setIsAmountFixed(false);
        setAllowCustomAmount(true);
      }
    } else if (publicData?.defaultAmount) {
      // Legacy: Default amount from searchable data - treat as fixed for backward compatibility
      setPaymentAmount(publicData.defaultAmount);
      setIsAmountFixed(true);
      setAllowCustomAmount(false);
      setAvailableAmounts([publicData.defaultAmount]);
    } else {
      // Legacy: No pricing data - show flexible mode
      setAvailableAmounts([4.99, 9.99, 14.99]);
      setPaymentAmount(9.99);
      setIsAmountFixed(false);
      setAllowCustomAmount(true);
    }
  }, [location.search, SearchableItem, publicData]);

  const handlePayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }

    setPaymentError(null);

    try {
      // Create invoice with the selected amount using shared function
      const invoiceData = {
        currency: 'usd',
        selections: [{
          amount: paymentAmount,
          type: 'direct'
        }],
        total_price: paymentAmount
      };

      await createInvoice(invoiceData);
    } catch (err) {
      setPaymentError(err.message);
    }
  };

  const handleDepositPayment = async (depositData) => {
    if (!paymentAmount || paymentAmount <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }

    setPaymentError(null);
    
    // For deposit payments, we show a success message and let the user know to deposit
    console.log('Deposit created for direct payment:', {
      depositData,
      paymentAmount
    });
    
    // You could implement deposit-based payment logic here if needed
    // For now, we just acknowledge the deposit address was created
  };

  const handleBalancePayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }

    setPaymentError(null);

    try {
      // Create balance payment with the selected amount
      const invoiceData = {
        selections: [{
          amount: paymentAmount,
          type: 'direct'
        }],
        total_price: paymentAmount
      };

      await createBalancePayment(invoiceData);
    } catch (err) {
      setPaymentError(err.message);
    }
  };

  // Render type-specific content for direct payment
  const renderDirectPaymentContent = ({ isOwner }) => (
    !isOwner && (
      <Box>
        {isAmountFixed ? (
          // For fixed amounts (from URL param or fixed pricing mode), just show the amount
          <Box className={classes.amountSection}>
            <Typography className={classes.fixedAmountLabel}>
              Donation Amount
            </Typography>
            <Typography className={classes.fixedAmountValue}>
              ${paymentAmount.toFixed(2)}
            </Typography>
          </Box>
        ) : (
          // For flexible/preset amounts, show the selection UI
          <Box>
            <Typography className={classes.paymentTitle}>
              {publicData?.pricingMode === 'preset' ? 'Choose Donation Amount' : 'Choose or Enter Donation Amount'}
            </Typography>

            {/* Amount selection buttons */}
            <Box className={classes.buttonGroupSection}>
              <ButtonGroup fullWidth>
                {availableAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={paymentAmount === amount ? 'contained' : 'outlined'}
                    onClick={() => setPaymentAmount(amount)}
                    startIcon={<AttachMoney />}
                  >
                    ${amount.toFixed(2)}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>

            {/* Custom amount input - only show if allowed */}
            {allowCustomAmount && (
              <Box className={classes.customAmountSection}>
                <TextField
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 0.01, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Enter any amount you'd like to donate"
                />
              </Box>
            )}
          </Box>
        )}

        {paymentError && (
          <Alert severity="error" className={classes.alertSection}>
            {paymentError}
          </Alert>
        )}
      </Box>
    )
  );

  // Render receipts content
  const renderReceiptsContent = ({ id }) => (
    <InvoiceList 
      searchableId={id} 
      onRatingSubmitted={() => {
        fetchRatings();
      }}
    />
  );

  return (
    <BaseSearchableDetails
      renderTypeSpecificContent={renderDirectPaymentContent}
      renderReceiptsContent={renderReceiptsContent}
      onPayment={handlePayment}
      onDepositPayment={handleDepositPayment}
      onBalancePayment={handleBalancePayment}
      totalPrice={paymentAmount}
      payButtonText="Pay"
      disabled={!paymentAmount || paymentAmount <= 0}
    />
  );
};

export default DirectSearchableDetails;