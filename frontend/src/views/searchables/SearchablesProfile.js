import React from 'react';
import { 
  Typography, Paper, Box, Divider, Link
} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import useComponentStyles from '../../themes/componentStyles';
const SearchablesProfile = ({ item, onClick }) => {
  const classes = useComponentStyles();
  const history = useHistory();

  // Extract data from the new structure
  const publicData = item.payloads?.public || {};
  const privateData = item.payloads?.private || {};

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Handle username click to navigate to user profile
  const handleUsernameClick = (e) => {
    e.stopPropagation(); // Prevent triggering the item click
    if (item.username) {
      history.push(`/profile/${item.username}`);
    }
  };

  return (
    <Paper 
      id="searchable-profile"
      onClick={onClick}
      style={{ marginBottom: '16px', cursor: 'pointer' }}
    >
      <Box display="flex" flexDirection="row">
        <Box id="item-details" flex="1 1 auto">
            <Typography variant="h4">
              {truncateText(publicData.title, 50)}
            </Typography>

          
          <Divider />
          
          <Box>
            {item.username && (
              <Typography variant="body2">
                Posted by: <Link 
                  component="button"
                  variant="body2"
                  onClick={handleUsernameClick}
                >
                  {truncateText(item.username, 30)}
                </Link>
              </Typography>
            )}
            
            {/* Only show price if it's in public payload */}
            {publicData.price && (
              <Typography variant="body2">
                Price: ${publicData.price}
              </Typography>
            )}

            
            {publicData.category && (
              <Typography variant="body2">
                Category: {truncateText(publicData.category, 30)}
              </Typography>
            )}
            
              <Typography variant="body2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                Description: {truncateText(publicData.description, 150)}
              </Typography>
          </Box>
        </Box>
        <Box id="item-profile-image" flex="0 0 auto" >
          {publicData.images && publicData.images.length > 0 && (
            <Paper display="flex" justifyContent="center">
              <img 
                src={`data:image/jpeg;base64,${publicData.images[0]}`} 
                alt={publicData.title || `Item #${item.searchable_id}`}
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
              />
            </Paper>
          )}
        </Box> 
      </Box>
    </Paper>
  );
};

export default SearchablesProfile;
