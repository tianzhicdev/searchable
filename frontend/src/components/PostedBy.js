import React from 'react';
import { Typography, Link } from '@material-ui/core';
import { useHistory } from 'react-router-dom';

const PostedBy = ({ username, terminalId, maxLength = 30 }) => {
  const history = useHistory();

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Handle username click to navigate to user profile
  const handleUsernameClick = (e) => {
    e.stopPropagation(); // Prevent triggering any parent click handlers
    if (terminalId) {
      history.push(`/profile/${terminalId}`);
    }
  };

  // Don't render if no username or terminal_id
  if (!username || !terminalId) {
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
    </Typography>
  );
};

export default PostedBy;