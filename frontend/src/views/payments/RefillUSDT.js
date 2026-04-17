import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme
} from '@material-ui/core';
import QRCode from 'react-qr-code';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';
import { componentSpacing } from '../../utils/spacing';
import { navigateBack } from '../../utils/navigationUtils';
import PageHeaderButton from '../../components/Navigation/PageHeaderButton';
import { testIdProps } from '../../utils/testIds';
import DecorativeIcons from '../../components/DecorativeIcons';
import { coinDollar, coinDollarGold, coinGeneric } from '../../assets/images/icons';
import {
  CRYPTO_PAYMENT_ASSET,
  CRYPTO_PAYMENT_LABEL,
  CRYPTO_PAYMENT_NETWORK,
  CRYPTO_PAYMENT_TOKEN_ACCOUNT_LABEL,
  CRYPTO_PAYMENT_WALLET_LABEL,
  CRYPTO_PAYMENT_RAIL,
} from '../../utils/cryptoPaymentConfig';

const refillIcons = [
  { src: coinDollarGold, alt: 'usdc', top: '8%', right: '3%', size: 34, opacity: 0.1, animation: 'float' },
  { src: coinDollar, alt: 'dollar', bottom: '12%', left: '4%', size: 30, opacity: 0.08, animation: 'pulse' },
  { src: coinGeneric, alt: 'coin', top: '45%', left: '2%', size: 28, opacity: 0.08, animation: 'float' },
];

const useStyles = makeStyles((theme) => ({
  addressBox: {
    background: `${theme.palette.background.paper}`,
    border: `1px solid ${theme.palette.divider || 'rgba(167,139,250,0.2)'}`,
    borderRadius: '12px',
    padding: theme.spacing(2),
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: `${theme.palette.background.paper}`,
      border: `1px solid ${theme.palette.primary.main}40`,
    },
    wordBreak: 'break-all',
    fontFamily: 'monospace',
    '& .MuiTypography-root': {
      color: theme.palette.text.primary
    }
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    display: 'inline-block'
  }
}));

const RefillUSDT = () => {
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
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

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
      setDepositSuccess(true);
      
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

  const handleCheckDeposits = () => {
    history.push('/dashboard?view=deposits');
  };

  return (
    <Grid container sx={{ ...componentSpacing.pageContainer(theme), position: 'relative' }} {...testIdProps('page', 'refill-usdc', 'container')}>
      <DecorativeIcons icons={refillIcons} />
      <Grid item xs={12} sx={componentSpacing.pageHeader(theme)} {...testIdProps('section', 'refill', 'header')}>
        <PageHeaderButton
          onClick={() => navigateBack(history, '/dashboard')}
        />
      </Grid>
      
      <Grid item xs={12} md={6} {...testIdProps('section', 'refill', 'content')}>
        <Paper className={classes.paperNoBorder} {...testIdProps('card', 'refill-usdc', 'form')}>
          <Typography variant="h4" gutterBottom {...testIdProps('text', 'refill', 'title')}>
            Refill Balance with {CRYPTO_PAYMENT_ASSET}
          </Typography>
          
          {!depositAddress ? (
            <>
              <Box mb={3} {...testIdProps('section', 'refill', 'instructions')}>
                <Typography variant="body1" gutterBottom {...testIdProps('text', 'refill', 'description')}>
                  Create a unique {CRYPTO_PAYMENT_LABEL} deposit address for your balance refill.
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom {...testIdProps('text', 'refill', 'instruction-1')}>
                  • Send any amount of {CRYPTO_PAYMENT_ASSET} on {CRYPTO_PAYMENT_NETWORK}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom {...testIdProps('text', 'refill', 'instruction-2')}>
                  • Most wallets accept the Solana wallet address shown below
                </Typography>
                <Typography variant="body2" color="textSecondary" {...testIdProps('text', 'refill', 'instruction-3')}>
                  • If your sender requires a token account, use the associated token account we provide
                </Typography>
              </Box>

              {depositError && (
                <Alert severity="error" sx={{ mb: 2 }} {...testIdProps('alert', 'refill', 'error')}>
                  {depositError}
                </Alert>
              )}

              <Button
                onClick={handleCreateDeposit}
                variant="contained"
                color="primary"
                size="large"
                disabled={depositLoading}
                startIcon={depositLoading ? <CircularProgress size={20} /> : null}
                fullWidth
                {...testIdProps('button', 'refill', 'create-deposit')}
              >
                {depositLoading ? 'Creating...' : 'Create Deposit'}
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom {...testIdProps('text', 'deposit', 'title')}>
                Send {CRYPTO_PAYMENT_ASSET} to this {CRYPTO_PAYMENT_WALLET_LABEL}:
              </Typography>
              
              {/* QR Code */}
              <Box display="flex" justifyContent="center" mb={3} {...testIdProps('section', 'deposit', 'qr-container')}>
                <Box className={styles.qrContainer} {...testIdProps('component', 'deposit', 'qr-code')}>
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
                className={styles.addressBox}
                mb={3}
                onClick={() => handleCopyAddress(depositAddress)}
                {...testIdProps('section', 'deposit', 'address-display')}
              >
                <Typography variant="body2" align="center" {...testIdProps('text', 'deposit', 'address')}>
                  {depositAddress}
                </Typography>
              </Box>

              {depositTokenAccount && (
                <Box className={styles.addressBox} mb={3} onClick={() => handleCopyAddress(depositTokenAccount)}>
                  <Typography variant="caption" display="block" align="center" color="textSecondary">
                    {CRYPTO_PAYMENT_TOKEN_ACCOUNT_LABEL}
                  </Typography>
                  <Typography variant="body2" align="center">
                    {depositTokenAccount}
                  </Typography>
                </Box>
              )}
              
              <Grid container spacing={2} {...testIdProps('section', 'deposit', 'actions')}>
                <Grid item xs={12} sm={6}>
                  <Button
                    onClick={() => handleCopyAddress(depositAddress)}
                    variant="contained"
                    color="primary"
                    fullWidth
                    {...testIdProps('button', 'deposit', 'copy-address')}
                  >
                    Copy Address
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    onClick={handleCheckDeposits}
                    variant="contained"
                    fullWidth
                    {...testIdProps('button', 'deposit', 'check-deposits')}
                  >
                    Check My Deposits
                  </Button>
                </Grid>
              </Grid>
              
              {/* Instructions */}
              <Box mt={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • Send native {CRYPTO_PAYMENT_ASSET} on {CRYPTO_PAYMENT_NETWORK} only
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • The QR code encodes your wallet address, not the token account
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Expires: {depositExpiresAt && new Date(depositExpiresAt).toLocaleString()}
                </Typography>
              </Box>

              <Box mt={3}>
                <Button
                  onClick={() => {
                    setDepositAddress('');
                    setDepositTokenAccount('');
                    setDepositExpiresAt(null);
                  }}
                  variant="outlined"
                  fullWidth
                >
                  Create New Deposit
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Grid>

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
    </Grid>
  );
};

export default RefillUSDT;
