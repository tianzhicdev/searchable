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
import {
  ArrowBack as ArrowBackIcon
} from '@material-ui/icons';
import QRCode from 'react-qr-code';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';
import { componentSpacing } from '../../utils/spacing';
import { navigateBack } from '../../utils/navigationUtils';

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
    fontFamily: 'monospace'
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
    <Grid container spacing={2} flexDirection={'column'}>
      <Grid item xs={12}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigateBack(history, '/dashboard')}
          className={classes.backButton}
        >
          Back to Dashboard
        </Button>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper className={classes.paper}>
          <Typography variant="h4" gutterBottom>
            Refill Balance with USDT
          </Typography>
          
          {!depositAddress ? (
            <>
              <Box mb={3}>
                <Typography variant="body1" gutterBottom>
                  Click "Create Deposit" to generate a unique Ethereum address for your USDT deposit.
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • Send any amount of USDT to the generated address
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  • Deposits expire after 1 hour
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Funds will be credited once confirmed on blockchain
                </Typography>
              </Box>

              {depositError && (
                <Alert severity="error" sx={{ mb: 2 }}>
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
              >
                {depositLoading ? 'Creating...' : 'Create Deposit'}
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Send USDT to this address:
              </Typography>
              
              {/* QR Code */}
              <Box display="flex" justifyContent="center" mb={3}>
                <Box className={styles.qrContainer}>
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
              >
                <Typography variant="body2" align="center">
                  {depositAddress}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    onClick={() => handleCopyAddress(depositAddress)}
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    Copy Address
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    onClick={handleCheckDeposits}
                    variant="contained"
                    fullWidth
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