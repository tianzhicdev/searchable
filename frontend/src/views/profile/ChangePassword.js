import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CircularProgress, Box, Snackbar, Alert } from '@material-ui/core';
import ChangePasswordDialog from '../../components/Auth/ChangePasswordDialog';
import { navigateBack } from '../../utils/navigationUtils';

const ChangePassword = () => {
  const history = useHistory();
  const [open, setOpen] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleClose = () => {
    setOpen(false);
    navigateBack(history, '/dashboard');
  };
  
  const handleSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setOpen(false);
    
    // Navigate back after showing success
    setTimeout(() => {
      navigateBack(history, '/dashboard');
    }, 2000);
  };
  
  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };
  
  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
      <ChangePasswordDialog
        open={open}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ChangePassword;