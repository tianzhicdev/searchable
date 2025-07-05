import React, { useState, useEffect } from 'react';
import {
  Select,
  MenuItem,
  Box,
  Typography,
  FormControl,
  FormLabel,
  Alert,
  OutlinedInput
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Backend from '../../views/utilities/Backend';
import TagChip from './TagChip';

const useStyles = makeStyles((theme) => ({
  formControl: {
    marginBottom: theme.spacing(2),
    width: '100%'
  },
  select: {
    width: '100%',
    '& .MuiSelect-select': {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1)
    }
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
  },
  menuPaper: {
    maxHeight: 400,
    width: 350,
    '& .MuiList-root': {
      paddingTop: 0,
      paddingBottom: 0,
      maxHeight: 400,
      overflowY: 'scroll',
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
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagType]);
  
  const loadAvailableTags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await Backend.get(`v1/tags?type=${tagType}&active=true`);
      
      if (response.data && response.data.success && Array.isArray(response.data.tags)) {
        // Ensure each tag has required properties
        const validTags = response.data.tags.filter(tag => tag && tag.id && tag.name);
        setAvailableTags(validTags);
      } else {
        setAvailableTags([]);
        setError('Failed to load available tags');
      }
    } catch (err) {
      console.error('Error loading tags:', err);
      setAvailableTags([]);
      setError('Failed to load available tags');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTagSelect = (event) => {
    const selectedIds = event.target.value;
    
    // Limit the number of selected tags
    if (selectedIds.length <= maxTags) {
      // Convert selected IDs to tag objects
      const newSelectedTags = selectedIds.map(id => 
        availableTags.find(tag => tag.id === id)
      ).filter(Boolean);
      
      onTagsChange(newSelectedTags);
    }
  };
  
  const handleTagRemove = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag.id !== tagToRemove.id);
    onTagsChange(newTags);
  };
  
  const isMaxReached = selectedTags.length >= maxTags;
  
  // Get array of selected tag IDs for the Select component
  const selectedTagIds = selectedTags.map(tag => tag.id);
  
  return (
    <FormControl className={classes.formControl}>
      {displayLabel && (
        <FormLabel component="legend">
          {displayLabel}
        </FormLabel>
      )}
      
      <Select
        multiple
        value={selectedTagIds}
        onChange={handleTagSelect}
        input={<OutlinedInput />}
        disabled={disabled || loading}
        displayEmpty
        className={classes.select}
        size="small"
        MenuProps={{
          classes: { paper: classes.menuPaper },
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          getContentAnchorEl: null,
          PaperProps: {
            style: {
              maxHeight: 400,
              width: 350,
            }
          }
        }}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <Typography color="textSecondary">{placeholder}</Typography>;
          }
          return `${selected.length} tag${selected.length > 1 ? 's' : ''} selected`;
        }}
      >
        <MenuItem disabled value="">
          <Typography color="textSecondary">
            {isMaxReached ? `Maximum ${maxTags} tags selected` : placeholder}
          </Typography>
        </MenuItem>
        {loading && (
          <MenuItem disabled>
            <Typography variant="body2">Loading tags...</Typography>
          </MenuItem>
        )}
        {!loading && availableTags.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2">No tags available</Typography>
          </MenuItem>
        )}
        {!loading && availableTags.map((tag) => (
          <MenuItem 
            key={tag.id} 
            value={tag.id}
            disabled={isMaxReached && !selectedTagIds.includes(tag.id)}
          >
            <Box display="flex" alignItems="center" width="100%">
              <Typography variant="body2">{tag.name}</Typography>
              {tag.description && (
                <Typography 
                  variant="caption" 
                  color="textSecondary" 
                  style={{ marginLeft: 8 }}
                >
                  - {tag.description}
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
      
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
