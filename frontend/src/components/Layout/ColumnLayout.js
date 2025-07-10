import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  columnLayout: {
    columnCount: 2,
    columnGap: theme.spacing(3), // 24px on desktop
    [theme.breakpoints.down('sm')]: {
      columnGap: theme.spacing(2), // 16px on mobile
      columnCount: 1
    }
  },
  columnItem: {
    breakInside: 'avoid',
    marginBottom: theme.spacing(3), // 24px on desktop
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(2) // 16px on mobile
    }
  }
}));

/**
 * ColumnLayout component that displays children in a vertical-fill column layout
 * Items fill the left column first, then the right column
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The items to display in columns
 * @param {number} props.columns - Number of columns (default: 2)
 * @param {string} props.className - Additional CSS class
 */
const ColumnLayout = ({ children, columns = 2, className = '' }) => {
  const classes = useStyles();
  
  const columnStyle = {
    columnCount: columns,
    ...((columns !== 2) && { columnCount: columns })
  };
  
  return (
    <Box 
      className={`${classes.columnLayout} ${className}`}
      style={columnStyle}
    >
      {React.Children.map(children, (child, index) => (
        <Box key={index} className={classes.columnItem}>
          {child}
        </Box>
      ))}
    </Box>
  );
};

export default ColumnLayout;