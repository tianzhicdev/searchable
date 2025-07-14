import React from 'react';
import { Button, CircularProgress, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { componentSpacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  button: {
    ...componentSpacing.button(theme),
    textTransform: 'none',
    position: 'relative',
    minWidth: theme.spacing(10)
  },
  loadingWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonProgress: {
    marginRight: theme.spacing(1)
  },
  fullWidth: {
    width: '100%'
  },
  primary: {
    // Primary button specific styles from theme
  },
  secondary: {
    // Secondary button specific styles from theme
  }
}));

const ActionButton = ({
  children,
  loading = false,
  loadingText,
  disabled = false,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  onClick,
  className,
  startIcon,
  endIcon,
  type = 'button',
  ...buttonProps
}) => {
  const classes = useStyles();

  const getButtonClassName = () => {
    const classNames = [classes.button];
    if (fullWidth) classNames.push(classes.fullWidth);
    if (color === 'primary' && variant === 'contained') classNames.push(classes.primary);
    if (color === 'secondary' && variant === 'contained') classNames.push(classes.secondary);
    if (className) classNames.push(className);
    return classNames.join(' ');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box className={classes.loadingWrapper}>
          <CircularProgress 
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
            className={classes.buttonProgress}
            color="inherit"
          />
          {loadingText || children}
        </Box>
      );
    }
    return children;
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      className={getButtonClassName()}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
      type={type}
      {...buttonProps}
    >
      {renderContent()}
    </Button>
  );
};

export default ActionButton;