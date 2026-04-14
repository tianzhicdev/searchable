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
import { ArrowBack } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { coinDollar as coinDollarIcon } from '../../assets/images/icons';
import backend from '../utilities/Backend';
import OnboardingAuthWithLoggedInState from '../../components/OnboardingAuthWithLoggedInState';
import DecorativeIcons from '../../components/DecorativeIcons';
import { smileyHappy, moonCrescent, cassetteTape, heartPixel } from '../../assets/images/icons';



const onboarding5_1Icons = [
  { src: smileyHappy, alt: 'happy', top: '9%', left: '4%', size: 40, opacity: 0.1, animation: 'float' },
  { src: moonCrescent, alt: 'moon', top: '13%', right: '6%', size: 44, opacity: 0.12, animation: 'pulse' },
  { src: cassetteTape, alt: 'cassette', bottom: '18%', left: '7%', size: 42, opacity: 0.12, animation: 'float' },
  { src: heartPixel, alt: 'heart', bottom: '14%', right: '5%', size: 38, opacity: 0.1, animation: 'float' },
];

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(4),
    position: 'relative',
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider || 'rgba(167,139,250,0.2)'}`,
    borderRadius: '16px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.28)',
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(3, 2),
    },
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
    backgroundColor: 'rgba(9, 9, 15, 0.95)',
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
      
      // Create the allinone searchable with donation component enabled
      const searchablePayload = {
        payloads: {
          public: {
            title: donationData.title,
            description: `Donation page by ${userData.username}`,
            type: 'allinone',
            components: {
              downloadable: {
                enabled: false,
                files: []
              },
              offline: {
                enabled: false,
                items: []
              },
              donation: {
                enabled: true,
                pricingMode: 'flexible',
                fixedAmount: parseFloat(donationData.defaultAmount),
                presetAmounts: [4.99, 9.99, 19.99]
              }
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
        redirectPath: `/allinone-item/${searchableResponse.data.searchable_id}`
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
      <Box className={classes.root} style={{ position: 'relative' }}>
        <DecorativeIcons icons={onboarding5_1Icons} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Paper className={classes.paper} elevation={0}>
            <CircularProgress />
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box className={classes.root} style={{ position: 'relative' }}>
      <DecorativeIcons icons={onboarding5_1Icons} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper className={classes.paper} elevation={0}>
          {isCreatingPage && (
            <Box className={classes.loadingOverlay}>
              <Box textAlign="center">
                <img src={coinDollarIcon} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} className={classes.successIcon} />
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
              submitButtonIcon={<img src={coinDollarIcon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
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
