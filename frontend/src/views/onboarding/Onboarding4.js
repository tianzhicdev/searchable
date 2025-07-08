import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
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
}));

const Onboarding4 = () => {
  const classes = useStyles();
  const history = useHistory();

  const handleBack = () => {
    history.push('/onboarding-2');
  };

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={3}>
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          
          <Typography variant="h3" gutterBottom>
            Create Store Catalog
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Coming soon...
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding4;