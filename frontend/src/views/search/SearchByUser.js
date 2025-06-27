import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  InputAdornment,
  IconButton
} from '@material-ui/core';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { useHistory, useLocation } from 'react-router-dom';
import MainCard from '../../ui-component/cards/MainCard';
import TagFilter from '../../components/Tags/TagFilter';
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
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); // 0 for users, 1 for searchables
  
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
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 1) {
      // Switch to searchables
      history.push('/searchables');
    }
  };
  
  const handleUserClick = (user) => {
    history.push(`/profile/${user.username || user.id}`);
  };
  
  return (
    <Container maxWidth="lg" className={classes.container}>
      {/* Page Header */}
      <Box className={classes.searchHeader}>
        <Typography variant="h4" gutterBottom>
          Find Creators
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Discover talented creators and explore their work
        </Typography>
      </Box>
      
      {/* Navigation Tabs */}
      <Paper className={classes.tabsContainer}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Search Users" />
          <Tab label="Search Content" />
        </Tabs>
      </Paper>
      
      <MainCard>
        <Grid container spacing={3}>
          {/* Search and Filters Section */}
          <Grid item xs={12} md={showFilters ? 8 : 12}>
            {/* Search Section */}
            <Box className={classes.searchSection}>
              <form onSubmit={handleSearchSubmit}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={showFilters ? 12 : 10}>
                    <TextField
                      className={classes.searchField}
                      placeholder="Search by username..."
                      variant="outlined"
                      size="medium"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setSearchTerm('')}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  {!showFilters && (
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="outlined"
                        startIcon={<FilterIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                        fullWidth
                      >
                        Filters
                      </Button>
                    </Grid>
                  )}
                </Grid>
                
                <Box className={classes.searchActions}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SearchIcon />}
                    disabled={loading}
                  >
                    Search Users
                  </Button>
                  
                  {(searchTerm || selectedTags.length > 0) && (
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={handleClearSearch}
                    >
                      Clear All
                    </Button>
                  )}
                  
                  {showFilters && (
                    <Button
                      variant="outlined"
                      onClick={() => setShowFilters(false)}
                    >
                      Hide Filters
                    </Button>
                  )}
                </Box>
              </form>
            </Box>
            
            {/* Results Section */}
            <UserSearchResults
              users={users}
              loading={loading}
              pagination={pagination}
              onUserClick={handleUserClick}
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
          
          {/* Filters Sidebar */}
          {showFilters && (
            <Grid item xs={12} md={4}>
              <Box className={classes.filtersSection}>
                <TagFilter
                  tagType="user"
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  title="Filter by User Tags"
                  expanded={true}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </MainCard>
    </Container>
  );
};

export default SearchByUser;