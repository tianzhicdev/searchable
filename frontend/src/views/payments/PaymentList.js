import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
} from '@material-ui/core';
import Payment from './Payment';
import { formatDate } from '../../views/utilities/Date';

const PaymentList = ({ payments = [], transformed_input = [], loading = false, error = null }) => {
  const [transformedPayments, setTransformedPayments] = useState([]);

  useEffect(() => {
    if (payments.length > 0) {
      // Transform the payments data to match the expected format
      let transformed = payments.map(payment => ({
        public: {
          Id: payment.pkey,
          Item: payment.searchable_id,
          Amount: payment.amount,
          Status: payment.status,
          date: formatDate(payment.timestamp),
          tracking: payment.tracking,
          rating: payment.rating,
          review: payment.review,
          address: payment.address,
          tel: payment.tel
        },
        private: {
          buyer_id: payment.buyer_id,
          seller_id: payment.seller_id || '' // Handle case where seller_id might not be in the API response
        }
      }));

      // append transformed_input to transformed
      transformed = transformed.concat(transformed_input);

      // Sort payments by date in descending order (newest first)
      transformed.sort((a, b) => {
        // Convert formatted dates back to Date objects for comparison
        const dateA = new Date(a.public.date);
        const dateB = new Date(b.public.date);
        return dateB - dateA; // Descending order
      });

      setTransformedPayments(transformed);
    } else {
      setTransformedPayments([]);
    }
  }, [payments]); // Only re-run when payments change

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
