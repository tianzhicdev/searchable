import React from 'react';
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  Paper
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import MiniUserProfile from '../Profiles/MiniUserProfile';

const useStyles = makeStyles((theme) => ({
  resultsContainer: {
    marginTop: theme.spacing(2)
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px'
  },
  emptyContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    flexDirection: 'column'
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2)
  },
  resultsHeader: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resultsCount: {
    color: theme.palette.text.secondary
  },
  gridItem: {
    display: 'flex'
  }
}));

const UserSearchResults = ({
  users = [],
  loading = false,
  pagination = null,
  onUserClick = null,
  emptyMessage = "No users found",
  emptySubtext = "Try adjusting your search filters or search terms."
}) => {
  const classes = useStyles();
  
  if (loading) {
    return (
      <Box className={classes.loadingContainer}>
        <CircularProgress size={40} />
      </Box>
    );
  }
  
  if (!users || users.length === 0) {
    return (
      <Box className={classes.emptyContainer}>
        <Typography variant="h6" className={classes.emptyMessage}>
          {emptyMessage}
        </Typography>
        <Typography variant="body2" className={classes.emptyMessage}>
          {emptySubtext}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box className={classes.resultsContainer}>
      {/* Results Header */}
      <Box className={classes.resultsHeader}>
        <Typography variant="h6">
          User Search Results
        </Typography>
        {pagination && (
          <Typography variant="body2" className={classes.resultsCount}>
            {pagination.total} user{pagination.total !== 1 ? 's' : ''} found
          </Typography>
        )}
      </Box>
      
      {/* Results Grid */}
      <Grid container spacing={2}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={user.id} className={classes.gridItem}>
            <MiniUserProfile
              user={user}
              onClick={onUserClick}
              showButton={true}
            />
          </Grid>
        ))}
      </Grid>
      
      {/* Pagination info */}
      {pagination && pagination.pages > 1 && (
        <Box mt={2}>
          <Typography variant="body2" color="textSecondary" align="center">
            Page {pagination.page} of {pagination.pages}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UserSearchResults;