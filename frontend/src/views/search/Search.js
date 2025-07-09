import React from 'react';
import { useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import SearchByContent from '../search/SearchByContent';
import SearchByUser from '../search/SearchByUser';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(0)
  }
}));

const Landing = () => {
  const location = useLocation();
  
  // Determine which component to show based on URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');
  // Default to creators tab if no tab specified
  const showCreators = tab === 'creators' || !tab;
  
  return (
      <div>
        {showCreators ? (
          <SearchByUser />
        ) : (
          <SearchByContent />
        )}
        </div>
  );
};

export default Landing;