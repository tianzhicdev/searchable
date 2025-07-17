import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
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
  useTheme
} from '@material-ui/core';
import {
  Visibility,
  VisibilityOff
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';
import { strengthIndicator, strengthColor } from '../../utils/password-strength';
import { componentSpacing } from '../../utils/spacing';
import { navigateBack } from '../../utils/navigationUtils';
import PageHeaderButton from '../../components/Navigation/PageHeaderButton';
import { testIdProps } from '../../utils/testIds';

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
  }
}));

const ChangePassword = () => {
  const classes = useComponentStyles();
  const styles = useStyles();
  const theme = useTheme();
  const history = useHistory();
  
  const [formValues, setFormValues] = useState({
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
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters long';
        } else if (strength < 2) {
          error = 'Password is too weak';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
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
    Object.keys(formValues).forEach(key => {
      const error = validateField(key, formValues[key]);
      if (error) {
        errors[key] = error;
      }
    });
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true
    });
    
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
      const response = await backend.post('v1/auth/change_password', {
        current_password: formValues.currentPassword,
        new_password: formValues.newPassword
      });
      
      if (response.data.message) {
        setSuccessMessage(response.data.message);
        setShowSuccess(true);
        
        // Navigate back after showing success
        setTimeout(() => {
          navigateBack(history, '/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const message = error.response?.data?.message || 'Failed to change password. Please try again.';
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
      
      <Grid item xs={12} md={6}>
        <Paper className={classes.paperNoBorder}>
          <Typography variant="h4" gutterBottom>
            Change Password
          </Typography>
          
          <form onSubmit={handleSubmit} className={styles.formContainer} {...testIdProps('form', 'change-password', 'container')}>
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword('current')}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        {...testIdProps('button', 'change-password', 'current-password-visibility-toggle')}
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                {...testIdProps('input', 'change-password', 'current-password-field')}
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
                label="New Password"
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
                {isSubmitting ? 'Changing Password...' : 'Change Password'}
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

export default ChangePassword;