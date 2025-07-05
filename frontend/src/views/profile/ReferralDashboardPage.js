import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { 
  Grid, 
  Button,
  Typography
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ReferralDashboard from '../../components/ReferralDashboard';
import useComponentStyles from '../../themes/componentStyles';
import { navigateBack, debugNavigationStack } from '../../utils/navigationUtils';

const ReferralDashboardPage = () => {
  const classes = useComponentStyles();
  const history = useHistory();
  const location = useLocation();
  
  return (
    <Grid container className={classes.container}>
      {/* Header Section */}
      <Grid item xs={12} className={classes.header} style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            variant="contained" 
            className={classes.iconButton}
            onClick={() => {
              debugNavigationStack(location, 'Referral Dashboard Navigation');
              navigateBack(history, '/dashboard');
            }}
            title="Back to Dashboard"
          >
            <ArrowBackIcon />
          </Button>
          <Typography variant="h5" component="h1">
            Referral Program
          </Typography>
        </div>
      </Grid>
      
      {/* Referral Dashboard Content */}
      <Grid item xs={12}>
        <ReferralDashboard />
      </Grid>
    </Grid>
  );
};

export default ReferralDashboardPage;