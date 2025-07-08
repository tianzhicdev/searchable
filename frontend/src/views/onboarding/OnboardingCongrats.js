import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button
} from '@material-ui/core';
import { CheckCircle, Store, ShoppingCart, MonetizationOn } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import confetti from 'canvas-confetti';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    padding: theme.spacing(6),
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  successIcon: {
    fontSize: 80,
    color: theme.palette.success.main,
    marginBottom: theme.spacing(3),
    animation: '$bounce 0.5s ease-in-out',
  },
  '@keyframes bounce': {
    '0%': {
      transform: 'scale(0)',
    },
    '50%': {
      transform: 'scale(1.2)',
    },
    '100%': {
      transform: 'scale(1)',
    },
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(2),
  },
  subtitle: {
    marginBottom: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  enterButton: {
    padding: theme.spacing(2, 6),
    fontSize: '1.1rem',
    fontWeight: 600,
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 5px 10px 2px rgba(33, 203, 243, .3)',
    },
    transition: 'all 0.3s ease',
  },
  storeInfo: {
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    border: `2px solid ${theme.palette.primary.light}`,
  },
  storeIcon: {
    fontSize: 40,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
  highlight: {
    color: theme.palette.primary.main,
    fontWeight: 600,
  }
}));

const OnboardingCongrats = ({ type, storeName, redirectPath }) => {
  const classes = useStyles();
  const history = useHistory();

  React.useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
      }));
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
      }));
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    history.push(redirectPath);
  };

  const getContent = () => {
    switch (type) {
      case 'downloadable':
        return {
          icon: <ShoppingCart className={classes.storeIcon} />,
          title: '🎉 Congratulations! Your Digital Store is Live!',
          subtitle: 'Your files are ready to be sold. Customers can now discover and purchase your digital content.',
          storeLabel: 'Store Name',
          tips: [
            'Share your store link on social media',
            'Add more products anytime from your profile',
            'Track your sales in the dashboard'
          ]
        };
      case 'offline':
        return {
          icon: <Store className={classes.storeIcon} />,
          title: '🎊 Amazing! Your Catalog is Ready!',
          subtitle: 'Your store catalog is now live. Customers can browse your items and place orders.',
          storeLabel: 'Store Name',
          tips: [
            'Print QR codes for easy customer access',
            'Update prices and items from your profile',
            'Accept orders in person or online'
          ]
        };
      case 'direct':
        return {
          icon: <MonetizationOn className={classes.storeIcon} />,
          title: '💝 Wonderful! Your Donation Page is Active!',
          subtitle: 'You can now receive donations from supporters who believe in your cause.',
          storeLabel: 'Donation Page',
          tips: [
            'Share your donation link with supporters',
            'Add updates to keep donors engaged',
            'Track donations in your dashboard'
          ]
        };
      default:
        return {
          icon: <CheckCircle className={classes.storeIcon} />,
          title: 'Success!',
          subtitle: 'Your page is ready.',
          storeLabel: 'Page Name',
          tips: []
        };
    }
  };

  const content = getContent();

  return (
    <Box className={classes.root}>
      <Container maxWidth="sm">
        <Paper className={classes.paper} elevation={3}>
          <CheckCircle className={classes.successIcon} />
          
          <Typography variant="h4" className={classes.title}>
            {content.title}
          </Typography>
          
          <Typography variant="h6" className={classes.subtitle}>
            {content.subtitle}
          </Typography>

          <Box className={classes.storeInfo}>
            {content.icon}
            <Typography variant="body2" color="textSecondary">
              {content.storeLabel}
            </Typography>
            <Typography variant="h5" className={classes.highlight}>
              {storeName}
            </Typography>
          </Box>

          <Box mb={3}>
            <Typography variant="body1" gutterBottom style={{ fontWeight: 600 }}>
              What's Next?
            </Typography>
            {content.tips.map((tip, index) => (
              <Typography key={index} variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                • {tip}
              </Typography>
            ))}
          </Box>

          <Button
            variant="contained"
            color="primary"
            size="large"
            className={classes.enterButton}
            onClick={handleEnter}
          >
            ENTER
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default OnboardingCongrats;