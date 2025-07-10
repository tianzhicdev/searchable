import React, { useState, useEffect } from 'react';
import {
  Select,
  MenuItem,
  Box,
  Typography,
  FormControl,
  FormLabel,
  Alert,
  OutlinedInput,
  useMediaQuery
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core/styles';
import Backend from '../../views/utilities/Backend';
import TagChip from './TagChip';
import { componentSpacing, touchTargets } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  formControl: {
    marginBottom: theme.spacing(2),
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1.5)
    }
  },
  select: {
    width: '100%',
    '& .MuiSelect-select': {
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
      minHeight: touchTargets.input.height - 32, // Account for borders/padding
      [theme.breakpoints.down('sm')]: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        minHeight: touchTargets.input.mobileHeight - 28,
        fontSize: '0.875rem'
      }
    }
  },
  selectedTagsContainer: {
    marginTop: theme.spacing(1.5),
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(1),
      gap: theme.spacing(0.5)
    }
  },
  limitMessage: {
    marginTop: theme.spacing(1),
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(0.75),
      fontSize: '0.7rem'
    }
  },
  errorMessage: {
    marginTop: theme.spacing(1)
  },
  menuPaper: {
    maxHeight: 400,
    width: 350,
    [theme.breakpoints.down('sm')]: {
      maxHeight: '60vh',
      width: '90vw',
      maxWidth: 300
    },
    '& .MuiList-root': {
      paddingTop: 0,
      paddingBottom: 0,
      maxHeight: 400,
      overflowY: 'scroll',
      [theme.breakpoints.down('sm')]: {
        maxHeight: '60vh'
      },
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
  },
  menuItem: {
    minHeight: touchTargets.clickable.minHeight,
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      minHeight: touchTargets.clickable.minHeight - 4,
      paddingTop: theme.spacing(0.75),
      paddingBottom: theme.spacing(0.75)
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
            className={classes.menuItem}
          >
            <Box display="flex" alignItems="center" width="100%">
              <Typography variant={isMobile ? "body2" : "body1"}>{tag.name}</Typography>
              {tag.description && !isMobile && (
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