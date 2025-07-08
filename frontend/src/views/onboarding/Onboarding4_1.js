import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  InputAdornment,
  FormControl,
  Snackbar,
  Alert
} from '@material-ui/core';
import { ArrowBack, Visibility, VisibilityOff, Store } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import axios from 'axios';
import backend from '../utilities/Backend';
import configData from '../../config';
import { ACCOUNT_INITIALIZE } from '../../store/actions';

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
  form: {
    marginTop: theme.spacing(3),
  },
  formField: {
    marginBottom: theme.spacing(3),
  },
  submitButton: {
    marginTop: theme.spacing(4),
    padding: theme.spacing(1.5),
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
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [catalogData, setCatalogData] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

  const validateField = (name, value) => {
    switch (name) {
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        break;
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email';
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        break;
      default:
        break;
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });
    
    setFormErrors(errors);
    setTouched({ username: true, email: true, password: true });
    
    if (Object.keys(errors).length > 0) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Step 1: Register the user
      const registerResponse = await axios.post(configData.API_SERVER + 'users/register', {
        username: formData.username,
        password: formData.password,
        email: formData.email
      });
      
      if (!registerResponse.data.success) {
        throw new Error(registerResponse.data.msg || 'Registration failed');
      }
      
      // Step 2: Login to get token
      const loginResponse = await axios.post(configData.API_SERVER + 'users/login', {
        email: formData.email,
        password: formData.password
      });
      
      if (!loginResponse.data.success) {
        throw new Error('Failed to login after registration');
      }
      
      // Store token
      const token = loginResponse.data.token;
      localStorage.setItem('serviceToken', token);
      
      // Update Redux store FIRST before making any API calls
      dispatch({
        type: ACCOUNT_INITIALIZE,
        payload: {
          isLoggedIn: true,
          user: {
            id: loginResponse.data.user_id,
            email: formData.email,
            name: formData.username
          },
          token: token
        }
      });
      
      // Configure backend with token (use lowercase 'authorization')
      backend.defaults.headers.common['authorization'] = token;
      
      setRegistrationSuccess(true);
      
      // Small delay to ensure Redux state is propagated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 3: Create the offline searchable directly
      const searchablePayload = {
        payloads: {
          public: {
            title: catalogData.storeName,
            description: `Store catalog by ${formData.username}`,
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
      setError(err.response?.data?.msg || err.message || 'An error occurred');
      setIsSubmitting(false);
      setRegistrationSuccess(false);
    }
  };


  if (!catalogData) {
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
            {(isSubmitting || registrationSuccess) && (
              <Box className={classes.loadingOverlay}>
                <Box textAlign="center">
                  {registrationSuccess ? (
                    <>
                      <Store className={classes.successIcon} />
                      <Typography variant="h6">
                        Creating your store catalog...
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CircularProgress />
                      <Typography variant="h6" style={{ marginTop: 16 }}>
                        Setting up your account...
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            )}
            
            <IconButton className={classes.backButton} onClick={handleBack}>
              <ArrowBack />
            </IconButton>
            
            <Typography variant="h3" gutterBottom>
              Create Your Account
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Set up your account for "{catalogData.storeName}"
            </Typography>

            <form onSubmit={handleRegistrationSubmit} className={classes.form}>
              <FormControl 
                fullWidth 
                error={Boolean(touched.username && formErrors.username)}
                className={classes.formField}
              >
                <TextField
                  name="username"
                  label="Username"
                  variant="outlined"
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.username && formErrors.username)}
                  helperText={touched.username && formErrors.username}
                  disabled={isSubmitting}
                />
              </FormControl>

              <FormControl 
                fullWidth 
                error={Boolean(touched.email && formErrors.email)}
                className={classes.formField}
              >
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  variant="outlined"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.email && formErrors.email)}
                  helperText={touched.email && formErrors.email}
                  disabled={isSubmitting}
                />
              </FormControl>

              <FormControl 
                fullWidth 
                error={Boolean(touched.password && formErrors.password)}
                className={classes.formField}
              >
                <TextField
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.password && formErrors.password)}
                  helperText={(touched.password && formErrors.password) || 'At least 8 characters'}
                  disabled={isSubmitting}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                className={classes.submitButton}
                disabled={isSubmitting}
              >
                Create Account
              </Button>
            </form>
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