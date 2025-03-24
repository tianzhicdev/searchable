import React from 'react';
import { 
  Typography, Paper, Box, Divider
} from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';

const SearchablesProfile = ({ item, onClick, formatDistance }) => {
  const classes = useComponentStyles();

  // Extract data from the new structure
  const publicData = item.payloads?.public || {};
  const privateData = item.payloads?.private || {};

  return (
    <Paper 
      id="searchable-profile"
      onClick={onClick}
      style={{ marginBottom: '16px', cursor: 'pointer' }}
    >
      <Box display="flex" flexDirection="row">
        <Box id="item-details" flex="1 1 auto">
          <Typography variant="h4">
            {publicData.title}
          </Typography>
          
          <Divider />
          
          <Box>
            {item.username && (
              <Typography variant="body2">
                Posted by: {item.username}
              </Typography>
            )}
            
            {/* Only show price if it's in public payload */}
            {publicData.price && (
              <Typography variant="body2">
                Price: {publicData.price} Sats
              </Typography>
            )}

            <Typography variant="body2">
              Distance: {formatDistance(item.distance)}
            </Typography>
            
            {publicData.category && (
              <Typography variant="body2">
                Category: {publicData.category}
              </Typography>
            )}
            
            <Typography variant="body2">
              Description: {publicData.description}
            </Typography>
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
