import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { profileUser, cursorArrowGradient, browserWindowsOk, coinDollar } from '../assets/images/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import OnboardingAuth from './OnboardingAuth';
import { LOGOUT } from '../store/actions';

const useStyles = makeStyles((theme) => ({
  optionsContainer: {
    marginTop: theme.spacing(3),
  },
  optionButton: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    justifyContent: 'flex-start',
    textAlign: 'left',
    textTransform: 'none',
  },
  optionIcon: {
    marginRight: theme.spacing(2),
  },
  userInfo: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  divider: {
    margin: theme.spacing(3, 0),
  }
}));

const OnboardingAuthWithLoggedInState = ({ 
  onSuccess, 
  submitButtonText = "Continue",
  submitButtonIcon = null,
  contextText = "",
  redirectPath = null
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const account = useSelector((state) => state.account);
  const { isLoggedIn, user } = account;
  
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [forceLogin, setForceLogin] = useState(false);

  // Check if user is logged in
  if (!isLoggedIn || showAuthForm) {
    return (
      <OnboardingAuth
        onSuccess={onSuccess}
        submitButtonText={submitButtonText}
        submitButtonIcon={submitButtonIcon}
        contextText={contextText}
      />
    );
  }

  const handleOpenStore = async () => {
    // Call the onSuccess callback with the current user data
    if (onSuccess) {
      onSuccess(user);
    }
  };

  const handleLoginAnother = () => {
    // First logout the current user
    dispatch({ type: LOGOUT });
    localStorage.removeItem('token');
    localStorage.removeItem('userPreferences');
    
    // Show the auth form for new login
    setForceLogin(true);
    setShowAuthForm(true);
  };

  const handleRegisterNew = () => {
    // First logout the current user
    dispatch({ type: LOGOUT });
    localStorage.removeItem('token');
    localStorage.removeItem('userPreferences');
    
    // Show the auth form for registration
    setForceLogin(false);
    setShowAuthForm(true);
  };

  // Determine the appropriate icon based on context
  const getContextIcon = () => {
    if (submitButtonIcon) return submitButtonIcon;
    if (contextText.includes('store')) return <img src={browserWindowsOk} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />;
    if (contextText.includes('payment')) return <img src={coinDollar} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />;
    return <img src={profileUser} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />;
  };

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Welcome Back!
      </Typography>
      
      <Box className={classes.userInfo}>
        <Typography variant="body1" color="textSecondary">
          You're currently logged in as:
        </Typography>
        <Typography variant="h6">
          {user?.username || user?.email}
        </Typography>
      </Box>

      <Typography variant="h6" color="textSecondary" gutterBottom>
        What would you like to do?
      </Typography>

      <Box className={classes.optionsContainer}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          className={classes.optionButton}
          onClick={handleOpenStore}
          startIcon={getContextIcon()}
        >
          <Box>
            <Typography variant="button" display="block">
              {submitButtonText.replace('...', '')} as {user?.username || user?.email}
            </Typography>
            <Typography variant="caption" color="primary">
              Continue with your current account
            </Typography>
          </Box>
        </Button>

        <Button
          variant="outlined"
          color="primary"
          size="large"
          fullWidth
          className={classes.optionButton}
          onClick={handleLoginAnother}
          startIcon={<img src={cursorArrowGradient} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} className={classes.optionIcon} />}
        >
          <Box>
            <Typography variant="button" display="block">
              Login with Another Account
            </Typography>
            <Typography variant="caption" color="primary">
              Switch to a different existing account
            </Typography>
          </Box>
        </Button>

        <Button
          variant="outlined"
          color="primary"
          size="large"
          fullWidth
          className={classes.optionButton}
          onClick={handleRegisterNew}
          startIcon={<img src={profileUser} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} className={classes.optionIcon} />}
        >
          <Box>
            <Typography variant="button" display="block">
              Register New Account
            </Typography>
            <Typography variant="caption" color="primary">
              Create a completely new account
            </Typography>
          </Box>
        </Button>
      </Box>
    </Box>
  );
};

export default OnboardingAuthWithLoggedInState;