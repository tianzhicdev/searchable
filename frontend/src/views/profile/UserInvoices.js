import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
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
import UnifiedReceipt from '../../components/Receipt';
import useComponentStyles from '../../themes/componentStyles';
import { componentSpacing, spacing } from '../../utils/spacing';

const UserInvoices = () => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const location = useLocation();
  const history = useHistory();
  
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  
  // Get active tab from URL
  const searchParams = new URLSearchParams(location.search);
  const viewParam = searchParams.get('view') || 'purchases';
  
  const viewToTab = {
    'purchases': 0,
    'sales': 1,
    'withdrawals': 2,
    'deposits': 3,
    'gifts': 4,
    'rewards': 4
  };
  
  const tabToView = {
    0: 'purchases',
    1: 'sales',
    2: 'withdrawals',
    3: 'deposits',
    4: 'gifts'
  };
  
  const activeTab = viewToTab[viewParam] ?? 0;

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserInvoices(),
        fetchUserWithdrawals(),
        fetchUserRewards(),
        fetchUserDeposits()
      ]);
      setLoading(false);
    };
    
    fetchAllData();
  }, []);
  
  // Re-render when URL changes
  useEffect(() => {
    // Force component to use new activeTab from URL
  }, [location.search]);

  const fetchUserInvoices = async () => {
    try {
      setError(null);
      
      const response = await Backend.get('v1/user/invoices');
      const data = response.data;
      
      setInvoices(data.invoices || []);
      setPurchases(data.purchases || []);
      setSales(data.sales || []);
      
      // Calculate statistics
      const totalSpent = data.purchases?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0;
      const totalEarned = data.sales?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0;
      
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
    const newView = tabToView[newValue];
    history.push(`/dashboard?view=${newView}`);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (tabIndex) => {
    const newView = tabToView[tabIndex];
    history.push(`/dashboard?view=${newView}`);
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

  const formatCurrency = (amount, currency = 'usd') => {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    const symbol = currency === 'usd' ? '$' : '';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  if (loading) {
    return (
      <Paper sx={{ ...componentSpacing.card(theme), textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" style={{ marginTop: 16 }}>
          Loading your invoices...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={componentSpacing.card(theme)}>
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
      <Paper sx={componentSpacing.card(theme)}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ 
        mb: theme.spacing(spacing.element.md),
        [theme.breakpoints.down('sm')]: {
          mb: theme.spacing(spacing.element.xs),
          flexDirection: 'column',
          gap: theme.spacing(1),
          alignItems: 'stretch'
        }
      }}>
        <Typography variant="h6">
          {getActiveTabName()}
        </Typography>
        <Button
          variant="contained"
          onClick={handleMenuOpen}
          endIcon={<MoreVert />}
          sx={{
            [theme.breakpoints.down('sm')]: {
              width: '100%'
            }
          }}
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

        <Box>
          {/* Total Spent Tab */}
          {activeTab === 0 && (
            <Box>
              {purchases.length === 0 ? (
                <Box textAlign="center" sx={{ 
                  py: theme.spacing(4),
                  [theme.breakpoints.down('sm')]: {
                    py: theme.spacing(3)
                  }
                }}>
                  <TrendingDown sx={{ 
                    fontSize: 48, 
                    color: theme.palette.grey[500], 
                    mb: theme.spacing(2),
                    [theme.breakpoints.down('sm')]: {
                      fontSize: 36,
                      mb: theme.spacing(1.5)
                    }
                  }} />
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
                <Box textAlign="center" sx={{ 
                  py: theme.spacing(4),
                  [theme.breakpoints.down('sm')]: {
                    py: theme.spacing(3)
                  }
                }}>
                  <TrendingUp sx={{ 
                    fontSize: 48, 
                    color: theme.palette.grey[500], 
                    mb: theme.spacing(2),
                    [theme.breakpoints.down('sm')]: {
                      fontSize: 36,
                      mb: theme.spacing(1.5)
                    }
                  }} />
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
                <Box textAlign="center" sx={{ 
                  py: theme.spacing(4),
                  [theme.breakpoints.down('sm')]: {
                    py: theme.spacing(3)
                  }
                }}>
                  <AccountBalanceWallet sx={{ 
                    fontSize: 48, 
                    color: theme.palette.grey[500], 
                    mb: theme.spacing(2),
                    [theme.breakpoints.down('sm')]: {
                      fontSize: 36,
                      mb: theme.spacing(1.5)
                    }
                  }} />
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
                    <UnifiedReceipt
                      key={withdrawal.id}
                      type="withdrawal"
                      data={withdrawal}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
                </>
              )}
            </Box>
          )}

          {/* Deposits Tab */}
          {activeTab === 3 && (
            <Box>
              {deposits.length === 0 ? (
                <Box textAlign="center" sx={{ 
                  py: theme.spacing(4),
                  [theme.breakpoints.down('sm')]: {
                    py: theme.spacing(3)
                  }
                }}>
                  <AccountBalance sx={{ 
                    fontSize: 48, 
                    color: theme.palette.grey[500], 
                    mb: theme.spacing(2),
                    [theme.breakpoints.down('sm')]: {
                      fontSize: 36,
                      mb: theme.spacing(1.5)
                    }
                  }} />
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
                    <UnifiedReceipt
                      key={deposit.deposit_id}
                      type="deposit"
                      data={{
                        ...deposit,
                        id: deposit.deposit_id,
                        metadata: {
                          address: deposit.address,
                          tx_hash: deposit.tx_hash
                        },
                        currency: deposit.type === 'stripe' ? 'usd' : 'usdt'
                      }}
                      formatCurrency={(amount, currency) => {
                        if (amount === '0.00000000') return 'Pending';
                        return formatCurrency(parseFloat(amount), currency);
                      }}
                      formatDate={formatDate}
                    />
                  ))}
                </>
              )}
            </Box>
          )}

          {/* Total Rewards Tab */}
          {activeTab === 4 && (
            <Box>
              {rewards.length === 0 ? (
                <Box textAlign="center" sx={{ 
                  py: theme.spacing(4),
                  [theme.breakpoints.down('sm')]: {
                    py: theme.spacing(3)
                  }
                }}>
                  <CardGiftcard sx={{ 
                    fontSize: 48, 
                    color: theme.palette.grey[500], 
                    mb: theme.spacing(2),
                    [theme.breakpoints.down('sm')]: {
                      fontSize: 36,
                      mb: theme.spacing(1.5)
                    }
                  }} />
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
                    <UnifiedReceipt
                      key={reward.id}
                      type="reward"
                      data={{
                        ...reward,
                        currency: 'usd',
                        description: reward.description || (reward.type ? `${reward.type.replace(/_/g, ' ')} reward` : 'Reward')
                      }}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
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