import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Typography,
  Button,
  Box,
  Link,
  Paper
} from '@material-ui/core';
import { Download } from '@material-ui/icons';
import useComponentStyles from '../themes/componentStyles';
import { navigateWithReferrer } from '../utils/navigationUtils';

const DownloadableProfile = ({ downloadableItem, onDownload }) => {
  const classes = useComponentStyles();
  const history = useHistory();

  const handleDownload = (file) => {
    if (onDownload) {
      onDownload(file, downloadableItem);
    }
  };

  const handleSearchableClick = () => {
    navigateWithReferrer(history, `/searchable-item/${downloadableItem.searchable_id}`, '/my-downloads');
  };

  return (
    <>
      {downloadableItem.downloadable_files.map((file, index) => (
        <Paper key={index} className={classes.paper} style={{ marginBottom: '8px' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {/* Searchable name (clickable link) - Left aligned */}
            <Box flex={1}>
              <Link 
                component="button" 
                variant="body1" 
                onClick={handleSearchableClick}
                style={{ textAlign: 'left' }}
              >
                {downloadableItem.searchable_title}
              </Link>
            </Box>
            
            {/* Downloadable file name and button - Right aligned */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">
                {file.name}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<Download />}
                onClick={() => handleDownload(file)}
              >
                Download
              </Button>
            </Box>
          </Box>
        </Paper>
      ))}
    </>
  );
};

export default DownloadableProfile;