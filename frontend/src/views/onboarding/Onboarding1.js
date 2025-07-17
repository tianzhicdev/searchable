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
  titleContainer: {
    marginBottom: theme.spacing(4),
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      width: '10%',
      height: '100%',
      zIndex: 1,
    },
    '&::before': {
      left: 0,
      background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
      [theme.breakpoints.down('sm')]: {
        background: 'none',
      },
    },
    '&::after': {
      right: 0,
      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
      [theme.breakpoints.down('sm')]: {
        background: 'none',
      },
    },
  },
  title: {
    display: 'inline-block',
    paddingLeft: '20px',
    animation: '$marquee 5s linear infinite',
    whiteSpace: 'nowrap',
  },
  '@keyframes marquee': {
    from: { transform: 'translateX(0)' },
    to: { transform: 'translateX(-100%)' }
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

          <Typography 
            variant="h5" 
            className={classes.subtitle} 
            gutterBottom
            id="onboarding1-text-title"
            data-testid="onboarding1-text-title"
          >
            What would you like to do?
          </Typography>
          
          <Box style={{ marginTop: 32 }}>
            <Grid container spacing={3} id="container-1">
              <Grid item xs={12} className={classes.optionCard}>
                <Card 
                  elevation={0}
                  id="onboarding1-card-earn"
                  data-testid="onboarding1-card-earn"
                >
                  <CardActionArea 
                    onClick={handleSellerClick}
                    id="onboarding1-button-earn"
                    data-testid="onboarding1-button-earn"
                  >
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
                <Card 
                  elevation={0}
                  id="onboarding1-card-shop"
                  data-testid="onboarding1-card-shop"
                >
                  <CardActionArea 
                    onClick={handleShopperClick}
                    id="onboarding1-button-shop"
                    data-testid="onboarding1-button-shop"
                  >
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