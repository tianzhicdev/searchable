import React from 'react';
import { 
  Typography, Paper, Box, Divider, Tooltip
} from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';

const SearchablesProfile = ({ item, onClick, formatDistance }) => {
  const classes = useComponentStyles();

  // Extract data from the new structure
  const publicData = item.payloads?.public || {};
  const privateData = item.payloads?.private || {};

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Paper 
      id="searchable-profile"
      onClick={onClick}
      style={{ marginBottom: '16px', cursor: 'pointer' }}
    >
      <Box display="flex" flexDirection="row">
        <Box id="item-details" flex="1 1 auto">
          <Tooltip title={publicData.title || ''} placement="top">
            <Typography variant="h4">
              {truncateText(publicData.title, 50)}
            </Typography>
          </Tooltip>
          
          <Divider />
          
          <Box>
            {item.username && (
              <Typography variant="body2">
                Posted by: {truncateText(item.username, 30)}
              </Typography>
            )}
            
            {/* Only show price if it's in public payload */}
            {publicData.price && (
              <Typography variant="body2">
                Price: {publicData.price} Sats
              </Typography>
            )}

            {item.distance && (
              <Typography variant="body2">
                Distance: {formatDistance(item.distance)}
              </Typography>
            )}
            
            {publicData.category && (
              <Typography variant="body2">
                Category: {truncateText(publicData.category, 30)}
              </Typography>
            )}
            
            <Tooltip title={publicData.description || ''} placement="top">
              <Typography variant="body2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                Description: {truncateText(publicData.description, 150)}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
        <Box id="item-profile-image" flex="0 0 auto" mr={2}>
          {publicData.images && publicData.images.length > 0 && (
            <Box p={1} display="flex" justifyContent="center" style={{border: `1px solid #ff3c00`, margin: '16px'}}>
              <img 
                src={`data:image/jpeg;base64,${publicData.images[0]}`} 
                alt={publicData.title || `Item #${item.searchable_id}`}
                className={classes.itemProfileImage}
              />
            </Box>
          )}
        </Box> 
      </Box>
    </Paper>
  );
};

export default SearchablesProfile;
