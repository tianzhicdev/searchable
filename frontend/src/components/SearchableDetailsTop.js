import React from 'react';
import { Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import ZoomableImage from './ZoomableImage';
import RatingDisplay from './Rating/RatingDisplay';
import PostedBy from './PostedBy';
import useComponentStyles from '../themes/componentStyles';
import { detailPageStyles } from '../utils/detailPageSpacing';

const useStyles = makeStyles((theme) => ({
  title: {
    ...detailPageStyles.title(theme),
  },
  description: {
    ...detailPageStyles.description(theme),
  },
  ratingSection: {
    ...detailPageStyles.itemText(theme),
    marginBottom: theme.spacing(2),
  },
  postedBySection: {
    marginBottom: theme.spacing(3),
  },
  imagesSection: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  imageGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }
}));

const SearchableDetailsTop = ({
  searchableItem,
  searchableRating,
  loadingRatings,
  searchableId
}) => {
  const classes = useComponentStyles();
  const detailClasses = useStyles();

  if (!searchableItem) return null;

  const publicData = searchableItem.payloads?.public || {};
  console.log('SearchableDetailsTop', searchableItem, searchableRating);

  return (
    <Box>
      {/* Title */}
      <Typography variant="h3" className={`${classes.userText} ${detailClasses.title}`}>
        {publicData.title || `Item #${searchableItem.searchable_id}`}
      </Typography>
      
      {/* Rating Summary */}
      {!loadingRatings && searchableRating && (
        <Box className={detailClasses.ratingSection}>
          <Typography variant="body1" className={classes.staticText}>
            Rating: {searchableRating.average_rating?.toFixed(1)}/5 ({searchableRating.total_ratings} reviews)
          </Typography>
        </Box>
      )}
      
      {/* Posted by section */}
      <Box className={detailClasses.postedBySection}>
        <PostedBy 
          username={searchableItem.username} 
          userId={searchableItem.user_id} 
          maxLength={30}
          rating={searchableItem.seller_rating}
          totalRatings={searchableItem.seller_total_ratings}
        />
      </Box>
      
      {/* Description */}
      {publicData.description && (
        <Box>
          <Typography variant="body1" className={`${classes.userText} ${detailClasses.description}`}>
            {publicData.description}
          </Typography>
        </Box>
      )}

      {/* Images */}
      {publicData.images && publicData.images.length > 0 && (
        <Box className={detailClasses.imagesSection}>
          <div className={detailClasses.imageGrid}>
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
        </Box>
      )}
    </Box>
  );
};

export default SearchableDetailsTop;