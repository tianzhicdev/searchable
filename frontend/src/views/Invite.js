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
      if (response.data.success) {
        setInviteCode(response.data.invite_code);
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
    <Box>
      <Grid containerjustifyContent="center" alignItems="center">
        <Grid item xs={12}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            
            {/* Logo Section */}
            <Box maxHeight={'200px'} maxWidth={'200px'}>
              <Logo />
            </Box>

            {/* Main Heading */}
            <Typography variant="h3" className={classes.staticText} gutterBottom>
              Sell Digital Content for Stablecoins
            </Typography>
            {/* QR Code Section */}
            <Box mb={4}>
              <ZoomableImage
                src={qrCodeImage}
                alt="QR Code to our site"
                // style={{
                //   maxWidth: '200px',
                //   maxHeight: '200px'
                // }}
              />
            </Box>

            {/* Invite Code Section */}
              
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

                  <Typography variant="h1"  style={{ marginBottom: '16px' }}>
                    {inviteCode}
                  </Typography>
                  <Typography variant="body2" style={{ marginBottom: '16px' }}>
                    use this invite code to get 5 USDT bonus when signing up
                  </Typography>
                  
                  <Typography variant="body2" className={classes.staticText}>
                    Contact: info@eccentricprotocol.com
                  </Typography>
                  
                </Box>
              )}
            
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Invite;