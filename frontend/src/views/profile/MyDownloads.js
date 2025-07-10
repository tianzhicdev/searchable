import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Grid,
  Typography,
  Button,
  Paper,
  Box,
  CircularProgress,
  Alert
} from '@material-ui/core';
import { ArrowBack, Download } from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';
import { componentSpacing, spacing } from '../../utils/spacing';
import { useTheme } from '@material-ui/core/styles';
import backend from '../utilities/Backend';
import DownloadableProfile from '../../components/DownloadableProfile';
import { navigateBack, navigateWithStack, getBackButtonText, debugNavigationStack } from '../../utils/navigationUtils';

const MyDownloads = () => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();
  const account = useSelector((state) => state.account);
  
  const [downloadableItems, setDownloadableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDownloadableItems();
  }, [account.user]);

  const fetchDownloadableItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await backend.get('v1/downloadable-items-by-user');
      console.log('Downloadable items response:', response.data);
      setDownloadableItems(response.data.downloadable_items || []);
    } catch (err) {
      console.error('Error fetching downloadable items:', err);
      setError('Failed to load your downloads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file, downloadableItem) => {
    try {
      console.log('Downloading file:', file.name, 'from item:', downloadableItem.searchable_title);
      
      // Make request to download endpoint
      const response = await backend.get(file.download_url, { 
        responseType: 'blob' 
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  const handleBackClick = () => {
    debugNavigationStack(location, 'MyDownloads Back Click');
    navigateBack(history, '/profile');
  };

  if (loading) {
    return (
      <Grid container className={classes.container}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container sx={componentSpacing.pageContainer(theme)}>
      {/* Header */}
      <Grid item xs={12} sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: theme.spacing(spacing.element.md),
        [theme.breakpoints.down('sm')]: {
          mb: theme.spacing(spacing.element.xs)
        }
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button 
            variant="contained" 
            className={classes.iconButton}
            onClick={handleBackClick}
            title={getBackButtonText(location)}
          >
            <ArrowBack />
          </Button>
        </Box>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error" sx={{ 
            mb: theme.spacing(spacing.element.md),
            [theme.breakpoints.down('sm')]: {
              mb: theme.spacing(spacing.element.xs)
            }
          }}>
            {error}
          </Alert>
        </Grid>
      )}

      {/* Downloads List */}
      <Grid item xs={12}>
        {downloadableItems.length === 0 ? (
          <Paper sx={componentSpacing.card(theme)}>
            <Box textAlign="center" sx={{ 
              py: theme.spacing(4),
              [theme.breakpoints.down('sm')]: {
                py: theme.spacing(3)
              }
            }}>
              <Download sx={{ 
                fontSize: 64, 
                color: theme.palette.grey[400], 
                mb: theme.spacing(2),
                [theme.breakpoints.down('sm')]: {
                  fontSize: 48,
                  mb: theme.spacing(1.5)
                }
              }} />
              <Typography variant="h6" gutterBottom>
                No Downloads Yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: theme.spacing(2) }}>
                Start exploring and purchasing items to see them here.
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  onClick={() => navigateWithStack(history, '/search', { replaceStack: true })}
                >
                  Browse Items
                </Button>
              </Box>
            </Box>
          </Paper>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: theme.spacing(spacing.element.md),
            [theme.breakpoints.down('sm')]: {
              gap: theme.spacing(spacing.element.xs)
            }
          }}>
            {downloadableItems.map((item, index) => (
              <DownloadableProfile
                key={`${item.invoice_id}-${index}`}
                downloadableItem={item}
                onDownload={handleDownload}
              />
            ))}
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default MyDownloads;