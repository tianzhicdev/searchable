import React from 'react';
import { Grid, Button, Box, CircularProgress } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import useComponentStyles from '../themes/componentStyles';
import { navigateWithStack } from '../utils/navigationUtils';
import ActionButtonLabel from './common/ActionButtonLabel';

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
          onClick={() => navigateWithStack(history, '/search')}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          variant="contained" 
          className={classes.button}
          disabled={loading || disabled}
          onClick={onSubmit}
          aria-label={loading ? loadingText : submitText}
          title={loading ? loadingText : submitText}
        >
          {loading ? (
            <CircularProgress size={20} aria-label={loadingText} />
          ) : (
            <ActionButtonLabel label={submitText} />
          )}
        </Button>
      </Box>
    </Grid>
  );
};

export default PublishSearchableActions;
