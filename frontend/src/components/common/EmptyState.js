import React from 'react';
import { Box, Typography } from '@material-ui/core';
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
    fontSize: theme.spacing(10),
    color: theme.palette.text.disabled,
    marginBottom: theme.spacing(2),
    opacity: 0.5
  },
  image: {
    width: theme.spacing(20),
    height: theme.spacing(20),
    marginBottom: theme.spacing(3),
    opacity: 0.7
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: 500,
    color: theme.palette.text.primary
  },
  message: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    maxWidth: theme.spacing(60)
  }
}));

const EmptyState = ({ 
  icon: Icon,
  image,
  title = 'No data found',
  message,
  action,
  actionText,
  minHeight,
  className 
}) => {
  const classes = useStyles();

  return (
    <Box 
      className={`${classes.container} ${className || ''}`}
      style={{ minHeight }}
    >
      {Icon && <Icon className={classes.icon} />}
      
      {image && (
        <img 
          src={image} 
          alt="Empty state" 
          className={classes.image}
        />
      )}
      
      <Typography variant="h6" className={classes.title}>
        {title}
      </Typography>
      
      {message && (
        <Typography variant="body2" className={classes.message}>
          {message}
        </Typography>
      )}
      
      {action && actionText && (
        <ActionButton 
          onClick={action}
          variant="contained"
          color="primary"
        >
          {actionText}
        </ActionButton>
      )}
    </Box>
  );
};

export default EmptyState;