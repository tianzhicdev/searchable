import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Zoom
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useHistory, useLocation } from 'react-router-dom';
import { useLogout } from '../LogoutHandler';

// Icons
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import DashboardIcon from '@material-ui/icons/Dashboard';
import PersonIcon from '@material-ui/icons/Person';
import GetAppIcon from '@material-ui/icons/GetApp';
import CreditCardIcon from '@material-ui/icons/CreditCard';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import MoneyOffIcon from '@material-ui/icons/MoneyOff';
import EditIcon from '@material-ui/icons/Edit';
import LockIcon from '@material-ui/icons/Lock';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import StorefrontIcon from '@material-ui/icons/Storefront';
import SendIcon from '@material-ui/icons/Send';
import PersonSearchIcon from '@material-ui/icons/PersonSearch';
import CategoryIcon from '@material-ui/icons/Category';

const useStyles = makeStyles((theme) => ({
  floatingBar: {
    position: 'fixed',
    bottom: theme.spacing(2),
    left: 0,
    right: 0,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 'fit-content',
    backgroundColor: theme.palette.background.paper,
    borderRadius: 30,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(0.5, 1),
    gap: theme.spacing(1),
    zIndex: theme.zIndex.speedDial,
    border: `2px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('sm')]: {
      bottom: theme.spacing(1),
      padding: theme.spacing(0.5),
      gap: theme.spacing(0.5),
    }
  },
  iconButton: {
    padding: theme.spacing(1.5),
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.light + '22',
      transform: 'scale(1.1)',
    },
    transition: 'all 0.3s ease',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    }
  },
  activeIcon: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    }
  },
  menu: {
    '& .MuiPaper-root': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.primary.main}`,
      borderRadius: theme.shape.borderRadius,
      minWidth: 250,
      maxHeight: '70vh',
      overflowY: 'auto',
    }
  },
  menuItem: {
    padding: theme.spacing(1.5, 2),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
      minWidth: 40,
    }
  },
  menuHeader: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    padding: theme.spacing(1, 2),
    textTransform: 'uppercase',
  }
}));

const FloatingBottomBar = () => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const logout = useLogout();
  const account = useSelector((state) => state.account);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const [discoverMenuAnchor, setDiscoverMenuAnchor] = useState(null);
  const [createMenuAnchor, setCreateMenuAnchor] = useState(null);

  // Hide on landing and onboarding pages
  const shouldHide = location.pathname === '/landing' || 
                     location.pathname.startsWith('/onboarding');
  
  if (shouldHide) {
    return null;
  }

  const handleAccountClick = (event) => {
    setAccountMenuAnchor(event.currentTarget);
    setDiscoverMenuAnchor(null);
    setCreateMenuAnchor(null);
  };

  const handleDiscoverClick = (event) => {
    setDiscoverMenuAnchor(event.currentTarget);
    setAccountMenuAnchor(null);
    setCreateMenuAnchor(null);
  };

  const handleCreateClick = (event) => {
    setCreateMenuAnchor(event.currentTarget);
    setAccountMenuAnchor(null);
    setDiscoverMenuAnchor(null);
  };

  const handleCloseAll = () => {
    setAccountMenuAnchor(null);
    setDiscoverMenuAnchor(null);
    setCreateMenuAnchor(null);
  };

  const handleNavigation = (path) => {
    history.push(path);
    handleCloseAll();
  };

  const handleLogout = () => {
    logout();
    handleCloseAll();
  };

  const accountMenuItems = [
    {
      icon: <DashboardIcon />,
      label: 'My Dashboard',
      onClick: () => handleNavigation('/dashboard')
    },
    {
      icon: <PersonIcon />,
      label: 'Profile Page',
      onClick: () => handleNavigation(`/profile/${account.user?._id}`)
    },
    {
      icon: <GetAppIcon />,
      label: 'My Downloads',
      onClick: () => handleNavigation('/my-downloads')
    },
    { divider: true },
    {
      icon: <CreditCardIcon />,
      label: 'Refill with Credit Card',
      onClick: () => handleNavigation('/credit-card-refill')
    },
    {
      icon: <AttachMoneyIcon />,
      label: 'Refill with USDT',
      onClick: () => handleNavigation('/refill-usdt')
    },
    {
      icon: <MoneyOffIcon />,
      label: 'Withdraw USDT',
      onClick: () => handleNavigation('/withdrawal-usdt')
    },
    { divider: true },
    {
      icon: <EditIcon />,
      label: 'Edit Profile',
      onClick: () => handleNavigation('/edit-profile')
    },
    {
      icon: <LockIcon />,
      label: 'Change Password',
      onClick: () => handleNavigation('/change-password')
    },
    { divider: true },
    {
      icon: <ExitToAppIcon />,
      label: 'Log Out',
      onClick: handleLogout
    }
  ];

  const discoverMenuItems = [
    {
      icon: <PersonSearchIcon />,
      label: 'By Artists',
      onClick: () => handleNavigation('/search?tab=creators')
    },
    {
      icon: <CategoryIcon />,
      label: 'By Content',
      onClick: () => handleNavigation('/search?tab=content')
    }
  ];

  const createMenuItems = [
    {
      icon: <CloudDownloadIcon />,
      label: 'Digital Files',
      description: 'Sell downloadable content',
      onClick: () => handleNavigation('/publish-searchables')
    },
    {
      icon: <StorefrontIcon />,
      label: 'Physical Items',
      description: 'List offline products',
      onClick: () => handleNavigation('/publish-offline-searchables')
    },
    {
      icon: <SendIcon />,
      label: 'Direct Payment',
      description: 'Request direct payments',
      onClick: () => handleNavigation('/publish-direct-searchables')
    }
  ];

  return (
    <>
      <Zoom in={true}>
        <Paper className={classes.floatingBar} elevation={8}>
          <IconButton
            className={`${classes.iconButton} ${accountMenuAnchor ? classes.activeIcon : ''}`}
            onClick={handleAccountClick}
            aria-label="My Account"
          >
            <AccountCircleIcon />
          </IconButton>
          
          <IconButton
            className={`${classes.iconButton} ${discoverMenuAnchor ? classes.activeIcon : ''}`}
            onClick={handleDiscoverClick}
            aria-label="Discover"
          >
            <SearchIcon />
          </IconButton>
          
          <IconButton
            className={`${classes.iconButton} ${createMenuAnchor ? classes.activeIcon : ''}`}
            onClick={handleCreateClick}
            aria-label="Create"
          >
            <AddIcon />
          </IconButton>
        </Paper>
      </Zoom>

      {/* Account Menu */}
      <Menu
        anchorEl={accountMenuAnchor}
        open={Boolean(accountMenuAnchor)}
        onClose={handleCloseAll}
        className={classes.menu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <div className={classes.menuHeader}>My Account</div>
        {accountMenuItems.map((item, index) => (
          item.divider ? (
            <Box key={index} sx={{ my: 1, borderBottom: 1, borderColor: 'divider' }} />
          ) : (
            <MenuItem
              key={item.label}
              onClick={item.onClick}
              className={classes.menuItem}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          )
        ))}
      </Menu>

      {/* Discover Menu */}
      <Menu
        anchorEl={discoverMenuAnchor}
        open={Boolean(discoverMenuAnchor)}
        onClose={handleCloseAll}
        className={classes.menu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <div className={classes.menuHeader}>Discover</div>
        {discoverMenuItems.map((item) => (
          <MenuItem
            key={item.label}
            onClick={item.onClick}
            className={classes.menuItem}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>

      {/* Create Menu */}
      <Menu
        anchorEl={createMenuAnchor}
        open={Boolean(createMenuAnchor)}
        onClose={handleCloseAll}
        className={classes.menu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <div className={classes.menuHeader}>Create New Posting</div>
        {createMenuItems.map((item) => (
          <MenuItem
            key={item.label}
            onClick={item.onClick}
            className={classes.menuItem}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.label} 
              secondary={item.description}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FloatingBottomBar;