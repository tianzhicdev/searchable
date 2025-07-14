import React from 'react';
import { Box, Typography, Rating } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { spacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing(1)
  },
  rating: {
    color: theme.palette.warning.main
  },
  ratingValue: {
    fontWeight: 500
  },
  count: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem'
  }
}));

const RatingDisplay = ({
  rating,
  count,
  size = 'medium',
  showValue = true,
  showCount = true,
  precision = 0.5,
  readOnly = true,
  onChange,
  className
}) => {
  const classes = useStyles();

  const getRatingSize = () => {
    switch (size) {
      case 'small': return 'small';
      case 'large': return 'large';
      default: return 'medium';
    }
  };

  const formatRating = (value) => {
    return value ? value.toFixed(1) : '0.0';
  };

  return (
    <Box className={`${classes.container} ${className || ''}`}>
      <Rating
        value={rating || 0}
        precision={precision}
        readOnly={readOnly}
        onChange={onChange}
        size={getRatingSize()}
        className={classes.rating}
      />
      
      {showValue && rating !== undefined && (
        <Typography 
          variant={size === 'small' ? 'body2' : 'body1'}
          className={classes.ratingValue}
        >
          {formatRating(rating)}
        </Typography>
      )}
      
      {showCount && count !== undefined && (
        <Typography 
          variant="body2"
          className={classes.count}
        >
          ({count})
        </Typography>
      )}
    </Box>
  );
};

export default RatingDisplay;