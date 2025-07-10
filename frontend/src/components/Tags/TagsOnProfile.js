import React from 'react';
import { Typography, useMediaQuery } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  tagText: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.8125rem',
      lineHeight: 1.4
    }
  }
}));

const TagsOnProfile = ({ tags = [] }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!tags || tags.length === 0) {
    return null;
  }
  
  // Extract tag names and join with separator
  const separator = isMobile ? ' · ' : ' / ';
  const tagNames = tags.map(tag => tag.name).join(separator);
  
  return (
    <Typography variant="caption" className={classes.tagText}>
      {tagNames}
    </Typography>
  );
};

export default TagsOnProfile;