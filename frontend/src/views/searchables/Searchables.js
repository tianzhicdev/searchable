import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { 
  Grid, Button, Box, TextField, MenuItem, Select, Menu, MenuList, ListItemIcon, ListItemText, Tabs, Tab
} from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PersonIcon from '@material-ui/icons/Person';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import GetAppIcon from '@material-ui/icons/GetApp';
import StorefrontIcon from '@material-ui/icons/Storefront';
import PaymentIcon from '@material-ui/icons/Payment';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import FilterListIcon from '@material-ui/icons/FilterList';
import { useLogout } from '../../components/LogoutHandler';
import useComponentStyles from '../../themes/componentStyles';
import SearchableList from './SearchableList';
import TagFilter from '../../components/Tags/TagFilter';
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

  // State for tag filtering
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [tabValue, setTabValue] = useState(0);

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
    const tagFilters = selectedTags.length > 0 ? { tags: selectedTags } : {};
    const updatedFilters = { ...filters, ...tagFilters };
    
    localStorage.setItem('searchTerm', searchTerm);
    localStorage.setItem('searchablesFilters', JSON.stringify(updatedFilters));
    
    setFilters(updatedFilters);
    
    // Force re-render of SearchableList by updating the search criteria
    setSearchTerm(prevTerm => {
      // This is a trick to force the re-render even if the term didn't change
      const currentTerm = prevTerm;
      return currentTerm;
    });
  };

  // Handle tag selection
  const handleTagSelection = (tags) => {
    setSelectedTags(tags);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1) {
      history.push('/search-by-user');
    }
  };

  // Toggle filters visibility
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
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
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
          <Tab label="Browse Content" />
          <Tab label="Find Creators" />
        </Tabs>
      </Grid>
      
      <Grid item xs={12}>
        <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
          <TextField
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, marginRight: 8 }}
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
          
          <Button
            variant="outlined"
            onClick={handleToggleFilters}
            startIcon={<FilterListIcon />}
          >
            Filters {selectedTags.length > 0 && `(${selectedTags.length})`}
          </Button>
        </Box>
      </Grid>

      {showFilters && (
        <Grid item xs={12}>
          <TagFilter
            selectedTags={selectedTags}
            onTagsChange={handleTagSelection}
            tagType="searchable"
          />
        </Grid>
      )}

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
