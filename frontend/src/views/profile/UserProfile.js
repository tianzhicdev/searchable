import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
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

const UserProfile = () => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const { identifier } = useParams(); // Can be username or user_id
  const history = useHistory();
  
  const [profileData, setProfileData] = useState(null);
  const [downloadables, setDownloadables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, [identifier]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Support both usernames and numeric user IDs
      response = await backend.get(`v1/profile/${identifier}`);
      
      const { profile, downloadables } = response.data;
      setProfileData(profile);
      setDownloadables(downloadables || []);
      
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

  const handleDownloadableClick = (searchableId) => {
    history.push(`/searchable-item/${searchableId}`);
  };

  const handleBackClick = () => {
    history.goBack();
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
                      style={{ color: platform.color }}
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

      {/* Downloadables Section */}
      <Grid item xs={12} className={classes.gridItem}>
        <Paper elevation={3} className={classes.paper}>
          <Typography variant="h6" gutterBottom>
            Published Items ({downloadables.length})
          </Typography>
          
          {downloadables.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              This user hasn't published any items yet.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {downloadables.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.searchable_id}>
                  <Paper 
                    elevation={1} 
                    style={{ 
                      padding: '16px', 
                      cursor: 'pointer',
                      transition: 'elevation 0.2s',
                      '&:hover': {
                        elevation: 3
                      }
                    }}
                    onClick={() => handleDownloadableClick(item.searchable_id)}
                  >
                    <Typography variant="h6" gutterBottom noWrap>
                      {item.title}
                    </Typography>
                    
                    {item.description && (
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          marginBottom: '8px'
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip 
                        label={item.type} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      {item.price && (
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          ${item.price} {item.currency}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default UserProfile;