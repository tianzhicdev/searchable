import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@material-ui/core';
import {
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Dashboard as DashboardIcon,
  ExitToApp as ExitToAppIcon,
  Add as AddIcon,
  GetApp as GetAppIcon,
  Storefront as StorefrontIcon,
  Payment as PaymentIcon
} from '@material-ui/icons';
import { useHistory } from 'react-router-dom';
import { useLogout } from '../../components/LogoutHandler';
import TagFilter from '../../components/Tags/TagFilter';
import SearchBar from '../../components/Search/SearchBar';

const SearchCommon = ({
  searchType = 'content', // 'content' or 'user'
  searchTerm,
  setSearchTerm,
  selectedTags,
  setSelectedTags,
  loading,
  showFilters,
  setShowFilters,
  onSearch,
  onClearSearch,
  children
}) => {
  const history = useHistory();
  const handleLogout = useLogout();
  
  // State for dropdown menus
  const [navigationAnchorEl, setNavigationAnchorEl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigationOpen = Boolean(navigationAnchorEl);
  const open = Boolean(anchorEl);

  // Auto-search when tags change
  useEffect(() => {
    onSearch(1);
  }, [selectedTags]);

  // Navigation menu handlers
  const handleNavigationMenu = (event) => {
    setNavigationAnchorEl(event.currentTarget);
  };

  const handleNavigationMenuClose = () => {
    setNavigationAnchorEl(null);
  };

  const handleDashboardClick = () => {
    handleNavigationMenuClose();
    history.push('/dashboard');
  };

  const handleFindCreators = () => {
    handleNavigationMenuClose();
    history.push('/landing?tab=creators');
  };

  const handleFindContent = () => {
    handleNavigationMenuClose();
    history.push('/landing?tab=content');
  };

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

  const isUserSearch = searchType === 'user';
  const placeholder = isUserSearch ? "Search by username..." : "Search content...";
  const searchButtonText = isUserSearch ? "Search Users" : "Search Content";
  const tagType = isUserSearch ? "user" : "searchable";
  const filterTitle = isUserSearch ? "Filter by User Tags" : "Filter by Content Tags";

  return (
    <Box>
      <Grid container>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                <MenuItem onClick={handleDashboardClick}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="My Dashboard" />
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
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} style={{ marginTop: 16 }}>
          <SearchBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearch={() => onSearch(1)}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onClear={onClearSearch}
            showFilters={showFilters}
            filterCount={selectedTags.length}
            loading={loading}
            placeholder={placeholder}
            searchButtonText={searchButtonText}
          />
        </Grid>

        {showFilters && (
          <Grid item xs={12} style={{ marginTop: 16 }}>
            <TagFilter
              tagType={tagType}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              title={filterTitle}
            />
          </Grid>
        )}
        
        {/* Results Section */}
        <Grid item xs={12} style={{ marginTop: 16 }}>
          {children}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SearchCommon;