import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Avatar,
  Button,
  Divider
} from '@material-ui/core';
import { 
  Person as PersonIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import TagsOnProfile from '../Tags/TagsOnProfile';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  profileCard: {
    cursor: 'pointer',
    transition: 'box-shadow 0.3s ease',
    width: '100%',
    '&:hover': {
      boxShadow: theme.shadows[4]
    }
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1)
  },
  avatar: {
    width: theme.spacing(6),
    height: theme.spacing(6),
    marginRight: theme.spacing(2),
    backgroundColor: theme.palette.primary.main
  },
  userInfo: {
    flex: 1
  },
  username: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.5)
  },
  userStats: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: '0.875rem'
  },
  introduction: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    lineHeight: 1.4
  },
  tagsSection: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  actionButton: {
    marginTop: theme.spacing(1)
  }
}));

const MiniUserProfile = ({ 
  user, 
  onClick = null
}) => {
  const classes = useStyles();
  const history = useHistory();
  
  if (!user) {
    return null;
  }
  
  // Extract user data
  const {
    id,
    username,
    displayName,
    profile_image_url,
    introduction,
    tags = [],
    rating,
    totalRatings,
    searchableCount,
    joinedDate
  } = user;
  
  const handleCardClick = () => {
    if (onClick) {
      onClick(user);
    } else {
      // Navigate to user profile
      history.push(`/profile/${username || id}`);
    }
  };
  
  
  // Truncate introduction for display
  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  
  return (
    <Paper 
      className={classes.profileCard} 
      onClick={handleCardClick}
      style={{ marginBottom: '16px', cursor: 'pointer', padding: '16px' }}
    >
      <Box display="flex" flexDirection="row">
        <Box flex="1 1 auto">
          <Typography variant="h4" gutterBottom>
            {displayName || username}
          </Typography>

          <Divider style={{ margin: '8px 0' }} />
          
          <Box>
            {username && displayName && (
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: '4px' }}>
                @{username}
              </Typography>
            )}
            
            {/* Stats */}
            <Box style={{ marginTop: '4px' }}>
              {typeof searchableCount === 'number' && (
                <Typography variant="body2" style={{ marginBottom: '2px' }}>
                  Items: {searchableCount}
                </Typography>
              )}
              
              {typeof rating === 'number' && (
                <Typography variant="body2" style={{ marginBottom: '2px' }}>
                  Rating: {rating.toFixed(1)} ({totalRatings || 0} reviews)
                </Typography>
              )}
            </Box>
            
            {/* Introduction */}
            {introduction && (
              <Typography 
                variant="body2" 
                style={{ 
                  wordBreak: 'break-word', 
                  overflowWrap: 'break-word',
                  marginTop: '8px'
                }}
              >
                {truncateText(introduction, 150)}
              </Typography>
            )}
            
            {/* Tags Section */}
            {tags && tags.length > 0 && (
              <Box style={{ marginTop: '12px' }}>
                <TagsOnProfile tags={tags} />
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Profile Image */}
        <Box flex="0 0 auto" style={{ marginLeft: '16px' }}>
          {profile_image_url && (
            <Paper>
              <Box display="flex" justifyContent="center">
                <img 
                  src={profile_image_url} 
                  alt={displayName || username}
                  style={{ 
                    maxWidth: '120px', 
                    maxHeight: '120px', 
                    objectFit: 'cover',
                  }}
                />
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default MiniUserProfile;