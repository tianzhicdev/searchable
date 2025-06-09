import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, CircularProgress, Typography, Snackbar, Alert,
  Box, Avatar, IconButton
} from '@material-ui/core';
import { PhotoCamera, Person } from '@material-ui/icons';
import Backend from '../utilities/Backend';
import { SET_USER } from '../../store/actions';
import useComponentStyles from '../../themes/componentStyles';

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
    tel: account.user?.tel || ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
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
          tel: account.user.tel || ''
        });
        
        // Set profile image preview if exists
        if (profile.profile_image_url) {
          setProfileImagePreview(profile.profile_image_url);
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
              tel: terminalResponse.data.tel || ''
            });
          } catch (terminalErr) {
            console.log('Terminal data not found, using defaults');
            setProfileData({
              username: account.user.username || '',
              introduction: '',
              profile_image_url: '',
              address: '',
              tel: ''
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

  const handleImageChange = (e) => {
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
      setProfileImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
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
  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare the profile update data
      const updateData = {
        username: profileData.username,
        introduction: profileData.introduction
      };

      // Convert image to base64 if a new image was selected
      if (profileImage) {
        const reader = new FileReader();
        const imageBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(profileImage);
        });
        updateData.profile_image = imageBase64;
      }

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
                  <Avatar 
                    src={profileImagePreview || profileData.profile_image_url} 
                    style={{ width: 100, height: 100, marginBottom: 8 }}
                  >
                    {!profileImagePreview && !profileData.profile_image_url && <Person />}
                  </Avatar>
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

              {/* Username */}
              <TextField
                name="username"
                label="Username"
                type="text"
                value={profileData.username}
                onChange={handleFormChange}
                variant="outlined"
                fullWidth
                margin="normal"
                disabled // Username changes might require additional validation
              />

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

              {/* Address */}
              <TextField
                name="address"
                label="Address"
                type="text"
                value={profileData.address}
                onChange={handleFormChange}
                variant="outlined"
                fullWidth
                margin="normal"
                placeholder="Your address (for deliveries)"
              />

              {/* Telephone */}
              <TextField
                name="tel"
                label="Telephone"
                type="text"
                value={profileData.tel}
                onChange={handleFormChange}
                variant="outlined"
                fullWidth
                margin="normal"
                placeholder="Your phone number"
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