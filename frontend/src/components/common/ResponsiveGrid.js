import React from 'react';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { responsiveSpacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  container: {
    marginBottom: responsiveSpacing(2)
  }
}));

const ResponsiveGrid = ({
  children,
  spacing = 3,
  columns = { xs: 12, sm: 6, md: 4, lg: 3 },
  containerProps = {},
  itemProps = {},
  className
}) => {
  const classes = useStyles();

  return (
    <Grid 
      container 
      spacing={spacing}
      className={`${classes.container} ${className || ''}`}
      {...containerProps}
    >
      {React.Children.map(children, (child, index) => {
        if (!child) return null;
        
        return (
          <Grid 
            item 
            key={index}
            xs={columns.xs}
            sm={columns.sm}
            md={columns.md}
            lg={columns.lg}
            xl={columns.xl}
            {...itemProps}
          >
            {child}
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ResponsiveGrid;