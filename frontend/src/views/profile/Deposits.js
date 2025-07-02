import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Paper, Box, Typography, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Tooltip,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert
} from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import AddIcon from '@material-ui/icons/Add';
import backend from '../utilities/Backend';
import { formatDate } from '../utilities/Date';
import useComponentStyles from '../../themes/componentStyles';

const Deposits = () => {
  const classes = useComponentStyles();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const account = useSelector((state) => state.account);
  
  // Deposit dialog states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositExpiresAt, setDepositExpiresAt] = useState(null);
  const [depositId, setDepositId] = useState(null);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

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

  const handleOpenDepositDialog = () => {
    setDepositDialogOpen(true);
    setDepositError(null);
    setDepositAddress('');
    setDepositExpiresAt(null);
    setDepositId(null);
  };

  const handleCloseDepositDialog = () => {
    setDepositDialogOpen(false);
    setDepositAddress('');
    setDepositExpiresAt(null);
    setDepositId(null);
  };

  const handleCreateDeposit = async () => {
    setDepositLoading(true);
    setDepositError(null);
    
    try {
      const response = await backend.post('v1/deposit/create', { amount: "0.01" });
      
      console.log('Deposit response:', response.data);
      setDepositAddress(response.data.address);
      setDepositExpiresAt(response.data.expires_at);
      setDepositId(response.data.deposit_id);
      setDepositSuccess(true);
      
      // Refresh deposits list
      fetchDeposits();
      
    } catch (err) {
      console.error('Error creating deposit:', err);
      setDepositError(err.response?.data?.message || 'Failed to create deposit. Please try again.');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
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

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Box>
      <Paper elevation={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Typography variant="h6" className={classes.staticText}>
            USDT Deposits
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDepositDialog}
              style={{ marginRight: 8 }}
            >
              New Deposit
            </Button>
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" style={{ padding: 16 }}>{error}</Typography>
        ) : deposits.length === 0 ? (
          <Typography style={{ padding: 16 }}>No deposits found. Click "New Deposit" to get started.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Transaction</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expires</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deposits.map((deposit) => (
                  <TableRow key={deposit.deposit_id}>
                    <TableCell>{formatDate(deposit.created_at)}</TableCell>
                    <TableCell>
                      {deposit.amount === '0.00000000' ? (
                        <Typography variant="body2" color="textSecondary">-</Typography>
                      ) : (
                        `$${deposit.amount} USDT`
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Tooltip title={deposit.address}>
                          <span>{formatAddress(deposit.address)}</span>
                        </Tooltip>
                        <IconButton 
                          size="small" 
                          onClick={() => handleCopyAddress(deposit.address)}
                          style={{ marginLeft: 4 }}
                        >
                          <FileCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {deposit.tx_hash ? (
                        <Tooltip title={deposit.tx_hash}>
                          <span>{formatAddress(deposit.tx_hash)}</span>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(deposit.status)}</TableCell>
                    <TableCell>
                      {deposit.status === 'pending' && deposit.expires_at ? (
                        <Typography 
                          variant="body2" 
                          color={isExpired(deposit.expires_at) ? 'error' : 'textSecondary'}
                        >
                          {new Date(deposit.expires_at).toLocaleString()}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onClose={handleCloseDepositDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create USDT Deposit</DialogTitle>
        <DialogContent>
          {!depositAddress ? (
            <>
              <Typography variant="body1" gutterBottom>
                Click "Create Deposit" to generate a unique Ethereum address for your USDT deposit.
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
                • Send any amount of USDT to the generated address
              • Minimum deposit: $10 USDT
              • Deposits expire after 23 hours
              • Funds will be credited once confirmed on blockchain
              </Typography>
              {depositError && (
                <Typography color="error" variant="body2" style={{ marginTop: 16 }}>
                  {depositError}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Send USDT to this address:
              </Typography>
              <Box 
                style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4, 
                  wordBreak: 'break-all',
                  marginBottom: 16,
                  cursor: 'pointer'
                }}
                onClick={() => handleCopyAddress(depositAddress)}
              >
                <Typography variant="body2" style={{ fontFamily: 'monospace' }}>
                  {depositAddress}
                </Typography>
              </Box>
              <Button
                onClick={() => handleCopyAddress(depositAddress)}
                variant="outlined"
                fullWidth
                style={{ marginBottom: 16 }}
              >
                Copy Address
              </Button>
              <Typography variant="body2" color="textSecondary">
                • Send only USDT on Ethereum network
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Minimum deposit: $10 USDT
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Deposit will be credited once confirmed
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Expires: {depositExpiresAt && new Date(depositExpiresAt).toLocaleString()}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDepositDialog}>
            {depositAddress ? 'Close' : 'Cancel'}
          </Button>
          {!depositAddress && (
            <Button 
              onClick={handleCreateDeposit} 
              variant="contained"
              color="primary"
              disabled={depositLoading}
            >
              {depositLoading ? <CircularProgress size={24} /> : 'Create Deposit'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar 
        open={depositSuccess && depositAddress} 
        autoHideDuration={8000} 
        onClose={() => setDepositSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setDepositSuccess(false)} severity="info">
          Deposit address created! Send USDT to the displayed address.
        </Alert>
      </Snackbar>

      {/* Copy Address Snackbar */}
      <Snackbar 
        open={copiedAddress} 
        autoHideDuration={2000} 
        onClose={() => setCopiedAddress(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopiedAddress(false)} severity="success">
          Address copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Deposits;