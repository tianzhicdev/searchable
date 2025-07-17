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

const useStyles = makeStyles((theme) => ({
  addressBox: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.grey[200]
    },
    wordBreak: 'break-all',
    fontFamily: 'monospace',
    '& .MuiTypography-root': {
      color: theme.palette.text.primary === '#ff69b4' || theme.palette.text.secondary === '#ff69b4' ? '#000000' : theme.palette.text.primary
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
  const [depositExpiresAt, setDepositExpiresAt] = useState(null);
  const [depositId, setDepositId] = useState(null);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCreateDeposit = async () => {
    setDepositLoading(true);
    setDepositError(null);
    
    try {
      const response = await backend.post('v1/deposit/create', { 
        type: 'usdt'
      });
      
      console.log('Deposit response:', response.data);
      setDepositAddress(response.data.address);
      setDepositExpiresAt(response.data.expires_at);
      setDepositId(response.data.deposit_id);
      setDepositSuccess(true);
      
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

  const handleCheckDeposits = () => {
    history.push('/dashboard?view=deposits');
  };

  return (
    <Grid container sx={componentSpacing.pageContainer(theme)} {...testIdProps('page', 'refill-usdt', 'container')}>
      <Grid item xs={12} sx={componentSpacing.pageHeader(theme)} {...testIdProps('section', 'refill', 'header')}>
        <PageHeaderButton
          onClick={() => navigateBack(history, '/dashboard')}
        />
      </Grid>
      
      <Grid item xs={12} md={6} {...testIdProps('section', 'refill', 'content')}>
        <Paper className={classes.paperNoBorder} {...testIdProps('card', 'refill-usdt', 'form')}>
          <Typography variant="h4" gutterBottom {...testIdProps('text', 'refill', 'title')}>
            Refill Balance with USDT
          </Typography>
          
          {!depositAddress ? (
            <>
              <Box mb={3} {...testIdProps('section', 'refill', 'instructions')}>
                <Typography variant="body1" gutterBottom {...testIdProps('text', 'refill', 'description')}>
                  Click "Create Deposit" to generate a unique Ethereum address for your USDT deposit.
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom {...testIdProps('text', 'refill', 'instruction-1')}>
                  • Send any amount of USDT to the generated address
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom {...testIdProps('text', 'refill', 'instruction-2')}>
                  • Deposits expire after 1 hour
                </Typography>
                <Typography variant="body2" color="textSecondary" {...testIdProps('text', 'refill', 'instruction-3')}>
                  • Funds will be credited once confirmed on blockchain
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
                Send USDT to this address:
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
                  • Send only USDT on Ethereum network
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • Deposit will be credited once confirmed
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Expires: {depositExpiresAt && new Date(depositExpiresAt).toLocaleString()}
                </Typography>
              </Box>

              <Box mt={3}>
                <Button
                  onClick={() => {
                    setDepositAddress('');
                    setDepositExpiresAt(null);
                    setDepositId(null);
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
    </Grid>
  );
};

export default RefillUSDT;