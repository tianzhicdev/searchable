import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Paper, Box, Typography, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Tooltip
} from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import backend from '../utilities/Backend';
import { formatDate } from '../utilities/Date';
import useComponentStyles from '../../themes/componentStyles';

const UserDeposits = () => {
  const classes = useComponentStyles();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const account = useSelector((state) => state.account);

  useEffect(() => {
    fetchDeposits();
  }, [account.user, account.token]);

  const fetchDeposits = async () => {
    if (!account.user || !account.user._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await backend.get('v1/deposits');
      console.log("Deposits response:", response.data);
      setDeposits(response.data.deposits || []);
    } catch (err) {
      console.error('Error fetching deposits:', err);
      setError('Failed to load deposit history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDeposits();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'pending': { color: 'default', label: 'Pending' },
      'complete': { color: 'primary', label: 'Complete' },
      'failed': { color: 'error', label: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return <Chip size="small" color={config.color} label={config.label} />;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Paper elevation={3} style={{ marginTop: 16 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" className={classes.staticText}>
          Deposit History
        </Typography>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" style={{ padding: 16 }}>{error}</Typography>
      ) : deposits.length === 0 ? (
        <Typography style={{ padding: 16 }}>No deposits found</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deposits.map((deposit) => (
                <TableRow key={deposit.deposit_id}>
                  <TableCell>{formatDate(deposit.created_at)}</TableCell>
                  <TableCell>${deposit.amount} USDT</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Tooltip title={deposit.address}>
                        <span>{formatAddress(deposit.address)}</span>
                      </Tooltip>
                      <IconButton 
                        size="small" 
                        onClick={() => copyToClipboard(deposit.address)}
                        style={{ marginLeft: 4 }}
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>{getStatusChip(deposit.status)}</TableCell>
                  <TableCell>
                    {deposit.status === 'pending' && deposit.expires_at ? (
                      new Date(deposit.expires_at).toLocaleString()
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default UserDeposits;