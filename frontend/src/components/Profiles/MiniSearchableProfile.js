import React from 'react';
import { 
  Typography, Paper, Box, Divider
} from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';
import PostedBy from '../PostedBy';
import TagsOnProfile from '../Tags/TagsOnProfile';

const MiniSearchableProfile = ({ item, onClick }) => {
  const classes = useComponentStyles();

  // Extract data from the new structure
  const publicData = item.payloads?.public || {};
  const privateData = item.payloads?.private || {};

  // Debug logging
  console.log('[MiniSearchableProfile] Item:', item);
  console.log('[MiniSearchableProfile] Public data:', publicData);

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Paper 
      id="searchable-profile"
      onClick={onClick}
      style={{ marginBottom: '16px', cursor: 'pointer', padding: '16px' }}
    >
      <Box display="flex" flexDirection="row">
        <Box id="item-details" flex="1 1 auto">
          <Typography variant="h4" gutterBottom>
            {truncateText(publicData.title, 50)}
          </Typography>

          <Divider style={{ margin: '8px 0' }} />
          
          <Box>
            <PostedBy 
              username={item.username} 
              terminalId={item.terminal_id} 
              maxLength={30}
            />
            
            {/* Only show price if it's in public payload */}
            {publicData.price && (
              <Typography variant="body2" style={{ marginTop: '4px' }}>
                Price: ${publicData.price}
              </Typography>
            )}

            {publicData.category && (
              <Typography variant="body2" style={{ marginTop: '4px' }}>
                Category: {truncateText(publicData.category, 30)}
              </Typography>
            )}
            
            <Typography 
              variant="body2" 
              style={{ 
                wordBreak: 'break-word', 
                overflowWrap: 'break-word',
                marginTop: '8px'
              }}
            >
              Description: {truncateText(publicData.description, 150)}
            </Typography>
            
            {/* Tags Section */}
            {item.tags && item.tags.length > 0 && (
              <Box style={{ marginTop: '12px' }}>
                <TagsOnProfile tags={item.tags} />
              </Box>
            )}
          </Box>
        </Box>
        <Box id="item-profile-image" flex="0 0 auto" style={{ marginLeft: '16px' }}>
          {publicData.images && publicData.images.length > 0 && (
          <Paper>
            <Box display="flex" justifyContent="center">
              <img 
                src={publicData.images[0]} 
                alt={publicData.title || `Item #${item.searchable_id}`}
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

export default MiniSearchableProfile;