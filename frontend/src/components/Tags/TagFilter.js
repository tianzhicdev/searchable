import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Box,
  Button,
  Chip
} from '@material-ui/core';
import { Clear as ClearIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import Backend from '../../views/utilities/Backend';

const useStyles = makeStyles((theme) => ({
  filterContainer: {
    width: '350px',
    maxWidth: '100%',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    position: 'absolute',
    right: 0,
    zIndex: 1200,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    backgroundColor: theme.palette.background.paper,
    marginTop: theme.spacing(1)
  },
  filterHeader: {
    marginBottom: theme.spacing(2)
  },
  tagGroup: {
    maxHeight: '300px',
    overflowY: 'scroll',
    marginBottom: theme.spacing(1),
    padding: theme.spacing(0.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    '&::-webkit-scrollbar': {
      width: '8px',
      visibility: 'visible',
      display: 'block'
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: theme.palette.primary.light + '20',
      borderRadius: '4px'
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.primary.main,
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark
      }
    }
  },
  clearButton: {
    marginTop: theme.spacing(1)
  },
  selectedTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  }
}));

const TagFilter = ({
  tagType = 'user', // 'user' or 'searchable'
  selectedTags = [],
  onTagsChange,
  title = null
}) => {
  const classes = useStyles();
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Auto-generate title if not provided
  const displayTitle = title || `Filter by ${tagType === 'user' ? 'User' : 'Content'} Tags`;
  
  useEffect(() => {
    loadAvailableTags();
  }, [tagType]);
  
  const loadAvailableTags = async () => {
    setLoading(true);
    
    try {
      const response = await Backend.get(`v1/tags?type=${tagType}&active=true`);
      if (response.data && response.data.success) {
        setAvailableTags(response.data.tags || []);
      }
    } catch (err) {
      console.error('Error loading tags:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTagToggle = (tag) => {
    const isSelected = selectedTags.find(selected => selected.id === tag.id);
    
    if (isSelected) {
      // Remove tag
      const newTags = selectedTags.filter(selected => selected.id !== tag.id);
      onTagsChange(newTags);
    } else {
      // Add tag
      const newTags = [...selectedTags, tag];
      onTagsChange(newTags);
    }
  };
  
  const handleClearAll = () => {
    onTagsChange([]);
  };
  
  const handleTagRemove = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag.id !== tagToRemove.id);
    onTagsChange(newTags);
  };
  
  return (
    <Paper className={classes.filterContainer}>
      <Typography variant="h6" className={classes.filterHeader}>
        {displayTitle}
        {selectedTags.length > 0 && (
          <Typography variant="caption" color="primary" style={{ marginLeft: 8 }}>
            ({selectedTags.length} active)
          </Typography>
        )}
      </Typography>
      
      <Box>
        {/* Selected tags display */}
        {selectedTags.length > 0 && (
          <Box className={classes.selectedTagsContainer}>
            {selectedTags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                onDelete={() => handleTagRemove(tag)}
                color={tag.tag_type === 'user' ? 'primary' : 'secondary'}
              />
            ))}
          </Box>
        )}
        
        {/* Available tags checkboxes */}
        <Box className={classes.tagGroup}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.find(selected => selected.id === tag.id);
            
            return (
              <FormControlLabel
                key={tag.id}
                style={{ display: 'block', margin: '4px 0', width: '100%' }}
                control={
                  <Checkbox
                    checked={!!isSelected}
                    onChange={() => handleTagToggle(tag)}
                    size="small"
                    color={tag.tag_type === 'user' ? 'primary' : 'secondary'}
                  />
                }
                label={tag.name}
              />
            );
          })}
        </Box>
        
        {loading && (
          <Typography variant="body2" color="textSecondary">
            Loading tags...
          </Typography>
        )}
        
        {!loading && availableTags.length === 0 && (
          <Typography variant="body2" color="textSecondary">
            No tags available
          </Typography>
        )}
        
        {/* Clear all button */}
        {selectedTags.length > 0 && (
          <Button
            className={classes.clearButton}
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
          >
            Clear All Filters
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default TagFilter;
