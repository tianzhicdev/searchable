import React from 'react';
import { 
  Paper, Typography, Box, Chip 
} from '@material-ui/core';
import { 
  CardGiftcard 
} from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';

const RewardComponent = ({ reward }) => {
  const classes = useComponentStyles();

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  const getRewardTypeDisplayName = (metadata) => {
    const type = metadata?.type || 'reward';
    switch (type) {
      case 'invite_code_reward':
        return 'Invite Code Bonus';
      default:
        return 'Reward';
    }
  };

  const getRewardDescription = (metadata) => {
    const type = metadata?.type || 'reward';
    switch (type) {
      case 'invite_code_reward':
        return `Used invite code: ${metadata?.invite_code || 'N/A'}`;
      default:
        return 'Platform reward';
    }
  };

  return (
    <Paper style={{ marginBottom: 16 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <CardGiftcard color="primary" />
            <Chip 
              label={getRewardTypeDisplayName(reward.metadata)}
              color="primary"
              size="small"
            />
          </Box>
          
          <Typography variant="h6" className={classes.staticText}>
            {formatCurrency(reward.amount)} {reward.currency.toUpperCase()}
          </Typography>
          
          <Typography variant="body2" className={classes.systemText}>
            {formatDate(reward.created_at)}
          </Typography>
          
          <Typography variant="body2" className={classes.systemText} style={{ marginTop: 4 }}>
            {getRewardDescription(reward.metadata)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default RewardComponent;