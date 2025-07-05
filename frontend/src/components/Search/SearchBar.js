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

const useStyles = makeStyles((theme) => ({
  searchContainer: {
    marginBottom: theme.spacing(2)
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  },
  searchField: {
    flex: 1
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
    <Box className={classes.searchContainer}>
      <form onSubmit={handleSubmit} className={classes.searchForm}>
        <TextField
          className={classes.searchField}
          placeholder={placeholder}
          variant="outlined"
          size="medium"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
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
                  onClick={() => onSearchTermChange('')}
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
        >
          <SearchIcon />
        </IconButton>
        
        <IconButton
          variant="contained"
          color={showFilters ? "primary" : "default"}
          onClick={onToggleFilters}
        >
          <FilterIcon />
        </IconButton>
      </form>
    </Box>
  );
};

export default SearchBar;
