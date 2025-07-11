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

const Onboarding4_1 = () => {
  const classes = useStyles();
  const history = useHistory();
  
  const [catalogData, setCatalogData] = useState(null);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load catalog data from sessionStorage
    const savedCatalogData = sessionStorage.getItem('onboarding_catalog_data');
    
    if (!savedCatalogData) {
      setError('Catalog data not found. Please complete previous steps.');
      setTimeout(() => {
        history.push('/onboarding-4');
      }, 2000);
      return;
    }
    
    setCatalogData(JSON.parse(savedCatalogData));
  }, [history]);

  const handleBack = () => {
    history.push('/onboarding-4');
  };

  const handleAuthSuccess = async (userData) => {
    setIsCreatingStore(true);
    
    try {
      // Small delay to ensure Redux state is propagated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create the offline searchable
      const searchablePayload = {
        payloads: {
          public: {
            title: catalogData.storeName,
            description: `Store catalog by ${userData.username}`,
            currency: 'usd',
            type: 'offline',
            offlineItems: catalogData.items.map(item => ({
              itemId: `item_${item.id}`,
              name: item.name,
              price: parseFloat(item.price),
              description: ''
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
      sessionStorage.removeItem('onboarding_catalog_data');
      
      // Store searchable info for congrats page
      sessionStorage.setItem('onboarding_success', JSON.stringify({
        type: 'offline',
        storeName: catalogData.storeName,
        redirectPath: `/offline-item/${searchableResponse.data.searchable_id}`
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

  if (!catalogData) {
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
          {isCreatingStore && (
            <Box className={classes.loadingOverlay}>
              <Box textAlign="center">
                <Store className={classes.successIcon} />
                <Typography variant="h6">
                  Creating your store catalog...
                </Typography>
              </Box>
            </Box>
          )}
          
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          
          <Box style={{ paddingTop: 48 }}>
            <OnboardingAuth
              onSuccess={handleAuthSuccess}
              submitButtonText={isCreatingStore ? "Creating..." : "Open My Store"}
              submitButtonIcon={<Store />}
              contextText={`publish "${catalogData.storeName}"`}
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

export default Onboarding4_1;