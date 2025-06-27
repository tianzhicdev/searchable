import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Grid,
  Paper,
  Button,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@material-ui/core';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
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
import { makeStyles } from '@material-ui/styles';
import { useHistory, useLocation } from 'react-router-dom';
import { useLogout } from '../../components/LogoutHandler';
import TagFilter from '../../components/Tags/TagFilter';
import SearchBar from '../../components/Search/SearchBar';
import UserSearchResults from '../../components/Search/UserSearchResults';
import backend from '../../mocks/mockBackend';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(4)
  },
  searchHeader: {
    marginBottom: theme.spacing(3)
  },
  searchSection: {
    marginBottom: theme.spacing(3)
  },
  searchField: {
    width: '100%'
  },
  filtersSection: {
    marginBottom: theme.spacing(3)
  },
  tabsContainer: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(2)
  },
  filterToggle: {
    marginLeft: theme.spacing(1)
  },
  searchActions: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2)
  }
}));

const SearchByUser = () => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const handleLogout = useLogout();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [navigationAnchorEl, setNavigationAnchorEl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigationOpen = Boolean(navigationAnchorEl);
  const open = Boolean(anchorEl);
  
  // Load initial data
  useEffect(() => {
    handleSearch();
  }, [selectedTags]);
  
  const handleSearch = async (page = 1) => {
    setLoading(true);
    
    try {
      // Build search parameters
      const params = new URLSearchParams();
      
      if (searchTerm.trim()) {
        params.append('username', searchTerm.trim());
      }
      
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => {
          params.append('tags[]', tag.name);
        });
      }
      
      params.append('page', page);
      params.append('limit', 20);
      
      const response = await backend.get(`/api/v1/search/users?${params.toString()}`);
      
      if (response.data && response.data.success) {
        setUsers(response.data.users || []);
        setPagination(response.data.pagination);
      } else {
        setUsers([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(1);
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };
  
  const handleUserClick = (user) => {
    history.push(`/profile/${user.username || user.id}`);
  };

  // Navigation menu handlers
  const handleNavigationMenu = (event) => {
    setNavigationAnchorEl(event.currentTarget);
  };

  const handleNavigationMenuClose = () => {
    setNavigationAnchorEl(null);
  };

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
          onSearch={() => handleSearch(1)}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onClear={handleClearSearch}
          showFilters={showFilters}
          filterCount={selectedTags.length}
          loading={loading}
          placeholder="Search by username..."
          searchButtonText="Search Users"
        />
      </Grid>

      {showFilters && (
        <Grid item xs={12} style={{ marginTop: 16 }}>
          <TagFilter
            tagType="user"
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            title="Filter by User Tags"
          />
        </Grid>
      )}
            
      {/* Results Section */}
      <Grid item xs={12} style={{ marginTop: 16 }}>
        <UserSearchResults
          users={users}
          loading={loading}
          pagination={pagination}
          onUserClick={handleUserClick}
          onPageChange={handleSearch}
          emptyMessage={
            selectedTags.length > 0 || searchTerm 
              ? "No users found matching your criteria"
              : "Start searching to find creators"
          }
          emptySubtext={
            selectedTags.length > 0 || searchTerm
              ? "Try adjusting your search filters or search terms."
              : "Use the search bar or tag filters to discover talented creators."
          }
        />
      </Grid>
      </Grid>
    </Box>
  );
};

export default SearchByUser;