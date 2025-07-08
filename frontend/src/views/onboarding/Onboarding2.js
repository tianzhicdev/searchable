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
  Icon,
  IconButton
} from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
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
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
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
      icon: 'cloud_download',
      path: '/onboarding-3'
    },
    {
      title: 'Create catalog for my store',
      description: 'Build a product catalog with multiple items and categories',
      icon: 'store',
      path: '/onboarding-4'
    },
    {
      title: 'Create a donation page',
      description: 'Accept donations and tips from supporters',
      icon: 'favorite',
      path: '/onboarding-5'
    }
  ];

  const handleOptionClick = (path) => {
    history.push(path);
  };

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={3}>
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          
          <Typography variant="h3" className={classes.title}>
            What would you like to create?
          </Typography>
          <Typography variant="h6" gutterBottom color="textSecondary">
            Choose how you want to start selling
          </Typography>
          
          <Grid container spacing={3} style={{ marginTop: 32 }}>
            {options.map((option, index) => (
              <Grid item xs={12} key={index}>
                <Card className={classes.optionCard} elevation={2}>
                  <CardActionArea onClick={() => handleOptionClick(option.path)}>
                    <CardContent className={classes.cardContent}>
                      <Icon className={classes.icon}>{option.icon}</Icon>
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
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding2;