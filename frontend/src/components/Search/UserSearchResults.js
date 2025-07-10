import React from 'react';
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  Paper
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import MiniProfile from '../Profiles/MiniProfile';
import Pagination from '../Pagination/Pagination';
import ColumnLayout from '../Layout/ColumnLayout';

const useStyles = makeStyles((theme) => ({
  resultsContainer: {
    marginTop: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(1.5)
    }
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      minHeight: '150px'
    }
  },
  emptyContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    flexDirection: 'column',
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      minHeight: '150px'
    }
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1.5),
      fontSize: '0.875rem'
    }
  },
  resultsHeader: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1.5)
    }
  },
  resultsCount: {
    color: theme.palette.text.secondary
  },
  paginationBox: {
    marginTop: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(2)
    }
  }
}));

const UserSearchResults = ({
  users = [],
  loading = false,
  pagination = null,
  onUserClick = null,
  onPageChange = null,
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
    <>
      {/* Results in column layout - fills left column first, then right */}
      <ColumnLayout columns={2}>
        {users.map((user) => (
          <MiniProfile
            key={user.id}
            type="user"
            data={user}
            onClick={onUserClick}
          />
        ))}
      </ColumnLayout>
      
      {/* Pagination */}
      {pagination && onPageChange && (
        <Box className={classes.paginationBox}>
          <Pagination
            currentPage={pagination.page || pagination.current_page || 1}
            totalPages={pagination.totalPages || pagination.pages || pagination.total_pages || 1}
            totalItems={pagination.totalCount || pagination.total || pagination.total_count || 0}
            onPageChange={onPageChange}
            disabled={loading}
          />
        </Box>
      )}
    </>
  );
};

export default UserSearchResults;