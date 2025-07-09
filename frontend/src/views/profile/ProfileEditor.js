import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, CircularProgress, Typography, Snackbar, Alert,
  Box, Avatar, IconButton, InputAdornment
} from '@material-ui/core';
import { PhotoCamera, Person } from '@material-ui/icons';
import Backend from '../utilities/Backend';
import { SET_USER } from '../../store/actions';
import useComponentStyles from '../../themes/componentStyles';
import ZoomableImage from '../../components/ZoomableImage';
import ImageUploader from '../../components/ImageUploader';
import TagSelector from '../../components/Tags/TagSelector';
import { SOCIAL_MEDIA_PLATFORMS, validateSocialMediaUrl } from '../../components/SocialMediaIcons';

// Singleton pattern to manage dialog state across components
const profileEditorState = {
  isOpen: false,
  openDialog: () => {},
  closeDialog: () => {}
};

const ProfileEditor = () => {
  const account = useSelector((state) => state.account);
  const dispatch = useDispatch();
  
  const [open, setOpen] = useState(false);
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
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Initialize the singleton functions
  useEffect(() => {
    profileEditorState.openDialog = () => setOpen(true);
    profileEditorState.closeDialog = () => setOpen(false);
    profileEditorState.isOpen = open;
  }, [open]);
  
  // Fetch profile data when dialog opens
  useEffect(() => {
    if (open && account.user?._id) {
      fetchProfileData();
    }
  }, [open, account.user, account.token]);
  
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
  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare the profile update data
      const updateData = {
        username: profileData.username,
        introduction: profileData.introduction,
        metadata: {}
      };

      // Include profile image URL if selected
      if (profileImage) {
        updateData.profile_image_url = profileImage;
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
      
      // Close dialog after short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setError(null);
    setOpen(false);
  };
  
  const handleSuccessClose = () => {
    setSuccess(false);
  };
  
  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile Information</DialogTitle>
        <DialogContent>
          {fetchLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <CircularProgress />
            </div>
          ) : (
            <>
              {/* Profile Image Section */}
              <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Profile Picture
                </Typography>
                <Box position="relative">
                  {profileImagePreview || profileData.profile_image_url ? (
                    <ZoomableImage 
                      src={profileImagePreview || profileData.profile_image_url} 
                      alt="Profile"
                      style={{ width: 100, height: 100, marginBottom: 8, borderRadius: '50%' }}
                    />
                  ) : (
                    <Avatar style={{ width: 100, height: 100, marginBottom: 8 }}>
                      <Person />
                    </Avatar>
                  )}
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-image-input"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="profile-image-input">
                    <IconButton
                      color="primary"
                      aria-label="upload picture"
                      component="span"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      <PhotoCamera />
                    </IconButton>
                  </label>
                </Box>
                {(profileImagePreview || profileData.profile_image_url) && (
                  <Button size="small" onClick={removeProfileImage} color="secondary">
                    Remove Image
                  </Button>
                )}
              </Box>

              {/* Introduction */}
              <TextField
                name="introduction"
                type="text"
                value={profileData.introduction}
                onChange={handleFormChange}
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                margin="normal"
                placeholder="Tell others about yourself..."
              />

              {/* User Tags Section */}
              <Box mt={3} mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Your Tags
                </Typography>
                <Typography variant="body2" color="textSecondary" style={{ marginBottom: 8 }}>
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
              <Box mt={3} mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Social Media Links
                </Typography>
                {SOCIAL_MEDIA_PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <TextField
                      key={platform.id}
                      name={platform.id}
                      type="text"
                      value={profileData.socialMedia[platform.id] || ''}
                      onChange={handleSocialMediaChange(platform.id)}
                      variant="outlined"
                      fullWidth
                      margin="normal"
                      placeholder={platform.name}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Icon /> {/* Color managed by theme override for MuiSvgIcon */}
                          </InputAdornment>
                        ),
                      }}
                      helperText={`Enter your ${platform.name} username (without @)`}
                    />
                  );
                })}
              </Box>

              {/* Additional Images Section */}
              <ImageUploader
                images={additionalImages}
                onImagesChange={handleAdditionalImagesChange}
                maxImages={10}
                title="Additional Images"
                description="Add up to 10 additional images to showcase in your profile"
                imageSize={100}
                onError={setError}
              />

              {error && (
                <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
                  {error}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            color="primary"
            disabled={loading || fetchLoading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
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
    </>
  );
};

// Export both the component and functions to control it
export default ProfileEditor;

// Export a function to open the profile editor from anywhere
export const openProfileEditor = () => {
  profileEditorState.openDialog();
}; 