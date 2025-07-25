import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { 
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fab
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useHistory } from 'react-router-dom';
import { useLogout } from '../LogoutHandler';
import FeedbackDialog from '../Feedback/FeedbackDialog';

// Icons
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import DashboardIcon from '@material-ui/icons/Dashboard';
import SearchIcon from '@material-ui/icons/Search';
import PersonSearchIcon from '@material-ui/icons/PersonSearch';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import SendIcon from '@material-ui/icons/Send';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import PersonIcon from '@material-ui/icons/Person';
import GetAppIcon from '@material-ui/icons/GetApp';
import MoneyOffIcon from '@material-ui/icons/MoneyOff';
import EditIcon from '@material-ui/icons/Edit';
import LockIcon from '@material-ui/icons/Lock';
import CreditCardIcon from '@material-ui/icons/CreditCard';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import FeedbackIcon from '@material-ui/icons/Feedback';

const useStyles = makeStyles((theme) => ({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    left: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    width: 56,
    height: 56,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    [theme.breakpoints.down('sm')]: {
      width: 48,
      height: 48,
    }
  },
  backdrop: {
    zIndex: theme.zIndex.drawer - 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    '& .MuiPaper-root': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.primary.main}`,
      minWidth: 280,
      [theme.breakpoints.down('sm')]: {
        minWidth: 250,
      }
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
    },
    '& .MuiListItemText-secondary': {
      fontSize: '0.75rem',
      color: theme.palette.text.secondary,
    }
  },
  submenu: {
    '& .MuiPaper-root': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.primary.main}`,
      minWidth: 280,
      [theme.breakpoints.down('sm')]: {
        minWidth: 250,
      }
    }
  },
  submenuItem: {
    padding: theme.spacing(1.5, 2),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
      minWidth: 40,
    },
    '& .MuiListItemText-secondary': {
      fontSize: '0.75rem',
      color: theme.palette.text.secondary,
    }
  },
  divider: {
    backgroundColor: theme.palette.divider,
  }
}));

const FloatingMenu = () => {
  const classes = useStyles();
  const history = useHistory();
  const logout = useLogout();
  const account = useSelector((state) => state.account);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [accountSubmenuAnchorEl, setAccountSubmenuAnchorEl] = useState(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const fabRef = useRef(null);

  const handleToggle = (event) => {
    if (menuAnchorEl) {
      handleClose();
    } else {
      setMenuAnchorEl(fabRef.current);
    }
  };

  const handleClose = () => {
    setMenuAnchorEl(null);
    setAccountSubmenuAnchorEl(null);
  };

  const handleAddPosting = (event) => {
    event.stopPropagation();
    handleNavigation('/publish-allinone');
  };


  const handleMyAccount = (event) => {
    event.stopPropagation();
    setAccountSubmenuAnchorEl(event.currentTarget);
  };

  const handleAccountSubmenuClose = () => {
    setAccountSubmenuAnchorEl(null);
  };

  const handleNavigation = (path) => {
    history.push(path);
    handleClose();
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const menuItems = [
    { 
      icon: <AccountCircleIcon />, 
      label: 'My Account',
      onClick: handleMyAccount
    },
    { 
      icon: <AddIcon />, 
      label: 'Add a Posting',
      onClick: handleAddPosting
    },
    { 
      icon: <PersonSearchIcon />, 
      label: 'Find Creators',
      onClick: () => handleNavigation('/search?tab=creators')
    },
    { 
      icon: <SearchIcon />, 
      label: 'Find Items',
      onClick: () => handleNavigation('/search?tab=content')
    },

    { 
      icon: <ExitToAppIcon />, 
      label: 'Log Out',
      onClick: handleLogout
    },
  ];
  
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
    {
      icon: <EditIcon />,
      label: 'Edit Profile',
      onClick: () => handleNavigation('/edit-profile')
    },
    {
      icon: <LockIcon />,
      label: 'Edit Account',
      onClick: () => handleNavigation('/edit-account')
    },
    {
      icon: <FeedbackIcon />,
      label: 'Feedback',
      onClick: () => {
        setFeedbackDialogOpen(true);
        handleAccountSubmenuClose();
        handleClose();
      }
    }
  ];


  return (
    <>
      <Fab
        ref={fabRef}
        aria-label="menu"
        className={classes.fab}
        onClick={handleToggle}
      >
        {Boolean(menuAnchorEl) ? <CloseIcon /> : <MenuIcon />}
      </Fab>

      {/* Main menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleClose}
        className={classes.menu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        getContentAnchorEl={null}
      >
        {menuItems.map((item) => (
          <MenuItem 
            key={item.label}
            onClick={item.onClick}
            className={classes.menuItem}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>


      {/* My Account submenu */}
      <Menu
        anchorEl={accountSubmenuAnchorEl}
        open={Boolean(accountSubmenuAnchorEl)}
        onClose={handleAccountSubmenuClose}
        className={classes.submenu}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        getContentAnchorEl={null}
      >
        {accountMenuItems.map((item) => (
          <MenuItem 
            key={item.label}
            onClick={() => {
              item.onClick();
              handleAccountSubmenuClose();
            }}
            className={classes.submenuItem}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>

      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={feedbackDialogOpen} 
        onClose={() => setFeedbackDialogOpen(false)} 
      />
    </>
  );
};

export default FloatingMenu;