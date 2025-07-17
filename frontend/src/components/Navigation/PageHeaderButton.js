import React from 'react';
import { Button } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';
import { testIds } from '../../utils/testIds';

/**
 * Standardized page header button component
 * Ensures consistent styling for all top navigation buttons
 */
const PageHeaderButton = ({ 
  onClick, 
  children = "Back",
  testId,
  ...props 
}) => {
  const classes = useComponentStyles();
  
  // Generate test ID based on children content if not provided
  const defaultTestId = testIds.button.nav(
    children.toString().toLowerCase().replace(/\s+/g, '-')
  );
  
  return (
    <Button
      onClick={onClick}
      className={classes.backButton}
      variant="text"
      data-testid={testId || defaultTestId}
      {...props}
    >
      {children}
    </Button>
  );
};

export default PageHeaderButton;