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
import { ArrowBack, Store } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import backend from '../utilities/Backend';
import OnboardingAuth from '../../components/OnboardingAuth';

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
      
      // Create the downloadable searchable
      const searchablePayload = {
        payloads: {
          public: {
            title: storeData.title,
            description: `Digital content store by ${userData.username}`,
            currency: 'usd',
            type: 'downloadable',
            downloadableFiles: storeData.files.map(file => ({
              name: file.name,
              description: '',
              price: parseFloat(file.price),
              fileId: file.id,
              uuid: file.uuid
            })),
            visibility: {
              udf: "always_true",
              data: {}
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
        redirectPath: `/searchable-item/${searchableResponse.data.searchable_id}`
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
      <Box className={classes.root}>
        <Container maxWidth="md">
          <Paper className={classes.paper} elevation={3}>
            <CircularProgress />
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={3}>
          {isCreatingStore && (
            <Box className={classes.loadingOverlay}>
              <Box textAlign="center">
                <Store className={classes.successIcon} />
                <Typography variant="h6">
                  Creating your store...
                </Typography>
              </Box>
            </Box>
          )}
          
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          
          <OnboardingAuth
            onSuccess={handleAuthSuccess}
            submitButtonText={isCreatingStore ? "Creating..." : "Open My Store"}
            submitButtonIcon={<Store />}
            contextText={`open "${storeData.title}"`}
          />
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