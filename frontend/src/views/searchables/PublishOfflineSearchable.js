import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import useComponentStyles from '../../themes/componentStyles';
import { 
  Grid, Typography, Button, Paper, Box, TextField, 
  CircularProgress, IconButton
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import backend from '../utilities/Backend';
import ImageUploader from '../../components/ImageUploader';
import PublishSearchableCommon from '../../components/PublishSearchableCommon';
import PublishSearchableActions from '../../components/PublishSearchableActions';

const PublishOfflineSearchable = () => {
  console.log("PublishOfflineSearchable component is being rendered");
  const classes = useComponentStyles();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    require_address: false
  });
  
  // State for offline items (menu items)
  const [offlineItems, setOfflineItems] = useState([]);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    description: '', 
    price: ''
  });
  
  // State for preview images
  const [images, setImages] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle preview image changes from ImageUploader component
  const handleImagesChange = (newImages) => {
    // Extract URIs from the image data objects
    const imageUris = newImages.map(img => img.uri);
    setImages(imageUris);
  };
  
  // Handle offline item data changes
  const handleItemDataChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };
  
  // Add offline item to the list
  const addOfflineItem = () => {
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
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }
    
    if (offlineItems.length === 0) {
      setError('Please add at least one offline item');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        payloads: {
          public: {
            title: formData.title,
            description: formData.description,
            type: 'offline',
            currency: 'usd', // Default to USD
            require_address: formData.require_address,
            offlineItems: offlineItems,
            images: images
          }
        }
      };
      
      console.log('Creating offline searchable with payload:', payload);
      
      const response = await backend.post('v1/searchable/create', payload);
      
      setSuccess(true);
        
      // Reset form
      setFormData({
        title: '',
        description: '',
        require_address: false
      });
      setImages([]);
      setOfflineItems([]);
      
      // Redirect to searchables page after a delay
      setTimeout(() => {
        history.push('/searchables');
      }, 2000);
    } catch (err) {
      console.error('Error creating offline searchable:', err);
      setError(err.response?.data?.error || 'Failed to create offline searchable');
    } finally {
      setLoading(false);
    }
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

  return (
    <Grid container className={classes.container}>
      <Grid item xs={12} className={classes.header}>
        <Button 
          variant="contained" 
          onClick={() => history.push('/searchables')}
        >
          <ArrowBackIcon />
        </Button>
      </Grid>
      
      {error && (
        <Grid item xs={12}>
          <Box className={classes.errorMessage}>
            <Typography variant="body1">{error}</Typography>
          </Box>
        </Grid>
      )}
      
      {success && (
        <Grid item xs={12}>
          <Box className={classes.successMessage}>
            <Typography variant="body1">Successfully published! Redirecting...</Typography>
          </Box>
        </Grid>
      )}
      
      <Grid item xs={12}>
        <Paper elevation={3}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={1}>
              <PublishSearchableCommon
                formData={formData}
                onInputChange={handleInputChange}
                images={images}
                onImagesChange={handleImagesChange}
                onError={setError}
                imageDescription="Add up to 10 images "
                showCurrency={false}
              />
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1">
                  Product Items *
                </Typography>
                <Typography variant="caption" className={classes.formHelp}>
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
                      onClick={addOfflineItem}
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
              
              <PublishSearchableActions
                loading={loading}
                disabled={offlineItems.length === 0}
                onSubmit={null}
                submitText="Publish"
                loadingText="Publishing..."
              />
            </Grid>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PublishOfflineSearchable;