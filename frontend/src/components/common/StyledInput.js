/**
 * StyledInput Component
 * A reusable input component with consistent styling and validation
 */

import React from 'react';
import { TextField, InputAdornment } from '@material-ui/core';
import { components } from '../../themes/styleSystem';
import { testIdProps } from '../../utils/testIds';

const StyledInput = ({ 
  value,
  onChange,
  onBlur,
  onFocus,
  label,
  placeholder,
  type = 'text',
  name,
  id,
  error = false,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows = 1,
  maxRows,
  startAdornment,
  endAdornment,
  inputProps = {},
  sx = {},
  variant = 'outlined',
  size = 'medium',
  testId,
  ...props
}) => {
  // Get the appropriate input style from our style system
  const inputStyles = {
    ...components.input.base,
    ...(error ? components.input.error : {}),
    ...sx,
    '& .MuiOutlinedInput-root': {
      ...components.input.base,
      ...(error ? components.input.error : {})
    }
  };

  // Generate test ID based on name, id, or provided testId
  const fieldTestId = testId || name || id || 'styled-input';

  return (
    <TextField
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      label={label}
      placeholder={placeholder}
      type={type}
      name={name}
      id={id}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      maxRows={maxRows}
      variant={variant}
      size={size}
      sx={inputStyles}
      InputProps={{
        startAdornment: startAdornment && (
          <InputAdornment position="start">{startAdornment}</InputAdornment>
        ),
        endAdornment: endAdornment && (
          <InputAdornment position="end">{endAdornment}</InputAdornment>
        ),
        ...inputProps
      }}
      inputProps={{
        ...testIdProps('input', fieldTestId, 'field'),
        ...inputProps
      }}
      {...props}
    />
  );
};

export default StyledInput;