import React from 'react';
import { 
  Typography, Paper, Box, Divider
} from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';
import PostedBy from '../../components/PostedBy';
const SearchablesProfile = ({ item, onClick }) => {
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
            <Typography variant="h4">
              {truncateText(publicData.title, 50)}
            </Typography>

          
          <Divider />
          
          <Box>
            <PostedBy 
              username={item.username} 
              terminalId={item.terminal_id} 
              maxLength={30}
            />
            
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
                src={publicData.images[0]} 
                alt={publicData.title || `Item #${item.searchable_id}`}
                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }}
              />
            </Paper>
          )}
        </Box> 
      </Box>
    </Paper>
  );
};

export default SearchablesProfile;
