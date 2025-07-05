import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { Alert } from '@material-ui/lab';
import ContentCopyIcon from '@material-ui/icons/FileCopy';
import RefreshIcon from '@material-ui/icons/Refresh';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import PendingIcon from '@material-ui/icons/Schedule';
import { useSnackbar } from 'notistack';
import backend from '../views/utilities/Backend';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  card: {
    marginBottom: theme.spacing(3),
  },
  inviteCodeInput: {
    '& input': {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      letterSpacing: '0.1em',
    },
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing(2),
  },
  buttonGroup: {
    display: 'flex',
    gap: theme.spacing(2),
  },
  alert: {
    marginBottom: theme.spacing(3),
  },
}));

const ReferralDashboard = () => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [stats, setStats] = useState({
    total_referrals: 0,
    qualified_referrals: 0,
    pending_referrals: 0,
    total_rewards_earned: 0,
    times_code_used: 0
  });
  const [referredUsers, setReferredUsers] = useState([]);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const response = await backend.get('v1/referral-stats');
      if (response.data.success) {
        setInviteCode(response.data.invite_code || '');
        setStats(response.data.stats);
        setReferredUsers(response.data.referred_users || []);
      }
    } catch (error) {
      enqueueSnackbar('Failed to fetch referral stats', { variant: 'error' });
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async () => {
    try {
      setGenerating(true);
      const response = await backend.post('v1/generate-invite-code');
      if (response.data.success) {
        setInviteCode(response.data.invite_code);
        enqueueSnackbar(response.data.message || 'Invite code generated successfully', { variant: 'success' });
        // Refresh stats to get the new code
        fetchReferralStats();
      } else {
        enqueueSnackbar(response.data.message || 'Failed to generate invite code', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to generate invite code', { variant: 'error' });
      console.error('Error generating invite code:', error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    enqueueSnackbar('Invite code copied to clipboard!', { variant: 'success' });
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/register?invite_code=${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    enqueueSnackbar('Invite link copied to clipboard!', { variant: 'success' });
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Referral Program
      </Typography>
      
      <Alert severity="info" className={classes.alert}>
        <Typography variant="body2">
          <strong>How it works:</strong> Share your invite code with friends. They get $5 when they sign up, 
          and you get $50 when they create their first listing!
        </Typography>
      </Alert>

      {/* Invite Code Section */}
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Invite Code
          </Typography>
          
          {inviteCode ? (
            <>
              <TextField
                value={inviteCode}
                fullWidth
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={copyToClipboard} edge="end">
                        <ContentCopyIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                className={classes.inviteCodeInput}
                style={{ marginBottom: 16 }}
              />
              <Box className={classes.buttonGroup}>
                <Button
                  variant="contained"
                  onClick={copyInviteLink}
                  startIcon={<ContentCopyIcon />}
                >
                  Copy Invite Link
                </Button>
                <Button
                  variant="outlined"
                  onClick={fetchReferralStats}
                  startIcon={<RefreshIcon />}
                >
                  Refresh Stats
                </Button>
              </Box>
            </>
          ) : (
            <Box>
              <Typography variant="body1" color="textSecondary" style={{ marginBottom: 16 }}>
                You don't have an invite code yet. Generate one to start referring friends!
              </Typography>
              <Button
                variant="contained"
                onClick={generateInviteCode}
                disabled={generating}
                startIcon={<PersonAddIcon />}
              >
                {generating ? 'Generating...' : 'Generate Invite Code'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Statistics Section */}
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Referral Statistics
          </Typography>
          
          <Box className={classes.statsGrid}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Total Referrals
              </Typography>
              <Typography variant="h4">
                {stats.total_referrals}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary">
                Qualified Referrals
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.qualified_referrals}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary">
                Pending Referrals
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending_referrals}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary">
                Total Rewards Earned
              </Typography>
              <Typography variant="h4" color="primary.main">
                ${stats.total_rewards_earned}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Referred Users Table */}
      {referredUsers.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Referrals
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reward</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {referredUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        {user.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user.has_searchable ? (
                          <Chip 
                            label="Has Listing" 
                            color="success" 
                            size="small"
                            icon={<CheckCircleIcon />}
                          />
                        ) : (
                          <Chip 
                            label="No Listing Yet" 
                            color="default" 
                            size="small"
                            icon={<PendingIcon />}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.reward_paid ? (
                          <Chip 
                            label="$50 Paid" 
                            color="success" 
                            size="small"
                            icon={<MonetizationOnIcon />}
                          />
                        ) : (
                          <Chip 
                            label="Pending" 
                            color="warning" 
                            size="small"
                            icon={<PendingIcon />}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReferralDashboard;