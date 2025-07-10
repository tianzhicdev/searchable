import React, { useState, useRef } from 'react';
import { 
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fab,
  Backdrop,
  Box,
  IconButton,
  Zoom
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useHistory } from 'react-router-dom';
import { useLogout } from '../LogoutHandler';

// Icons
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import DashboardIcon from '@material-ui/icons/Dashboard';
import SearchIcon from '@material-ui/icons/Search';
import PersonSearchIcon from '@material-ui/icons/PersonSearch';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import StorefrontIcon from '@material-ui/icons/Storefront';
import SendIcon from '@material-ui/icons/Send';
import AutoAwesomeMotionIcon from '@material-ui/icons/AutoAwesomeMotion';

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
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [submenuAnchorEl, setSubmenuAnchorEl] = useState(null);
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
    setSubmenuAnchorEl(null);
  };

  const handleAddPosting = (event) => {
    event.stopPropagation();
    setSubmenuAnchorEl(event.currentTarget);
  };

  const handleSubmenuClose = () => {
    setSubmenuAnchorEl(null);
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
      icon: <AddIcon />, 
      label: 'Add a Posting',
      onClick: handleAddPosting
    },
    { 
      icon: <DashboardIcon />, 
      label: 'My Dashboard',
      onClick: () => handleNavigation('/dashboard')
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

  const postingTypes = [
    {
      icon: <CloudDownloadIcon />,
      name: 'Downloadable',
      description: 'Digital files for download',
      path: '/publish-searchables'
    },
    {
      icon: <StorefrontIcon />,
      name: 'Offline',
      description: 'Physical items or services',
      path: '/publish-offline-searchables'
    },
    {
      icon: <SendIcon />,
      name: 'Direct',
      description: 'Direct payment requests',
      path: '/publish-direct-searchables'
    },
    {
      icon: <AutoAwesomeMotionIcon />,
      name: 'AI Content',
      description: 'AI-generated content',
      path: '/publish/ai-content'
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

      {/* Submenu for posting types */}
      <Menu
        anchorEl={submenuAnchorEl}
        open={Boolean(submenuAnchorEl)}
        onClose={handleSubmenuClose}
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
        <MenuItem disabled>
          <ListItemText 
            primary="Choose Posting Type" 
            primaryTypographyProps={{ variant: 'subtitle2' }}
          />
        </MenuItem>
        <Divider className={classes.divider} />
        {postingTypes.map((type) => (
          <MenuItem 
            key={type.name}
            onClick={() => {
              handleNavigation(type.path);
              handleSubmenuClose();
            }}
            className={classes.submenuItem}
          >
            <ListItemIcon>
              {type.icon}
            </ListItemIcon>
            <ListItemText 
              primary={type.name} 
              secondary={type.description}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FloatingMenu;