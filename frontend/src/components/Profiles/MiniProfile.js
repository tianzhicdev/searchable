import React from 'react';
import { 
  Typography, Paper, Box, Divider
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import PostedBy from '../PostedBy';
import TagsOnProfile from '../Tags/TagsOnProfile';
import { useHistory } from 'react-router-dom';
import { navigateWithStack } from '../../utils/navigationUtils';

const useStyles = makeStyles((theme) => ({
  profileCard: {
    cursor: 'pointer',
    transition: 'box-shadow 0.3s ease',
    width: '100%',
    padding: 0,
    overflow: 'hidden',
    '&:hover': {
      boxShadow: theme.shadows[4]
    }
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.palette.grey[100]
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  contentContainer: {
    padding: theme.spacing(2)
  },
  title: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(1)
  },
  description: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  tagsSection: {
    marginTop: theme.spacing(1.5)
  },
  metaInfo: {
    marginTop: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem'
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.secondary
  }
}));

const MiniProfile = ({ 
  type = 'searchable', // 'searchable' or 'user'
  data,
  onClick
}) => {
  console.log('MiniProfile data:', data);
  const classes = useStyles();
  const history = useHistory();
  
  if (!data) return null;
  
  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  // Helper function to get searchable type label
  const getSearchableTypeLabel = (searchableType) => {
    const typeLabels = {
      'offline': 'Offline Store',
      'direct': 'Direct Payment',
      'downloadable': 'Digital Products'
    };
    return typeLabels[searchableType] || searchableType;
  };
  
  // Extract common data based on type
  let title, description, imageUrl, tags, metaInfo, clickPath;
  
  if (type === 'searchable') {
    const publicData = data.payloads?.public || {};
    title = publicData.title;
    description = publicData.description;
    imageUrl = publicData.images?.[0];
    tags = data.tags || [];
    metaInfo = {
      username: data.username,
      userId: data.user_id,
      price: publicData.price,
      category: publicData.category,
      searchableType: publicData.type,
      rating: data.avg_rating,
      totalRatings: data.total_ratings
    };
    
    // Determine click path based on searchable type
    if (data.type === 'downloadable') {
      clickPath = `/searchable-item/${data.searchable_id}`;
    } else if (data.type === 'offline') {
      clickPath = `/offline-item/${data.searchable_id}`;
    } else if (data.type === 'direct') {
      clickPath = `/direct-item/${data.searchable_id}`;
    }
  } else if (type === 'user') {
    title = data.displayName || data.username;
    description = data.introduction;
    imageUrl = data.profile_image_url;
    tags = data.tags || [];
    metaInfo = {
      username: data.username,
      searchableCount: data.searchableCount,
      rating: data.rating,
      totalRatings: data.totalRatings,
      userId: data.user_id
    };
    clickPath = `/profile/${data.user_id || data.id}`;
  }

  console.log('MiniProfile metaInfo:', metaInfo);
  
  const handleClick = () => {
    if (onClick) {
      onClick(data);
    } else if (clickPath) {
      navigateWithStack(history, clickPath);
    }
  };
  
  return (
    <Paper className={classes.profileCard} onClick={handleClick}>
      {/* Image at the top taking full width - only show if image exists */}
      {imageUrl && (
        <Box className={classes.imageContainer}>
          <img 
            src={imageUrl} 
            alt={title}
            className={classes.image}
          />
        </Box>
      )}
      
      {/* Content below the image */}
      <Box className={classes.contentContainer}>
        <Typography variant="h4" className={classes.title}>
          {truncateText(title, 50)}
        </Typography>

        <Divider />
        
        {/* Meta information based on type */}
        {type === 'searchable' && metaInfo.username && (
          <Box className={classes.metaInfo}>
            <PostedBy 
              username={metaInfo.username} 
              userId={metaInfo.userId} 
              maxLength={30}
              rating={data.seller_rating}
              totalRatings={data.seller_total_ratings}
            />
            
            {metaInfo.searchableType && (
              <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                Type: {getSearchableTypeLabel(metaInfo.searchableType)}
              </Typography>
            )}
            
            {metaInfo.price && (
              <Typography variant="body2">
                Price: ${metaInfo.price}
              </Typography>
            )}
            
            {metaInfo.category && (
              <Typography variant="body2">
                Category: {truncateText(metaInfo.category, 30)}
              </Typography>
            )}
            
            {typeof metaInfo.rating === 'number' && metaInfo.totalRatings > 0 && (
              <Typography variant="body2">
                Item Rating: {metaInfo.rating.toFixed(1)} ({metaInfo.totalRatings} reviews)
              </Typography>
            )}
          </Box>
        )}
        
        {type === 'user' && (
          <Box className={classes.metaInfo}>
            {metaInfo.username && title !== metaInfo.username && (
              <Typography variant="body2">
                @{metaInfo.username}
              </Typography>
            )}
            
            {typeof metaInfo.searchableCount === 'number' && (
              <Typography variant="body2">
                Items: {metaInfo.searchableCount}
              </Typography>
            )}
            
            {typeof metaInfo.rating === 'number' && metaInfo.totalRatings > 0 && (
              <Typography variant="body2">
                Rating: {metaInfo.rating.toFixed(1)} ({metaInfo.totalRatings} reviews)
              </Typography>
            )}
          </Box>
        )}
        
        {/* Description */}
        {description && (
          <Typography variant="body2" className={classes.description}>
            {type === 'searchable' ? 'Description: ' : ''}
            {truncateText(description, 150)}
          </Typography>
        )}
        
        {/* Tags Section */}
        {tags && tags.length > 0 && (
          <Box className={classes.tagsSection}>
            <TagsOnProfile tags={tags} />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MiniProfile;