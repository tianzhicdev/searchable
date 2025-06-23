import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Button
} from '@material-ui/core';
import { ContentCopy } from '@material-ui/icons';
import useComponentStyles from '../themes/componentStyles';
import Logo from '../ui-component/Logo';
import ZoomableImage from '../components/ZoomableImage';
import backend from './utilities/Backend';
import qrCodeImage from '../assets/images/qr-code.png';

const Invite = () => {
  const classes = useComponentStyles();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchActiveInviteCode();
  }, []);

  const fetchActiveInviteCode = async () => {
    try {
      const response = await backend.get('v1/get-active-invite-code');
      if (response.success) {
        setInviteCode(response.invite_code);
      } else {
        setError('No active invite codes available');
      }
    } catch (err) {
      setError('Failed to fetch invite code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box className={classes.mainContent}>
      <Grid container spacing={4} justifyContent="center" alignItems="center" style={{ minHeight: '100vh', padding: '20px' }}>
        <Grid item xs={12} style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            
            {/* Logo Section */}
            <Box mb={4}>
              <Logo />
            </Box>

            {/* Main Heading */}
            <Typography variant="h3" className={classes.staticText} gutterBottom>
              Sell Your Art for Stablecoins
            </Typography>

            {/* Subheading */}
            <Typography variant="h5" className={classes.userText} gutterBottom style={{ marginBottom: '32px' }}>
              Setup your store in 2 minutes
            </Typography>

            {/* QR Code Section */}
            <Box mb={4}>
              <ZoomableImage
                src={qrCodeImage}
                alt="QR Code to our site"
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px'
                }}
              />
              <Typography variant="body2" className={classes.staticText} style={{ marginTop: '8px' }}>
                Scan to visit our site
              </Typography>
            </Box>

            {/* Invite Code Section */}
            <Paper className={classes.paper} style={{ padding: '20px', width: '100%', maxWidth: '400px' }}>
              <Typography variant="h6" className={classes.staticText} gutterBottom>
                Active Invite Code
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60px">
                  <CircularProgress size={30} />
                </Box>
              ) : error ? (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              ) : (
                <Box>
                  <TextField
                    value={inviteCode}
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      readOnly: true,
                      style: {
                        fontSize: '18px',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            onClick={copyToClipboard}
                            variant="contained"
                            size="small"
                            startIcon={<ContentCopy />}
                            style={{ minWidth: 'auto' }}
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </Button>
                        </InputAdornment>
                      )
                    }}
                    style={{ marginBottom: '16px' }}
                  />
                  <Typography variant="body2" className={classes.staticText}>
                    Use this code to get $5 bonus when signing up
                  </Typography>
                </Box>
              )}
            </Paper>
            
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Invite;