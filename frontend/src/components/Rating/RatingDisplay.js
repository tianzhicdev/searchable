import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider
} from '@material-ui/core';
import { Rating } from '@material-ui/lab';
import { Star, StarBorder } from '@material-ui/icons';

const RatingDisplay = ({ 
  averageRating = 0, 
  totalRatings = 0, 
  individualRatings = [],
  showIndividualRatings = true,
  maxIndividualRatings = 5
}) => {
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
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Rating
          value={averageRating}
          readOnly
          precision={0.1}
          emptyIcon={<StarBorder fontSize="inherit" />}
        />
        <Typography variant="h6">
          {averageRating.toFixed(1)}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
        </Typography>
      </Box>

      {/* Individual Ratings */}
      {showIndividualRatings && displayedRatings.length > 0 && (
        <Box>
          <Divider style={{ margin: '16px 0' }} />
          <Typography variant="subtitle2" gutterBottom>
            Recent Reviews
          </Typography>
          
          {displayedRatings.map((ratingItem, index) => (
            <Paper
              key={index}
              // style={{ 
              //   padding: 12, 
              //   marginBottom: 8
              // }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Rating
                    value={ratingItem.rating}
                    readOnly
                    size="small"
                    emptyIcon={<StarBorder fontSize="inherit" />}
                  />
                </Box>
                
                <Box display="flex" alignItems="center" gap={1}>
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
                <Typography variant="body2" style={{ marginTop: 8 }}>
                  "{ratingItem.review}"
                </Typography>
              )}
              
              {ratingItem.item_title && (
                <Typography variant="caption" color="textSecondary" style={{ marginTop: 4, display: 'block' }}>
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