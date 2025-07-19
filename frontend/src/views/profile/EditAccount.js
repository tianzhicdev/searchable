import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  FormHelperText,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  Divider,
  useTheme
} from '@material-ui/core';
import {
  Visibility,
  VisibilityOff,
  Email,
  AccountCircle
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';
import { strengthIndicator, strengthColor } from '../../utils/password-strength';
import { componentSpacing } from '../../utils/spacing';
import { navigateBack } from '../../utils/navigationUtils';
import PageHeaderButton from '../../components/Navigation/PageHeaderButton';
import { testIdProps } from '../../utils/testIds';
import { isGuestUser } from '../../utils/guestUtils';
import { ACCOUNT_INITIALIZE } from '../../store/actions';

const useStyles = makeStyles((theme) => ({
  formContainer: {
    '& .MuiTextField-root': {
      marginBottom: theme.spacing(2)
    }
  },
  strengthBar: {
    height: 8,
    borderRadius: '7px',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  submitButton: {
    marginTop: theme.spacing(2)
  },
  sectionDivider: {
    margin: theme.spacing(3, 0)
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main
  }
}));

const EditAccount = () => {
  const classes = useComponentStyles();
  const styles = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const dispatch = useDispatch();
  const account = useSelector((state) => state.account);
  
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [strength, setStrength] = useState(0);
  const [level, setLevel] = useState('');
  
  // Check if user is a guest
  const isGuest = isGuestUser(account.user);
  const guestUserId = account.user?._id;
  
  useEffect(() => {
    if (account.user) {
      setFormValues(prev => ({
        ...prev,
        username: account.user.username || '',
        email: account.user.email || '',
        // Autofill password for guest users
        currentPassword: isGuest ? `guest_${guestUserId}` : ''
      }));
    }
  }, [account.user, isGuest, guestUserId]);

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
      case 'username':
        if (!value) {
          error = 'Username is required';
        } else if (value.length < 2) {
          error = 'Username must be at least 2 characters long';
        } else if (value.length > 32) {
          error = 'Username must be less than 32 characters';
        }
        break;
      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Email is invalid';
        } else if (value.length > 64) {
          error = 'Email must be less than 64 characters';
        }
        break;
      case 'currentPassword':
        if (!value) {
          error = 'Current password is required';
        }
        break;
      case 'newPassword':
        if (value && value.length < 8) {
          error = 'Password must be at least 8 characters long';
        } else if (value && strength < 2) {
          error = 'Password is too weak';
        }
        break;
      case 'confirmPassword':
        if (formValues.newPassword && !value) {
          error = 'Please confirm your password';
        } else if (value && value !== formValues.newPassword) {
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
    setFormValues({ ...formValues, [name]: value });
    
    if (name === 'newPassword') {
      changePassword(value);
    }
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setFormErrors({ ...formErrors, [name]: error });
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setFormErrors({ ...formErrors, [name]: error });
  };

  const validateForm = () => {
    const errors = {};
    
    // Always validate username, email, and current password
    ['username', 'email', 'currentPassword'].forEach(key => {
      const error = validateField(key, formValues[key]);
      if (error) {
        errors[key] = error;
      }
    });
    
    // Only validate new password fields if user is changing password
    if (formValues.newPassword || formValues.confirmPassword) {
      const newPasswordError = validateField('newPassword', formValues.newPassword);
      const confirmPasswordError = validateField('confirmPassword', formValues.confirmPassword);
      
      if (newPasswordError) errors.newPassword = newPasswordError;
      if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    }
    
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Mark all relevant fields as touched
    const touchedFields = {
      username: true,
      email: true,
      currentPassword: true
    };
    
    if (formValues.newPassword || formValues.confirmPassword) {
      touchedFields.newPassword = true;
      touchedFields.confirmPassword = true;
    }
    
    setTouched(touchedFields);
    
    // Validate all fields
    const errors = validateForm();
    setFormErrors(errors);
    
    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // First update username and email
      const response = await backend.post('users/edit-account', {
        username: formValues.username,
        email: formValues.email,
        current_password: formValues.currentPassword,
        new_password: formValues.newPassword || undefined
      });
      
      if (response.data.success) {
        // Update token and user data in localStorage and Redux
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          
          // Update Redux store with new user data
          dispatch({
            type: ACCOUNT_INITIALIZE,
            payload: {
              isLoggedIn: true,
              user: response.data.user,
              token: response.data.token
            }
          });
        }
        
        setSuccessMessage(
          isGuest 
            ? 'Account successfully upgraded!'
            : 'Account information updated successfully!'
        );
        setShowSuccess(true);
        
        // Navigate after showing success
        setTimeout(() => {
          navigateBack(history, '/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating account:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.msg || error.response?.data?.error || 'Failed to update account. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <Grid container sx={componentSpacing.pageContainer(theme)}>
      <Grid item xs={12} sx={componentSpacing.pageHeader(theme)}>
        <PageHeaderButton
          onClick={() => navigateBack(history, '/dashboard')}
        />
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Paper className={classes.paperNoBorder}>
          <Typography variant="h4" gutterBottom>
            {isGuest ? 'Upgrade Your Account' : 'Edit Account'}
          </Typography>
          
          <form onSubmit={handleSubmit} className={styles.formContainer} {...testIdProps('form', 'edit-account', 'container')}>
            {/* Account Information Section */}
            <Typography variant="h6" className={styles.sectionTitle}>
              <AccountCircle style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Account Information
            </Typography>
            
            {/* Username */}
            <FormControl fullWidth error={Boolean(formErrors.username && touched.username)}>
              <TextField
                name="username"
                value={formValues.username}
                onChange={handleChange}
                onBlur={handleBlur}
                label="Username"
                variant="outlined"
                error={Boolean(formErrors.username && touched.username)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle />
                    </InputAdornment>
                  )
                }}
                {...testIdProps('input', 'edit-account', 'username-field')}
              />
              {formErrors.username && touched.username && (
                <FormHelperText>{formErrors.username}</FormHelperText>
              )}
            </FormControl>

            {/* Email */}
            <FormControl fullWidth error={Boolean(formErrors.email && touched.email)}>
              <TextField
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                onBlur={handleBlur}
                label="Email"
                variant="outlined"
                error={Boolean(formErrors.email && touched.email)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  )
                }}
                {...testIdProps('input', 'edit-account', 'email-field')}
              />
              {formErrors.email && touched.email && (
                <FormHelperText>{formErrors.email}</FormHelperText>
              )}
            </FormControl>

            <Divider className={styles.sectionDivider} />

            {/* Password Section */}
            <Typography variant="h6" className={styles.sectionTitle}>
              Security
            </Typography>
            
            {/* Current Password */}
            <FormControl fullWidth error={Boolean(formErrors.currentPassword && touched.currentPassword)}>
              <TextField
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formValues.currentPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                label="Current Password"
                variant="outlined"
                error={Boolean(formErrors.currentPassword && touched.currentPassword)}
                helperText={isGuest ? "This has been pre-filled for you" : ""}
                disabled={isGuest}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword('current')}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        {...testIdProps('button', 'edit-account', 'current-password-visibility-toggle')}
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                {...testIdProps('input', 'edit-account', 'current-password-field')}
              />
              {formErrors.currentPassword && touched.currentPassword && (
                <FormHelperText>{formErrors.currentPassword}</FormHelperText>
              )}
            </FormControl>

            {/* New Password */}
            <FormControl fullWidth error={Boolean(formErrors.newPassword && touched.newPassword)}>
              <TextField
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formValues.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                label={isGuest ? "New Password (Required)" : "New Password (Optional)"}
                variant="outlined"
                error={Boolean(formErrors.newPassword && touched.newPassword)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword('new')}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {formValues.newPassword && (
                <Box sx={{ mb: 2 }}>
                  <Box className={styles.strengthBar} sx={{ bgcolor: level?.color }} />
                  <Typography variant="caption" sx={{ color: level?.color }}>
                    Password Strength: {level?.label}
                  </Typography>
                </Box>
              )}
              {formErrors.newPassword && touched.newPassword && (
                <FormHelperText>{formErrors.newPassword}</FormHelperText>
              )}
            </FormControl>

            {/* Confirm Password */}
            <FormControl fullWidth error={Boolean(formErrors.confirmPassword && touched.confirmPassword)}>
              <TextField
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formValues.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                label="Confirm New Password"
                variant="outlined"
                error={Boolean(formErrors.confirmPassword && touched.confirmPassword)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword('confirm')}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {formErrors.confirmPassword && touched.confirmPassword && (
                <FormHelperText>{formErrors.confirmPassword}</FormHelperText>
              )}
            </FormControl>

            {/* Submit Error */}
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

            {/* Submit Button */}
            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                className={styles.submitButton}
                fullWidth
              >
                {isSubmitting 
                  ? (isGuest ? 'Registering...' : 'Updating...') 
                  : (isGuest ? 'Complete Registration' : 'Update Account')}
              </Button>
            </Box>
          </form>
        </Paper>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default EditAccount;