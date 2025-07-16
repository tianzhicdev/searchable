import React, { useState } from 'react';
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
  Payment as PaymentIcon,
  CloudUpload as CloudUploadIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { useHistory } from 'react-router-dom';
import { useLogout } from '../../components/LogoutHandler';
import TagFilter from '../../components/Tags/TagFilter';
import SearchBar from '../../components/Search/SearchBar';
import { navigateWithStack } from '../../utils/navigationUtils';
import { testIds } from '../../utils/testIds';

const useStyles = makeStyles((theme) => ({
  searchBarContainer: {
    marginTop: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(1.5)
    }
  },
  resultsContainer: {
    marginTop: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(1.5)
    }
  }
}));

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
  const classes = useStyles();

  const isUserSearch = searchType === 'user';
  const placeholder = isUserSearch ? "Search by username..." : "Search content...";
  const searchButtonText = isUserSearch ? "Search Users" : "Search Content";
  const tagType = isUserSearch ? "user" : "searchable";
  const filterTitle = isUserSearch ? "Filter by User Tags" : "Filter by Content Tags";

  return (
    <Box data-testid={testIds.page.container(`search-${searchType}`)}>
      <Grid container margin={0} spacing={0} padding={0}>
        <Grid item xs={12} className={classes.searchBarContainer}>
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