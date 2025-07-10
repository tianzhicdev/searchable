import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { 
  Grid, Typography, Button, Paper, Box, TextField, 
  CircularProgress, Alert, Snackbar, Avatar, InputAdornment
} from '@material-ui/core';
import { ArrowBack, PhotoCamera, Person } from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';
import { componentSpacing, spacing } from '../../utils/spacing';
import { useTheme } from '@material-ui/core/styles';
import Backend from '../utilities/Backend';
import { SET_USER } from '../../store/actions';
import ImageUploader from '../../components/ImageUploader';
import TagSelector from '../../components/Tags/TagSelector';
import { SOCIAL_MEDIA_PLATFORMS, validateSocialMediaUrl } from '../../components/SocialMediaIcons';
import { navigateBack, debugNavigationStack } from '../../utils/navigationUtils';
import { getMediaUrl } from '../../utils/mediaUtils';

const EditProfile = () => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const history = useHistory();
  const location = history.location;
  const account = useSelector((state) => state.account);
  const dispatch = useDispatch();
  
  const [profileData, setProfileData] = useState({
    username: account.user?.username || '',
    introduction: '',
    profile_image_url: '',
    additional_images: [],
    socialMedia: {
      instagram: '',
      x: '',
      youtube: ''
    }
  });
  const [userTags, setUserTags] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    fetchProfileData();
  }, []);
  
  const fetchProfileData = async () => {
    if (!account.user || !account.token) return;
    
    setLoading(true);
    
    try {
      let profileResponse;
      try {
        profileResponse = await Backend.get('v1/profile');
        const { profile } = profileResponse.data;
        
        setProfileData({
          username: profile.username || account.user.username || '',
          introduction: profile.introduction || '',
          profile_image_url: profile.profile_image_url || '',
          additional_images: profile.metadata?.additional_images || [],
          socialMedia: {
            instagram: profile.metadata?.socialMedia?.instagram || '',
            x: profile.metadata?.socialMedia?.x || '',
            youtube: profile.metadata?.socialMedia?.youtube || ''
          }
        });
        
        if (profile.profile_image_url) {
          setProfileImagePreview(getMediaUrl(profile.profile_image_url));
        }
        
        if (profile.metadata?.additional_images) {
          const imageData = profile.metadata.additional_images.map(uri => ({
            uri: uri,
            preview: getMediaUrl(uri)
          }));
          setAdditionalImages(imageData);
        }
        
      } catch (profileErr) {
        if (profileErr.response?.status === 404) {
          console.log('User profile not found, using defaults');
        } else {
          throw profileErr;
        }
      }
      
      try {
        const tagsResponse = await Backend.get(`v1/users/${account.user._id}/tags`);
        if (tagsResponse.data && tagsResponse.data.success) {
          setUserTags(tagsResponse.data.tags || []);
        }
      } catch (tagErr) {
        console.error('Error fetching user tags:', tagErr);
      }
      
    } catch (err) {
      console.error('Error fetching user profile data:', err);
      setError('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialMediaChange = (platform) => (e) => {
    const value = e.target.value;
    
    if (!validateSocialMediaUrl(platform, value)) {
      setError(`Invalid ${platform} username format`);
      return;
    }
    
    setError(null);
    setProfileData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }

      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (PNG, JPG, JPEG, GIF, or WEBP)');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAdditionalImagesChange = (images) => {
    setAdditionalImages(images);
  };
  
  const handleTagsChange = (newTags) => {
    setUserTags(newTags);
  };
  
  const handleSave = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      const uploadedImages = [];
      for (const img of additionalImages) {
        if (img.file) {
          const formData = new FormData();
          formData.append('file', img.file);
          const uploadResponse = await Backend.post('v1/file-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedImages.push(uploadResponse.data.file_uri);
        } else if (img.uri) {
          uploadedImages.push(img.uri);
        }
      }

      let profileImageUri = profileData.profile_image_url;
      if (profileImage) {
        const formData = new FormData();
        formData.append('file', profileImage);
        const uploadResponse = await Backend.post('v1/file-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        profileImageUri = uploadResponse.data.file_uri;
      }

      await Backend.post('v1/profile', {
        username: profileData.username,
        introduction: profileData.introduction,
        profile_image_url: profileImageUri,
        metadata: {
          additional_images: uploadedImages,
          socialMedia: profileData.socialMedia
        }
      });

      if (profileData.username !== account.user.username) {
        dispatch({
          type: SET_USER,
          payload: {
            ...account.user,
            username: profileData.username
          }
        });
      }

      await Backend.put(`v1/users/${account.user._id}/tags`, { tags: userTags });

      setSuccess(true);
      setTimeout(() => {
        handleBackClick();
      }, 2000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleBackClick = () => {
    debugNavigationStack(location, 'EditProfile Back Click');
    navigateBack(history, '/dashboard');
  };
  
  const handleCloseSuccess = () => {
    setSuccess(false);
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
          >
            <ArrowBack />
          </Button>
          <Typography variant="h5">Edit Profile</Typography>
        </Box>
      </Grid>
      
      {/* Main Content */}
      <Grid item xs={12} md={8} lg={6}>
        <Paper sx={componentSpacing.card(theme)}>
          <Box>
            {/* Profile Image */}
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar 
                src={profileImagePreview}
                sx={{ width: 100, height: 100, mb: 2 }}
              >
                {!profileImagePreview && <Person style={{ fontSize: 50 }} />}
              </Avatar>
              <Button
                variant="contained"
                component="label"
                startIcon={<PhotoCamera />}
              >
                Change Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
            </Box>

            {/* Username */}
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={profileData.username}
              onChange={handleFormChange}
              margin="normal"
              variant="outlined"
              disabled={submitting}
            />

            {/* Introduction */}
            <TextField
              fullWidth
              label="Introduction"
              name="introduction"
              value={profileData.introduction}
              onChange={handleFormChange}
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
              disabled={submitting}
            />

            {/* Tags */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <TagSelector
                value={userTags}
                onChange={handleTagsChange}
                disabled={submitting}
              />
            </Box>

            {/* Social Media */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Social Media
              </Typography>
              {SOCIAL_MEDIA_PLATFORMS.map((platform) => (
                <TextField
                  key={platform.id}
                  fullWidth
                  label={platform.name}
                  value={profileData.socialMedia[platform.id] || ''}
                  onChange={handleSocialMediaChange(platform.id)}
                  margin="normal"
                  variant="outlined"
                  disabled={submitting}
                  placeholder={platform.placeholder}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {platform.baseUrl.replace('https://', '')}
                      </InputAdornment>
                    ),
                  }}
                />
              ))}
            </Box>

            {/* Additional Images */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Gallery Images
              </Typography>
              <ImageUploader
                images={additionalImages}
                onChange={handleAdditionalImagesChange}
                maxImages={5}
                disabled={submitting}
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              gap: theme.spacing(2),
              mt: theme.spacing(3) 
            }}>
              <Button 
                onClick={handleBackClick}
                disabled={submitting}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                variant="contained"
                color="primary"
                disabled={submitting || loading}
              >
                {submitting ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Grid>
      
      {/* Success Message */}
      <Snackbar 
        open={success} 
        autoHideDuration={2000} 
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default EditProfile;