import React from 'react';
import { 
  Typography, Paper, Box, Divider
} from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';

const SearchablesProfile = ({ item, onClick, formatDistance }) => {
  const classes = useComponentStyles();

  return (
    <Paper 
      id="searchable-profile"
      onClick={onClick}
      style={{ marginBottom: '16px', cursor: 'pointer' }}
    >
      <Box display="flex" flexDirection="row">
        <Box id="item-details" flex="1 1 auto">
          <Typography variant="h4">
            {item.title}
          </Typography>
          
          <Divider />
          
          <Box>
            {item.username && (
              <Typography variant="body2">
                Posted by: {item.username}
              </Typography>
            )}
            {item.price && (
              <Typography variant="body2">
                Price: {item.price} Sats
              </Typography>
            )}


            <Typography variant="body2">
              Distance: {formatDistance(item.distance)}
            </Typography>
            
            {item.category && (
              <Typography variant="body2">
                Category: {item.category}
              </Typography>
            )}
            
            <Typography variant="body2">
              Description: {item.description}
            </Typography>
          </Box>
        </Box>
        <Box id="item-profile-image" flex="0 0 auto" mr={2}>
          {item.images && item.images.length > 0 && (
            <Box p={1} display="flex" justifyContent="center" style={{border: `1px solid #ff3c00`, margin: '16px'}}>
              <img 
                src={`data:image/jpeg;base64,${item.images[0]}`} 
                alt={item.title || `Item #${item.searchable_id}`}
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
