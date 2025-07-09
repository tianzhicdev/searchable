import React from 'react';
import { LinearProgress, Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(3),
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.palette.grey[200],
  },
  progressText: {
    marginTop: theme.spacing(1),
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
}));

const ProgressBar = ({ progress }) => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <LinearProgress
        variant="determinate"
        value={progress}
        className={classes.progressBar}
      />
      <Typography className={classes.progressText} align="right">
        {Math.round(progress)}% Complete
      </Typography>
    </Box>
  );
};

export default ProgressBar;