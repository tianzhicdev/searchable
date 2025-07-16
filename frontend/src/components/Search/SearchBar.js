import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton
} from '@material-ui/core';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { testIds } from '../../utils/testIds';

const useStyles = makeStyles((theme) => ({
  searchContainer: {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1.5)
    }
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(0.5)
    }
  },
  searchField: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      // Touch-friendly sizing on mobile
      [theme.breakpoints.down('sm')]: {
        minHeight: 48,
        '& input': {
          padding: '12px 14px',
          fontSize: '16px' // Prevents zoom on iOS
        }
      }
    }
  },
  iconButton: {
    // Touch-friendly sizing
    minWidth: 44,
    minHeight: 44,
    [theme.breakpoints.down('sm')]: {
      minWidth: 48,
      minHeight: 48,
      padding: theme.spacing(1)
    }
  }
}));

const SearchBar = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  onToggleFilters,
  onClear,
  showFilters = false,
  filterCount = 0,
  loading = false,
  placeholder = "Search...",
  searchButtonText = "Search"
}) => {
  const classes = useStyles();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <Box className={classes.searchContainer} data-testid={testIds.page.container('search-bar')}>
      <form onSubmit={handleSubmit} className={classes.searchForm} data-testid={testIds.form.container('search')}>
        <TextField
          className={classes.searchField}
          placeholder={placeholder}
          variant="outlined"
          size="medium"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          data-testid={testIds.input.search('main')}
          InputProps={{
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onSearchTermChange('')}
                  data-testid={testIds.button.nav('clear-search')}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <IconButton
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          className={classes.iconButton}
          data-testid={testIds.button.submit('search')}
        >
          <SearchIcon />
        </IconButton>
        
        <IconButton
          variant="contained"
          color={showFilters ? "primary" : "default"}
          onClick={onToggleFilters}
          className={classes.iconButton}
          data-testid={testIds.button.nav('toggle-filters')}
        >
          <FilterIcon />
        </IconButton>
      </form>
    </Box>
  );
};

export default SearchBar;