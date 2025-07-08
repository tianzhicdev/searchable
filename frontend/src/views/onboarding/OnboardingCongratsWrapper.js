import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import OnboardingCongrats from './OnboardingCongrats';
import { CircularProgress, Box } from '@material-ui/core';

const OnboardingCongratsWrapper = () => {
  const history = useHistory();
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    // Get success data from sessionStorage
    const savedData = sessionStorage.getItem('onboarding_success');
    
    if (!savedData) {
      // No success data, redirect to home
      history.push('/');
      return;
    }
    
    const data = JSON.parse(savedData);
    setSuccessData(data);
    
    // Clear the success data so it's not shown again
    sessionStorage.removeItem('onboarding_success');
  }, [history]);

  if (!successData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <OnboardingCongrats
      type={successData.type}
      storeName={successData.storeName}
      redirectPath={successData.redirectPath}
    />
  );
};

export default OnboardingCongratsWrapper;