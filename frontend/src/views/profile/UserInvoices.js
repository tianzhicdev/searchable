import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Button
} from '@material-ui/core';
import { 
  ShoppingCart, 
  Store, 
  Receipt,
  TrendingUp,
  TrendingDown 
} from '@material-ui/icons';
import Backend from '../utilities/Backend';
import Invoice from '../payments/Invoice';

const UserInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalEarned: 0,
    purchasesCount: 0,
    salesCount: 0
  });

  useEffect(() => {
    fetchUserInvoices();
  }, []);

  const fetchUserInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await Backend.get('v1/user/invoices');
      const data = response.data;
      
      setInvoices(data.invoices || []);
      setPurchases(data.purchases || []);
      setSales(data.sales || []);
      
      // Calculate statistics
      const totalSpent = data.purchases.reduce((sum, invoice) => sum + invoice.amount, 0);
      const totalEarned = data.sales.reduce((sum, invoice) => sum + invoice.amount, 0);
      
      setStats({
        totalSpent,
        totalEarned,
        purchasesCount: data.purchases_count || 0,
        salesCount: data.sales_count || 0
      });
      
    } catch (err) {
      console.error('Error fetching user invoices:', err);
      setError(err.response?.data?.error || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmitted = () => {
    // Refresh invoices to get updated rating status
    fetchUserInvoices();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Paper style={{ padding: 24, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" style={{ marginTop: 16 }}>
          Loading your invoices...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper style={{ padding: 24 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          onClick={fetchUserInvoices} 
          style={{ marginTop: 16 }}
          variant="outlined"
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Statistics Cards */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Paper style={{ padding: 16, flex: 1, minWidth: 200 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingDown color="secondary" />
            <Box>
              <Typography variant="h6" color="secondary">
                {formatCurrency(stats.totalSpent)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total Spent ({stats.purchasesCount} purchases)
              </Typography>
            </Box>
          </Box>
        </Paper>
        
        <Paper style={{ padding: 16, flex: 1, minWidth: 200 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUp color="primary" />
            <Box>
              <Typography variant="h6" color="primary">
                {formatCurrency(stats.totalEarned)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total Earned ({stats.salesCount} sales)
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Tabs for switching between purchases and sales */}
      <Paper>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <ShoppingCart />
                <span>My Purchases</span>
                <Chip label={stats.purchasesCount} size="small" />
              </Box>
            }
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Store />
                <span>My Sales</span>
                <Chip label={stats.salesCount} size="small" />
              </Box>
            }
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Receipt />
                <span>All Invoices</span>
                <Chip label={invoices.length} size="small" />
              </Box>
            }
          />
        </Tabs>

        <Box p={2}>
          {/* Purchases Tab */}
          {activeTab === 0 && (
            <Box>
              {purchases.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <ShoppingCart style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                  <Typography variant="h6" color="textSecondary">
                    No purchases yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Your purchase history will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Purchase History ({purchases.length})
                  </Typography>
                  {purchases.map((invoice) => (
                    <Invoice
                      key={invoice.id}
                      invoice={invoice}
                      userRole="buyer"
                      onRatingSubmitted={handleRatingSubmitted}
                    />
                  ))}
                </>
              )}
            </Box>
          )}

          {/* Sales Tab */}
          {activeTab === 1 && (
            <Box>
              {sales.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Store style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                  <Typography variant="h6" color="textSecondary">
                    No sales yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Your sales history will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Sales History ({sales.length})
                  </Typography>
                  {sales.map((invoice) => (
                    <Invoice
                      key={invoice.id}
                      invoice={invoice}
                      userRole="seller"
                      onRatingSubmitted={handleRatingSubmitted}
                    />
                  ))}
                </>
              )}
            </Box>
          )}

          {/* All Invoices Tab */}
          {activeTab === 2 && (
            <Box>
              {invoices.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Receipt style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                  <Typography variant="h6" color="textSecondary">
                    No invoices yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Your complete invoice history will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    All Invoices ({invoices.length})
                  </Typography>
                  {invoices.map((invoice) => (
                    <Invoice
                      key={invoice.id}
                      invoice={invoice}
                      userRole={invoice.user_role}
                      onRatingSubmitted={handleRatingSubmitted}
                    />
                  ))}
                </>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default UserInvoices;