import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CircularProgress, Box } from '@material-ui/core';
import DepositComponent from '../../components/Deposit/DepositComponent';
import { navigateBack } from '../../utils/navigationUtils';

const RefillUSDT = () => {
  const history = useHistory();
  const [open, setOpen] = useState(true);
  
  const handleClose = () => {
    setOpen(false);
    navigateBack(history, '/dashboard');
  };
  
  const handleDepositCreated = (depositData) => {
    console.log('Deposit created:', depositData);
    // The component will show the QR code and address automatically
  };
  
  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
      <DepositComponent
        open={open}
        onClose={handleClose}
        onDepositCreated={handleDepositCreated}
        title="Refill Balance with USDT"
        showInstructions={true}
      />
    </>
  );
};

export default RefillUSDT;