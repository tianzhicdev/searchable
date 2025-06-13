import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  Alert,
} from '@material-ui/core';
import Invoice from './Invoice';
import Backend from '../utilities/Backend';

const InvoiceList = ({ searchableId, onRatingSubmitted }) => {
  const [invoices, setInvoices] = useState([]);
  const [userRole, setUserRole] = useState('buyer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (searchableId) {
      fetchInvoices();
    }
  }, [searchableId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await Backend.get(`v1/invoices-by-searchable/${searchableId}`);
      setInvoices(response.data.invoices || []);
      setUserRole(response.data.user_role || 'buyer');
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.response?.data?.error || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmitted = () => {
    // Refresh invoices to get updated rating status
    fetchInvoices();
    
    // Call parent callback if provided
    if (onRatingSubmitted) {
      onRatingSubmitted();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" style={{ marginTop: 16 }}>
        {error}
      </Alert>
    );
  }

  if (invoices.length === 0) {
    return (
      <Paper style={{ padding: 24, textAlign: 'center', marginTop: 16 }}>
        <Typography variant="h6" color="textSecondary">
          No invoices found
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {userRole === 'seller' 
            ? 'No completed sales for this item yet.' 
            : 'You haven\'t purchased this item yet.'
          }
        </Typography>
      </Paper>
    );
  }

  // Separate pending and completed invoices for better display
  const pendingInvoices = invoices.filter(invoice => invoice.payment_status === 'pending');
  const completedInvoices = invoices.filter(invoice => invoice.payment_status === 'complete');

  return (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        {userRole === 'seller' ? 'Sales' : 'Your Purchases'} ({invoices.length})
      </Typography>
      
      {/* Show pending invoices first for buyers */}
      {userRole === 'buyer' && pendingInvoices.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            Pending Payments (24 hours)
          </Typography>
          {pendingInvoices.map((invoice) => (
            <Invoice 
              key={invoice.id}
              invoice={invoice}
              userRole={userRole}
              onRatingSubmitted={handleRatingSubmitted}
            />
          ))}
        </Box>
      )}
      
      {/* Show completed invoices */}
      {completedInvoices.length > 0 && (
        <Box>
          {userRole === 'buyer' && pendingInvoices.length > 0 && (
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              Completed Purchases
            </Typography>
          )}
          {completedInvoices.map((invoice) => (
            <Invoice 
              key={invoice.id}
              invoice={invoice}
              userRole={userRole}
              onRatingSubmitted={handleRatingSubmitted}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default InvoiceList;