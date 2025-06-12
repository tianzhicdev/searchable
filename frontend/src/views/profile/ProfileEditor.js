import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, CircularProgress, Typography, Snackbar, Alert,
  Box, Avatar, IconButton
} from '@material-ui/core';
import { PhotoCamera, Person, Delete as DeleteIcon, AddPhotoAlternate as AddPhotoAlternateIcon } from '@material-ui/icons';
import Backend from '../utilities/Backend';
import { SET_USER } from '../../store/actions';
import useComponentStyles from '../../themes/componentStyles';
import ZoomableImage from '../../components/ZoomableImage';

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
    address: account.user?.address || '',
    tel: account.user?.tel || '',
    additional_images: []
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
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
          address: account.user.address || '',
          tel: account.user.tel || '',
          additional_images: profile.metadata?.additional_images || []
        });
        
        // Set profile image preview if exists
        if (profile.profile_image_url) {
          setProfileImagePreview(profile.profile_image_url);
        }
        
        // Set additional image previews if exist
        if (profile.metadata?.additional_images) {
          setAdditionalImagePreviews(profile.metadata.additional_images);
        }
        
      } catch (profileErr) {
        // If profile doesn't exist, try to get terminal data for address/tel
        if (profileErr.response?.status === 404) {
          console.log('User profile not found, trying terminal data...');
          
          try {
            const terminalResponse = await Backend.get('v1/terminal');
            
            setProfileData({
              username: account.user.username || '',
              introduction: '',
              profile_image_url: '',
              address: terminalResponse.data.address || '',
              tel: terminalResponse.data.tel || '',
              additional_images: []
            });
          } catch (terminalErr) {
            console.log('Terminal data not found, using defaults');
            setProfileData({
              username: account.user.username || '',
              introduction: '',
              profile_image_url: '',
              address: '',
              tel: '',
              additional_images: []
            });
          }
        } else {
          throw profileErr;
        }
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

  const handleAdditionalImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    const newImageUris = [];
    const newPreviews = [];
    
    setLoading(true);
    
    for (const file of files) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        continue;
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select valid image files (PNG, JPG, JPEG, GIF, or WEBP)');
        continue;
      }

      try {
        // Upload image immediately to media endpoint
        const uploadResult = await uploadImageToMedia(file);
        newImageUris.push(uploadResult.media_uri);

        // Create preview for immediate display
        const reader = new FileReader();
        const preview = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newPreviews.push(preview);
      } catch (error) {
        setError('Failed to upload one or more images. Please try again.');
        console.error('Additional image upload error:', error);
      }
    }

    if (newImageUris.length > 0) {
      setError(null);
      setAdditionalImages([...additionalImages, ...newImageUris]);
      setAdditionalImagePreviews([...additionalImagePreviews, ...newPreviews]);
    }
    
    setLoading(false);
  };

  const removeAdditionalImage = (index) => {
    const newImages = [...additionalImages];
    const newPreviews = [...additionalImagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setAdditionalImages(newImages);
    setAdditionalImagePreviews(newPreviews);
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

      // Include profile image URI if selected
      if (profileImage) {
        updateData.profile_image_uri = profileImage;
      }

      // Include additional image URIs
      updateData.metadata.additional_images = additionalImages;

      // Update the profile using the new API
      const response = await Backend.put('v1/profile', updateData);
      
      // Check if the response is successful
      if (!response || !response.data) {
        throw new Error('Failed to update profile. Server returned an invalid response.');
      }
      
      // Update terminal data if address/tel changed
      if (profileData.address !== account.user.address || profileData.tel !== account.user.tel) {
        try {
          await Backend.put('v1/terminal', {
            address: profileData.address,
            tel: profileData.tel
          });
        } catch (terminalErr) {
          console.warn('Failed to update terminal data:', terminalErr);
          // Don't fail the whole operation for this
        }
      }
      
      // Update Redux store with new profile data
      dispatch({
        type: SET_USER,
        payload: {
          ...account.user,
          username: profileData.username,
          address: profileData.address,
          tel: profileData.tel
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
                label="Introduction"
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

              {/* Additional Images Section */}
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Additional Images
                </Typography>
                <Typography variant="caption" color="textSecondary" gutterBottom>
                  Add up to 10 additional images to showcase in your profile
                </Typography>
                
                <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                  {additionalImagePreviews.map((preview, index) => (
                    <Box key={index} position="relative">
                      <ZoomableImage 
                        src={preview} 
                        alt={`Additional ${index + 1}`}
                        style={{ width: 100, height: 100, objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeAdditionalImage(index)}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  
                  {additionalImagePreviews.length < 10 && (
                    <Box>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="additional-images-input"
                        type="file"
                        multiple
                        onChange={handleAdditionalImagesChange}
                      />
                      <label htmlFor="additional-images-input">
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          style={{
                            width: 100,
                            height: 100,
                            border: '2px dashed #ccc',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <IconButton component="span">
                            <AddPhotoAlternateIcon />
                          </IconButton>
                        </Box>
                      </label>
                    </Box>
                  )}
                </Box>
              </Box>

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