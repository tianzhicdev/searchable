import React from 'react';
import { 
  Box,
  Typography,
  Chip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import TagChip from './TagChip';

const useStyles = makeStyles((theme) => ({
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  moreIndicator: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    height: '24px',
    margin: theme.spacing(0.25),
    cursor: 'pointer'
  },
  emptyMessage: {
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
    fontSize: '0.875rem'
  }
}));

const TagList = ({ 
  tags = [], 
  maxVisible = null, 
  clickable = false, 
  deletable = false,
  onTagClick = null,
  onTagDelete = null,
  emptyMessage = "No tags",
  showMoreCallback = null
}) => {
  const classes = useStyles();
  
  if (!tags || tags.length === 0) {
    return (
      <Typography className={classes.emptyMessage}>
        {emptyMessage}
      </Typography>
    );
  }
  
  // Determine which tags to show
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = maxVisible && tags.length > maxVisible ? tags.length - maxVisible : 0;
  
  const handleShowMore = () => {
    if (showMoreCallback) {
      showMoreCallback();
    }
  };
  
  return (
    <Box className={classes.tagContainer}>
      {visibleTags.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          clickable={clickable}
          deletable={deletable}
          onClick={onTagClick}
          onDelete={onTagDelete}
        />
      ))}
      
      {hiddenCount > 0 && (
        <Chip
          label={`+${hiddenCount} more`}
          className={classes.moreIndicator}
          size="small"
          onClick={handleShowMore}
        />
      )}
    </Box>
  );
};

export default TagList;
