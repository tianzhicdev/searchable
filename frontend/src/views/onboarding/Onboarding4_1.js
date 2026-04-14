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
import { catPixel as physicalItemsIcon } from '../../assets/images/icons';
import backend from '../utilities/Backend';
import OnboardingAuthWithLoggedInState from '../../components/OnboardingAuthWithLoggedInState';
import DecorativeIcons from '../../components/DecorativeIcons';
import { smileyCute, cursorMedium, snowflakeSmall, coinDollar } from '../../assets/images/icons';



const onboarding4_1Icons = [
  { src: smileyCute, alt: 'cute', top: '8%', left: '6%', size: 42, opacity: 0.12, animation: 'float' },
  { src: cursorMedium, alt: 'cursor', top: '14%', right: '5%', size: 40, opacity: 0.1, animation: 'pulse' },
  { src: snowflakeSmall, alt: 'snowflake', bottom: '16%', left: '5%', size: 36, opacity: 0.1, animation: 'float' },
  { src: coinDollar, alt: 'coin', bottom: '12%', right: '7%', size: 44, opacity: 0.12, animation: 'float' },
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
      
      // Create the allinone searchable with offline component enabled
      const searchablePayload = {
        payloads: {
          public: {
            title: catalogData.storeName,
            description: `Store catalog by ${userData.username}`,
            type: 'allinone',
            components: {
              downloadable: {
                enabled: false,
                files: []
              },
              offline: {
                enabled: true,
                items: catalogData.items.map(item => ({
                  id: `item_${item.id}`,
                  name: item.name,
                  price: parseFloat(item.price)
                }))
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
      sessionStorage.removeItem('onboarding_catalog_data');
      
      // Store searchable info for congrats page
      sessionStorage.setItem('onboarding_success', JSON.stringify({
        type: 'offline',
        storeName: catalogData.storeName,
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

  if (!catalogData) {
    return (
      <Box className={classes.root} style={{ position: 'relative' }}>
        <DecorativeIcons icons={onboarding4_1Icons} />
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
      <DecorativeIcons icons={onboarding4_1Icons} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper className={classes.paper} elevation={0}>
          {isCreatingStore && (
            <Box className={classes.loadingOverlay}>
              <Box textAlign="center">
                <img src={physicalItemsIcon} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} className={classes.successIcon} />
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
            <OnboardingAuthWithLoggedInState
              onSuccess={handleAuthSuccess}
              submitButtonText={isCreatingStore ? "Creating..." : "Open My Store"}
              submitButtonIcon={<img src={physicalItemsIcon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
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
