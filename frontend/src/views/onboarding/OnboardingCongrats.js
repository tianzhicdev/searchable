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
// import confetti from 'canvas-confetti'; // Uncomment when library is installed

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
    boxShadow: 'none',
    border: 'none',
    background: 'transparent',
  },
  successIcon: {
    fontSize: 80,
    color: theme.palette.success.main,
    marginBottom: theme.spacing(3),
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    animation: '$slideInLetters 1.5s ease-out 0.5s both',
    position: 'relative',
    '& span': {
      display: 'inline-block',
      animation: '$letterBounce 0.6s ease-out',
      animationFillMode: 'both',
    }
  },
  '@keyframes slideInLetters': {
    from: { opacity: 0 },
    to: { opacity: 1 }
  },
  '@keyframes letterBounce': {
    '0%': { transform: 'translateY(-100px) rotate(360deg)', opacity: 0 },
    '60%': { transform: 'translateY(20px) rotate(-10deg)' },
    '80%': { transform: 'translateY(-10px) rotate(5deg)' },
    '100%': { transform: 'translateY(0) rotate(0)', opacity: 1 }
  },
  subtitle: {
    marginBottom: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  enterButton: {
    padding: theme.spacing(2, 6),
    fontSize: '1.1rem',
    fontWeight: 600,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[8],
    },
    transition: 'all 0.3s ease',
  },
  storeInfo: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  storeIcon: {
    fontSize: 40,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
  highlight: {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  tipsContainer: {
    // Simple tips container without animations
  }
}));

const OnboardingCongrats = ({ type, storeName, redirectPath }) => {
  const classes = useStyles();
  const history = useHistory();

  React.useEffect(() => {
    // Confetti animation placeholder
    // Uncomment the code below when canvas-confetti is installed
    /*
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
    */
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
        <Paper className={classes.paper} elevation={0}>
          <CheckCircle className={classes.successIcon} />
          
          <Typography variant="h4" className={classes.title}>
            {content.title.split('').map((char, i) => (
              <span key={i} style={{ animationDelay: `${1 + i * 0.05}s` }}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
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

          <Box mb={3} className={classes.tipsContainer}>
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