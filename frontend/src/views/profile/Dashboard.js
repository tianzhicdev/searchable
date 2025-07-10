import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles'; // Import shared component styles
import { componentSpacing, responsivePadding, spacing } from '../../utils/spacing';
import { makeStyles } from '@material-ui/styles';
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
import RefillBalanceDialog from '../../components/Payment/RefillBalanceDialog';
import ChangePasswordDialog from '../../components/Auth/ChangePasswordDialog';
import AIContentStatus from '../../components/AIContentStatus';

const useStyles = makeStyles((theme) => ({
  dialogContent: componentSpacing.dialog(theme),
  button: componentSpacing.button(theme),
  dialog: {
    '& .MuiDialog-paper': {
      [theme.breakpoints.down('sm')]: {
        margin: theme.spacing(2),
        maxHeight: '90vh'
      }
    }
  }
}));

const Dashboard = () => {
  const classes = useComponentStyles(); // Use shared component styles
  const styles = useStyles();
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
  
  // Add refill balance dialog state
  const [refillDialogOpen, setRefillDialogOpen] = useState(false);
  
  // Add change password dialog state
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  const location = useLocation();
  
  // Parse view parameter from URL
  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view') || 'overview'; // default to overview
  
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
  
  // Refill balance functions
  const handleCloseRefillDialog = () => {
    setRefillDialogOpen(false);
    // Refresh balance when dialog closes
    fetchBalance();
  };
  
  const handleChangePasswordClick = () => {
    setChangePasswordDialogOpen(true);
    handleMenuClose();
  };
  
  const handleCloseChangePasswordDialog = () => {
    setChangePasswordDialogOpen(false);
  };
  
  const handlePasswordChangeSuccess = (message) => {
    setSuccessMessage(message);
    setWithdrawalSuccess(true); // Reuse existing success message system
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
              setRefillDialogOpen(true);
            }}>
              Refill Balance
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
            <MenuItem onClick={handleChangePasswordClick}>
              Change Password
            </MenuItem>
          </Menu>
        </div>
      </Grid>
      
      {/* Personal Information Section */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={componentSpacing.card(theme)}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                sx={{ width: 80, height: 80, mb: 2 }}
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

          <Box sx={{ mb: theme.spacing(spacing.element.md), [theme.breakpoints.down('sm')]: { mb: theme.spacing(spacing.element.xs) } }}>
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
          <Box sx={{ mb: theme.spacing(spacing.element.md), [theme.breakpoints.down('sm')]: { mb: theme.spacing(spacing.element.xs) } }}>
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
            <Box sx={{ mt: theme.spacing(spacing.section.md), [theme.breakpoints.down('sm')]: { mt: theme.spacing(spacing.section.xs) } }}>
              <Typography variant="h6" gutterBottom>
                Gallery
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2} sx={{ 
                [theme.breakpoints.down('sm')]: { 
                  gap: 1,
                  justifyContent: 'center' 
                } 
              }}>
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
                    sx={{
                      [theme.breakpoints.down('sm')]: {
                        width: 120,
                        height: 120
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>
      
      {/* AI Content Status Section */}
      <Grid item xs={12} sx={{ 
        p: theme.spacing(0.5), 
        mt: theme.spacing(spacing.element.md),
        [theme.breakpoints.down('sm')]: { 
          p: theme.spacing(0.25),
          mt: theme.spacing(spacing.element.xs)
        } 
      }}>
        <AIContentStatus />
      </Grid>
      
      {/* Invoice History Section with view parameter */}
      <Grid item xs={12} sx={{ 
        p: theme.spacing(0.5), 
        mt: theme.spacing(spacing.element.md),
        [theme.breakpoints.down('sm')]: { 
          p: theme.spacing(0.25),
          mt: theme.spacing(spacing.element.xs)
        } 
      }}>
        <UserInvoices />
      </Grid>
      
      {/* USDT Withdrawal Dialog */}
      <Dialog open={usdtWithdrawDialogOpen} onClose={handleCloseUsdtWithdrawDialog} maxWidth="sm" fullWidth className={styles.dialog}>
        <DialogTitle>Withdraw USDT</DialogTitle>
        <DialogContent className={styles.dialogContent}>
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
          <Button onClick={handleCloseUsdtWithdrawDialog} className={styles.button}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitUsdtWithdrawal} 
            variant="contained"
            color="primary"
            disabled={usdtWithdrawalLoading}
            className={styles.button}
          >
            {usdtWithdrawalLoading ? <CircularProgress size={24} /> : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Refill Balance Dialog */}
      <RefillBalanceDialog
        open={refillDialogOpen}
        onClose={handleCloseRefillDialog}
        currentBalance={balance.usd || 0}
        requiredAmount={0}
      />
      
      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={handleCloseChangePasswordDialog}
        onSuccess={handlePasswordChangeSuccess}
      />
      
      {/* Success Message */}
      <Snackbar 
        open={withdrawalSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success">
          {successMessage || 'Withdrawal successful! Your funds have been sent.'}
        </Alert>
      </Snackbar>
      
      
      {/* ProfileEditor component now has no props */}
      <ProfileEditor />
    </Grid>
  );
};

export default Dashboard;