import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
} from '@material-ui/core';
import axios from 'axios';
import Payment from './Payment';
import { useSelector } from 'react-redux';
import configData from '../../config';
import { formatDate } from '../../views/utilities/Date';

const PaymentList = ({ searchable_id }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const account = useSelector(state => state.account);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build the API endpoint URL based on whether searchable_id is provided
        const endpoint = searchable_id 
          ? `${configData.API_SERVER}payments?searchable_id=${searchable_id}`
          : `${configData.API_SERVER}payments`;
        
        // Make the actual API call
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `${account.token}`
          }
        });
        console.log("fetchPayments.response.data", response.data);
        
        // Transform the API response data to match the expected format
        const transformedPayments = response.data.payments.map(payment => ({
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
        // Sort payments by date in descending order (newest first)
        transformedPayments.sort((a, b) => {
          // Convert formatted dates back to Date objects for comparison
          const dateA = new Date(a.public.date);
          const dateB = new Date(b.public.date);
          return dateB - dateA; // Descending order
        });
        
        setPayments(transformedPayments);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching payments:", error);
        setError("Failed to load payments. Please try again later.");
        setLoading(false);
      }
    };

    fetchPayments();
  }, [searchable_id]); // Re-fetch when searchable_id changes

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

  if (payments.length === 0) {
    return (
        <></>
    );
  }

  return (
    <>
    <Typography variant="h6">Transactions</Typography>
    <Box>
      {payments.map((payment) => (
        <Payment key={payment.public.Id} payment={payment} />
      ))}
    </Box>
    </>
  );
};

export default PaymentList;
