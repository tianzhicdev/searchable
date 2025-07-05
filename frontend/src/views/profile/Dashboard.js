import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles'; // Import shared component styles
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert,
  Menu, MenuItem, IconButton, Avatar, useTheme
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import PersonIcon from '@material-ui/icons/Person';
import axios from 'axios';
// import PaymentList from '../payments/PaymentList';
import ProfileEditor, { openProfileEditor } from './ProfileEditor';
import UserInvoices from './UserInvoices';
import backend from '../utilities/Backend';
import { formatDate } from '../utilities/Date';
import ZoomableImage from '../../components/ZoomableImage';
import { getMediaUrl, processMediaUrls } from '../../utils/mediaUtils';
import { SOCIAL_MEDIA_PLATFORMS, formatSocialMediaUrl } from '../../components/SocialMediaIcons';
import { navigateBack, navigateWithStack, getBackButtonText, debugNavigationStack } from '../../utils/navigationUtils';
import TagsOnProfile from '../../components/Tags/TagsOnProfile';
import DepositComponent from '../../components/Deposit/DepositComponent';

import ReferralDashboard from '../../components/ReferralDashboard';

const Dashboard = () => {
  const classes = useComponentStyles(); // Use shared component styles
  const theme = useTheme();
  const [balance, setBalance] = useState({ usd: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  
  // Add USDT withdrawal states
  const [usdtWithdrawDialogOpen, setUsdtWithdrawDialogOpen] = useState(false);
  const [usdtWithdrawalAddress, setUsdtWithdrawalAddress] = useState('');
  const [usdtWithdrawalAmount, setUsdtWithdrawalAmount] = useState('');
  const [usdtWithdrawalLoading, setUsdtWithdrawalLoading] = useState(false);
  const [usdtWithdrawalError, setUsdtWithdrawalError] = useState(null);
  
  // Add USDT deposit states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  const location = useLocation();
  
  useEffect(() => {
    fetchBalance();
    fetchProfileData();
    fetchUserProfile();
  }, [account.user, account.token]);
  
  const fetchBalance = async () => {
    if (!account.user || !account.user._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch balance directly from the balance endpoint
      const balanceResponse = await backend.get('balance');
      console.log("Balance response:", balanceResponse.data);
      
      // Update to store USD value from the response
      setBalance({
        usd: balanceResponse.data.balance?.usd || 0
      });
    } catch (err) {
      console.error('Error fetching user payment data:', err);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProfileData = async () => {
    if (!account.user || !account.user._id) return;
    
    setProfileLoading(true);
    
    try {
      // Terminal endpoint removed - profile data now comes from user_profile
      const response = await backend.get('v1/profile');
      
      console.log("Profile data response:", response.data);
      setProfileData(response.data.profile || {});
    } catch (err) {
      console.error('Error fetching user profile data:', err);
      // We don't set global error here to avoid affecting other components
      setProfileData({});
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!account.user || !account.user._id) return;
    
    try {
      const response = await backend.get('v1/profile');
      console.log("User profile response:", response.data);
      setUserProfile(response.data.profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Profile might not exist yet, which is fine
    }
  };
  
  const handleWithdrawalUSDTClick = () => {
    setUsdtWithdrawDialogOpen(true);
    setUsdtWithdrawalAddress('');
    setUsdtWithdrawalAmount('');
    setUsdtWithdrawalError(null);
  };
  
  const handleCloseSuccessMessage = () => {
    setWithdrawalSuccess(false);
  };
  
  const handleEditClick = () => {
    openProfileEditor();
    handleMenuClose();
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleCloseUsdtWithdrawDialog = () => {
    setUsdtWithdrawDialogOpen(false);
  };
  
  const handleUsdtAddressChange = (e) => {
    setUsdtWithdrawalAddress(e.target.value);
  };
  
  const handleUsdtAmountChange = (e) => {
    // Only allow numeric input with at most 2 decimal places
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setUsdtWithdrawalAmount(value);
    }
  };
  
  const handleSubmitUsdtWithdrawal = async () => {
    // Validate inputs
    if (!usdtWithdrawalAddress || usdtWithdrawalAddress.trim() === '') {
      setUsdtWithdrawalError('Please enter a valid withdrawal address');
      return;
    }
    
    if (!usdtWithdrawalAmount || parseFloat(usdtWithdrawalAmount) <= 0) {
      setUsdtWithdrawalError('Please enter a valid amount greater than 0');
      return;
    }
    
    if (parseFloat(usdtWithdrawalAmount) > balance.usd) {
      setUsdtWithdrawalError(`Insufficient funds. Available balance: $${balance.usd} USD`);
      return;
    }
    
    setUsdtWithdrawalLoading(true);
    setUsdtWithdrawalError(null);
    
    try {
      const response = await backend.post(
        'v1/withdrawal-usd',
        { 
          address: usdtWithdrawalAddress.trim(),
          amount: parseFloat(usdtWithdrawalAmount)
        }
      );
      
      console.log('USDT Withdrawal response:', response.data);
      setWithdrawalSuccess(true);
      setUsdtWithdrawDialogOpen(false);
      
      // Refresh balance after successful withdrawal
      fetchBalance();
      
    } catch (err) {
      console.error('Error processing USDT withdrawal:', err);
      
      // Handle error response
      if (err.response?.status === 400 && 
          err.response?.data?.error === "Insufficient funds") {
        const errorMsg = `Insufficient funds. Available balance: $${balance.usd} USD`;
        setUsdtWithdrawalError(errorMsg);
      } else {
        setUsdtWithdrawalError(err.response?.data?.message || 'Failed to process withdrawal. Please try again.');
      }
    } finally {
      setUsdtWithdrawalLoading(false);
    }
  };
  
  // Deposit functions
  const handleOpenDepositDialog = () => {
    setDepositDialogOpen(true);
  };
  
  const handleCloseDepositDialog = () => {
    setDepositDialogOpen(false);
  };

  const handleDepositCreated = (depositData) => {
    console.log('Deposit created from dashboard:', depositData);
    // Optionally refresh balance after deposit is created
    fetchBalance();
  };
  
  return (
    <Grid container className={classes.container}>
      {/* Header Section with updated styles */}
      <Grid item xs={12} className={classes.header} style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div>
          <Button 
            variant="contained" 
            className={classes.iconButton}
            onClick={() => {
              debugNavigationStack(location, 'Profile Page Navigation');
              navigateBack(history, '/search');
            }}
            title={getBackButtonText(location)}
          >
            <ArrowBackIcon />
          </Button>
        </div>
        <div>
          <Button 

            variant='contained'
            onClick={handleMenuOpen}
          >
            <MoreVertIcon />
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              handleMenuClose();
              navigateWithStack(history, `/profile/${account.user._id}`);
            }}>
              Profile Page
            </MenuItem>
            <MenuItem onClick={() => {
              handleMenuClose();
              navigateWithStack(history, '/my-downloads');
            }}>
              My Downloads
            </MenuItem>
            <MenuItem onClick={() => {
              handleMenuClose();
              handleOpenDepositDialog();
            }}>
              Deposit USDT
            </MenuItem>
            {balance.usd > 0 && !loading && (
              <MenuItem onClick={() => {
                handleMenuClose();
                handleWithdrawalUSDTClick();
              }}>
                Withdraw USDT
              </MenuItem>
            )}
            <MenuItem onClick={() => {
              handleMenuClose();
              handleEditClick();
            }}>
              Edit Profile
            </MenuItem>
          </Menu>
        </div>
      </Grid>
      
      {/* Personal Information Section */}
      <Grid item xs={12}>
        <Paper elevation={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" style={{ padding: 0, margin: 0 }}>
            <Typography variant="h6" className={classes.staticText}>
              Personal Information
            </Typography>
          </Box>

          {/* Profile Picture and Introduction */}
          {userProfile && (
            <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
              <Avatar 
                src={getMediaUrl(userProfile.profile_image_url)} 
                alt={userProfile.username}
              >
                {!userProfile.profile_image_url && <PersonIcon style={{ fontSize: 40 }} />}
              </Avatar>
              <Typography variant="body1"  className={classes.userText}>
              {account.user.username}
             </Typography>
                          {/* Display tags below username */}
             {userProfile?.tags && userProfile.tags.length > 0 && (
              <Box style={{ marginTop: 8 }}>
                <TagsOnProfile tags={userProfile.tags} />
              </Box>
            )}

              {userProfile.introduction && (
                <Typography variant="body2" align="center" style={{ marginTop: 8, fontStyle: 'italic' }}>
                  "{userProfile.introduction}"
                </Typography>
              )}

              {/* Social Media Links */}
              {userProfile.metadata?.socialMedia && (
                <Box mt={2} display="flex" gap={1} justifyContent="center">
                  {SOCIAL_MEDIA_PLATFORMS.map((platform) => {
                    const username = userProfile.metadata.socialMedia[platform.id];
                    if (!username) return null;
                    
                    const Icon = platform.icon;
                    const url = formatSocialMediaUrl(platform.id, username);
                    
                    return (
                      <IconButton
                        key={platform.id}
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        // Color managed by theme override for MuiSvgIcon
                        title={`${platform.name}: @${username}`}
                      >
                        <Icon />
                      </IconButton>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

          <Box>
            <Typography variant="body2"  className={classes.staticText}>
              Email:
            </Typography>
            <Typography variant="body1"  className={classes.userText}>
              {account.user.email}
            </Typography>
          </Box>
          
          {profileLoading ? (
            <CircularProgress size={18} />
          ) : profileData && (
            <>
            </>
          )}
          <Box>
            {loading ? (
              <CircularProgress size={18} />
            ) : error ? (
              <Typography variant="body1" color="error">{error}</Typography>
            ) : (
              <Box>
                <Typography variant="body2"  className={classes.staticText}>
                  Balance:
                </Typography>
                
                <Typography variant="body1"  className={classes.userText}>
                  ${balance.usd} USDT
                </Typography>
              </Box>
            )}
          </Box>

          {/* Additional Images Section */}
          {userProfile?.metadata?.additional_images && userProfile.metadata.additional_images.length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Gallery
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {processMediaUrls(userProfile.metadata.additional_images).map((imageUrl, index) => (
                  <ZoomableImage 
                    key={index}
                    src={imageUrl} 
                    alt={`Gallery ${index + 1}`}
                    style={{ 
                      width: 150, 
                      height: 150, 
                      objectFit: 'cover',
                      borderRadius: 4
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>
      
      {/* Invoice History Section */}
      <Grid item xs={12} style={{ padding: '4px' }}>
        <UserInvoices />
      </Grid>
      
      {/* Referral Program Section */}
      <Grid item xs={12} style={{ padding: '4px' }}>
        <ReferralDashboard />
      </Grid>
      
      {/* USDT Withdrawal Dialog */}
      <Dialog open={usdtWithdrawDialogOpen} onClose={handleCloseUsdtWithdrawDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Withdraw USDT</DialogTitle>
        <DialogContent>
          <TextField
            id="usdt-address"
            type="text"
            value={usdtWithdrawalAddress}
            onChange={handleUsdtAddressChange}
            placeholder="Enter Ethereum wallet address to receive USDT"
            variant="outlined"
            fullWidth
            margin="normal"
          />
          <TextField
            id="usdt-amount"
            type="text"
            value={usdtWithdrawalAmount}
            onChange={handleUsdtAmountChange}
            placeholder="Enter amount to withdraw"
            variant="outlined"
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: <Typography  style={{ marginRight: 8 }}>$</Typography>,
            }}
          />
          {usdtWithdrawalError && (
            <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
              {usdtWithdrawalError}
            </Typography>
          )}
          <Typography variant="body2" style={{ marginTop: 16 }}>
            Available balance: ${balance.usd} USD
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUsdtWithdrawDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitUsdtWithdrawal} 
            variant="contained"
            color="primary"
            disabled={usdtWithdrawalLoading}
          >
            {usdtWithdrawalLoading ? <CircularProgress size={24} /> : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Deposit Component */}
      <DepositComponent
        open={depositDialogOpen}
        onClose={handleCloseDepositDialog}
        onDepositCreated={handleDepositCreated}
        title="Create USDT Deposit"
        showInstructions={true}
      />
      
      {/* Success Message */}
      <Snackbar 
        open={withdrawalSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success">
          Withdrawal successful! Your funds have been sent.
        </Alert>
      </Snackbar>
      
      
      {/* ProfileEditor component now has no props */}
      <ProfileEditor />
    </Grid>
  );
};

export default Dashboard;