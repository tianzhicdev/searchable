import React from 'react';
import {
  Box,
  Button,
  Typography
} from '@material-ui/core';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3)
  },
  pageButton: {
    minWidth: '36px',
    padding: theme.spacing(0.5, 1)
  }
}));

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  disabled = false
}) => {
  const classes = useStyles();
  
  if (totalPages <= 1) {
    return null;
  }
  
  const handlePreviousPage = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };
  
  return (
    <Box className={classes.paginationContainer}>
      {/* Previous page button - only show if not on first page */}
      {currentPage > 1 && (
        <Button
          className={classes.pageButton}
          variant="outlined"
          size="small"
          onClick={handlePreviousPage}
          disabled={disabled}
        >
          <ChevronLeftIcon />
        </Button>
      )}
      
      {/* Current page number */}
      <Button
        className={classes.pageButton}
        variant="contained"
        color="primary"
        size="small"
        disabled
      >
        {currentPage}
      </Button>
      
      {/* Next page button - only show if not on last page */}
      {currentPage < totalPages && (
        <Button
          className={classes.pageButton}
          variant="outlined"
          size="small"
          onClick={handleNextPage}
          disabled={disabled}
        >
          <ChevronRightIcon />
        </Button>
      )}
    </Box>
  );
};

export default Pagination;
