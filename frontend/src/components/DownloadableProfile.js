import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Typography,
  Button,
  Box,
  Link,
  Paper
} from '@material-ui/core';
import { componentSpacing } from '../utils/spacing';
import { floppyDisk } from '../assets/images/icons';
import { useTheme } from '@material-ui/core/styles';
import { navigateWithStack } from '../utils/navigationUtils';

const DownloadableProfile = ({ downloadableItem, onDownload }) => {
  const theme = useTheme();
  const history = useHistory();

  const handleDownload = (file) => {
    if (onDownload) {
      onDownload(file, downloadableItem);
    }
  };

  const handleSearchableClick = () => {
    navigateWithStack(history, `/searchable-item/${downloadableItem.searchable_id}`);
  };

  return (
    <>
      {downloadableItem.downloadable_files.map((file, index) => (
        <Paper key={index} sx={{ 
          ...componentSpacing.card(theme),
          mb: theme.spacing(1)
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: theme.spacing(1), sm: 0 },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            {/* Searchable name (clickable link) - Left aligned */}
            <Box flex={1} sx={{ 
              textAlign: { xs: 'center', sm: 'left' },
              mb: { xs: theme.spacing(1), sm: 0 }
            }}>
              <Link 
                component="button" 
                variant="body1" 
                onClick={handleSearchableClick}
                sx={{ 
                  textAlign: 'inherit',
                  wordBreak: 'break-word'
                }}
              >
                {downloadableItem.searchable_title}
              </Link>
            </Box>
            
            {/* Downloadable file name and button - Right aligned */}
            <Box display="flex" alignItems="center" gap={1} sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' },
              gap: { xs: theme.spacing(0.5), sm: theme.spacing(1) }
            }}>
              <Typography variant="body2" sx={{ 
                textAlign: { xs: 'center', sm: 'left' },
                wordBreak: 'break-word'
              }}>
                {file.name}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<img src={floppyDisk} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                onClick={() => handleDownload(file)}
                sx={{
                  width: { xs: '100%', sm: 'auto' }
                }}
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