import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  useMediaQuery
} from '@material-ui/core';
import { Rating } from '@material-ui/lab';
import { Star, StarBorder } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core/styles';
import { componentSpacing, touchTargets } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  ratingContainer: {
    '& .MuiRating-root': {
      fontSize: '1.5rem',
      [theme.breakpoints.down('sm')]: {
        fontSize: '1.25rem'
      }
    }
  },
  individualRatingContainer: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5)
    }
  },
  smallRating: {
    '& .MuiRating-root': {
      fontSize: '1rem',
      [theme.breakpoints.down('sm')]: {
        fontSize: '0.875rem'
      }
    }
  },
  reviewText: {
    marginTop: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(0.75),
      fontSize: '0.875rem'
    }
  },
  divider: {
    margin: theme.spacing(2, 0),
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(1.5, 0)
    }
  }
}));

const RatingDisplay = ({ 
  averageRating = 0, 
  totalRatings = 0, 
  individualRatings = [],
  showIndividualRatings = true,
  maxIndividualRatings = 5
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  if (totalRatings === 0) {
    return (
      <Box py={2}>
        <Typography variant="body2" color="textSecondary">
          No ratings yet
        </Typography>
      </Box>
    );
  }

  const displayedRatings = showIndividualRatings 
    ? individualRatings.slice(0, maxIndividualRatings)
    : [];

  return (
    <Box>
      {/* Average Rating Summary */}
      <Box 
        display="flex" 
        alignItems="center" 
        gap={isMobile ? 1 : 2} 
        mb={2}
        className={classes.ratingContainer}
      >
        <Rating
          value={averageRating}
          readOnly
          precision={0.1}
          emptyIcon={<StarBorder fontSize="inherit" />}
        />
        <Typography variant={isMobile ? "subtitle1" : "h6"}>
          {averageRating.toFixed(1)}
        </Typography>
        <Typography variant={isMobile ? "caption" : "body2"} color="textSecondary">
          ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
        </Typography>
      </Box>

      {/* Individual Ratings */}
      {showIndividualRatings && displayedRatings.length > 0 && (
        <Box>
          <Divider className={classes.divider} />
          <Typography variant={isMobile ? "body2" : "subtitle2"} gutterBottom>
            Recent Reviews
          </Typography>
          
          {displayedRatings.map((ratingItem, index) => (
            <Paper
              key={index}
              className={classes.individualRatingContainer}
              elevation={1}
            >
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between" 
                mb={1}
                flexWrap={isMobile ? "wrap" : "nowrap"}
                className={classes.smallRating}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Rating
                    value={ratingItem.rating}
                    readOnly
                    size={isMobile ? "small" : "medium"}
                    emptyIcon={<StarBorder fontSize="inherit" />}
                  />
                </Box>
                
                <Box 
                  display="flex" 
                  alignItems="center" 
                  gap={isMobile ? 0.5 : 1}
                  flexWrap="wrap"
                >
                  {ratingItem.username && (
                    <Typography variant="caption" color="textSecondary">
                      by {ratingItem.username}
                    </Typography>
                  )}
                  {ratingItem.created_at && (
                    <Typography variant="caption" color="textSecondary">
                      {new Date(ratingItem.created_at).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {ratingItem.review && (
                <Typography variant="body2" className={classes.reviewText}>
                  "{ratingItem.review}"
                </Typography>
              )}
              
              {ratingItem.item_title && (
                <Typography 
                  variant="caption" 
                  color="textSecondary" 
                  style={{ 
                    marginTop: isMobile ? 4 : 8, 
                    display: 'block' 
                  }}
                >
                  Item: {ratingItem.item_title}
                </Typography>
              )}
            </Paper>
          ))}
          
          {individualRatings.length > maxIndividualRatings && (
            <Typography variant="caption" color="textSecondary">
              Showing {maxIndividualRatings} of {individualRatings.length} reviews
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default RatingDisplay;