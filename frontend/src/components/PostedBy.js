import React from 'react';
import { Typography, Link } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { navigateWithStack } from '../utils/navigationUtils';

const PostedBy = ({ username, userId, maxLength = 30, rating, totalRatings }) => {
  const history = useHistory();

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Handle username click to navigate to user profile
  const handleUsernameClick = (e) => {
    e.stopPropagation(); // Prevent triggering any parent click handlers
    if (userId) {
      navigateWithStack(history, `/profile/${userId}`);
    }
  };

  // Don't render if no username or user_id
  if (!username || !userId) {
    return null;
  }

  return (
    <Typography variant="body2">
      Posted by: <Link 
        component="button"
        variant="body2"
        onClick={handleUsernameClick}
      >
        {truncateText(username, maxLength)}
      </Link>
      {typeof rating === 'number' && totalRatings > 0 && (
        <span> ★ {rating.toFixed(1)}({totalRatings})</span>
      )}
    </Typography>
  );
};

export default PostedBy;