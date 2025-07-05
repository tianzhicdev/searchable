import React from 'react';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  tagText: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem'
  }
}));

const TagsOnProfile = ({ tags = [] }) => {
  const classes = useStyles();
  
  if (!tags || tags.length === 0) {
    return null;
  }
  
  // Extract tag names and join with separator
  const tagNames = tags.map(tag => tag.name).join(' / ');
  
  return (
    <Typography variant="caption" className={classes.tagText}>
      {tagNames}
    </Typography>
  );
};

export default TagsOnProfile;
