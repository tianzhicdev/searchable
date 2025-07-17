import React from 'react';
import { LinearProgress, Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { testIdProps } from '../../../utils/testIds';

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
    <Box className={classes.root} {...testIdProps('component', 'onboarding-progress', 'container')}>
      <LinearProgress
        variant="determinate"
        value={progress}
        className={classes.progressBar}
        {...testIdProps('progress', 'onboarding', 'bar')}
      />
      <Typography 
        className={classes.progressText} 
        align="right"
        {...testIdProps('text', 'progress', 'percentage')}
      >
        {Math.round(progress)}% Complete
      </Typography>
    </Box>
  );
};

export default ProgressBar;