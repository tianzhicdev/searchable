import React, { useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import SearchByContent from '../search/SearchByContent';
import SearchByUser from '../search/SearchByUser';
import { testIds } from '../../utils/testIds';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(0)
  }
}));

const Landing = () => {
  const location = useLocation();
  const history = useHistory();
  
  // Determine which component to show based on URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');
  
  useEffect(() => {
    // If no tab parameter, redirect to creators tab
    if (!tab) {
      history.replace('/search?tab=creators');
    }
  }, [tab, history]);
  
  // Show creators if tab is creators or not specified (before redirect)
  const showCreators = tab === 'creators' || !tab;
  
  return (
      <div data-testid={testIds.page.container('search')}>
        {showCreators ? (
          <SearchByUser />
        ) : (
          <SearchByContent />
        )}
      </div>
  );
};

export default Landing;