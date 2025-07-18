import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { 
  Paper, 
  Typography, 
  Button, 
  Box,
  Container
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { PersonAdd } from '@material-ui/icons';
import { isGuestUser } from '../../utils/guestUtils';

const useStyles = makeStyles((theme) => ({
  banner: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1.5),
    position: 'sticky',
    top: 0,
    zIndex: theme.zIndex.appBar - 1,
    boxShadow: theme.shadows[2],
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'center',
      textAlign: 'center'
    }
  },
  text: {
    fontSize: '1.1rem',
    fontWeight: 500,
    [theme.breakpoints.down('sm')]: {
      fontSize: '1rem'
    }
  },
  registerButton: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: theme.palette.common.white,
    }
  }
}));

const GuestUserBanner = () => {
  const classes = useStyles();
  const history = useHistory();
  const account = useSelector((state) => state.account);
  
  // Don't show banner if not logged in or not a guest user
  if (!account.isLoggedIn || !account.user || !isGuestUser(account.user)) {
    return null;
  }
  
  const visitorNumber = account.user._id || account.user.id;
  
  const handleRegisterClick = () => {
    history.push('/edit-account');
  };
  
  return (
    <Paper className={classes.banner} elevation={0}>
      <Container maxWidth="lg">
        <Box className={classes.container}>
          <Typography className={classes.text}>
            👋 Welcome, Visitor #{visitorNumber}! You're currently using a guest account.
          </Typography>
          <Button
            variant="contained"
            className={classes.registerButton}
            startIcon={<PersonAdd />}
            onClick={handleRegisterClick}
            size="medium"
          >
            Click here to register
          </Button>
        </Box>
      </Container>
    </Paper>
  );
};

export default GuestUserBanner;