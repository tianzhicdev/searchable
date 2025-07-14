import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../../views/utilities/Backend';
import { strengthIndicator, strengthColor } from '../../utils/password-strength';
import { spacing } from '../../utils/spacing';
import { CommonDialog, FormField } from '../common';

const useStyles = makeStyles((theme) => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(2)
  },
  passwordStrength: {
    marginTop: spacing(-1),
    marginBottom: spacing(1)
  }
}));

const ChangePasswordDialog = ({ open, onClose, onSuccess }) => {
  const classes = useComponentStyles();
  const styles = useStyles();
  
  const [formValues, setFormValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const [strength, setStrength] = useState(0);
  const [level, setLevel] = useState('');

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

  const handleFormSubmit = (event) => {
    event.preventDefault();
    handleSubmit(event);
  };

  const dialogActions = [
    {
      label: 'Cancel',
      onClick: handleClose,
      disabled: isSubmitting
    },
    {
      label: 'Change Password',
      onClick: handleFormSubmit,
      variant: 'contained',
      primary: true,
      disabled: isSubmitting,
      loading: isSubmitting,
      loadingText: 'Changing...'
    }
  ];

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title="Change Password"
      actions={dialogActions}
      error={submitError}
      maxWidth="sm"
    >
      <form noValidate onSubmit={handleFormSubmit} className={styles.form}>
        <Typography variant="body2" className={classes.staticText} gutterBottom>
          Please enter your current password and choose a new password.
        </Typography>
        
        {/* Current Password */}
        <FormField
          name="currentPassword"
          label="Current Password"
          type="password"
          value={formValues.currentPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.currentPassword && formErrors.currentPassword}
          placeholder="Enter your current password"
          showPasswordToggle
          autoFocus
        />

        {/* New Password */}
        <FormField
          name="newPassword"
          label="New Password"
          type="password"
          value={formValues.newPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.newPassword && formErrors.newPassword}
          placeholder="Enter your new password"
          showPasswordToggle
        />

        {/* Password Strength Indicator */}
        {strength !== 0 && (
          <Box className={styles.passwordStrength}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Box
                  style={{
                    backgroundColor: level.color,
                    width: 85,
                    height: 8,
                    borderRadius: 7
                  }}
                />
              </Grid>
              <Grid item>
                <Typography variant="subtitle1" fontSize="0.75rem">
                  {level.label}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Confirm Password */}
        <FormField
          name="confirmPassword"
          label="Confirm New Password"
          type="password"
          value={formValues.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.confirmPassword && formErrors.confirmPassword}
          placeholder="Confirm your new password"
          showPasswordToggle
        />
      </form>
    </CommonDialog>
  );
};

export default ChangePasswordDialog;