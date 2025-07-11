import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Box
} from '@material-ui/core';
import { Storefront, ShoppingCart } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { componentSpacing } from '../../utils/spacing';
import config from '../../config';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    ...componentSpacing.card(theme),
    textAlign: 'center',
    boxShadow: 'none',
    border: 'none',
    background: 'transparent',
  },
  title: {
    marginBottom: theme.spacing(4),
    animation: '$typewriter 2s steps(20) 1s forwards',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    width: 0,
  },
  '@keyframes typewriter': {
    to: { width: '100%' }
  },
  subtitle: {
    marginBottom: theme.spacing(3),
  },
  optionCard: {
    height: '100%',
    transition: 'all 0.3s ease',
    boxShadow: 'none !important',
    border: 'none !important',
    background: 'transparent !important',
    '& .MuiPaper-root': {
      boxShadow: 'none !important',
      border: 'none !important',
      background: 'transparent !important',
    },
    '& .MuiCard-root': {
      boxShadow: 'none !important',
      border: 'none !important',
      background: 'transparent !important',
    },
    '& .MuiCardActionArea-root': {
      '&:hover': {
        backgroundColor: 'transparent',
      }
    },
    '&:hover': {
      transform: 'translateY(-10px)',
    },
  },
  cardContent: {
    ...componentSpacing.card(theme),
    textAlign: 'center',
  },
  icon: {
    fontSize: 64,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  optionTitle: {
    marginBottom: theme.spacing(1),
  },
  optionDescription: {
    color: theme.palette.text.secondary,
  }
}));

const Onboarding1 = () => {
  const classes = useStyles();
  const history = useHistory();

  const handleSellerClick = () => {
    history.push('/onboarding-2');
  };

  const handleShopperClick = () => {
    history.push('/search');
  };

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={0}>
          <Typography variant="h3" className={classes.title}>
            Welcome to {config.BRANDING_CONFIG.landingIntro}!
          </Typography>
          <Typography variant="h5" className={classes.subtitle} gutterBottom>
            What would you like to do?
          </Typography>
          
          <Box style={{ marginTop: 32 }}>
            <Grid container spacing={3} id="container-1">
              <Grid item xs={12} className={classes.optionCard}>
                <Card elevation={0}>
                  <CardActionArea onClick={handleSellerClick}>
                    <CardContent className={classes.cardContent}>
                      <Storefront className={classes.icon} />
                      <Typography variant="h5" className={classes.optionTitle}>
                        I want to earn
                      </Typography>
                      <Typography variant="body1" className={classes.optionDescription}>
                        Create your store and start selling digital content or create a donation page
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              
              <Grid item xs={12} className={classes.optionCard}>
                <Card elevation={0}>
                  <CardActionArea onClick={handleShopperClick}>
                    <CardContent className={classes.cardContent}>
                      <ShoppingCart className={classes.icon} />
                      <Typography variant="h5" className={classes.optionTitle}>
                        I want to shop
                      </Typography>
                      <Typography variant="body1" className={classes.optionDescription}>
                        Browse and purchase digital content from creators
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding1;