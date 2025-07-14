/**
 * StyledForm Component
 * A reusable form component with built-in validation and consistent styling
 */

import React, { useState, useCallback } from 'react';
import { Box } from '@material-ui/core';
import { validateForm } from '../../utils/validation';
import { layouts, spacing } from '../../themes/styleSystem';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';

const StyledForm = ({
  children,
  initialValues = {},
  validationRules = {},
  onSubmit,
  onChange,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  showCancel = true,
  isLoading = false,
  sx = {},
  actionsAlign = 'right',
  ...props
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Call parent onChange if provided
    if (onChange) {
      onChange(name, newValue, values);
    }
  }, [errors, values, onChange]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate single field on blur
    if (validationRules[name]) {
      const { errors: validationErrors } = validateForm(
        { [name]: values[name] },
        { [name]: validationRules[name] }
      );
      
      if (validationErrors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: validationErrors[name]
        }));
      }
    }
  }, [values, validationRules]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Validate all fields
    const { isValid, errors: validationErrors } = validateForm(values, validationRules);
    
    if (!isValid) {
      setErrors(validationErrors);
      // Mark all fields as touched to show errors
      const allTouched = Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);
      return;
    }

    // Clear errors and submit
    setErrors({});
    onSubmit(values);
  }, [values, validationRules, onSubmit]);

  // Form context to pass to children
  const formContext = {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isLoading
  };

  // Render children with form context
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(formContext);
    }

    // Clone children and inject form props if they're StyledInput components
    return React.Children.map(children, child => {
      if (React.isValidElement(child) && child.type === StyledInput) {
        const fieldName = child.props.name;
        return React.cloneElement(child, {
          value: values[fieldName] || '',
          onChange: handleChange,
          onBlur: handleBlur,
          error: touched[fieldName] && !!errors[fieldName],
          helperText: touched[fieldName] && errors[fieldName],
          disabled: isLoading || child.props.disabled
        });
      }
      return child;
    });
  };

  const formStyles = {
    ...layouts.flexColumn,
    gap: spacing.md,
    ...sx
  };

  const actionsStyles = {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.lg,
    justifyContent: actionsAlign === 'left' ? 'flex-start' : 
                   actionsAlign === 'center' ? 'center' : 'flex-end'
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={formStyles}
      {...props}
    >
      {renderChildren()}
      
      <Box sx={actionsStyles}>
        {showCancel && onCancel && (
          <StyledButton
            color="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </StyledButton>
        )}
        <StyledButton
          type="submit"
          color="primary"
          disabled={isLoading}
        >
          {submitText}
        </StyledButton>
      </Box>
    </Box>
  );
};

export default StyledForm;