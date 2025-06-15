import React from 'react';
import { Grid, Typography, Button, Box } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { useHistory } from 'react-router-dom';
import useComponentStyles from '../../themes/componentStyles';

const SearchableDetailsHeader = ({ 
  title, 
  loading = false, 
  backPath = '/searchables',
  actions = null 
}) => {
  const classes = useComponentStyles();
  const history = useHistory();

  const handleBackClick = () => {
    history.push(backPath);
  };

  return (
    <Grid container spacing={2} alignItems="center" className={classes.marginMd}>
      <Grid item>
        <Button
          startIcon={<ChevronLeftIcon />}
          onClick={handleBackClick}
          className={classes.backButton}
        >
          Back
        </Button>
      </Grid>
      <Grid item xs>
        <Typography variant="h4" className={classes.title}>
          {loading ? 'Loading...' : title || 'Searchable Item'}
        </Typography>
      </Grid>
      {actions && (
        <Grid item>
          <Box display="flex" gap={1}>
            {actions}
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default SearchableDetailsHeader;