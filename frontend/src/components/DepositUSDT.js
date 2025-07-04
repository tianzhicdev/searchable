import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  useTheme
} from '@material-ui/core';
import QRCode from 'react-qr-code';
import backend from '../views/utilities/Backend';

const DepositUSDT = ({ open, onClose, onSuccess }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositExpiresAt, setDepositExpiresAt] = useState(null);
  const [depositId, setDepositId] = useState(null); // eslint-disable-line no-unused-vars
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCreateDeposit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await backend.post('v1/deposit/create', { amount: "0.01" });
      
      console.log('Deposit response:', response.data);
      setDepositAddress(response.data.address);
      setDepositExpiresAt(response.data.expires_at);
      setDepositId(response.data.deposit_id);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
    } catch (err) {
      console.error('Error creating deposit:', err);
      setError(err.response?.data?.message || 'Failed to create deposit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleClose = () => {
    setDepositAddress('');
    setDepositExpiresAt(null);
    setDepositId(null);
    setError(null);
    setCopiedAddress(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create USDT Deposit</DialogTitle>
      <DialogContent>
        {!depositAddress ? (
          <>
            <Typography variant="body1" gutterBottom>
              Click "Create Deposit" to generate a unique Ethereum address for your USDT deposit.
            </Typography>
            <Typography variant="body2">
              • Send any amount of USDT to the generated address
            </Typography>
            <Typography variant="body2">
              • Deposits expire after 1 hour
            </Typography>
            <Typography variant="body2">
              • Funds will be credited once confirmed on blockchain
            </Typography>
            {error && (
              <Typography color="error" variant="body2" style={{ marginTop: 16 }}>
                {error}
              </Typography>
            )}
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Send USDT to this address:
            </Typography>
            
            {/* QR Code */}
            <Box display="flex" justifyContent="center" style={{ marginBottom: 24 }}>
              <Box style={{ background: 'black', padding: 16, borderRadius: 8 }}>
                <QRCode
                  value={depositAddress}
                  size={200}
                  level="M"
                  includeMargin={true}
                  bgColor="black"
                  fgColor={theme.palette.primary.main}
                />
              </Box>
            </Box>
            
            <Box 
              style={{ 
                textAlign: 'center',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: copiedAddress ? theme.palette.success.light : 'transparent',
                transition: 'background-color 0.3s'
              }}
              onClick={() => handleCopyAddress(depositAddress)}
            >
              <Typography style={{ wordBreak: 'break-all' }}>
                {depositAddress}
              </Typography>
              {copiedAddress && (
                <Typography variant="caption" color="primary">
                  Copied!
                </Typography>
              )}
            </Box>
            <Button
              onClick={() => handleCopyAddress(depositAddress)}
              variant="outlined"
              fullWidth
              style={{ marginTop: 16, marginBottom: 16 }}
            >
              {copiedAddress ? 'Copied!' : 'Copy Address'}
            </Button>
            <Typography variant="body2" color="textSecondary">
              • Send only USDT on Ethereum network
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
        <Button onClick={handleClose}>
          {depositAddress ? 'Close' : 'Cancel'}
        </Button>
        {!depositAddress && (
          <Button 
            onClick={handleCreateDeposit} 
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Deposit'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DepositUSDT;