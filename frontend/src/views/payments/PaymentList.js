import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
} from '@material-ui/core';
import Payment from './Payment';
import { formatDate } from '../../views/utilities/Date';

const PaymentList = ({ receipts = [], loading = false, error = null }) => {
  const [transformedPayments, setTransformedPayments] = useState([]);

  useEffect(() => {
    // Start with an empty array
    let transformed = [];
    
    if (receipts.length > 0) {
      transformed = receipts.map(receipt => {
        // Create a copy of the receipt to avoid mutating the original
        const formattedReceipt = { ...receipt };
        
        // Format the timestamp if it exists
        if (formattedReceipt.public && formattedReceipt.public.timestamp) {
          formattedReceipt.public.date = formatDate(formattedReceipt.public.timestamp);
        }
        // Remove timestamp to avoid redundancy since we're using the formatted date
        if (formattedReceipt.public) {
          delete formattedReceipt.public.timestamp;
        }
        
        return formattedReceipt;
      });
    }
    
    // Only sort if we have data
    if (transformed.length > 0) {
      // Sort payments by date in descending order (newest first)
      transformed.sort((a, b) => {
        // Convert formatted dates back to Date objects for comparison
        const dateA = new Date(a.public.date);
        const dateB = new Date(b.public.date);
        return dateB - dateA; // Descending order
      });
    }
    
    // Only update the state if the transformed array is different
    // This prevents unnecessary re-renders
    if (JSON.stringify(transformed) !== JSON.stringify(transformedPayments)) {
      setTransformedPayments(transformed);
    }
  }, [receipts, transformedPayments]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Paper>
    );
  }

  if (transformedPayments.length === 0) {
    return (
      <></>
    );
  }

  return (
    <>
    <Typography variant="h6">Transactions</Typography>
    <Box>
      {transformedPayments.map((payment) => (
        <Payment key={payment.public.Id} payment={payment} />
      ))}
    </Box>
    </>
  );
};

export default PaymentList;
