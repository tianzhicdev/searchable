import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  InputAdornment,
  FormControl,
  IconButton,
  Typography
} from '@material-ui/core';
import { Visibility, VisibilityOff } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { useDispatch } from 'react-redux';
import { performLogin, performRegistrationAndLogin } from '../services/authService';

const useStyles = makeStyles((theme) => ({
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
  toggleSection: {
    marginTop: theme.spacing(3),
    textAlign: 'center',
  }
}));

const OnboardingAuth = ({ 
  onSuccess, 
  submitButtonText = "Continue",
  submitButtonIcon = null,
  contextText = ""
}) => {
  const classes = useStyles();
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
  const [isLoginMode, setIsLoginMode] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case 'username':
        if (!isLoginMode) {
          if (!value) return 'Username is required';
          if (value.length < 3) return 'Username must be at least 3 characters';
          if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        }
        break;
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email';
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (!isLoginMode && value.length < 8) return 'Password must be at least 8 characters';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate all fields
    const errors = {};
    const fieldsToValidate = isLoginMode ? ['email', 'password'] : ['username', 'email', 'password'];
    fieldsToValidate.forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });
    
    setFormErrors(errors);
    if (isLoginMode) {
      setTouched({ email: true, password: true });
    } else {
      setTouched({ username: true, email: true, password: true });
    }
    
    if (Object.keys(errors).length > 0) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      let authResult;
      
      if (isLoginMode) {
        // Just login
        authResult = await performLogin(dispatch, formData.email, formData.password);
      } else {
        // Register and login
        authResult = await performRegistrationAndLogin(
          dispatch, 
          formData.username, 
          formData.email, 
          formData.password
        );
      }
      
      // Call success callback with user data
      if (onSuccess) {
        onSuccess(authResult);
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.msg || err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {isLoginMode ? 'Welcome Back!' : 'Create Your Account'}
      </Typography>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        {isLoginMode 
          ? `Sign in to ${contextText}`
          : `Set up your account to ${contextText}`
        }
      </Typography>

      <form onSubmit={handleSubmit} className={classes.form}>
        {!isLoginMode && (
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
        )}

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
            helperText={(touched.password && formErrors.password) || (!isLoginMode ? 'At least 8 characters' : '')}
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

        {error && (
          <Typography color="error" variant="body2" style={{ marginBottom: 16 }}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          className={classes.submitButton}
          disabled={isSubmitting}
          startIcon={submitButtonIcon}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            submitButtonText
          )}
        </Button>
      </form>

      <Box className={classes.toggleSection}>
        <Typography variant="body2" color="textSecondary">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}
        </Typography>
        <Button
          color="primary"
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setFormErrors({});
            setTouched({});
            setError('');
          }}
          style={{ textTransform: 'none', marginTop: 8 }}
        >
          {isLoginMode ? 'Create Account' : 'Sign In Instead'}
        </Button>
      </Box>
    </>
  );
};

export default OnboardingAuth;