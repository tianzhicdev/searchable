import React from 'react';
import { Button } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';

/**
 * Standardized page header button component
 * Ensures consistent styling for all top navigation buttons
 */
const PageHeaderButton = ({ 
  onClick, 
  children = "Back",
  ...props 
}) => {
  const classes = useComponentStyles();
  
  return (
    <Button
      onClick={onClick}
      className={classes.backButton}
      variant="text"
      {...props}
    >
      {children}
    </Button>
  );
};

export default PageHeaderButton;