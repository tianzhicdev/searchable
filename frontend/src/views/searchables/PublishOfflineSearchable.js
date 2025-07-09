import React, { useState } from 'react';
import { 
  Grid, Typography, Box, TextField, Button, IconButton
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import BasePublishSearchable from '../../components/BasePublishSearchable';
import useComponentStyles from '../../themes/componentStyles';

const PublishOfflineSearchable = () => {
  
  const classes = useComponentStyles();
  
  // State for offline items (menu items)
  const [offlineItems, setOfflineItems] = useState([]);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    description: '', 
    price: ''
  });
  
  // Handle offline item data changes
  const handleItemDataChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };
  
  // Add offline item to the list
  const addOfflineItem = (setError) => {
    if (newItem.name && newItem.price) {
      const priceValue = parseFloat(newItem.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        setError('Please enter a valid price greater than 0');
        return;
      }

      const item = {
        itemId: Date.now(), // Simple ID generation
        name: newItem.name,
        description: newItem.description,
        price: priceValue
      };
      
      setOfflineItems([...offlineItems, item]);
      setNewItem({ name: '', description: '', price: '' });
      setError(null);
    } else {
      setError('Please provide item name and price');
    }
  };
  
  // Remove offline item from the list
  const removeOfflineItem = (itemId) => {
    setOfflineItems(offlineItems.filter(item => item.itemId !== itemId));
  };

  // Function to format USD price
  const formatUSD = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Create type-specific payload for offline searchable
  const getTypeSpecificPayload = (formData) => ({
    require_address: formData.require_address || false,
    offlineItems: offlineItems
  });

  // Form validation
  const isFormValid = () => {
    return offlineItems.length > 0; // At least one item required
  };

  // Custom validation for offline-specific requirements
  const customValidation = () => {
    if (offlineItems.length === 0) {
      return "Please add at least one offline item";
    }
    return null;
  };

  // Render type-specific content for offline items
  const renderOfflineContent = ({ formData, handleInputChange, setError }) => (
    <Grid item xs={12}>
      <Typography variant="subtitle1">
        Product Items *
      </Typography>
      <Typography variant="caption">
        Add items that customers can order from your menu
      </Typography>
      
      <Box mt={2}>
        <Box mb={2}>
          <TextField
            placeholder="Item Name"
            value={newItem.name}
            onChange={handleItemDataChange}
            name="name"
            fullWidth
            variant="outlined"
            size="small"
            style={{ marginBottom: 8 }}
          />
          <TextField
            placeholder="Price (USD)"
            value={newItem.price}
            onChange={handleItemDataChange}
            name="price"
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            fullWidth
            variant="outlined"
            size="small"
            style={{ marginBottom: 8 }}
          />
          <TextField
            placeholder="Description (Optional)"
            value={newItem.description}
            onChange={handleItemDataChange}
            name="description"
            fullWidth
            variant="outlined"
            size="small"
            style={{ marginBottom: 8 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => addOfflineItem(setError)}
            startIcon={<AddIcon />}
          >
            Add Item
          </Button>
        </Box>
        
        {offlineItems.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Items ({offlineItems.length})
            </Typography>
            {offlineItems.map((item) => (
              <Box key={item.itemId} className={classes.fileItem}>
                <Box flex={1}>
                  <Typography variant="body1">{item.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {item.description || 'No description'}
                  </Typography>
                </Box>
                <Typography variant="body1" style={{ marginRight: 16 }}>
                  {formatUSD(item.price)}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => removeOfflineItem(item.itemId)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Grid>
  );

  return (
    <BasePublishSearchable
      searchableType="offline"
      title="Publish Offline Item"
      subtitle="Create an item for offline orders or services"
      renderTypeSpecificContent={renderOfflineContent}
      getTypeSpecificPayload={getTypeSpecificPayload}
      isFormValid={isFormValid}
      customValidation={customValidation}
      showCurrency={false}
      imageDescription="Add up to 10 images"
    />
  );
};

export default PublishOfflineSearchable;