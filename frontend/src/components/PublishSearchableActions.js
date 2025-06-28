import React from 'react';
import { Grid, Button, Box, CircularProgress } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import useComponentStyles from '../themes/componentStyles';
import { navigateWithStack } from '../utils/navigationUtils';

const PublishSearchableActions = ({
  loading = false,
  disabled = false,
  onSubmit,
  submitText = "Publish",
  loadingText = "Publishing..."
}) => {
  const classes = useComponentStyles();
  const history = useHistory();

  return (
    <Grid item xs={12}>
      <Box className={classes.formActions}>
        <Button 
          variant="contained"
          className={classes.button} 
          onClick={() => navigateWithStack(history, '/landing')}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          variant="contained" 
          className={classes.button}
          disabled={loading || disabled}
          onClick={onSubmit}
        >
          {loading ? <CircularProgress size={20} /> : submitText}
        </Button>
      </Box>
    </Grid>
  );
};

export default PublishSearchableActions;