import React from 'react';
import { 
  Box,
  Typography,
  Chip,
  useMediaQuery
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core/styles';
import TagChip from './TagChip';
import { touchTargets } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(0.5)
    }
  },
  moreIndicator: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    minHeight: 32,
    height: 'auto',
    margin: theme.spacing(0.5),
    cursor: 'pointer',
    '& .MuiChip-label': {
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
      paddingTop: theme.spacing(0.5),
      paddingBottom: theme.spacing(0.5),
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem',
      minHeight: touchTargets.clickable.minHeight - 16,
      margin: theme.spacing(0.25),
      '& .MuiChip-label': {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
      }
    },
    '&:hover': {
      backgroundColor: theme.palette.grey[400]
    }
  },
  emptyMessage: {
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
    fontSize: '0.875rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.8125rem'
    }
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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