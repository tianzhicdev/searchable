import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { CircularProgress, Box } from '@material-ui/core';
import WithdrawalDialog, { openWithdrawalDialog } from '../../components/WithdrawalDialog';
import { navigateBack } from '../../utils/navigationUtils';

const WithdrawalUSDT = () => {
  const history = useHistory();
  
  useEffect(() => {
    // Open the withdrawal dialog when component mounts
    openWithdrawalDialog();
    
    // Set up listener for dialog close to navigate back
    const checkDialogClosed = setInterval(() => {
      // Check if dialog is closed (this is a bit hacky but works)
      const dialogBackdrop = document.querySelector('.MuiBackdrop-root');
      if (!dialogBackdrop) {
        clearInterval(checkDialogClosed);
        navigateBack(history, '/dashboard');
      }
    }, 100);
    
    // Cleanup
    return () => clearInterval(checkDialogClosed);
  }, [history]);
  
  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
      <WithdrawalDialog />
    </>
  );
};

export default WithdrawalUSDT;