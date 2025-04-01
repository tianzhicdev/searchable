import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, CircularProgress, Typography, Snackbar, Alert
} from '@material-ui/core';
import axios from 'axios';
import configData from '../../config';
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
    address: account.user.address || '',
    tel: account.user.tel || ''
  });
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
      const response = await axios.get(`${configData.API_SERVER}v1/terminal`, {
        headers: { Authorization: `${account.token}` }
      });
      
      if (response.data) {
        setProfileData({
          address: response.data.address || '',
          tel: response.data.tel || ''
        });
      }
    } catch (err) {
      // 404 is acceptable - it just means the user hasn't set up their profile yet
      if (err.response && err.response.status === 404) {
        console.log('User profile not found, using default empty values');
      } else {
        console.error('Error fetching user profile data:', err);
        setError('Failed to load profile information');
      }
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
  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(
        `${configData.API_SERVER}v1/terminal`,
        profileData,
        {
          headers: {
            Authorization: `${account.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Check if the response is successful
      if (!response || !response.data || response.status !== 200) {
        throw new Error(response?.data?.message || 'Failed to update profile. Server returned an invalid response.');
      }
      
      // Check if the response contains the expected data
      if (!response.data.address && !response.data.tel) {
        console.warn('Profile update response missing expected fields:', response.data);
      }
      
      // Update Redux store with new profile data
      dispatch({
        type: SET_USER,
        payload: {
          ...account.user,
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
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
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
              <TextField
                name="address"
                placeholder="Address"
                type="text"
                value={profileData.address}
                onChange={handleFormChange}
                variant="outlined"
                fullWidth
                margin="normal"
              />
              <TextField
                name="tel"
                placeholder="Telephone"
                type="text"
                value={profileData.tel}
                onChange={handleFormChange}
                variant="outlined"
                fullWidth
                margin="normal"
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