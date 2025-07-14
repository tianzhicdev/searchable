import React from 'react';
import { Box, Typography, Button } from '@material-ui/core';
import { Error as ErrorIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import ActionButton from './ActionButton';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6),
    minHeight: theme.spacing(30),
    textAlign: 'center'
  },
  icon: {
    fontSize: theme.spacing(8),
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2)
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: 500
  },
  message: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    maxWidth: theme.spacing(60)
  }
}));

const ErrorState = ({ 
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  onRetry,
  retryText = 'Try Again',
  minHeight,
  className 
}) => {
  const classes = useStyles();

  return (
    <Box 
      className={`${classes.container} ${className || ''}`}
      style={{ minHeight }}
    >
      <ErrorIcon className={classes.icon} />
      
      <Typography variant="h6" className={classes.title}>
        {title}
      </Typography>
      
      {message && (
        <Typography variant="body2" className={classes.message}>
          {message}
        </Typography>
      )}
      
      {onRetry && (
        <ActionButton 
          onClick={onRetry}
          variant="contained"
          color="primary"
        >
          {retryText}
        </ActionButton>
      )}
    </Box>
  );
};

export default ErrorState;