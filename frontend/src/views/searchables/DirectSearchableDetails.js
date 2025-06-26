import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Typography, Box, TextField, InputAdornment, ButtonGroup, Button
} from '@material-ui/core';
import { AttachMoney } from '@material-ui/icons';
import Alert from '@material-ui/lab/Alert';
import BaseSearchableDetails from '../../components/BaseSearchableDetails';
import useSearchableDetails from '../../hooks/useSearchableDetails';
import { formatUSD } from '../../utils/searchableUtils';

const DirectSearchableDetails = () => {
  const location = useLocation();
  
  // Use the shared hook for common functionality
  const { 
    SearchableItem, 
    isOwner, 
    createInvoice,
    formatCurrency,
    publicData 
  } = useSearchableDetails();
  
  // Direct payment specific states
  const [paymentAmount, setPaymentAmount] = useState(9.99);
  const [paymentError, setPaymentError] = useState(null);
  const [isAmountFixed, setIsAmountFixed] = useState(false); // Whether amount is fixed from URL or default

  // Quick amount options
  const quickAmounts = [4.99, 9.99, 14.99];

  useEffect(() => {
    // Three flavours of pricing:
    // 1. URL parameter 'amount' - fixed amount, no choice
    // 2. Default amount from searchable data - fixed amount, no choice
    // 3. Neither - show 4.99, 9.99, 14.99 options
    
    const params = new URLSearchParams(location.search);
    const amountParam = params.get('amount');
    
    if (amountParam && !isNaN(parseFloat(amountParam))) {
      // Flavour 1: Amount from URL parameter
      const fixedAmount = parseFloat(amountParam);
      setPaymentAmount(fixedAmount);
      setIsAmountFixed(true); // Amount is fixed from URL

    } else if (publicData?.defaultAmount) {
      setPaymentAmount(publicData.defaultAmount);
      setIsAmountFixed(false); // Amount can be modified
    } else {
      // Flavour 3: No fixed amount, use middle option as default
      setPaymentAmount(9.99); // Default to middle option
      setIsAmountFixed(false); // Amount can be modified
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

  // Render type-specific content for direct payment
  const renderDirectPaymentContent = ({ isOwner }) => (
    !isOwner && (
      <Box>
        {isAmountFixed ? (
          <Box>
            <Typography variant="h4" color="primary">
              ${paymentAmount.toFixed(2)}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Payment Amount
            </Typography>

            {/* Quick amount buttons */}
            <ButtonGroup fullWidth style={{ marginBottom: 16 }}>
              {quickAmounts.map((amount) => (
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

            {/* Custom amount input */}
            <TextField
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              fullWidth
              inputProps={{ min: 0.01, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              style={{ marginBottom: 24 }}
            />
          </Box>
        )}

        {paymentError && (
          <Alert severity="error" style={{ marginBottom: 16 }}>
            {paymentError}
          </Alert>
        )}
      </Box>
    )
  );

  return (

    <BaseSearchableDetails
      renderTypeSpecificContent={renderDirectPaymentContent}
      onPayment={handlePayment}
      totalPrice={paymentAmount * 1.035}
      payButtonText={`Pay $${(paymentAmount * 1.035).toFixed(2)}`}
      disabled={!paymentAmount || paymentAmount <= 0}
    />
  );
};

export default DirectSearchableDetails;