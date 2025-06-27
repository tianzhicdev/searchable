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
  Person as PersonIcon,
  Star as StarIcon,
  Shop as ShopIcon 
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import TagList from '../Tags/TagList';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  profileCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    cursor: 'pointer',
    transition: 'box-shadow 0.3s ease',
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
  onClick = null,
  showButton = true 
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
  
  const handleViewProfile = (e) => {
    e.stopPropagation(); // Prevent card click
    history.push(`/profile/${username || id}`);
  };
  
  // Truncate introduction for display
  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  // Format join date
  const formatJoinDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };
  
  return (
    <Paper className={classes.profileCard} onClick={handleCardClick}>
      {/* Profile Header */}
      <Box className={classes.profileHeader}>
        <Avatar 
          src={profile_image_url} 
          className={classes.avatar}
          alt={displayName || username}
        >
          {(!profile_image_url) && <PersonIcon />}
        </Avatar>
        
        <Box className={classes.userInfo}>
          <Typography variant="h6" className={classes.username}>
            {displayName || username}
          </Typography>
          
          {username && displayName && (
            <Typography variant="body2" color="textSecondary">
              @{username}
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* User Stats */}
      <Box className={classes.userStats}>
        {typeof searchableCount === 'number' && (
          <Box className={classes.statItem}>
            <ShopIcon fontSize="small" />
            <Typography variant="caption">
              {searchableCount} item{searchableCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
        
        {typeof rating === 'number' && (
          <Box className={classes.statItem}>
            <StarIcon fontSize="small" />
            <Typography variant="caption">
              {rating.toFixed(1)} ({totalRatings || 0} review{totalRatings !== 1 ? 's' : ''})
            </Typography>
          </Box>
        )}
        
        {joinedDate && (
          <Typography variant="caption" color="textSecondary">
            Joined {formatJoinDate(joinedDate)}
          </Typography>
        )}
      </Box>
      
      {/* Introduction */}
      {introduction && (
        <Typography className={classes.introduction}>
          {truncateText(introduction)}
        </Typography>
      )}
      
      <Divider />
      
      {/* Tags Section */}
      <Box className={classes.tagsSection}>
        <TagList
          tags={tags}
          maxVisible={4}
          emptyMessage="No tags assigned"
        />
      </Box>
      
      {/* Action Button */}
      {showButton && (
        <Button
          variant="outlined"
          size="small"
          className={classes.actionButton}
          onClick={handleViewProfile}
          fullWidth
        >
          View Profile
        </Button>
      )}
    </Paper>
  );
};

export default MiniUserProfile;