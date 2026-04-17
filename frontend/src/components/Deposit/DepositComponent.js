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
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../../views/utilities/Backend';
import { useHistory } from 'react-router-dom';
import { componentSpacing } from '../../utils/spacing';
import { testIdProps } from '../../utils/testIds';
import {
  CRYPTO_PAYMENT_ASSET,
  CRYPTO_PAYMENT_LABEL,
  CRYPTO_PAYMENT_NETWORK,
  CRYPTO_PAYMENT_RAIL,
  CRYPTO_PAYMENT_TOKEN_ACCOUNT_LABEL,
  CRYPTO_PAYMENT_WALLET_LABEL,
} from '../../utils/cryptoPaymentConfig';

const useStyles = makeStyles((theme) => ({
  dialogContent: componentSpacing.dialog(theme),
  button: componentSpacing.button(theme),
  dialog: {
    '& .MuiDialog-paper': {
      [theme.breakpoints.down('sm')]: {
        margin: theme.spacing(2),
        maxHeight: '90vh'
      }
    }
  }
}));

/**
 * Reusable crypto deposit component
 * Can be used in Dashboard, PayButton, or anywhere deposits are needed
 */
const DepositComponent = ({
  open,
  onClose,
  onDepositCreated,
  title = `Create ${CRYPTO_PAYMENT_ASSET} Deposit`,
  showInstructions = true
}) => {
  const classes = useComponentStyles();
  const styles = useStyles();
  const theme = useTheme();
  const history = useHistory();
  
  // Deposit states
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositTokenAccount, setDepositTokenAccount] = useState('');
  const [depositExpiresAt, setDepositExpiresAt] = useState(null);
  const [depositId, setDepositId] = useState(null);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Reset states when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setDepositError(null);
      setDepositAddress('');
      setDepositTokenAccount('');
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
        type: CRYPTO_PAYMENT_RAIL
      });
      
      console.log('Deposit response:', response.data);
      setDepositAddress(response.data.address);
      setDepositTokenAccount(response.data.token_account || '');
      setDepositExpiresAt(response.data.expires_at);
      setDepositId(response.data.deposit_id);
      setDepositSuccess(true);
      
      // Notify parent component
      if (onDepositCreated) {
        onDepositCreated({
          address: response.data.address,
          tokenAccount: response.data.token_account,
          expiresAt: response.data.expires_at,
          depositId: response.data.deposit_id
        });
      }
      
    } catch (err) {
      console.error('Error creating deposit:', err);
      setDepositError(err.response?.data?.error || err.response?.data?.msg || 'Failed to create deposit. Please try again.');
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
    setDepositTokenAccount('');
    setDepositExpiresAt(null);
    setDepositId(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth className={styles.dialog} {...testIdProps('dialog', 'deposit', 'container')}>
        <DialogTitle {...testIdProps('dialog', 'deposit', 'title')}>{title}</DialogTitle>
        <DialogContent className={styles.dialogContent} {...testIdProps('dialog', 'deposit', 'content')}>
          {!depositAddress ? (
            <>
              {showInstructions && (
                <>
                  <Typography variant="body1" gutterBottom>
                    Create a unique {CRYPTO_PAYMENT_LABEL} deposit address for your balance refill.
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    • Send any amount of {CRYPTO_PAYMENT_ASSET} on {CRYPTO_PAYMENT_NETWORK}
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    • Most wallets accept the Solana wallet address below
                  </Typography>
                  <Typography variant="body2" className={classes.staticText}>
                    • If needed, use the associated token account shown after creation
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
                Send {CRYPTO_PAYMENT_ASSET} to this {CRYPTO_PAYMENT_WALLET_LABEL}:
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

              {depositTokenAccount && (
                <Box textAlign="center" p={2} mb={2} onClick={() => handleCopyAddress(depositTokenAccount)}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {CRYPTO_PAYMENT_TOKEN_ACCOUNT_LABEL}
                  </Typography>
                  <Typography variant="body2" className={classes.userText}>
                    {depositTokenAccount}
                  </Typography>
                </Box>
              )}
              
              <Button
                onClick={() => handleCopyAddress(depositAddress)}
                variant="contained"
                fullWidth
                {...testIdProps('button', 'deposit', 'copy-address')}
              >
                Copy Address
              </Button>
              
              {/* Check Deposits Button */}
              <Box mt={2}>
                <Button
                  onClick={() => {
                    history.push('/dashboard?view=deposits');
                    handleClose();
                  }}
                  variant="outlined"
                  fullWidth
                  {...testIdProps('button', 'deposit', 'check-deposits')}
                >
                  Check My Deposits
                </Button>
              </Box>
              
              {/* Instructions */}
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • Send native {CRYPTO_PAYMENT_ASSET} on {CRYPTO_PAYMENT_NETWORK} only
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • The QR code uses your wallet address, not the token account
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Expires: {depositExpiresAt && new Date(depositExpiresAt).toLocaleString()}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions {...testIdProps('dialog', 'deposit', 'actions')}>
          <Button onClick={handleClose} className={styles.button} {...testIdProps('button', 'deposit', 'close')}>
            {depositAddress ? 'Close' : 'Cancel'}
          </Button>
          {!depositAddress && (
            <Button 
              onClick={handleCreateDeposit} 
              variant="contained"
              disabled={depositLoading}
              startIcon={depositLoading ? <CircularProgress size={20} /> : null}
              className={styles.button}
              {...testIdProps('button', 'deposit', 'create')}
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
          Deposit address created. Send {CRYPTO_PAYMENT_ASSET} on {CRYPTO_PAYMENT_NETWORK} to the displayed address.
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
