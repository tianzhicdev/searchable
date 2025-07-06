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
  Alert,
  Snackbar,
  useTheme
} from '@material-ui/core';
import QRCode from 'react-qr-code';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../../views/utilities/Backend';

/**
 * Reusable USDT Deposit Component
 * Can be used in Dashboard, PayButton, or anywhere deposits are needed
 */
const DepositComponent = ({
  open,
  onClose,
  onDepositCreated,
  title = "Create USDT Deposit",
  showInstructions = true
}) => {
  const classes = useComponentStyles();
  const theme = useTheme();
  
  // Deposit states
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositExpiresAt, setDepositExpiresAt] = useState(null);
  const [depositId, setDepositId] = useState(null);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Reset states when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setDepositError(null);
      setDepositAddress('');
      setDepositExpiresAt(null);
      setDepositId(null);
      setDepositSuccess(false);
    }
  }, [open]);

  const handleCreateDeposit = async () => {
    setDepositLoading(true);
    setDepositError(null);
    
    try {
      const response = await backend.post('v1/deposit/create', { 
        type: 'usdt'
        // No amount needed for USDT deposits - user sends whatever they want
      });
      
      console.log('Deposit response:', response.data);
      setDepositAddress(response.data.address);
      setDepositExpiresAt(response.data.expires_at);
      setDepositId(response.data.deposit_id);
      setDepositSuccess(true);
      
      // Notify parent component
      if (onDepositCreated) {
        onDepositCreated({
          address: response.data.address,
          expiresAt: response.data.expires_at,
          depositId: response.data.deposit_id
        });
      }
      
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

  const handleClose = () => {
    setDepositAddress('');
    setDepositExpiresAt(null);
    setDepositId(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {!depositAddress ? (
            <>
              {showInstructions && (
                <>
                  <Typography variant="body1" gutterBottom>
                    Click "Create Deposit" to generate a unique Ethereum address for your USDT deposit.
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    • Send any amount of USDT to the generated address
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    • Deposits expire after 1 hour
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    • Funds will be credited once confirmed on blockchain
                  </Typography>
                </>
              )}
              {depositError && (
                <Alert severity="error">
                  {depositError}
                </Alert>
              )}
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom className={classes.staticText}>
                Send USDT to this address:
              </Typography>
              
              {/* QR Code */}
              <Box display="flex" justifyContent="center" mb={3}>
                <Box p={2}>
                  <QRCode
                    value={depositAddress}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </Box>
              </Box>
              
              {/* Address Display */}
              <Box 
                textAlign="center"
                p={2}
                mb={2}
                onClick={() => handleCopyAddress(depositAddress)}
              >
                <Typography 
                  variant="body2" 
                  className={classes.userText}
                >
                  {depositAddress}
                </Typography>
              </Box>
              
              <Button
                onClick={() => handleCopyAddress(depositAddress)}
                variant="contained"
                fullWidth
              >
                Copy Address
              </Button>
              
              {/* Instructions */}
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • Send only USDT on Ethereum network
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • Deposit will be credited once confirmed
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Expires: {depositExpiresAt && new Date(depositExpiresAt).toLocaleString()}
                </Typography>
              </Box>
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
              disabled={depositLoading}
              startIcon={depositLoading ? <CircularProgress size={20} /> : null}
            >
              {depositLoading ? 'Creating...' : 'Create Deposit'}
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
    </>
  );
};

export default DepositComponent;