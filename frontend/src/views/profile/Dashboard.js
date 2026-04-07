import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import useComponentStyles from '../../themes/componentStyles';
import { componentSpacing } from '../../utils/spacing';
import {
  Grid, Typography, Paper, Box, CircularProgress,
  Snackbar, Alert, Button,
  IconButton, Avatar, useTheme
} from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import EditIcon from '@material-ui/icons/Edit';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import UserInvoices from './UserInvoices';
import backend from '../utilities/Backend';
import ZoomableImage from '../../components/ZoomableImage';
import { getMediaUrl, processMediaUrls } from '../../utils/mediaUtils';
import { SOCIAL_MEDIA_PLATFORMS, formatSocialMediaUrl } from '../../components/SocialMediaIcons';
import { navigateBack, debugNavigationStack } from '../../utils/navigationUtils';
import PageHeaderButton from '../../components/Navigation/PageHeaderButton';
import TagsOnProfile from '../../components/Tags/TagsOnProfile';
import RefillBalanceDialog from '../../components/Payment/RefillBalanceDialog';
import WithdrawalDialog, { openWithdrawalDialog } from '../../components/WithdrawalDialog';
import { testIdProps } from '../../utils/testIds';
import DecorativeIcons from '../../components/DecorativeIcons';
import { progressBarHalf, coinDollar, smileyWinking } from '../../assets/images/icons';

const dashboardIcons = [
  { src: progressBarHalf, alt: 'progress', top: '5%', right: '3%', size: 36, opacity: 0.1, animation: 'float' },
  { src: coinDollar, alt: 'coin', top: '30%', left: '2%', size: 32, opacity: 0.08, animation: 'pulse' },
  { src: smileyWinking, alt: 'smiley', bottom: '15%', right: '4%', size: 30, opacity: 0.1, animation: 'float' },
];

// Glass card style helper
const glassCard = (theme) => ({
  background: `${theme.palette.background.paper}B3`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${theme.palette.divider || 'rgba(167,139,250,0.2)'}`,
  borderRadius: '12px',
  boxShadow: 'none',
});

const Dashboard = () => {
  const classes = useComponentStyles();
  const theme = useTheme();
  const [balance, setBalance] = useState({ usd: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [refillDialogOpen, setRefillDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const account = useSelector((state) => state.account);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    fetchBalance();
    fetchUserProfile();
  }, []);

  const fetchBalance = async () => {
    if (!account.user || !account.user._id) return;
    setLoading(true);
    setError(null);
    try {
      const balanceResponse = await backend.get('balance');
      setBalance({ usd: balanceResponse.data.balance?.usd || 0 });
    } catch (err) {
      console.error('Error fetching user payment data:', err);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!account.user || !account.user._id) return;
    try {
      const response = await backend.get('v1/profile');
      setUserProfile(response.data.profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleWithdrawalUSDTClick = () => {
    openWithdrawalDialog();
  };

  const handleCloseSuccessMessage = () => {
    setWithdrawalSuccess(false);
  };

  const handleEditClick = () => {
    history.push('/edit-profile');
  };

  const handleCloseRefillDialog = () => {
    setRefillDialogOpen(false);
    fetchBalance();
  };

  const hasGallery = userProfile?.metadata?.additional_images && userProfile.metadata.additional_images.length > 0;

  return (
    <Grid container sx={{ ...componentSpacing.pageContainer(theme), position: 'relative' }}>
      <DecorativeIcons icons={dashboardIcons} />

      {/* Back Button */}
      <Grid item xs={12} sx={componentSpacing.pageHeader(theme)}>
        <PageHeaderButton
          onClick={() => {
            debugNavigationStack(location, 'Profile Page Navigation');
            navigateBack(history, '/search');
          }}
        />
      </Grid>

      {/* ===== PROFILE HEADER — horizontal glass card ===== */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{
          ...componentSpacing.card(theme),
          ...glassCard(theme),
          display: 'flex',
          gap: 3,
          alignItems: 'center',
          [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
            textAlign: 'center',
            gap: 2,
          },
        }}>
          {/* LEFT: Avatar */}
          {userProfile && (
            <Avatar
              src={getMediaUrl(userProfile.profile_image_url)}
              alt={userProfile.username}
              sx={{
                width: 96, height: 96, flexShrink: 0,
                [theme.breakpoints.down('sm')]: { width: 72, height: 72 },
              }}
            >
              {!userProfile.profile_image_url && <PersonIcon style={{ fontSize: 48 }} />}
            </Avatar>
          )}

          {/* CENTER: Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" className={classes.userText} style={{ fontWeight: 600 }}>
              {account.user.username}
            </Typography>
            <Typography variant="body2" className={classes.staticText} style={{ marginTop: 2 }}>
              {account.user.email}
            </Typography>

            {userProfile?.tags && userProfile.tags.length > 0 && (
              <Box style={{ marginTop: 8 }}>
                <TagsOnProfile tags={userProfile.tags} />
              </Box>
            )}

            {userProfile?.introduction && (
              <Typography variant="body2" style={{ marginTop: 8, fontStyle: 'italic' }}>
                "{userProfile.introduction}"
              </Typography>
            )}

            {/* Social Media Links */}
            {userProfile?.metadata?.socialMedia && (
              <Box mt={1} display="flex" gap={1} sx={{
                [theme.breakpoints.down('sm')]: { justifyContent: 'center' },
              }}>
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
                      size="small"
                      title={`${platform.name}: @${username}`}
                    >
                      <Icon />
                    </IconButton>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* RIGHT: Action buttons */}
          <Box sx={{
            display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0,
            [theme.breakpoints.down('sm')]: {
              flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
            },
          }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleEditClick}
              {...testIdProps('button', 'dashboard', 'edit-profile')}
            >
              Edit Profile
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AccountBalanceWalletIcon />}
              onClick={handleWithdrawalUSDTClick}
              {...testIdProps('button', 'dashboard', 'withdraw')}
            >
              Withdraw
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setRefillDialogOpen(true)}
              {...testIdProps('button', 'dashboard', 'refill')}
            >
              Refill
            </Button>
          </Box>
        </Paper>
      </Grid>

      {/* ===== STAT CARDS ROW ===== */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: '1fr',
          },
        }}>
          {/* Balance Card */}
          <Paper elevation={0} sx={{ ...componentSpacing.card(theme), ...glassCard(theme) }}>
            <Typography variant="caption" className={classes.staticText}>Balance</Typography>
            {loading ? (
              <CircularProgress size={18} />
            ) : error ? (
              <Typography variant="body1" color="error">{error}</Typography>
            ) : (
              <Typography variant="h5" className={classes.userText} style={{ fontWeight: 700 }}>
                ${balance.usd} USDT
              </Typography>
            )}
          </Paper>

          {/* Email Card */}
          <Paper elevation={0} sx={{ ...componentSpacing.card(theme), ...glassCard(theme) }}>
            <Typography variant="caption" className={classes.staticText}>Email</Typography>
            <Typography variant="body1" className={classes.userText} style={{
              wordBreak: 'break-all', fontWeight: 500
            }}>
              {account.user.email}
            </Typography>
          </Paper>

          {/* Member Card */}
          <Paper elevation={0} sx={{ ...componentSpacing.card(theme), ...glassCard(theme) }}>
            <Typography variant="caption" className={classes.staticText}>Member</Typography>
            <Typography variant="body1" className={classes.userText} style={{ fontWeight: 500 }}>
              {account.user.username}
            </Typography>
          </Paper>
        </Box>
      </Grid>

      {/* ===== TWO-COLUMN BODY: Gallery + Invoices ===== */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Gallery — Left column (or full width if no gallery) */}
          {hasGallery && (
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ ...componentSpacing.card(theme), ...glassCard(theme) }}>
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
              </Paper>
            </Grid>
          )}

          {/* Invoices — Right column (or full width if no gallery) */}
          <Grid item xs={12} md={hasGallery ? 5 : 12}>
            <Paper elevation={0} sx={{ ...componentSpacing.card(theme), ...glassCard(theme) }}>
              <UserInvoices />
            </Paper>
          </Grid>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <WithdrawalDialog />
      <RefillBalanceDialog
        open={refillDialogOpen}
        onClose={handleCloseRefillDialog}
        currentBalance={balance.usd || 0}
        requiredAmount={0}
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
    </Grid>
  );
};

export default Dashboard;
