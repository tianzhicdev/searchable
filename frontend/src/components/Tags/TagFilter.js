import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  FormGroup,
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
    width: '100%',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2)
  },
  filterHeader: {
    marginBottom: theme.spacing(2)
  },
  searchField: {
    marginBottom: theme.spacing(2),
    width: '100%'
  },
  tagGroup: {
    maxHeight: '200px',
    overflowY: 'auto',
    marginBottom: theme.spacing(1)
  },
  clearButton: {
    marginTop: theme.spacing(1)
  },
  selectedTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1)
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
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  // Filter tags based on search term
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
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
        {/* Search within tags */}
        <TextField
          className={classes.searchField}
          placeholder="Search tags..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
        />
        
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
        <FormGroup className={classes.tagGroup}>
          {filteredTags.map((tag) => {
            const isSelected = selectedTags.find(selected => selected.id === tag.id);
            
            return (
              <FormControlLabel
                key={tag.id}
                control={
                  <Checkbox
                    checked={!!isSelected}
                    onChange={() => handleTagToggle(tag)}
                    size="small"
                    color={tag.tag_type === 'user' ? 'primary' : 'secondary'}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">{tag.name}</Typography>
                    {tag.description && (
                      <Typography variant="caption" color="textSecondary">
                        {tag.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
            );
          })}
        </FormGroup>
        
        {loading && (
          <Typography variant="body2" color="textSecondary">
            Loading tags...
          </Typography>
        )}
        
        {!loading && filteredTags.length === 0 && searchTerm && (
          <Typography variant="body2" color="textSecondary">
            No tags found matching "{searchTerm}"
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