import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Avatar,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme
} from '@material-ui/core';
import {
  PhotoCamera,
  Person
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import Backend from '../utilities/Backend';
import { SET_USER } from '../../store/actions';
import ZoomableImage from '../../components/ZoomableImage';
import ImageUploader from '../../components/ImageUploader';
import TagSelector from '../../components/Tags/TagSelector';
import { SOCIAL_MEDIA_PLATFORMS, validateSocialMediaUrl } from '../../components/SocialMediaIcons';
import { componentSpacing } from '../../utils/spacing';
import { navigateBack } from '../../utils/navigationUtils';
import PageHeaderButton from '../../components/Navigation/PageHeaderButton';

const useStyles = makeStyles((theme) => ({
  formContainer: {
    '& .MuiTextField-root': {
      marginBottom: theme.spacing(2)
    }
  },
  profileImageSection: {
    textAlign: 'center',
    marginBottom: theme.spacing(3)
  },
  profileImageContainer: {
    position: 'relative',
    display: 'inline-block'
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.primary.main,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    '&:hover': {
      backgroundColor: theme.palette.background.paper
    }
  },
  avatar: {
    width: 120,
    height: 120,
    margin: '0 auto'
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    objectFit: 'cover'
  }
}));

const EditProfile = () => {
  const classes = useComponentStyles();
  const styles = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const dispatch = useDispatch();
  const account = useSelector((state) => state.account);
  
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
  const [profileImageRemoved, setProfileImageRemoved] = useState(false);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  useEffect(() => {
    if (account.user?._id) {
      fetchProfileData();
    }
  }, [account.user, account.token]);
  
  const fetchProfileData = async () => {
    if (!account.user || !account.token) return;
    
    setFetchLoading(true);
    
    try {
      // Try to fetch the new profile data first
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
        
        // Set profile image preview if exists
        if (profile.profile_image_url) {
          setProfileImagePreview(profile.profile_image_url);
        }
        
        // Reset the removed flag when loading profile
        setProfileImageRemoved(false);
        setProfileImage(null);
        
        // Set additional images if exist
        if (profile.metadata?.additional_images) {
          const imageData = profile.metadata.additional_images.map(uri => ({
            uri: uri,
            preview: uri
          }));
          setAdditionalImages(imageData);
        }
        
      } catch (profileErr) {
        // If profile doesn't exist, use defaults
        if (profileErr.response?.status === 404) {
          console.log('User profile not found, using defaults');
          setProfileData({
            username: account.user.username || '',
            introduction: '',
            profile_image_url: '',
            additional_images: [],
            socialMedia: {
              instagram: '',
              x: '',
              youtube: ''
            }
          });
        } else {
          throw profileErr;
        }
      }
      
      // Fetch user tags
      try {
        const tagsResponse = await Backend.get(`v1/users/${account.user._id}/tags`);
        if (tagsResponse.data && tagsResponse.data.success) {
          setUserTags(tagsResponse.data.tags || []);
        }
      } catch (tagErr) {
        console.error('Error fetching user tags:', tagErr);
        // Don't fail the whole load if tags fail
      }
      
    } catch (err) {
      console.error('Error fetching user profile data:', err);
      setError('Failed to load profile information');
    } finally {
      setFetchLoading(false);
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
    
    // Validate the input
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
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (PNG, JPG, JPEG, GIF, or WEBP)');
        return;
      }

      setError(null);
      setLoading(true);

      try {
        // Upload image immediately to media endpoint
        const uploadResult = await uploadImageToMedia(file);
        
        // Store the media URI instead of the file
        setProfileImage(uploadResult.media_uri);
        
        // Reset the removed flag since a new image is being set
        setProfileImageRemoved(false);

        // Create preview URL for immediate display
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        setError('Failed to upload image. Please try again.');
        console.error('Profile image upload error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    setProfileImageRemoved(true);
    // Clear the current profile_image_url from profileData
    setProfileData(prev => ({
      ...prev,
      profile_image_url: ''
    }));
    // Clear the file input
    const fileInput = document.getElementById('profile-image-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Function to upload image to media endpoint immediately
  const uploadImageToMedia = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await Backend.post('v1/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        return {
          media_uri: response.data.media_uri,
          media_id: response.data.media_id
        };
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image to media:', error);
      throw error;
    }
  };

  const handleAdditionalImagesChange = (newImages) => {
    setAdditionalImages(newImages);
  };
  
  const handleTagsChange = (newTags) => {
    setUserTags(newTags);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmitError('');
    
    try {
      // Prepare the profile update data
      const updateData = {
        username: profileData.username,
        introduction: profileData.introduction,
        metadata: {}
      };

      // Handle profile image
      if (profileImage) {
        // New image was selected
        updateData.profile_image_url = profileImage;
      } else if (profileImageRemoved) {
        // User explicitly removed the profile image
        updateData.profile_image_url = '';
      } else if (profileData.profile_image_url) {
        // Keep existing image if not changed
        updateData.profile_image_url = profileData.profile_image_url;
      }

      // Include additional image URIs
      updateData.metadata.additional_images = additionalImages.map(img => img.uri);
      
      // Include social media links (only non-empty ones)
      const socialMediaData = {};
      Object.entries(profileData.socialMedia).forEach(([platform, username]) => {
        if (username && username.trim()) {
          socialMediaData[platform] = username.trim();
        }
      });
      
      if (Object.keys(socialMediaData).length > 0) {
        updateData.metadata.socialMedia = socialMediaData;
      }

      // Update the profile using the new API
      const response = await Backend.put('v1/profile', updateData);
      
      // Check if the response is successful
      if (!response || !response.data) {
        throw new Error('Failed to update profile. Server returned an invalid response.');
      }
      
      // Update user tags
      try {
        const tagIds = userTags.map(tag => tag.id);
        await Backend.post(`v1/users/${account.user._id}/tags`, {
          tag_ids: tagIds
        });
      } catch (tagError) {
        console.error('Failed to update user tags:', tagError);
        // Don't fail the whole operation if tags fail
      }
      
      // Update Redux store with new profile data
      dispatch({
        type: SET_USER,
        payload: {
          ...account.user,
          username: profileData.username
        }
      });
      
      setSuccess(true);
      
      // Navigate back after short delay
      setTimeout(() => {
        navigateBack(history, '/dashboard');
      }, 1500);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setSubmitError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccessClose = () => {
    setSuccess(false);
  };

  if (fetchLoading) {
    return (
      <Grid container sx={componentSpacing.pageContainer(theme)}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
          </Box>
        </Grid>
      </Grid>
    );
  }
  
  return (
    <Grid container sx={componentSpacing.pageContainer(theme)}>
      <Grid item xs={12} sx={componentSpacing.pageHeader(theme)}>
        <PageHeaderButton
          onClick={() => navigateBack(history, '/dashboard')}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper className={classes.paperNoBorder}>
          <Typography variant="h4" gutterBottom>
            Edit Profile Information
          </Typography>
          
          <form onSubmit={handleSubmit} className={styles.formContainer}>
            {/* Profile Image Section */}
            <Box className={styles.profileImageSection}>
              <Typography variant="h6" gutterBottom>
                Profile Picture
              </Typography>
              <Box className={styles.profileImageContainer}>
                {(profileImagePreview || profileData.profile_image_url) && !profileImageRemoved ? (
                  <ZoomableImage 
                    src={profileImagePreview || profileData.profile_image_url} 
                    alt="Profile"
                    className={styles.profileImage}
                  />
                ) : (
                  <Avatar className={styles.avatar}>
                    <Person style={{ fontSize: 60 }} />
                  </Avatar>
                )}
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-image-input"
                  data-testid="editprofile-input-image"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="profile-image-input">
                  <IconButton
                    id="editprofile-button-upload-image"
                    data-testid="editprofile-button-upload-image"
                    className={styles.uploadButton}
                    aria-label="upload picture"
                    component="span"
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
              </Box>
              {((profileImagePreview || profileData.profile_image_url) && !profileImageRemoved) && (
                <Box mt={1}>
                  <Button 
                    id="editprofile-button-remove-image"
                    data-testid="editprofile-button-remove-image"
                    size="small" 
                    onClick={removeProfileImage} 
                  >
                    Remove Image
                  </Button>
                </Box>
              )}
            </Box>

            {/* Introduction */}
            <TextField
              id="editprofile-input-introduction"
              data-testid="editprofile-input-introduction"
              name="introduction"
              label="Introduction"
              type="text"
              value={profileData.introduction}
              onChange={handleFormChange}
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              placeholder="Tell others about yourself..."
              helperText="Write a brief introduction about yourself"
            />

            {/* User Tags Section */}
            <Box mt={3} mb={3}>
              <Typography variant="h6" gutterBottom>
                Your Tags
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Add tags to help others find you (max 10 tags)
              </Typography>
              <TagSelector
                tagType="user"
                selectedTags={userTags}
                onTagsChange={handleTagsChange}
                maxTags={10}
                placeholder="Select tags that describe you..."
              />
            </Box>

            {/* Social Media Links Section */}
            <Box mt={3} mb={3}>
              <Typography variant="h6" gutterBottom>
                Social Media Links
              </Typography>
              {SOCIAL_MEDIA_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <TextField
                    id={`editprofile-input-social-${platform.id}`}
                    data-testid={`editprofile-input-social-${platform.id}`}
                    key={platform.id}
                    name={platform.id}
                    type="text"
                    value={profileData.socialMedia[platform.id] || ''}
                    onChange={handleSocialMediaChange(platform.id)}
                    variant="outlined"
                    fullWidth
                    placeholder={platform.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon />
                        </InputAdornment>
                      ),
                    }}
                    helperText={`Enter your ${platform.name} username (without @)`}
                  />
                );
              })}
            </Box>

            {/* Additional Images Section */}
            <Box mt={3} mb={3}>
              <ImageUploader
                images={additionalImages}
                onImagesChange={handleAdditionalImagesChange}
                maxImages={10}
                title="Additional Images"
                description="Add up to 10 additional images to showcase in your profile"
                imageSize={120}
                onError={setError}
              />
            </Box>

            {/* Error Display */}
            {(error || submitError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || submitError}
              </Alert>
            )}

            {/* Submit Button */}
            <Box display="flex" gap={2} mt={3}>
              <Button
                id="editprofile-button-submit"
                data-testid="editprofile-button-submit"
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
                size="large"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Grid>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSuccessClose} severity="success">
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default EditProfile;