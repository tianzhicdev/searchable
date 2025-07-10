import React from 'react';
import { Box, Typography, Chip, useMediaQuery } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/styles';
import { isMockMode } from '../mocks/mockBackend';
import { touchTargets } from '../utils/spacing';

const useStyles = makeStyles((theme) => ({
  indicator: {
    position: 'fixed',
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 9999,
    backgroundColor: theme.palette.warning.main,
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[4],
    minHeight: touchTargets.clickable.minHeight,
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      top: theme.spacing(1),
      right: theme.spacing(1),
      padding: theme.spacing(1, 1.5),
      minHeight: 36
    }
  },
  text: {
    color: theme.palette.warning.contrastText,
    fontWeight: 'bold',
    fontSize: '0.875rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem'
    }
  }
}));

const MockModeIndicator = () => {
  const theme = useTheme();
  const classes = useStyles();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!isMockMode) return null;

  return (
    <Box className={classes.indicator}>
      <Typography variant="body2" className={classes.text}>
        {isMobile ? '🔧 MOCK' : '🔧 MOCK MODE'}
      </Typography>
    </Box>
  );
};

export default MockModeIndicator;