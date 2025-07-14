import React from 'react';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6),
    minHeight: theme.spacing(30)
  },
  progress: {
    marginBottom: theme.spacing(2)
  },
  text: {
    color: theme.palette.text.secondary
  }
}));

const LoadingState = ({ 
  text = 'Loading...', 
  size = 40,
  minHeight,
  className 
}) => {
  const classes = useStyles();

  return (
    <Box 
      className={`${classes.container} ${className || ''}`}
      style={{ minHeight }}
    >
      <CircularProgress 
        size={size} 
        className={classes.progress}
      />
      {text && (
        <Typography variant="body2" className={classes.text}>
          {text}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingState;