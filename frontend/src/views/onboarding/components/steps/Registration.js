import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@material-ui/core';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { useOnboarding } from '../../OnboardingProvider';
import backend from '../../../../views/utilities/Backend';
import { componentSpacing, touchTargets } from '../../../../utils/spacing';
import { testIdProps } from '../../../../utils/testIds';

const useStyles = makeStyles((theme) => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    ...componentSpacing.formContainer(theme),
  },
  passwordRequirements: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  requirement: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    fontSize: '0.875rem',
  },
  requirementMet: {
    color: theme.palette.success.main,
  },
  requirementUnmet: {
    color: theme.palette.text.secondary,
  },
  continueButton: {
    marginTop: theme.spacing(3),
    ...componentSpacing.button(theme),
  },
  successMessage: {
    marginTop: theme.spacing(2),
  },
  summary: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
}));

const Registration = ({ stepConfig }) => {
  const classes = useStyles();
  const { answers, handleNext, uploadedFiles } = useOnboarding();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const passwordRequirements = [
    { id: 'length', text: 'At least 8 characters', check: (p) => p.length >= 8 },
    { id: 'uppercase', text: 'One uppercase letter', check: (p) => /[A-Z]/.test(p) },
    { id: 'lowercase', text: 'One lowercase letter', check: (p) => /[a-z]/.test(p) },
    { id: 'number', text: 'One number', check: (p) => /\d/.test(p) },
  ];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare registration data
      const registrationData = {
        email,
        password,
        userType: answers['1']?.value || 'creator',
        storeInfo: answers['4'] || {},
        pricingInfo: answers['5'] || {},
        contentType: answers['2']?.value || null,
        uploadedFiles: uploadedFiles.map(f => f.id),
      };

      // Register user
      const response = await backend.post('/v1/auth/register', registrationData);

      if (response.data.success) {
        setRegistrationSuccess(true);
        
        // Store auth token
        localStorage.setItem('auth_token', response.data.token);
        
        // Wait a moment then proceed
        setTimeout(() => {
          handleNext({ email, userId: response.data.userId });
        }, 2000);
      } else {
        throw new Error(response.data.msg || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        general: error.response?.data?.msg || error.message || 'Failed to create account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSummaryText = () => {
    const storeInfo = answers['4'];
    const pricingInfo = answers['5'];
    
    return {
      storeName: storeInfo?.storeName || 'Your Store',
      contentType: answers['2']?.text || 'Digital Content',
      pricingModel: pricingInfo?.pricingModel === 'fixed' 
        ? `Fixed pricing (${pricingInfo.defaultPrice ? `$${pricingInfo.defaultPrice}` : 'TBD'})`
        : pricingInfo?.pricingModel === 'pwyw' 
        ? 'Pay what you want'
        : 'Free',
      filesUploaded: uploadedFiles.length,
    };
  };

  const summary = getSummaryText();

  return (
    <Box {...testIdProps('component', 'registration', 'container')}>
      {!registrationSuccess && (
        <>
          <Box className={classes.summary} {...testIdProps('section', 'registration', 'summary')}>
            <Typography variant="h6" gutterBottom {...testIdProps('text', 'summary', 'title')}>
              Your Store Summary
            </Typography>
            <Typography variant="body2" {...testIdProps('text', 'summary', 'store-name')}>
              <strong>Store:</strong> {summary.storeName}
            </Typography>
            <Typography variant="body2" {...testIdProps('text', 'summary', 'content-type')}>
              <strong>Content Type:</strong> {summary.contentType}
            </Typography>
            <Typography variant="body2" {...testIdProps('text', 'summary', 'pricing')}>
              <strong>Pricing:</strong> {summary.pricingModel}
            </Typography>
            <Typography variant="body2" {...testIdProps('text', 'summary', 'files')}>
              <strong>Products Ready:</strong> {summary.filesUploaded} file{summary.filesUploaded !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {errors.general && (
            <Alert 
              severity="error" 
              style={{ marginBottom: 16 }}
              {...testIdProps('alert', 'registration', 'error')}
            >
              {errors.general}
            </Alert>
          )}

          <Box className={classes.form} {...testIdProps('form', 'registration', 'container')}>
            <TextField
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
              required
              disabled={isLoading}
              InputProps={{
                style: { minHeight: touchTargets.input.mobileHeight }
              }}
              inputProps={testIdProps('input', 'registration', 'email-field')}
            />

            <TextField
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              required
              disabled={isLoading}
              InputProps={{
                style: { minHeight: touchTargets.input.mobileHeight },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      {...testIdProps('button', 'registration', 'password-visibility')}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={testIdProps('input', 'registration', 'password-field')}
            />

            <TextField
              placeholder="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              fullWidth
              required
              disabled={isLoading}
              InputProps={{
                style: { minHeight: touchTargets.input.mobileHeight }
              }}
              inputProps={testIdProps('input', 'registration', 'confirm-password-field')}
            />
          </Box>

          {password && (
            <Box className={classes.passwordRequirements} {...testIdProps('section', 'password', 'requirements')}>
              <Typography variant="subtitle2" gutterBottom {...testIdProps('text', 'password', 'requirements-title')}>
                Password Requirements:
              </Typography>
              {passwordRequirements.map((req) => (
                <Box
                  key={req.id}
                  className={`${classes.requirement} ${
                    req.check(password) ? classes.requirementMet : classes.requirementUnmet
                  }`}
                  {...testIdProps('text', 'password', `requirement-${req.id}`)}
                >
                  <CheckCircle fontSize="small" />
                  <Typography variant="body2">{req.text}</Typography>
                </Box>
              ))}
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            className={classes.continueButton}
            onClick={handleRegister}
            disabled={isLoading}
            {...testIdProps('button', 'registration', 'submit')}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" {...testIdProps('spinner', 'registration', 'loading')} />
            ) : (
              stepConfig.nextButton?.text || 'Create Account'
            )}
          </Button>
        </>
      )}

      {registrationSuccess && (
        <Alert severity="success" className={classes.successMessage} {...testIdProps('alert', 'registration', 'success')}>
          <Typography variant="h6" gutterBottom {...testIdProps('text', 'success', 'title')}>
            Account Created Successfully!
          </Typography>
          <Typography variant="body2" {...testIdProps('text', 'success', 'message')}>
            Setting up your store...
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default Registration;