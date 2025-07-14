import React, { useState } from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useFormValidation, ValidationBuilder } from '../../utils/validation';
import { CommonDialog, FormField, ActionButton } from './index';

const useStyles = makeStyles((theme) => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2)
  }
}));

// Example of how to use the new form components and validation
const FormExample = ({ open, onClose }) => {
  const styles = useStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define validation schema
  const validationSchema = {
    name: new ValidationBuilder()
      .required('Name')
      .minLength(2, 'Name')
      .maxLength(50, 'Name')
      .build(),
    
    email: new ValidationBuilder()
      .required('Email')
      .email()
      .build(),
    
    password: new ValidationBuilder()
      .required('Password')
      .minLength(8, 'Password')
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      )
      .build(),
    
    confirmPassword: (value, allValues) => {
      if (!value) return 'Please confirm your password';
      if (value !== allValues.password) return 'Passwords do not match';
      return '';
    }
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    isValid,
    resetForm
  } = useFormValidation(
    {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success
      console.log('Form submitted:', values);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogActions = [
    {
      label: 'Cancel',
      onClick: () => {
        resetForm();
        onClose();
      }
    },
    {
      label: 'Submit',
      onClick: handleSubmit,
      variant: 'contained',
      primary: true,
      disabled: isSubmitting || !isValid(),
      loading: isSubmitting
    }
  ];

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title="Form Example"
      actions={dialogActions}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          This example demonstrates the new form components and validation patterns.
        </Typography>

        <FormField
          name="name"
          label="Name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name && errors.name}
          required
          autoFocus
        />

        <FormField
          name="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email && errors.email}
          required
        />

        <FormField
          name="password"
          label="Password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password && errors.password}
          helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
          showPasswordToggle
          required
        />

        <FormField
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.confirmPassword && errors.confirmPassword}
          showPasswordToggle
          required
        />
      </form>
    </CommonDialog>
  );
};

export default FormExample;