import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  useMediaQuery
} from '@material-ui/core';
import { Clear as ClearIcon, Search as SearchIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core/styles';
import Backend from '../../views/utilities/Backend';
import { touchTargets } from '../../utils/spacing';

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
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: theme.spacing(0.75),
      marginTop: theme.spacing(1)
    }
  },
  searchButton: {
    flex: 1,
    minHeight: touchTargets.clickable.minHeight,
    [theme.breakpoints.down('sm')]: {
      minHeight: touchTargets.clickable.minHeight - 4,
      fontSize: '0.875rem'
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
  onSearch,
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
    const isSelected = selectedTags.find(selected => 
      selected.id === tag.id || 
      (selected.id && selected.id.toString() === tag.id.toString())
    );
    
    if (isSelected) {
      // Remove tag
      const newTags = selectedTags.filter(selected => 
        selected.id !== tag.id && 
        (!selected.id || selected.id.toString() !== tag.id.toString())
      );
      onTagsChange(newTags);
    } else {
      // Add tag - ensure we pass the full tag object
      const newTags = [...selectedTags, { ...tag }];
      onTagsChange(newTags);
    }
  };
  
  const handleClearAll = () => {
    onTagsChange([]);
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
        {/* Available tags as clickable buttons */}
        <Box className={classes.tagGroup}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.some(selected => {
              // Handle various formats of selected tags
              if (typeof selected === 'string') {
                return selected === tag.id.toString();
              }
              if (selected.id !== undefined) {
                return selected.id.toString() === tag.id.toString();
              }
              return false;
            });
            
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
        
        {/* Action buttons */}
        {(selectedTags.length > 0 || onSearch) && (
          <Box className={classes.buttonContainer}>
            {onSearch && (
              <Button
                className={classes.searchButton}
                variant="contained"
                color="primary"
                size={isMobile ? "small" : "medium"}
                startIcon={<SearchIcon />}
                onClick={onSearch}
              >
                Search
              </Button>
            )}
            {selectedTags.length > 0 && (
              <Button
                className={classes.clearButton}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                startIcon={<ClearIcon />}
                onClick={handleClearAll}
                style={{ flex: 1 }}
              >
                Clear All Filters
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TagFilter;