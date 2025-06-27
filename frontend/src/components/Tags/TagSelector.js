import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  Typography,
  FormControl,
  FormLabel,
  Alert
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import backend from '../../mocks/mockBackend';
import TagChip from './TagChip';

const useStyles = makeStyles((theme) => ({
  formControl: {
    marginBottom: theme.spacing(2),
    width: '100%'
  },
  selectedTagsContainer: {
    marginTop: theme.spacing(1),
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5)
  },
  limitMessage: {
    marginTop: theme.spacing(1),
    fontSize: '0.75rem',
    color: theme.palette.text.secondary
  },
  errorMessage: {
    marginTop: theme.spacing(1)
  }
}));

const TagSelector = ({
  tagType = 'user', // 'user' or 'searchable'
  selectedTags = [],
  onTagsChange,
  maxTags = 10,
  label = null,
  placeholder = "Search and select tags...",
  disabled = false
}) => {
  const classes = useStyles();
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Auto-generate label if not provided
  const displayLabel = label || `${tagType === 'user' ? 'User' : 'Content'} Tags`;
  
  useEffect(() => {
    loadAvailableTags();
  }, [tagType]);
  
  const loadAvailableTags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await backend.get(`/api/v1/tags?type=${tagType}&active=true`);
      if (response.data && response.data.success) {
        setAvailableTags(response.data.tags || []);
      } else {
        setError('Failed to load available tags');
      }
    } catch (err) {
      console.error('Error loading tags:', err);
      setError('Failed to load available tags');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTagSelect = (event, newTags) => {
    // Limit the number of selected tags
    if (newTags.length <= maxTags) {
      onTagsChange(newTags);
    }
  };
  
  const handleTagRemove = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag.id !== tagToRemove.id);
    onTagsChange(newTags);
  };
  
  // Filter out already selected tags from available options
  const unselectedTags = availableTags.filter(
    tag => !selectedTags.find(selected => selected.id === tag.id)
  );
  
  const isMaxReached = selectedTags.length >= maxTags;
  
  return (
    <FormControl className={classes.formControl}>
      {displayLabel && (
        <FormLabel component="legend">
          {displayLabel}
        </FormLabel>
      )}
      
      <Autocomplete
        multiple
        options={unselectedTags}
        getOptionLabel={(option) => option.name}
        value={selectedTags}
        onChange={handleTagSelect}
        loading={loading}
        disabled={disabled || isMaxReached}
        renderTags={() => null} // We'll render tags separately below
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder={isMaxReached ? `Maximum ${maxTags} tags selected` : placeholder}
            size="small"
          />
        )}
        renderOption={(option) => (
          <Box display="flex" alignItems="center">
            <Typography variant="body2">{option.name}</Typography>
            {option.description && (
              <Typography 
                variant="caption" 
                color="textSecondary" 
                style={{ marginLeft: 8 }}
              >
                - {option.description}
              </Typography>
            )}
          </Box>
        )}
      />
      
      {/* Display selected tags */}
      {selectedTags.length > 0 && (
        <Box className={classes.selectedTagsContainer}>
          {selectedTags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              deletable={!disabled}
              onDelete={handleTagRemove}
            />
          ))}
        </Box>
      )}
      
      {/* Limit message */}
      <Typography className={classes.limitMessage}>
        {selectedTags.length}/{maxTags} tags selected
        {isMaxReached && " (maximum reached)"}
      </Typography>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" className={classes.errorMessage}>
          {error}
        </Alert>
      )}
    </FormControl>
  );
};

export default TagSelector;