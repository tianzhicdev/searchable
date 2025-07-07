import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  FormControl,
  FormHelperText,
  InputAdornment,
  Grid
} from '@material-ui/core';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff
} from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../../views/utilities/Backend';
import { strengthIndicator, strengthColor } from '../../utils/password-strength';

const ChangePasswordDialog = ({ open, onClose, onSuccess }) => {
  const classes = useComponentStyles();
  
  const [formValues, setFormValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
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
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Also clear confirm password error if new password changes
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
    
    // Validate all fields
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
        // Reset form
        setFormValues({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setFormErrors({});
        setTouched({});
        setStrength(0);
        setLevel('');
        
        // Call success callback
        if (onSuccess) {
          onSuccess('Password changed successfully!');
        }
        
        // Close dialog
        onClose();
      } else {
        setSubmitError(response.data.msg || 'Failed to change password');
      }
    } catch (error) {
      setSubmitError(error.response?.data?.msg || error.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormValues({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setTouched({});
    setSubmitError('');
    setStrength(0);
    setLevel('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" className={classes.staticText}>
            Change Password
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <form noValidate onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" className={classes.staticText} gutterBottom>
            Please enter your current password and choose a new password.
          </Typography>
          
          {/* Current Password */}
          <FormControl 
            fullWidth 
            error={Boolean(touched.currentPassword && formErrors.currentPassword)}
            style={{ marginBottom: 16 }}
          >
            <TextField
              id="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={formValues.currentPassword}
              name="currentPassword"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="Enter your current password"
              error={touched.currentPassword && Boolean(formErrors.currentPassword)}
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
            style={{ marginBottom: 16 }}
          >
            <TextField
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={formValues.newPassword}
              name="newPassword"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="Enter your new password"
              error={touched.newPassword && Boolean(formErrors.newPassword)}
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
            <FormControl fullWidth style={{ marginBottom: 16 }}>
              <Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <Box
                      backgroundColor={level.color}
                      sx={{
                        width: 85,
                        height: 8,
                        borderRadius: '7px'
                      }}
                    ></Box>
                  </Grid>
                  <Grid item>
                    <Typography variant="subtitle1" fontSize="0.75rem">
                      {level.label}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </FormControl>
          )}

          {/* Confirm Password */}
          <FormControl 
            fullWidth 
            error={Boolean(touched.confirmPassword && formErrors.confirmPassword)}
            style={{ marginBottom: 16 }}
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
            <Box mb={2}>
              <FormHelperText error>{submitError}</FormHelperText>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChangePasswordDialog;