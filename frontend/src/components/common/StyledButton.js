/**
 * StyledButton Component
 * A wrapper around Material-UI Button that enforces variant="contained" 
 * and applies theme-based styling consistently
 */

import React from 'react';
import { Button } from '@material-ui/core';
import { components } from '../../themes/styleSystem';

const StyledButton = ({ 
  children, 
  color = 'primary', 
  size = 'medium',
  fullWidth = false,
  disabled = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  sx = {},
  ...props 
}) => {
  // Get the appropriate button style from our style system
  const buttonStyles = {
    ...components.button.base,
    ...(components.button[color] || components.button.primary),
    ...sx
  };

  return (
    <Button
      variant="contained" // ALWAYS use contained variant as per requirements
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      onClick={onClick}
      type={type}
      sx={buttonStyles}
      {...props}
    >
      {children}
    </Button>
  );
};

export default StyledButton;