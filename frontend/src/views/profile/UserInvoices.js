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
  TrendingDown,
  AccountBalanceWallet
} from '@material-ui/icons';
import Backend from '../utilities/Backend';
import Invoice from '../payments/Invoice';

const UserInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    purchasesCount: 0,
    salesCount: 0,
    withdrawalsCount: 0
  });

  useEffect(() => {
    fetchUserInvoices();
    fetchUserWithdrawals();
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
      
      setStats(prevStats => ({
        ...prevStats,
        totalSpent,
        totalEarned,
        purchasesCount: data.purchases_count || 0,
        salesCount: data.sales_count || 0
      }));
      
    } catch (err) {
      console.error('Error fetching user invoices:', err);
      setError(err.response?.data?.error || 'Failed to load invoices');
    }
  };
  
  const fetchUserWithdrawals = async () => {
    try {
      const response = await Backend.get('v1/withdrawals');
      const data = response.data;
      
      setWithdrawals(data.withdrawals || []);
      
      // Calculate withdrawal statistics
      const totalWithdrawn = data.withdrawals.reduce((sum, withdrawal) => {
        return withdrawal.status === 'complete' ? sum + withdrawal.amount : sum;
      }, 0);
      
      setStats(prevStats => ({
        ...prevStats,
        totalWithdrawn,
        withdrawalsCount: data.withdrawals.length
      }));
      
    } catch (err) {
      console.error('Error fetching user withdrawals:', err);
      // Don't set error state for withdrawals as it's not critical
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
          onClick={() => {
            fetchUserInvoices();
            fetchUserWithdrawals();
          }} 
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
        
        <Paper style={{ padding: 16, flex: 1, minWidth: 200 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountBalanceWallet color="action" />
            <Box>
              <Typography variant="h6" color="textPrimary">
                {formatCurrency(stats.totalWithdrawn)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total Withdrawn ({stats.withdrawalsCount} withdrawals)
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
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <AccountBalanceWallet />
                <span>Withdrawals</span>
                <Chip label={stats.withdrawalsCount} size="small" />
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

          {/* Withdrawals Tab */}
          {activeTab === 3 && (
            <Box>
              {withdrawals.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <AccountBalanceWallet style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                  <Typography variant="h6" color="textSecondary">
                    No withdrawals yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Your withdrawal history will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Withdrawal History ({withdrawals.length})
                  </Typography>
                  {withdrawals.map((withdrawal) => (
                    <Paper 
                      key={withdrawal.id} 
                      style={{ 
                        padding: 16, 
                        marginBottom: 16, 
                        border: withdrawal.status === 'complete' ? '1px solid #4caf50' : '1px solid #ff9800' 
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6">
                            {formatCurrency(withdrawal.amount)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(withdrawal.created_at).toLocaleDateString()} at {new Date(withdrawal.created_at).toLocaleTimeString()}
                          </Typography>
                          {withdrawal.metadata?.address && (
                            <Typography variant="body2" color="textSecondary">
                              To: {withdrawal.metadata.address.substring(0, 20)}...
                            </Typography>
                          )}
                        </Box>
                        <Box textAlign="right">
                          <Chip 
                            label={withdrawal.status.toUpperCase()}
                            color={withdrawal.status === 'complete' ? 'primary' : 'default'}
                            size="small"
                          />
                          <Typography variant="caption" display="block" style={{ marginTop: 4 }}>
                            {withdrawal.type.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
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