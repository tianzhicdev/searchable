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
import { browserWindowsOk } from '../../assets/images/icons';
import backend from '../utilities/Backend';
import OnboardingAuthWithLoggedInState from '../../components/OnboardingAuthWithLoggedInState';
import DecorativeIcons from '../../components/DecorativeIcons';
import { robotPixel, sparkleStarPurple, cursorLarge, smileyNeutral } from '../../assets/images/icons';



const onboarding3_2Icons = [
  { src: robotPixel, alt: 'robot', top: '7%', left: '5%', size: 46, opacity: 0.1, animation: 'float' },
  { src: sparkleStarPurple, alt: 'sparkle', top: '12%', right: '6%', size: 38, opacity: 0.12, animation: 'pulse' },
  { src: cursorLarge, alt: 'cursor', bottom: '14%', left: '8%', size: 42, opacity: 0.1, animation: 'float' },
  { src: smileyNeutral, alt: 'neutral', bottom: '20%', right: '7%', size: 40, opacity: 0.12, animation: 'float' },
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

const Onboarding3_2 = () => {
  const classes = useStyles();
  const history = useHistory();
  
  const [storeData, setStoreData] = useState(null);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load store data from sessionStorage
    const savedStoreData = sessionStorage.getItem('onboarding_store_data');
    const savedFiles = sessionStorage.getItem('onboarding_files');
    
    if (!savedStoreData || !savedFiles) {
      setError('Store data not found. Please complete previous steps.');
      setTimeout(() => {
        history.push('/onboarding-3');
      }, 2000);
      return;
    }
    
    setStoreData(JSON.parse(savedStoreData));
  }, [history]);

  const handleBack = () => {
    history.push('/onboarding-3-1');
  };

  const handleAuthSuccess = async (userData) => {
    setIsCreatingStore(true);
    
    try {
      // Small delay to ensure Redux state is propagated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create the allinone searchable with downloadable component enabled
      const searchablePayload = {
        payloads: {
          public: {
            title: storeData.title,
            description: `Digital content store by ${userData.username}`,
            type: 'allinone',
            components: {
              downloadable: {
                enabled: true,
                files: storeData.files.map(file => ({
                  id: file.uuid,  // UUID for file server operations
                  fileId: file.id,  // Numeric ID for frontend/backend communication
                  name: file.name,
                  size: file.size || 0,
                  price: parseFloat(file.price),
                  uuid: file.uuid
                }))
              },
              offline: {
                enabled: false,
                items: []
              },
              donation: {
                enabled: false,
                pricingMode: 'flexible'
              }
            }
          }
        }
      };
      
      const searchableResponse = await backend.post('v1/searchable/create', searchablePayload);
      
      if (!searchableResponse.data.searchable_id) {
        throw new Error('Failed to create store');
      }
      
      // Clear session storage
      sessionStorage.removeItem('onboarding_files');
      sessionStorage.removeItem('onboarding_store_data');
      
      // Store searchable info for congrats page
      sessionStorage.setItem('onboarding_success', JSON.stringify({
        type: 'downloadable',
        storeName: storeData.title,
        redirectPath: `/allinone-item/${searchableResponse.data.searchable_id}`
      }));
      
      // Redirect to congratulations page
      setTimeout(() => {
        history.push('/onboarding-congrats');
      }, 1500);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.msg || err.message || 'Failed to create store');
      setIsCreatingStore(false);
    }
  };

  if (!storeData) {
    return (
      <Box className={classes.root} style={{ position: 'relative' }}>
        <DecorativeIcons icons={onboarding3_2Icons} />
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
      <DecorativeIcons icons={onboarding3_2Icons} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper className={classes.paper} elevation={0}>
          {isCreatingStore && (
            <Box className={classes.loadingOverlay}>
              <Box textAlign="center">
                <img src={browserWindowsOk} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} className={classes.successIcon} />
                <Typography variant="h6">
                  Creating your store...
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
              submitButtonText={isCreatingStore ? "Creating..." : "Open My Store"}
              submitButtonIcon={<img src={browserWindowsOk} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
              contextText={`open "${storeData.title}"`}
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

export default Onboarding3_2;
