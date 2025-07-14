/**
 * StyledChip Component
 * A reusable chip component with consistent styling
 */

import React from 'react';
import { Chip, Avatar } from '@material-ui/core';
import { components, combineStyles } from '../../themes/styleSystem';

const StyledChip = ({
  label,
  variant = 'filled',
  color = 'default',
  size = 'medium',
  avatar,
  icon,
  onDelete,
  onClick,
  disabled = false,
  sx = {},
  ...props
}) => {
  // Get the appropriate chip style from our style system
  const chipStyles = combineStyles(
    components.chip.base,
    color === 'primary' && components.chip.primary,
    color === 'secondary' && components.chip.secondary,
    sx
  );

  // Handle avatar prop - can be string (image url) or element
  const avatarElement = avatar && (
    typeof avatar === 'string' 
      ? <Avatar src={avatar} sx={{ width: 24, height: 24 }} />
      : avatar
  );

  return (
    <Chip
      label={label}
      variant={variant}
      color={color === 'primary' || color === 'secondary' ? 'default' : color}
      size={size}
      avatar={avatarElement}
      icon={icon}
      onDelete={onDelete}
      onClick={onClick}
      disabled={disabled}
      sx={chipStyles}
      {...props}
    />
  );
};

export default StyledChip;