import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  useMediaQuery
} from '@material-ui/core';
import { Clear as ClearIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core/styles';
import Backend from '../../views/utilities/Backend';
import { componentSpacing, touchTargets } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  filterContainer: {
    width: '350px',
    maxWidth: '100%',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2.5),
    position: 'absolute',
    right: 0,
    zIndex: 1200,
    boxShadow: theme.shadows[4],
    backgroundColor: theme.palette.background.paper,
    marginTop: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      width: '90vw',
      maxWidth: '100%',
      padding: theme.spacing(2),
      right: theme.spacing(1)
    }
  },
  filterHeader: {
    marginBottom: theme.spacing(2)
  },
  tagGroup: {
    maxHeight: '300px',
    overflowY: 'auto',
    marginBottom: theme.spacing(1.5),
    padding: theme.spacing(1),
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      maxHeight: '40vh',
      padding: theme.spacing(0.5),
      gap: theme.spacing(0.75)
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
  },
  clearButton: {
    marginTop: theme.spacing(1.5),
    minHeight: touchTargets.clickable.minHeight,
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(1),
      minHeight: touchTargets.clickable.minHeight - 4,
      fontSize: '0.875rem'
    }
  },
  selectedTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(0.5),
      marginBottom: theme.spacing(1)
    }
  },
  chip: {
    minHeight: 32,
    height: 'auto',
    '& .MuiChip-label': {
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
      paddingTop: theme.spacing(0.5),
      paddingBottom: theme.spacing(0.5),
      fontSize: '0.875rem'
    },
    [theme.breakpoints.down('sm')]: {
      minHeight: touchTargets.clickable.minHeight - 16,
      '& .MuiChip-label': {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        fontSize: '0.75rem'
      }
    }
  },
  chipSecondary: {
    // For retro80s theme, use black text on bright green background
    color: theme.palette.secondary === '#00ff00' ? '#000000' : theme.palette.getContrastText(theme.palette.secondary.main),
    '& .MuiChip-deleteIcon': {
      color: theme.palette.secondary === '#00ff00' ? '#000000' : theme.palette.getContrastText(theme.palette.secondary.main)
    }
  },
  tagButton: {
    minHeight: 36,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1, 2),
    textTransform: 'none',
    fontWeight: 'normal',
    transition: 'all 0.2s',
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows[2]
    },
    [theme.breakpoints.down('sm')]: {
      minHeight: touchTargets.clickable.minHeight,
      padding: theme.spacing(0.75, 1.5),
      fontSize: '0.875rem'
    }
  },
  tagButtonSelected: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: `1px solid ${theme.palette.primary.main}`,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      border: `1px solid ${theme.palette.primary.dark}`
    }
  }
}));

const TagFilter = ({
  tagType = 'user', // 'user' or 'searchable'
  selectedTags = [],
  onTagsChange,
  title = null
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
                size={isMobile ? "small" : "medium"}
                onDelete={() => handleTagRemove(tag)}
                color={tag.tag_type === 'user' ? 'primary' : 'secondary'}
                className={`${classes.chip} ${tag.tag_type !== 'user' ? classes.chipSecondary : ''}`}
              />
            ))}
          </Box>
        )}
        
        {/* Available tags as clickable buttons */}
        <Box className={classes.tagGroup}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.find(selected => selected.id === tag.id);
            
            return (
              <Button
                key={tag.id}
                variant="outlined"
                className={`${classes.tagButton} ${isSelected ? classes.tagButtonSelected : ''}`}
                onClick={() => handleTagToggle(tag)}
                size={isMobile ? "small" : "medium"}
              >
                {tag.name}
              </Button>
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
            size={isMobile ? "small" : "medium"}
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
            fullWidth={isMobile}
          >
            Clear All Filters
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default TagFilter;