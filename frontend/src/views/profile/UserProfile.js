import React, { useState, useEffect } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { 
  Grid, Typography, Paper, Box, CircularProgress, Avatar, Button, Chip, IconButton
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import PersonIcon from '@material-ui/icons/Person';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';
import ZoomableImage from '../../components/ZoomableImage';
import { getMediaUrl, processMediaUrls } from '../../utils/mediaUtils';
import { SOCIAL_MEDIA_PLATFORMS, formatSocialMediaUrl } from '../../components/SocialMediaIcons';
import { navigateWithStack, navigateBack, getBackButtonText, debugNavigationStack } from '../../utils/navigationUtils';
import TagsOnProfile from '../../components/Tags/TagsOnProfile';
import SearchableList from '../searchables/SearchableList';

const UserProfile = () => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const { identifier } = useParams(); // user_id
  const history = useHistory();
  const location = useLocation();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, [identifier]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Get profile by user ID
      response = await backend.get(`v1/profile/${identifier}`);
      
      const { profile } = response.data;
      setProfileData(profile);
      
      // Set up search criteria for SearchableList
      if (profile && profile.user_id) {
        setSearchCriteria({
          searchTerm: '',
          filters: {
            user_id: profile.user_id
          },
          searchTrigger: Date.now() // Trigger initial search
        });
      }
      
    } catch (err) {
      console.error('Error fetching user profile:', err);
      if (err.response?.status === 404) {
        setError('User profile not found');
      } else {
        setError('Failed to load user profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    debugNavigationStack(location, 'UserProfile Back Click');
    navigateBack(history, '/landing');
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

  if (error) {
    return (
      <Grid container className={classes.container}>
        <Grid item xs={12}>
          <Paper elevation={3} className={classes.paper}>
            <Box display="flex" alignItems="center" mb={2}>
              <Button 
                variant="contained" 
                className={classes.iconButton}
                onClick={handleBackClick}
              >
                <ArrowBackIcon />
              </Button>
              <Typography variant="h6" style={{ marginLeft: '16px' }}>
                User Profile
              </Typography>
            </Box>
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container className={classes.container}>
      {/* Header */}
      <Grid item xs={12} className={classes.header} style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <Button 
          variant="contained" 
          className={classes.iconButton}
          onClick={handleBackClick}
          title={getBackButtonText(location)}
        >
          <ArrowBackIcon />
        </Button>
      </Grid>

      {/* Profile Information */}
      <Grid item xs={12} className={classes.gridItem}>
        <Paper elevation={3} className={classes.paper}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            {/* Profile Image */}
            <Box mb={2}>
              {profileData.profile_image_url ? (
                <Avatar 
                  src={getMediaUrl(profileData.profile_image_url)} 
                  alt={profileData.username}
                  style={{ width: 100, height: 100 }}
                />
              ) : (
                <Avatar style={{ width: 100, height: 100, backgroundColor: theme.palette.secondary.main }}>
                  <PersonIcon style={{ fontSize: 60 }} />
                </Avatar>
              )}
            </Box>

            {/* Username */}
            <Typography variant="h5" gutterBottom>
              {profileData.username}
            </Typography>

            {/* Display tags below name */}
            {profileData.tags && profileData.tags.length > 0 && (
              <Box style={{ marginTop: 8, marginBottom: 16 }}>
                <TagsOnProfile tags={profileData.tags} />
              </Box>
            )}

            {/* Introduction */}
            {profileData.introduction && (
              <Box mb={2} maxWidth="600px">
                <Typography variant="body1" color="textSecondary">
                  {profileData.introduction}
                </Typography>
              </Box>
            )}

            {/* Member since */}
            {profileData.created_at && (
              <Typography variant="body2" color="textSecondary">
                Member since {new Date(profileData.created_at).toLocaleDateString()}
              </Typography>
            )}

            {/* Social Media Links */}
            {profileData.metadata?.socialMedia && (
              <Box mt={2} display="flex" gap={1} justifyContent="center">
                {SOCIAL_MEDIA_PLATFORMS.map((platform) => {
                  const username = profileData.metadata.socialMedia[platform.id];
                  if (!username) return null;
                  
                  const Icon = platform.icon;
                  const url = formatSocialMediaUrl(platform.id, username);
                  
                  return (
                    <IconButton
                      key={platform.id}
                      component="a"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      // Color managed by theme override for MuiSvgIcon
                      title={`${platform.name}: @${username}`}
                    >
                      <Icon />
                    </IconButton>
                  );
                })}
              </Box>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* Additional Images Section */}
      {profileData.metadata?.additional_images && profileData.metadata.additional_images.length > 0 && (
        <Grid item xs={12} className={classes.gridItem}>
          <Paper elevation={3} className={classes.paper}>
            <Typography variant="h6" gutterBottom>
              Gallery
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {processMediaUrls(profileData.metadata.additional_images).map((imageUrl, index) => (
                <ZoomableImage 
                  key={index}
                  src={imageUrl} 
                  alt={`Gallery ${index + 1}`}
                  style={{ 
                    width: 200, 
                    height: 200, 
                    objectFit: 'cover',
                    borderRadius: 4
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      )}

      {/* Published Items Section */}
      <Grid item xs={12} className={classes.gridItem}>
          <Typography variant="h6" gutterBottom>
            Published Items
          </Typography>
          
          {searchCriteria ? (
            <SearchableList criteria={searchCriteria} />
          ) : (
            <Typography variant="body2" color="textSecondary">
              Loading published items...
            </Typography>
          )}
      </Grid>
    </Grid>
  );
};

export default UserProfile;