import React, { useEffect, useState } from 'react';
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
  IconButton
} from '@material-ui/core';
import { ArrowBack, CloudDownload, Store, Favorite } from '@material-ui/icons';
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
    position: 'relative',
    boxShadow: 'none',
    border: 'none',
    background: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(4),
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
    padding: theme.spacing(4),
    textAlign: 'center',
    transition: 'all 0.3s ease',
  },
  icon: {
    fontSize: 64,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  optionTitle: {
    marginBottom: theme.spacing(1),
    fontWeight: 600,
  },
  optionDescription: {
    color: theme.palette.text.secondary,
  }
}));

const Onboarding2 = () => {
  const classes = useStyles();
  const history = useHistory();

  const handleBack = () => {
    history.push('/onboarding-1');
  };

  const options = [
    {
      title: 'Sell my digital content',
      description: 'Upload and sell files like PDFs, music, videos, or software',
      icon: <CloudDownload className={classes.icon} />,
      path: '/onboarding-3'
    },
    {
      title: 'Create catalog for my store',
      description: 'Build a product catalog with multiple items and categories',
      icon: <Store className={classes.icon} />,
      path: '/onboarding-4'
    },
    {
      title: 'Create a donation page',
      description: 'Accept donations and tips from supporters',
      icon: <Favorite className={classes.icon} />,
      path: '/onboarding-5'
    }
  ];

  const handleOptionClick = (path) => {
    history.push(path);
  };

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={0}>
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          
          <Box style={{ paddingTop: 48 }}>
            <Typography variant="h3" className={classes.title}>
              What would you like to create?
            </Typography>
          </Box>
          <Typography variant="h6" className={classes.subtitle} color="textSecondary">
            Choose how you want to start selling
          </Typography>
          
          <Box style={{ marginTop: 32 }}>
            <Grid container spacing={3}>
              {options.map((option, index) => (
                <Grid item xs={12} key={index}>
                  <Card className={classes.optionCard} elevation={0}>
                    <CardActionArea onClick={() => handleOptionClick(option.path)}>
                      <CardContent className={classes.cardContent}>
                        {option.icon}
                        <Typography variant="h5" className={classes.optionTitle}>
                          {option.title}
                        </Typography>
                        <Typography variant="body1" className={classes.optionDescription}>
                          {option.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding2;