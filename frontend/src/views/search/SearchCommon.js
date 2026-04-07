import React from 'react';
import {
  Box,
  Grid,
  Button,
  IconButton,
  Typography,
  Tooltip
} from '@material-ui/core';
import {
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  ExitToApp as ExitToAppIcon,
  Add as AddIcon
} from '@material-ui/icons';
import { makeStyles, useTheme } from '@material-ui/styles';
import { useHistory, useLocation } from 'react-router-dom';
import { useLogout } from '../../components/LogoutHandler';
import TagFilter from '../../components/Tags/TagFilter';
import SearchBar from '../../components/Search/SearchBar';
import { navigateWithStack } from '../../utils/navigationUtils';
import { componentSpacing } from '../../utils/spacing';
import { testIds } from '../../utils/testIds';

const useStyles = makeStyles((theme) => ({
  // Top navigation bar
  topNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1.5),
      gap: theme.spacing(1),
    }
  },
  // Tab pills container
  tabPills: {
    display: 'flex',
    gap: theme.spacing(0.5),
    background: `${theme.palette.background.paper}80`,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '24px',
    padding: 3,
    border: `1px solid ${theme.palette.divider}40`,
  },
  tabPill: {
    borderRadius: '20px',
    padding: theme.spacing(0.75, 2.5),
    minWidth: 0,
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.5, 1.5),
      fontSize: '0.8rem',
    }
  },
  tabPillActive: {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    color: '#fff',
    boxShadow: `0 2px 8px ${theme.palette.primary.main}40`,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      boxShadow: `0 4px 12px ${theme.palette.primary.main}60`,
    }
  },
  tabPillInactive: {
    color: theme.palette.text.secondary,
    '&:hover': {
      background: `${theme.palette.action.hover}`,
    }
  },
  // Quick action icons
  quickActions: {
    display: 'flex',
    gap: theme.spacing(0.5),
    alignItems: 'center',
  },
  quickActionBtn: {
    color: theme.palette.text.secondary,
    transition: 'all 0.2s ease',
    '&:hover': {
      color: theme.palette.primary.main,
      background: `${theme.palette.primary.main}15`,
    }
  },
  // Search area with glass effect
  searchArea: {
    background: `${theme.palette.background.paper}B3`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${theme.palette.divider}40`,
    borderRadius: '12px',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
      marginBottom: theme.spacing(1.5),
    }
  },
  resultsContainer: {
    marginTop: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(0.5)
    }
  }
}));

const SearchCommon = ({
  searchType = 'content',
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
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();
  const handleLogout = useLogout();

  const isUserSearch = searchType === 'user';
  const placeholder = isUserSearch ? "Search creators..." : "Search content...";
  const tagType = isUserSearch ? "user" : "searchable";
  const filterTitle = isUserSearch ? "Filter by Creator Tags" : "Filter by Content Tags";

  const handleTabSwitch = (tab) => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    params.set('page', '1');
    history.replace(`/search?${params.toString()}`);
  };

  return (
    <Box data-testid={testIds.page.container(`search-${searchType}`)} sx={{ ...componentSpacing.pageContainer(theme), position: 'relative' }}>
      <Grid container margin={0} spacing={0} padding={0} sx={{ position: 'relative', zIndex: 1 }}>

        {/* Top Navigation Bar */}
        <Grid item xs={12}>
          <Box className={classes.topNav}>
            {/* Tab Pills */}
            <Box className={classes.tabPills}>
              <Button
                className={`${classes.tabPill} ${isUserSearch ? classes.tabPillActive : classes.tabPillInactive}`}
                onClick={() => handleTabSwitch('creators')}
                disableElevation
                data-testid={testIds.button.nav('tab-creators')}
              >
                Creators
              </Button>
              <Button
                className={`${classes.tabPill} ${!isUserSearch ? classes.tabPillActive : classes.tabPillInactive}`}
                onClick={() => handleTabSwitch('content')}
                disableElevation
                data-testid={testIds.button.nav('tab-content')}
              >
                Content
              </Button>
            </Box>

            {/* Quick Actions */}
            <Box className={classes.quickActions}>
              <Tooltip title="Publish">
                <IconButton
                  className={classes.quickActionBtn}
                  onClick={() => navigateWithStack(history, '/publish-allinone')}
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Dashboard">
                <IconButton
                  className={classes.quickActionBtn}
                  onClick={() => navigateWithStack(history, '/dashboard')}
                  size="small"
                >
                  <DashboardIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Profile">
                <IconButton
                  className={classes.quickActionBtn}
                  onClick={() => navigateWithStack(history, '/edit-profile')}
                  size="small"
                >
                  <PersonIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton
                  className={classes.quickActionBtn}
                  onClick={handleLogout}
                  size="small"
                >
                  <ExitToAppIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        {/* Search Area — glass card */}
        <Grid item xs={12}>
          <Box className={classes.searchArea}>
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
            />
          </Box>
        </Grid>

        {showFilters && (
          <Grid item xs={12} style={{ marginTop: 0, position: 'relative' }}>
            <TagFilter
              tagType={tagType}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              onSearch={() => {
                setShowFilters(false);
                onSearch(1);
              }}
              title={filterTitle}
            />
          </Grid>
        )}

        {/* Results Section */}
        <Grid item xs={12} className={classes.resultsContainer} data-testid={testIds.page.content(`search-${searchType}-results`)}>
          {children}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SearchCommon;
