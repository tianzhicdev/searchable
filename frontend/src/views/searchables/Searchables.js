import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { 
  Grid, Button, Box, TextField, MenuItem, Select, Menu, MenuList, ListItemIcon, ListItemText
} from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PersonIcon from '@material-ui/icons/Person';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import GetAppIcon from '@material-ui/icons/GetApp';
import StorefrontIcon from '@material-ui/icons/Storefront';
import PaymentIcon from '@material-ui/icons/Payment';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { useLogout } from '../../components/LogoutHandler';
import useComponentStyles from '../../themes/componentStyles';
import SearchableList from './SearchableList';
import backend from '../utilities/Backend';
import { isMockMode } from '../../mocks/mockBackend'; 
const Searchables = () => {
  
  // State variables
  const [searchTerm, setSearchTerm] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('searchTerm') || localStorage.getItem('searchTerm') || '';
  });

  const [filters, setFilters] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters = urlParams.get('filters');
    
    if (urlFilters) {
      try {
        return JSON.parse(decodeURIComponent(urlFilters));
      } catch (e) {
        console.error("Error parsing filters from URL:", e);
      }
    }
    
    const storedFilters = localStorage.getItem('searchablesFilters');
    if (storedFilters) {
      try {
        return JSON.parse(storedFilters);
      } catch (e) {
        console.error("Error parsing filters from localStorage:", e);
      }
    }
    
    return {};
  });

  // Get location from Redux store instead of local state
  const account = useSelector((state) => state.account);
  const history = useHistory();
  const handleLogout = useLogout();

  const classes = useComponentStyles();

  // State for dropdown menu
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Handle dropdown menu
  const handleAddNew = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle navigation to publish pages
  const handlePublishDigital = () => {
    history.push('/publish-searchables');
    handleMenuClose();
  };

  const handlePublishOffline = () => {
    history.push('/publish-offline-searchables');
    handleMenuClose();
  };

  const handlePublishDirect = () => {
    history.push('/publish-direct-searchables');
    handleMenuClose();
  };

  // Handle navigation to profile page
  const handleProfileClick = () => {
    history.push('/profile');
  };


  // Handle search button click
  const handleSearchButtonClick = () => {
    localStorage.setItem('searchTerm', searchTerm);
    localStorage.setItem('searchablesFilters', JSON.stringify(filters));
    // Force re-render of SearchableList by updating the search criteria
    setSearchTerm(prevTerm => {
      // This is a trick to force the re-render even if the term didn't change
      const currentTerm = prevTerm;
      return currentTerm;
    });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box >
            {/* Users must be logged in to access this page, so always show logged-in UI */}
            <>
              <Button 
                variant="contained" 
                onClick={handleProfileClick}
              >
                <PersonIcon />
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handleLogout}
              >
                <ExitToAppIcon />
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handleAddNew}
                style={{ float: 'right' }}
              >
                <AddIcon />
              </Button>
              
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handlePublishDigital}>
                  <ListItemIcon>
                    <GetAppIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sell Digital Products" />
                </MenuItem>
                <MenuItem onClick={handlePublishOffline}>
                  <ListItemIcon>
                    <StorefrontIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sell Offline Products" />
                </MenuItem>
                <MenuItem onClick={handlePublishDirect}>
                  <ListItemIcon>
                    <PaymentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Direct Payment Item" />
                </MenuItem>
              </Menu>
            </>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
            InputProps={{
              endAdornment: (
                <Button 

                  variant='contained'
                  onClick={handleSearchButtonClick} 
                  style={{ padding: '4px', minWidth: 'unset' }}
                >
                  <SearchIcon/>
                </Button>
              ),
            }}
          />
          
        </Box>
      </Grid>

      <SearchableList 
        criteria={{
          searchTerm: searchTerm,
          filters: filters
        }}
      />


    </Grid>
  );
};

export default Searchables;
