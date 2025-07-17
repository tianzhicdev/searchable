import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  TextField,
  InputAdornment
} from '@material-ui/core';
import { ArrowBack, AttachMoney } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    padding: theme.spacing(4),
    position: 'relative',
    boxShadow: 'none !important',
    border: 'none !important',
    background: 'transparent !important',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
  form: {
    marginTop: theme.spacing(3),
  },
  nextButton: {
    marginTop: theme.spacing(4),
    padding: theme.spacing(1.5),
  },
  previewBox: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    textAlign: 'center',
    boxShadow: 'none !important',
    border: 'none !important',
  }
}));

const Onboarding5 = () => {
  const classes = useStyles();
  const history = useHistory();
  
  const [title, setTitle] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('9.99');
  const [error, setError] = useState('');

  const handleBack = () => {
    history.push('/onboarding-2');
  };

  const handleNext = () => {
    if (!title) {
      setError('Please enter a title for your donation page');
      return;
    }
    if (!defaultAmount || parseFloat(defaultAmount) <= 0) {
      setError('Please enter a valid donation amount');
      return;
    }
    
    // Save donation data to sessionStorage
    const donationData = {
      title,
      defaultAmount: parseFloat(defaultAmount).toFixed(2)
    };
    sessionStorage.setItem('onboarding_donation_data', JSON.stringify(donationData));
    
    history.push('/onboarding-5-1');
  };

  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={0}>
          <IconButton 
            id="onboarding5-button-back"
            data-testid="onboarding5-button-back"
            className={classes.backButton} 
            onClick={handleBack}
          >
            <ArrowBack />
          </IconButton>
          
          <Box style={{ paddingTop: 48 }}>
            <Typography 
              id="onboarding5-text-title"
              data-testid="onboarding5-text-title"
              variant="h3" 
              gutterBottom
            >
              Create Your Donation Page
            </Typography>
          </Box>
          <Typography 
            id="onboarding5-text-subtitle"
            data-testid="onboarding5-text-subtitle"
            variant="h6" 
            color="textSecondary" 
            gutterBottom
          >
            Set up a simple way to receive donations
          </Typography>

          <form className={classes.form}>
            <TextField
              id="onboarding5-input-title"
              data-testid="onboarding5-input-title"
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="e.g., Support My Work"
              margin="normal"
            />

            <TextField
              id="onboarding5-input-amount"
              data-testid="onboarding5-input-amount"
              fullWidth
              variant="outlined"
              type="number"
              value={defaultAmount}
              onChange={(e) => {
                setDefaultAmount(e.target.value);
                setError('');
              }}
              placeholder="Default donation amount"
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney />
                  </InputAdornment>
                ),
              }}
              helperText="Donors can change this amount when they donate"
            />

            {error && (
              <Typography color="error" variant="body2" style={{ marginTop: 8 }}>
                {error}
              </Typography>
            )}

            {title && defaultAmount && (
              <Box className={classes.previewBox}>
                <Typography variant="h5" gutterBottom>
                  {title}
                </Typography>
                <Typography variant="h4" color="primary">
                  {formatUSD(defaultAmount)}
                </Typography>
                <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                  This is how your donation page will appear
                </Typography>
              </Box>
            )}

            <Button
              id="onboarding5-button-next"
              data-testid="onboarding5-button-next"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              className={classes.nextButton}
              onClick={handleNext}
              disabled={!title || !defaultAmount}
            >
              Next
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding5;