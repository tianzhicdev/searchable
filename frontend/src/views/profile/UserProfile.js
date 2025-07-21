import React, { useState, useEffect } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { 
  Grid, Typography, Paper, Box, CircularProgress, Avatar, Button, Chip, IconButton
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import PersonIcon from '@material-ui/icons/Person';
import useComponentStyles from '../../themes/componentStyles';
import { componentSpacing, spacing } from '../../utils/spacing';
import backend from '../utilities/Backend';
import ZoomableImage from '../../components/ZoomableImage';
import { getMediaUrl, processMediaUrls } from '../../utils/mediaUtils';
import { SOCIAL_MEDIA_PLATFORMS, formatSocialMediaUrl } from '../../components/SocialMediaIcons';
import { navigateWithStack, navigateBack, getBackButtonText, debugNavigationStack } from '../../utils/navigationUtils';
import PageHeaderButton from '../../components/Navigation/PageHeaderButton';
import TagsOnProfile from '../../components/Tags/TagsOnProfile';
import SearchableList from '../searchables/SearchableList';
import { testIdProps } from '../../utils/testIds';

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
  const [currentPage, setCurrentPage] = useState(1);

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
          currentPage: currentPage,
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
    navigateBack(history, '/search');
  };

  const handlePageChange = (newPage) => {
    console.log('[USER PROFILE] Page change requested:', newPage);
    setCurrentPage(newPage);
    
    // Update search criteria with new page
    if (profileData && profileData.user_id) {
      setSearchCriteria({
        searchTerm: '',
        filters: {
          user_id: profileData.user_id
        },
        currentPage: newPage,
        searchTrigger: Date.now() // Trigger new search
      });
    }
  };

  if (loading) {
    return (
      <Grid container>
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
      <Grid container>
        <Grid item xs={12} sx={componentSpacing.pageHeader(theme)}>
          <Paper elevation={3} className={classes.paper}>
            <Box mb={2}>
              <PageHeaderButton
                onClick={handleBackClick}
              />
              <Typography variant="h6" style={{ marginTop: '16px' }}>
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
    <Grid container {...testIdProps('page', 'user-profile', 'container')}>
      {/* Header */}
      <Grid item xs={12} sx={componentSpacing.pageHeader(theme)} {...testIdProps('section', 'profile', 'header')}>
        <PageHeaderButton
          onClick={handleBackClick}
        />
      </Grid>

      {/* Profile Information */}
      <Grid item xs={12} sx={{ mb: theme.spacing(spacing.element.md), [theme.breakpoints.down('sm')]: { mb: theme.spacing(spacing.element.xs) } }}>
        <Paper elevation={3} sx={componentSpacing.card(theme)} {...testIdProps('card', 'profile', 'info')}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" {...testIdProps('section', 'profile', 'content')}>
            {/* Profile Image */}
            <Box sx={{ mb: theme.spacing(spacing.element.md), [theme.breakpoints.down('sm')]: { mb: theme.spacing(spacing.element.xs) } }} {...testIdProps('section', 'profile', 'image')}>
              {profileData.profile_image_url ? (
                <Avatar 
                  src={getMediaUrl(profileData.profile_image_url)} 
                  alt={profileData.username}
                  sx={{ 
                    width: 100, 
                    height: 100,
                    [theme.breakpoints.down('sm')]: {
                      width: 80,
                      height: 80
                    }
                  }}
                  {...testIdProps('image', 'profile', 'avatar')}
                />
              ) : (
                <Avatar sx={{ 
                  width: 100, 
                  height: 100, 
                  backgroundColor: theme.palette.secondary.main,
                  [theme.breakpoints.down('sm')]: {
                    width: 80,
                    height: 80
                  }
                }} {...testIdProps('image', 'profile', 'default-avatar')}>
                  <PersonIcon sx={{ fontSize: 60, [theme.breakpoints.down('sm')]: { fontSize: 48 } }} />
                </Avatar>
              )}
            </Box>

            {/* Username */}
            <Typography variant="h5" gutterBottom {...testIdProps('text', 'profile', 'username')}>
              {profileData.username}
            </Typography>

            {/* Display tags below name */}
            {profileData.tags && profileData.tags.length > 0 && (
              <Box style={{ marginTop: 8, marginBottom: 16 }} {...testIdProps('section', 'profile', 'tags')}>
                <TagsOnProfile tags={profileData.tags} />
              </Box>
            )}

            {/* Introduction */}
            {profileData.introduction && (
              <Box sx={{ 
                mb: theme.spacing(spacing.element.md), 
                maxWidth: '600px',
                px: theme.spacing(2),
                [theme.breakpoints.down('sm')]: { 
                  mb: theme.spacing(spacing.element.xs),
                  px: theme.spacing(1)
                }
              }} {...testIdProps('section', 'profile', 'introduction')}>
                <Typography variant="body1" color="textSecondary" {...testIdProps('text', 'profile', 'introduction-text')}>
                  {profileData.introduction}
                </Typography>
              </Box>
            )}

            {/* Seller Rating */}
            {typeof profileData.seller_rating === 'number' && profileData.seller_total_ratings > 0 && (
              <Box mt={1} {...testIdProps('section', 'profile', 'rating')}>
                <Typography variant="body1" {...testIdProps('text', 'profile', 'rating-value')}>
                  ★ {profileData.seller_rating.toFixed(1)} ({profileData.seller_total_ratings} reviews)
                </Typography>
              </Box>
            )}

            {/* Member since */}
            {profileData.created_at && (
              <Typography variant="body2" color="textSecondary" {...testIdProps('text', 'profile', 'member-since')}>
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
        <Grid item xs={12} sx={{ mb: theme.spacing(spacing.element.md), [theme.breakpoints.down('sm')]: { mb: theme.spacing(spacing.element.xs) } }}>
          <Paper elevation={3} sx={componentSpacing.card(theme)}>
            <Typography variant="h6" gutterBottom>
              Gallery
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2} sx={{ 
              [theme.breakpoints.down('sm')]: { 
                gap: 1,
                justifyContent: 'center' 
              } 
            }}>
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
                  sx={{
                    [theme.breakpoints.down('sm')]: {
                      width: 150,
                      height: 150
                    }
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      )}

      {/* Published Items Section */}
      <Grid item xs={12} sx={{ mb: theme.spacing(spacing.element.md), [theme.breakpoints.down('sm')]: { mb: theme.spacing(spacing.element.xs) } }}>

          <Typography variant="h6" gutterBottom>
            Published Items
          </Typography>
          
          {searchCriteria ? (
            <SearchableList 
              criteria={searchCriteria} 
              onPageChange={handlePageChange}
            />
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