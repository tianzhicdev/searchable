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
import { ArrowBack } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { coinDollar as coinDollarIcon } from '../../assets/images/icons';
import DecorativeIcons from '../../components/DecorativeIcons';
import { heartPixel, smileyBlushing, coinDollar, sparkleGradientLarge } from '../../assets/images/icons';



const onboarding5Icons = [
  { src: heartPixel, alt: 'heart', top: '7%', left: '5%', size: 40, opacity: 0.12, animation: 'pulse' },
  { src: smileyBlushing, alt: 'blushing', top: '12%', right: '6%', size: 42, opacity: 0.1, animation: 'float' },
  { src: coinDollar, alt: 'coin', bottom: '15%', left: '8%', size: 38, opacity: 0.1, animation: 'float' },
  { src: sparkleGradientLarge, alt: 'sparkle', bottom: '10%', right: '5%', size: 44, opacity: 0.12, animation: 'float' },
];

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(4),
    position: 'relative',
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider || 'rgba(167,139,250,0.2)'}`,
    borderRadius: '16px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.28)',
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(3, 2),
    },
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
    border: `1px solid ${theme.palette.primary.main}33`,
    transition: 'all 0.3s ease',
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
    <Box className={classes.root} style={{ position: 'relative' }}>
      <DecorativeIcons icons={onboarding5Icons} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper className={classes.paper} elevation={0}>
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>

          <Box style={{ paddingTop: 48 }}>
            <Typography variant="h3" gutterBottom color="primary">
              Create Your Donation Page
            </Typography>
          </Box>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Set up a simple way to receive donations
          </Typography>

          <form className={classes.form}>
            <TextField
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
                    <img src={coinDollarIcon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
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
