import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@material-ui/core';
import { ArrowBack, MonetizationOn } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import backend from '../utilities/Backend';
import OnboardingAuthWithLoggedInState from '../../components/OnboardingAuthWithLoggedInState';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    padding: theme.spacing(4),
    position: 'relative',
    boxShadow: 'none !important',
    border: 'none !important',
    background: 'transparent !important',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  successIcon: {
    fontSize: 48,
    color: theme.palette.success.main,
    marginBottom: theme.spacing(2),
  }
}));

const Onboarding5_1 = () => {
  const classes = useStyles();
  const history = useHistory();
  
  const [donationData, setDonationData] = useState(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load donation data from sessionStorage
    const savedDonationData = sessionStorage.getItem('onboarding_donation_data');
    
    if (!savedDonationData) {
      setError('Donation data not found. Please complete previous steps.');
      setTimeout(() => {
        history.push('/onboarding-5');
      }, 2000);
      return;
    }
    
    setDonationData(JSON.parse(savedDonationData));
  }, [history]);

  const handleBack = () => {
    history.push('/onboarding-5');
  };

  const handleAuthSuccess = async (userData) => {
    setIsCreatingPage(true);
    
    try {
      // Small delay to ensure Redux state is propagated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create the direct payment searchable
      const searchablePayload = {
        payloads: {
          public: {
            title: donationData.title,
            description: `Donation page by ${userData.username}`,
            currency: 'usd',
            type: 'direct',
            defaultAmount: parseFloat(donationData.defaultAmount),
            visibility: {
              udf: "always_true",
              data: {}
            }
          }
        }
      };
      
      const searchableResponse = await backend.post('v1/searchable/create', searchablePayload);
      
      if (!searchableResponse.data.searchable_id) {
        throw new Error('Failed to create donation page');
      }
      
      // Clear session storage
      sessionStorage.removeItem('onboarding_donation_data');
      
      // Store searchable info for congrats page
      sessionStorage.setItem('onboarding_success', JSON.stringify({
        type: 'direct',
        storeName: donationData.title,
        redirectPath: `/direct-item/${searchableResponse.data.searchable_id}`
      }));
      
      // Redirect to congratulations page
      setTimeout(() => {
        history.push('/onboarding-congrats');
      }, 1500);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.msg || err.message || 'Failed to create donation page');
      setIsCreatingPage(false);
    }
  };

  if (!donationData) {
    return (
      <Box className={classes.root}>
        <Container maxWidth="md">
          <Paper className={classes.paper} elevation={0}>
            <CircularProgress />
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={0}>
          {isCreatingPage && (
            <Box className={classes.loadingOverlay}>
              <Box textAlign="center">
                <MonetizationOn className={classes.successIcon} />
                <Typography variant="h6">
                  Creating your donation page...
                </Typography>
              </Box>
            </Box>
          )}
          
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          
          <Box style={{ paddingTop: 48 }}>
            <OnboardingAuthWithLoggedInState
              onSuccess={handleAuthSuccess}
              submitButtonText={isCreatingPage ? "Creating..." : "Create Donation Page"}
              submitButtonIcon={<MonetizationOn />}
              contextText={`create "${donationData.title}"`}
            />
          </Box>
        </Paper>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Onboarding5_1;