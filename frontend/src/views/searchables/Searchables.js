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
import FilterListIcon from '@material-ui/icons/FilterList';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import GroupIcon from '@material-ui/icons/Group';
import DashboardIcon from '@material-ui/icons/Dashboard';
import { useLogout } from '../../components/LogoutHandler';
import useComponentStyles from '../../themes/componentStyles';
import SearchableList from './SearchableList';
import TagFilter from '../../components/Tags/TagFilter';
import SearchBar from '../../components/Search/SearchBar';
import Backend from '../utilities/Backend';
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

  // State for dropdown menus
  const [anchorEl, setAnchorEl] = useState(null);
  const [navigationAnchorEl, setNavigationAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigationOpen = Boolean(navigationAnchorEl);

  // State for tag filtering
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Handle dropdown menus
  const handleAddNew = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigationMenu = (event) => {
    setNavigationAnchorEl(event.currentTarget);
  };

  const handleNavigationMenuClose = () => {
    setNavigationAnchorEl(null);
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

  // Handle navigation actions
  const handleProfileClick = () => {
    handleNavigationMenuClose();
    history.push('/profile');
  };

  const handleFindCreators = () => {
    handleNavigationMenuClose();
    history.push('/landing?tab=creators');
  };

  const handleFindContent = () => {
    handleNavigationMenuClose();
    history.push('/landing?tab=content');
  };


  // Handle search button click
  const handleSearchButtonClick = () => {
    const tagFilters = selectedTags.length > 0 ? { tags: selectedTags } : {};
    const updatedFilters = { ...filters, ...tagFilters };
    
    localStorage.setItem('searchTerm', searchTerm);
    localStorage.setItem('searchablesFilters', JSON.stringify(updatedFilters));
    localStorage.removeItem('searchablesPage'); // Reset to page 1 on new search
    
    setFilters(updatedFilters);
    setSearchTrigger(prev => prev + 1); // Trigger a new search
  };

  // Handle tag selection
  const handleTagSelection = (tags) => {
    setSelectedTags(tags);
  };

  // Toggle filters visibility
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Box>
      <Grid container>
        <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
            {/* Navigation dropdown menu on the left */}
            <Box>
              <Button 
                variant="contained" 
                onClick={handleNavigationMenu}
              >
                <MoreVertIcon />
              </Button>
              
              <Menu
                anchorEl={navigationAnchorEl}
                open={navigationOpen}
                onClose={handleNavigationMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                <MenuItem onClick={handleProfileClick}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="My Profile" />
                </MenuItem>
                <MenuItem onClick={handleFindCreators}>
                  <ListItemIcon>
                    <GroupIcon />
                  </ListItemIcon>
                  <ListItemText primary="Find Creators" />
                </MenuItem>
                <MenuItem onClick={handleFindContent}>
                  <ListItemIcon>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Find Content" />
                </MenuItem>
              </Menu>
            </Box>
            
            {/* Action buttons on the right */}
            <Box>
              <Button 
                variant="contained" 
                onClick={handleLogout}
                style={{ marginRight: 8 }}
              >
                <ExitToAppIcon />
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handleAddNew}
              >
                <AddIcon />
              </Button>
            </Box>
          </Box>
          
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
      </Grid>
      
      
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <SearchBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearchButtonClick}
          onToggleFilters={handleToggleFilters}
          onClear={() => {
            setSearchTerm('');
            setSelectedTags([]);
          }}
          showFilters={showFilters}
          filterCount={selectedTags.length}
          placeholder="Search content..."
          searchButtonText="Search Content"
        />
      </Grid>

      {showFilters && (
        <Grid item xs={12} style={{ marginTop: 16 }}>
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
          filters: filters,
          searchTrigger: searchTrigger
        }}
      />


      </Grid>
    </Box>
  );
};

export default Searchables;
