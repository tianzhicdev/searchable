import React from 'react';
import { Box, Typography, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    marginBottom: theme.spacing(3)
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2)
  },
  title: {
    fontWeight: 600,
    color: theme.palette.text.primary
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5)
  },
  divider: {
    marginTop: theme.spacing(2)
  }
}));

const SectionHeader = ({
  title,
  subtitle,
  action,
  divider = false,
  titleVariant = 'h5',
  className,
  titleClassName,
  subtitleClassName
}) => {
  const classes = useStyles();

  return (
    <Box className={`${classes.container} ${className || ''}`}>
      <Box className={classes.header}>
        <Box flex={1}>
          <Typography 
            variant={titleVariant} 
            className={`${classes.title} ${titleClassName || ''}`}
          >
            {title}
          </Typography>
          
          {subtitle && (
            <Typography 
              variant="body2" 
              className={`${classes.subtitle} ${subtitleClassName || ''}`}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {action && (
          <Box ml={2}>
            {action}
          </Box>
        )}
      </Box>
      
      {divider && <Divider className={classes.divider} />}
    </Box>
  );
};

export default SectionHeader;