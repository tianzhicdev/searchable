import React from 'react';
import { Typography, Box, Divider } from '@material-ui/core';
import ZoomableImage from './ZoomableImage';
import RatingDisplay from './Rating/RatingDisplay';
import PostedBy from './PostedBy';
import useComponentStyles from '../themes/componentStyles';

const SearchableDetailsTop = ({
  searchableItem,
  searchableRating,
  loadingRatings,
  searchableId
}) => {
  const classes = useComponentStyles();

  if (!searchableItem) return null;

  const publicData = searchableItem.payloads?.public || {};
  console.log('SearchableDetailsTop', searchableItem, searchableRating);

  return (
    <Box>
      {/* Title */}
      <Typography variant="h3" className={classes.userText}>
        {publicData.title || `Item #${searchableItem.searchable_id}`}
      </Typography>
      <Divider />
      
      {/* Rating Summary */}
      {!loadingRatings && searchableRating && (
        <Box>
          <Typography variant="body1" className={classes.staticText}>
            Rating: {searchableRating.average_rating?.toFixed(1)}/5 ({searchableRating.total_ratings} reviews)
          </Typography>
        </Box>
      )}
      
      {/* Posted by section */}
      <PostedBy 
        username={searchableItem.username} 
        userId={searchableItem.user_id} 
        maxLength={30}
      />

      <Divider />
      
      {/* Description */}
      {publicData.description && (
        <Box>
          <Typography variant="body1" className={classes.userText}>
            {publicData.description}
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Images */}
      {publicData.images && publicData.images.length > 0 && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {publicData.images.map((image, index) => {
              // Check if it's a URL (mock mode) or base64
              const isUrl = typeof image === 'string' && (image.startsWith('http') || image.startsWith('/') || image.includes('static/media'));
              const imageSrc = isUrl ? image : `data:image/jpeg;base64,${image}`;
              
              return (
                <ZoomableImage 
                  key={index}
                  src={imageSrc} 
                  alt={`${publicData.title} ${index + 1}`}
                  style={{
                    width: '150px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              );
            })}
          </div>
          <Divider />
        </>
      )}
    </Box>
  );
};

export default SearchableDetailsTop;