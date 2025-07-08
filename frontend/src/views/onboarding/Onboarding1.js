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
  Box,
  Icon
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    padding: theme.spacing(4),
    textAlign: 'center',
  },
  title: {
    marginBottom: theme.spacing(4),
  },
  optionCard: {
    height: '100%',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  },
  cardContent: {
    padding: theme.spacing(4),
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
  },
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
        <Paper className={classes.paper} elevation={3}>
          <Typography variant="h3" className={classes.title}>
            Welcome to Searchable!
          </Typography>
          <Typography variant="h5" gutterBottom>
            What would you like to do?
          </Typography>
          
          <Grid container spacing={3} style={{ marginTop: 32 }}>
            <Grid item xs={12}>
              <Card className={classes.optionCard} elevation={2}>
                <CardActionArea onClick={handleSellerClick}>
                  <CardContent className={classes.cardContent}>
                    <Icon className={classes.icon}>storefront</Icon>
                    <Typography variant="h5" className={classes.optionTitle}>
                      I want to sell
                    </Typography>
                    <Typography variant="body1" className={classes.optionDescription}>
                      Create your store and start selling digital content, products, or services
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card className={classes.optionCard} elevation={2}>
                <CardActionArea onClick={handleShopperClick}>
                  <CardContent className={classes.cardContent}>
                    <Icon className={classes.icon}>shopping_cart</Icon>
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
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding1;