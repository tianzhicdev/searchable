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
  Button,
  Menu,
  MenuItem
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { 
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  CardGiftcard,
  MoreVert,
  AccountBalance
} from '@material-ui/icons';
import Backend from '../utilities/Backend';
import Invoice from '../payments/Invoice';
import RewardComponent from '../../components/Reward/RewardComponent';
import useComponentStyles from '../../themes/componentStyles';

const UserInvoices = ({ initialView }) => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Map view names to tab indices
  const getInitialTab = () => {
    switch (initialView) {
      case 'purchases': return 0;
      case 'sales': return 1;
      case 'withdrawals': return 2;
      case 'deposits': return 3;
      case 'rewards': return 4;
      default: return 0; // Default to purchases
    }
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [anchorEl, setAnchorEl] = useState(null);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    totalRewards: 0,
    totalDeposited: 0,
    purchasesCount: 0,
    salesCount: 0,
    withdrawalsCount: 0,
    rewardsCount: 0,
    depositsCount: 0
  });

  useEffect(() => {
    fetchUserInvoices();
    fetchUserWithdrawals();
    fetchUserRewards();
    fetchUserDeposits();
  }, []);
  
  // Update active tab when initialView changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [initialView]);

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
  
  const fetchUserRewards = async () => {
    try {
      const response = await Backend.get('v1/rewards');
      const data = response.data;
      
      setRewards(data.rewards || []);
      
      // Calculate reward statistics
      const totalRewards = data.total_amount || 0;
      
      setStats(prevStats => ({
        ...prevStats,
        totalRewards,
        rewardsCount: data.count || 0
      }));
      
    } catch (err) {
      console.error('Error fetching user rewards:', err);
      // Don't set error state for rewards as it's not critical
    }
  };
  
  const fetchUserDeposits = async () => {
    try {
      const response = await Backend.get('v1/deposits');
      const data = response.data;
      
      setDeposits(data.deposits || []);
      
      // Calculate deposit statistics
      const totalDeposited = data.deposits.reduce((sum, deposit) => {
        return deposit.status === 'complete' ? sum + parseFloat(deposit.amount) : sum;
      }, 0);
      
      setStats(prevStats => ({
        ...prevStats,
        totalDeposited,
        depositsCount: data.deposits.length
      }));
      
    } catch (err) {
      console.error('Error fetching user deposits:', err);
      // Don't set error state for deposits as it's not critical
    }
  };

  const handleRatingSubmitted = () => {
    // Refresh invoices to get updated rating status
    fetchUserInvoices();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (tabIndex) => {
    setActiveTab(tabIndex);
    handleMenuClose();
  };

  const getActiveTabName = () => {
    switch (activeTab) {
      case 0: return 'Purchases';
      case 1: return 'Sales';
      case 2: return 'Withdrawals';
      case 3: return 'Deposits';
      case 4: return 'Gifts';
      default: return 'Purchases';
    }
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
            fetchUserRewards();
            fetchUserDeposits();
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
      <Paper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} p={2}>
        <Typography variant="h6">
          {getActiveTabName()}
        </Typography>
        <Button
          variant="contained"
          onClick={handleMenuOpen}
          endIcon={<MoreVert />}
        >
          Select View
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem 
            onClick={() => handleMenuItemClick(0)}
            selected={activeTab === 0}
          >
            <TrendingDown style={{ marginRight: 8 }} />
            Purchases ({stats.purchasesCount})
          </MenuItem>
          <MenuItem 
            onClick={() => handleMenuItemClick(1)}
            selected={activeTab === 1}
          >
            <TrendingUp style={{ marginRight: 8 }} />
            Sales ({stats.salesCount})
          </MenuItem>
          <MenuItem 
            onClick={() => handleMenuItemClick(2)}
            selected={activeTab === 2}
          >
            <AccountBalanceWallet style={{ marginRight: 8 }} />
            Withdrawals ({stats.withdrawalsCount})
          </MenuItem>
          <MenuItem 
            onClick={() => handleMenuItemClick(3)}
            selected={activeTab === 3}
          >
            <AccountBalance style={{ marginRight: 8 }} />
            Deposits ({stats.depositsCount})
          </MenuItem>
          {stats.totalRewards > 0 && (
            <MenuItem 
              onClick={() => handleMenuItemClick(4)}
              selected={activeTab === 4}
            >
              <CardGiftcard style={{ marginRight: 8 }} />
              Gifts ({stats.rewardsCount})
            </MenuItem>
          )}
        </Menu>
      </Box>

        <Box p={2}>
          {/* Total Spent Tab */}
          {activeTab === 0 && (
            <Box>
              {purchases.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <TrendingDown style={{ fontSize: 48, color: theme.palette.grey[500], marginBottom: 16 }} />
                  <Typography variant="h6" className={classes.staticText}>
                    No purchases yet
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    Your spending history will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Total Spent History ({purchases.length})
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

          {/* Total Earned Tab */}
          {activeTab === 1 && (
            <Box>
              {sales.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <TrendingUp style={{ fontSize: 48, color: theme.palette.grey[500], marginBottom: 16 }} />
                  <Typography variant="h6" className={classes.staticText}>
                    No sales yet
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    Your earnings history will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Total Earned History ({sales.length})
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

          {/* Total Withdrawn Tab */}
          {activeTab === 2 && (
            <Box>
              {withdrawals.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <AccountBalanceWallet style={{ fontSize: 48, color: theme.palette.grey[500], marginBottom: 16 }} />
                  <Typography variant="h6" className={classes.staticText}>
                    No withdrawals yet
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    Your withdrawal history will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Total Withdrawn History ({withdrawals.length})
                  </Typography>
                  {withdrawals.map((withdrawal) => (
                    <Paper 
                      key={withdrawal.id} 
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Chip 
                            label={withdrawal.status.toUpperCase()}
                            color={withdrawal.status === 'complete' ? 'primary' : 'default'}
                            size="small"
                          />
                          <Typography variant="h6" className={classes.staticText}>
                            Withdrawal #{withdrawal.id}
                          </Typography>
                          <Typography variant="body2" className={classes.systemText}>
                            {new Date(withdrawal.created_at).toLocaleDateString()} at {new Date(withdrawal.created_at).toLocaleTimeString()}
                          </Typography>
                          {withdrawal.metadata?.address && (
                            <Typography
                              variant="body2"
                              className={classes.systemText}
                              style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}
                            >
                              To: {withdrawal.metadata.address}
                            </Typography>
                          )}
                          <Typography variant="caption" display="block" style={{ marginTop: 4 }}>
                            {withdrawal.type.replace('_', ' ').toUpperCase()}
                          </Typography>
                          
                          {/* Withdrawal Breakdown */}
                          <Box mt={2} p={2} >
                            <Typography variant="subtitle2" className={classes.systemText}>
                              Withdrawal Breakdown:
                            </Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                              <Typography variant="body2" className={classes.userText}>
                                Amount:
                              </Typography>
                              <Typography variant="body2" className={classes.userText}>
                                {formatCurrency(withdrawal.amount)}
                              </Typography>
                            </Box>
                            {withdrawal.fee > 0 && (
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" className={classes.systemText}>
                                  Platform Fee (0.1%):
                                </Typography>
                                <Typography variant="body2" className={classes.systemText}>
                                  -{formatCurrency(withdrawal.fee)}
                                </Typography>
                              </Box>
                            )}
                            <Box display="flex" justifyContent="space-between" alignItems="center" style={{ borderTop: '1px solid #ccc', paddingTop: '8px', marginTop: '8px' }}>
                              <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                                Received Amount:
                              </Typography>
                              <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                                {formatCurrency(withdrawal.amount - (withdrawal.fee || 0))}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </>
              )}
            </Box>
          )}

          {/* Deposits Tab */}
          {activeTab === 3 && (
            <Box>
              {deposits.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <AccountBalance style={{ fontSize: 48, color: theme.palette.grey[500], marginBottom: 16 }} />
                  <Typography variant="h6" className={classes.staticText}>
                    No deposits yet
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    Your deposit history will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Total Deposit History ({deposits.length})
                  </Typography>
                  {deposits.map((deposit) => (
                    <Paper 
                      key={deposit.deposit_id}
                      style={{ marginBottom: 16, padding: 16 }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Box display="flex" gap={1} mb={1}>
                            <Chip 
                              label={deposit.status.toUpperCase()}
                              color={deposit.status === 'complete' ? 'primary' : 'default'}
                              size="small"
                            />
                          </Box>
                          <Typography variant="h6" className={classes.staticText}>
                            Deposit #{deposit.deposit_id}
                          </Typography>
                          <Typography variant="body2" className={classes.systemText}>
                            {new Date(deposit.created_at).toLocaleDateString()} at {new Date(deposit.created_at).toLocaleTimeString()}
                          </Typography>
                          {deposit.type !== 'stripe' && deposit.address && (
                            <Typography variant="body2" className={classes.systemText}>
                              Address: {deposit.address}
                            </Typography>
                          )}
                          {deposit.tx_hash && (
                            <Typography variant="body2" className={classes.systemText}>
                              TX: {deposit.tx_hash}
                            </Typography>
                          )}
                          <Typography variant="h6" className={classes.userText} style={{ marginTop: 8 }}>
                            {deposit.amount === '0.00000000' ? 'Pending' : `$${deposit.amount} ${deposit.type === 'stripe' ? 'USD' : 'USDT'}`}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </>
              )}
            </Box>
          )}

          {/* Total Rewards Tab */}
          {activeTab === 4 && (
            <Box>
              {rewards.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CardGiftcard style={{ fontSize: 48, color: theme.palette.grey[500], marginBottom: 16 }} />
                  <Typography variant="h6" className={classes.staticText}>
                    No rewards yet
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    Your rewards history will appear here
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Total Rewards History ({rewards.length})
                  </Typography>
                  {rewards.map((reward) => (
                    <RewardComponent
                      key={reward.id}
                      reward={reward}
                    />
                  ))}
                </>
              )}
            </Box>
          )}
        </Box>
      </Paper>

  );
};

export default UserInvoices;