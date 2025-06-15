import React from 'react';
import { Grid, Typography, Paper, Box, Divider } from '@material-ui/core';
import ZoomableImage from '../ZoomableImage';
import RatingDisplay from '../Rating/RatingDisplay';
import PostedBy from '../PostedBy';
import useComponentStyles from '../../themes/componentStyles';

const SearchableDetailsInfo = ({
  searchableItem,
  searchableRating,
  terminalRating,
  loadingRatings = false
}) => {
  const classes = useComponentStyles();

  if (!searchableItem) {
    return null;
  }

  const publicData = searchableItem.payloads?.public || {};
  const images = publicData.images || [];

  return (
    <Paper className={classes.paper}>
      <Grid container spacing={3}>
        {/* Images */}
        {images.length > 0 && (
          <Grid item xs={12}>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {images.map((image, index) => (
                <ZoomableImage
                  key={index}
                  src={image}
                  alt={`${publicData.title || 'Item'} - Image ${index + 1}`}
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              ))}
            </Box>
          </Grid>
        )}

        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h5" className={classes.title} gutterBottom>
            {publicData.title}
          </Typography>
          
          {publicData.description && (
            <Typography variant="body1" className={classes.description} paragraph>
              {publicData.description}
            </Typography>
          )}

          {publicData.category && (
            <Typography variant="body2" className={classes.category} gutterBottom>
              Category: {publicData.category}
            </Typography>
          )}
        </Grid>

        {/* Posted By */}
        <Grid item xs={12}>
          <PostedBy 
            username={searchableItem.username} 
            terminalId={searchableItem.terminal_id}
          />
        </Grid>

        {/* Ratings */}
        <Grid item xs={12}>
          <Divider className={classes.divider} />
          <Typography variant="h6" className={classes.sectionTitle} gutterBottom>
            Ratings
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Item Rating
              </Typography>
              <RatingDisplay 
                rating={searchableRating} 
                loading={loadingRatings}
                showDetails={true}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Seller Rating
              </Typography>
              <RatingDisplay 
                rating={terminalRating} 
                loading={loadingRatings}
                showDetails={true}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SearchableDetailsInfo;