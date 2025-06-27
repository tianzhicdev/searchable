import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Box,
  Button,
  Chip,
  Badge
} from '@material-ui/core';
import { ExpandMore as ExpandMoreIcon, Clear as ClearIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import backend from '../../mocks/mockBackend';

const useStyles = makeStyles((theme) => ({
  filterContainer: {
    width: '100%',
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
  },
  accordionSummary: {
    '& .MuiAccordionSummary-content': {
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }
}));

const TagFilter = ({
  tagType = 'user', // 'user' or 'searchable'
  selectedTags = [],
  onTagsChange,
  title = null,
  expanded = false
}) => {
  const classes = useStyles();
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Auto-generate title if not provided
  const displayTitle = title || `Filter by ${tagType === 'user' ? 'User' : 'Content'} Tags`;
  
  useEffect(() => {
    loadAvailableTags();
  }, [tagType]);
  
  const loadAvailableTags = async () => {
    setLoading(true);
    
    try {
      const response = await backend.get(`/api/v1/tags?type=${tagType}&active=true`);
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
    <div className={classes.filterContainer}>
      <Accordion 
        expanded={isExpanded}
        onChange={(event, expanded) => setIsExpanded(expanded)}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          className={classes.accordionSummary}
        >
          <Typography variant="h6">
            {displayTitle}
          </Typography>
          {selectedTags.length > 0 && (
            <Badge badgeContent={selectedTags.length} color="primary">
              <Typography variant="body2" color="textSecondary">
                filters active
              </Typography>
            </Badge>
          )}
        </AccordionSummary>
        
        <AccordionDetails>
          <Box width="100%">
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
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default TagFilter;