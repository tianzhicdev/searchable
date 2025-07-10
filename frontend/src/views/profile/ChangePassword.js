import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Grid,
  Typography,
  Button,
  Paper,
  Box,
  TextField,
  Alert,
  Snackbar,
  FormControl,
  FormHelperText,
  InputAdornment,
  IconButton
} from '@material-ui/core';
import {
  ArrowBack,
  Visibility,
  VisibilityOff
} from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';
import { componentSpacing, spacing } from '../../utils/spacing';
import { useTheme } from '@material-ui/core/styles';
import backend from '../utilities/Backend';
import { navigateBack, debugNavigationStack } from '../../utils/navigationUtils';
import { strengthIndicator, strengthColor } from '../../utils/password-strength';

const ChangePassword = () => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const history = useHistory();
  const location = history.location;
  
  const [formValues, setFormValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [strength, setStrength] = useState(0);
  const [level, setLevel] = useState('');

  const handleClickShowPassword = (type) => {
    switch (type) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const changePassword = (value) => {
    const temp = strengthIndicator(value);
    setStrength(temp);
    setLevel(strengthColor(temp));
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'currentPassword':
        if (!value) {
          error = 'Current password is required';
        }
        break;
      case 'newPassword':
        if (!value) {
          error = 'New password is required';
        } else if (value.length < 4) {
          error = 'Password must be at least 4 characters';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your new password';
        } else if (value !== formValues.newPassword) {
          error = 'Passwords do not match';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      changePassword(value);
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'newPassword' && formErrors.confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    const errors = {};
    Object.keys(formValues).forEach(key => {
      const error = validateField(key, formValues[key]);
      if (error) errors[key] = error;
    });
    
    setFormErrors(errors);
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true
    });
    
    if (Object.keys(errors).length > 0) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await backend.post('users/change-password', {
        current_password: formValues.currentPassword,
        new_password: formValues.newPassword
      });
      
      if (response.data.success) {
        setFormValues({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setFormErrors({});
        setTouched({});
        setStrength(0);
        setLevel('');
        setSuccess(true);
        
        setTimeout(() => {
          handleBackClick();
        }, 2000);
      } else {
        setSubmitError(response.data.msg || 'Failed to change password');
      }
    } catch (error) {
      setSubmitError(error.response?.data?.msg || error.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    debugNavigationStack(location, 'ChangePassword Back Click');
    navigateBack(history, '/dashboard');
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  return (
    <Grid container sx={componentSpacing.pageContainer(theme)}>
      {/* Header */}
      <Grid item xs={12} sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: theme.spacing(spacing.element.md),
        [theme.breakpoints.down('sm')]: {
          mb: theme.spacing(spacing.element.xs)
        }
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button 
            variant="contained" 
            className={classes.iconButton}
            onClick={handleBackClick}
          >
            <ArrowBack />
          </Button>
          <Typography variant="h5">Change Password</Typography>
        </Box>
      </Grid>
      
      {/* Main Content */}
      <Grid item xs={12} md={8} lg={6}>
        <Paper sx={componentSpacing.card(theme)}>
          <form noValidate onSubmit={handleSubmit}>
            <Typography variant="body2" className={classes.staticText} gutterBottom>
              Please enter your current password and choose a new password.
            </Typography>
            
            {/* Current Password */}
            <FormControl 
              fullWidth 
              error={Boolean(touched.currentPassword && formErrors.currentPassword)}
              margin="normal"
            >
              <TextField
                id="current-password"
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formValues.currentPassword}
                name="currentPassword"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="Enter your current password"
                error={touched.currentPassword && Boolean(formErrors.currentPassword)}
                variant="outlined"
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword('current')}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showCurrentPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {touched.currentPassword && formErrors.currentPassword && (
                <FormHelperText error>
                  {formErrors.currentPassword}
                </FormHelperText>
              )}
            </FormControl>

            {/* New Password */}
            <FormControl 
              fullWidth 
              error={Boolean(touched.newPassword && formErrors.newPassword)}
              margin="normal"
            >
              <TextField
                id="new-password"
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={formValues.newPassword}
                name="newPassword"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="Enter your new password"
                error={touched.newPassword && Boolean(formErrors.newPassword)}
                variant="outlined"
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword('new')}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showNewPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {touched.newPassword && formErrors.newPassword && (
                <FormHelperText error>
                  {formErrors.newPassword}
                </FormHelperText>
              )}
            </FormControl>

            {/* Password Strength Indicator */}
            {strength !== 0 && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 85,
                      height: 8,
                      borderRadius: '7px',
                      backgroundColor: level.color
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {level.label}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Confirm Password */}
            <FormControl 
              fullWidth 
              error={Boolean(touched.confirmPassword && formErrors.confirmPassword)}
              margin="normal"
            >
              <TextField
                id="confirm-password"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formValues.confirmPassword}
                name="confirmPassword"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="Confirm your new password"
                error={touched.confirmPassword && Boolean(formErrors.confirmPassword)}
                variant="outlined"
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword('confirm')}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {touched.confirmPassword && formErrors.confirmPassword && (
                <FormHelperText error>
                  {formErrors.confirmPassword}
                </FormHelperText>
              )}
            </FormControl>

            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              gap: theme.spacing(2),
              mt: theme.spacing(3) 
            }}>
              <Button 
                onClick={handleBackClick}
                disabled={isSubmitting}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Grid>
      
      {/* Success Message */}
      <Snackbar 
        open={success} 
        autoHideDuration={2000} 
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          Password changed successfully!
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default ChangePassword;