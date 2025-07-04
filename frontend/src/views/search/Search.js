import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { 
  Grid, Box
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import SearchByContent from '../search/SearchByContent';
import SearchByUser from '../search/SearchByUser';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(0)
  }
}));

const Landing = () => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  
  // Determine which component to show based on URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');
  const showCreators = tab === 'creators';
  
  return (
    // <Grid id="search-by-container" container className={classes.container}>
      // <Grid item xs={12}>
      <div>
        {showCreators ? (
          <SearchByUser />
        ) : (
          <SearchByContent />
        )}
        </div>
      // </Grid>
    // </Grid>
  );
};

export default Landing;