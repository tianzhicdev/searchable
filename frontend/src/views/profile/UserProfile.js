import React, { useState, useEffect } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import {
  Grid, Typography, Paper, Box, CircularProgress, Avatar, IconButton
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import PersonIcon from '@material-ui/icons/Person';
import StarIcon from '@material-ui/icons/Star';
import useComponentStyles from '../../themes/componentStyles';
import { componentSpacing } from '../../utils/spacing';
import backend from '../utilities/Backend';
import ZoomableImage from '../../components/ZoomableImage';
import { getMediaUrl, processMediaUrls } from '../../utils/mediaUtils';
import { SOCIAL_MEDIA_PLATFORMS, formatSocialMediaUrl } from '../../components/SocialMediaIcons';
import { navigateBack, debugNavigationStack } from '../../utils/navigationUtils';
import PageHeaderButton from '../../components/Navigation/PageHeaderButton';
import TagsOnProfile from '../../components/Tags/TagsOnProfile';
import SearchableList from '../searchables/SearchableList';
import { testIdProps } from '../../utils/testIds';

// Glass card style helper
const glassCard = (theme) => ({
  background: `${theme.palette.background.paper}B3`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${theme.palette.divider || 'rgba(167,139,250,0.2)'}`,
  borderRadius: '12px',
  boxShadow: 'none',
});

const UserProfile = () => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const { identifier } = useParams();
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
      const response = await backend.get(`v1/profile/${identifier}`);
      const { profile } = response.data;
      setProfileData(profile);

      if (profile && profile.user_id) {
        setSearchCriteria({
          searchTerm: '',
          filters: { user_id: profile.user_id },
          currentPage: currentPage,
          searchTrigger: Date.now()
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
    setCurrentPage(newPage);
    if (profileData && profileData.user_id) {
      setSearchCriteria({
        searchTerm: '',
        filters: { user_id: profileData.user_id },
        currentPage: newPage,
        searchTrigger: Date.now()
      });
    }
  };

  if (loading) {
    return (
      <Grid container sx={componentSpacing.pageContainer(theme)}>
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
      <Grid container sx={componentSpacing.pageContainer(theme)}>
        <Grid item xs={12} sx={componentSpacing.pageHeader(theme)}>
          <PageHeaderButton onClick={handleBackClick} />
        </Grid>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ ...componentSpacing.card(theme), ...glassCard(theme) }}>
            <Typography variant="body1" color="error">{error}</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  const hasGallery = profileData?.metadata?.additional_images && profileData.metadata.additional_images.length > 0;
  const hasRating = typeof profileData?.seller_rating === 'number' && profileData?.seller_total_ratings > 0;

  return (
    <Grid container sx={componentSpacing.pageContainer(theme)} {...testIdProps('page', 'user-profile', 'container')}>

      {/* Back Button */}
      <Grid item xs={12} sx={componentSpacing.pageHeader(theme)} {...testIdProps('section', 'profile', 'header')}>
        <PageHeaderButton onClick={handleBackClick} />
      </Grid>

      {/* ===== PROFILE HEADER — horizontal glass card ===== */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{
          ...componentSpacing.card(theme),
          ...glassCard(theme),
          display: 'flex',
          gap: 3,
          alignItems: 'center',
          [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
            textAlign: 'center',
            gap: 2,
          },
        }} {...testIdProps('card', 'profile', 'info')}>

          {/* LEFT: Avatar */}
          <Avatar
            src={profileData.profile_image_url ? getMediaUrl(profileData.profile_image_url) : undefined}
            alt={profileData.username}
            sx={{
              width: 120, height: 120, flexShrink: 0,
              backgroundColor: theme.palette.secondary.main,
              [theme.breakpoints.down('sm')]: { width: 88, height: 88 },
            }}
            {...testIdProps('image', 'profile', 'avatar')}
          >
            {!profileData.profile_image_url && <PersonIcon style={{ fontSize: 56 }} />}
          </Avatar>

          {/* CENTER: Info */}
          <Box sx={{ flex: 1, minWidth: 0 }} {...testIdProps('section', 'profile', 'content')}>
            <Typography variant="h4" className={classes.userText} style={{ fontWeight: 700 }}
              {...testIdProps('text', 'profile', 'username')}>
              {profileData.username}
            </Typography>

            {profileData.tags && profileData.tags.length > 0 && (
              <Box style={{ marginTop: 8 }} {...testIdProps('section', 'profile', 'tags')}>
                <TagsOnProfile tags={profileData.tags} />
              </Box>
            )}

            {profileData.introduction && (
              <Typography variant="body1" style={{ marginTop: 10, fontStyle: 'italic', opacity: 0.85 }}
                {...testIdProps('text', 'profile', 'introduction-text')}>
                "{profileData.introduction}"
              </Typography>
            )}

            {/* Social Media Links */}
            {profileData.metadata?.socialMedia && (
              <Box mt={1.5} display="flex" gap={1} sx={{
                [theme.breakpoints.down('sm')]: { justifyContent: 'center' },
              }}>
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
                      size="small"
                      title={`${platform.name}: @${username}`}
                    >
                      <Icon />
                    </IconButton>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* RIGHT: Rating + Member since badges */}
          <Box sx={{
            display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, alignItems: 'flex-end',
            [theme.breakpoints.down('sm')]: { alignItems: 'center' },
          }}>
            {hasRating && (
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                padding: '6px 14px',
                ...glassCard(theme),
                borderRadius: '20px',
              }} {...testIdProps('section', 'profile', 'rating')}>
                <StarIcon style={{ color: theme.palette.warning.main, fontSize: 20 }} />
                <Typography variant="body1" style={{ fontWeight: 600 }}
                  {...testIdProps('text', 'profile', 'rating-value')}>
                  {profileData.seller_rating.toFixed(1)}
                </Typography>
                <Typography variant="body2" className={classes.staticText}>
                  ({profileData.seller_total_ratings})
                </Typography>
              </Box>
            )}

            {profileData.created_at && (
              <Typography variant="caption" className={classes.staticText}
                {...testIdProps('text', 'profile', 'member-since')}>
                Member since {new Date(profileData.created_at).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* ===== TWO-COLUMN BODY: Gallery + Published Items ===== */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: hasGallery ? '5fr 7fr' : '1fr',
          gap: 3,
          [theme.breakpoints.down('md')]: {
            gridTemplateColumns: '1fr',
          },
        }}>
          {/* Gallery */}
          {hasGallery && (
            <Paper elevation={0} sx={{ ...componentSpacing.card(theme), ...glassCard(theme) }}>
              <Typography variant="h6" gutterBottom>Gallery</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} sx={{
                [theme.breakpoints.down('sm')]: { gap: 1, justifyContent: 'center' }
              }}>
                {processMediaUrls(profileData.metadata.additional_images).map((imageUrl, index) => (
                  <ZoomableImage
                    key={index}
                    src={imageUrl}
                    alt={`Gallery ${index + 1}`}
                    style={{
                      width: 150, height: 150,
                      objectFit: 'cover', borderRadius: 4
                    }}
                    sx={{
                      [theme.breakpoints.down('sm')]: { width: 120, height: 120 }
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Published Items */}
          <Paper elevation={0} sx={{ ...componentSpacing.card(theme), ...glassCard(theme) }}>
            <Typography variant="h6" gutterBottom>Published Items</Typography>
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
          </Paper>
        </Box>
      </Grid>
    </Grid>
  );
};

export default UserProfile;
