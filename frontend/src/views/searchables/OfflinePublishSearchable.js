import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles';
import { 
  Grid, Typography, Button, Paper, Box, TextField, 
  CircularProgress, Divider, IconButton, MenuItem, Switch,
  FormControlLabel, Checkbox
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import backend from '../utilities/Backend';
import ImageUploader from '../../components/ImageUploader';

const OfflinePublishSearchable = () => {
  console.log("OfflinePublishSearchable component is being rendered");
  const classes = useComponentStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    currency: 'usd',
    require_address: false
  });
  
  // State for offline items (menu items)
  const [offlineItems, setOfflineItems] = useState([]);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    description: '', 
    price: '',
    available: true
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
    const { name, value, type, checked } = e.target;
    setNewItem({
      ...newItem,
      [name]: type === 'checkbox' ? checked : value
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
        price: priceValue,
        available: newItem.available
      };
      
      setOfflineItems([...offlineItems, item]);
      setNewItem({ name: '', description: '', price: '', available: true });
      setError(null);
    } else {
      setError('Please provide item name and price');
    }
  };
  
  // Remove offline item from the list
  const removeOfflineItem = (itemId) => {
    setOfflineItems(offlineItems.filter(item => item.itemId !== itemId));
  };

  // Update existing offline item
  const updateOfflineItem = (itemId, field, value) => {
    setOfflineItems(offlineItems.map(item => 
      item.itemId === itemId 
        ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value }
        : item
    ));
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
        title: formData.title,
        description: formData.description,
        type: 'offline',
        currency: formData.currency,
        require_address: formData.require_address,
        offlineItems: offlineItems,
        images: images
      };
      
      console.log('Creating offline searchable with payload:', payload);
      
      const response = await backend.post('v1/searchable/create', payload);
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          history.push('/searchables');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to create offline searchable');
      }
    } catch (err) {
      console.error('Error creating offline searchable:', err);
      setError(err.response?.data?.message || 'Failed to create offline searchable');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    history.goBack();
  };

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            variant="outlined"
          >
            Back
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Sell Offline Products
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Create a menu of offline products or services that customers can order from you.
          </Typography>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3}>
            <Box p={3}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Basic Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      name="title"
                      label="Title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      fullWidth
                      placeholder="e.g., Local Bakery Menu, Handmade Crafts"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      label="Description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Describe your offline products or services..."
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="currency"
                      label="Currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      select
                      fullWidth
                    >
                      <MenuItem value="usd">USD</MenuItem>
                      <MenuItem value="usdt">USDT</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="require_address"
                          checked={formData.require_address}
                          onChange={handleInputChange}
                        />
                      }
                      label="Require customer address for orders"
                    />
                  </Grid>

                  <Divider />

                  {/* Images */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Images (Optional)
                    </Typography>
                    <ImageUploader 
                      onImagesChange={handleImagesChange}
                      maxImages={5}
                    />
                  </Grid>

                  <Divider />

                  {/* Offline Items */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Menu Items
                    </Typography>
                  </Grid>

                  {/* Add New Item */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" style={{ padding: 16, backgroundColor: '#f9f9f9' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Add New Item
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            name="name"
                            label="Item Name"
                            value={newItem.name}
                            onChange={handleItemDataChange}
                            fullWidth
                            size="small"
                            placeholder="e.g., Chocolate Cake, Custom T-Shirt"
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                          <TextField
                            name="price"
                            label="Price"
                            value={newItem.price}
                            onChange={handleItemDataChange}
                            type="number"
                            inputProps={{ step: "0.01", min: "0" }}
                            fullWidth
                            size="small"
                          />
                        </Grid>

                        <Grid item xs={12} sm={3}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="available"
                                checked={newItem.available}
                                onChange={handleItemDataChange}
                              />
                            }
                            label="Available"
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <TextField
                            name="description"
                            label="Description (Optional)"
                            value={newItem.description}
                            onChange={handleItemDataChange}
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Button
                            onClick={addOfflineItem}
                            variant="contained"
                            startIcon={<AddIcon />}
                            size="small"
                          >
                            Add Item
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Existing Items List */}
                  {offlineItems.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Current Items ({offlineItems.length})
                      </Typography>
                      
                      {offlineItems.map((item, index) => (
                        <Paper key={item.itemId} variant="outlined" style={{ marginBottom: 8, padding: 12 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4}>
                              <TextField
                                value={item.name}
                                onChange={(e) => updateOfflineItem(item.itemId, 'name', e.target.value)}
                                label="Name"
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={2}>
                              <TextField
                                value={item.price}
                                onChange={(e) => updateOfflineItem(item.itemId, 'price', e.target.value)}
                                label="Price"
                                type="number"
                                inputProps={{ step: "0.01", min: "0" }}
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                              <TextField
                                value={item.description}
                                onChange={(e) => updateOfflineItem(item.itemId, 'description', e.target.value)}
                                label="Description"
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            
                            <Grid item xs={6} sm={1}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={item.available}
                                    onChange={(e) => updateOfflineItem(item.itemId, 'available', e.target.checked)}
                                    size="small"
                                  />
                                }
                                label="Available"
                              />
                            </Grid>
                            
                            <Grid item xs={6} sm={1}>
                              <IconButton
                                onClick={() => removeOfflineItem(item.itemId)}
                                color="secondary"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Grid>
                  )}

                  {/* Error and Success Messages */}
                  {error && (
                    <Grid item xs={12}>
                      <Typography color="error" variant="body2">
                        {error}
                      </Typography>
                    </Grid>
                  )}
                  
                  {success && (
                    <Grid item xs={12}>
                      <Typography color="primary" variant="body2">
                        Offline searchable created successfully! Redirecting...
                      </Typography>
                    </Grid>
                  )}

                  {/* Action Buttons */}
                  <Grid item xs={12}>
                    <Box display="flex" gap={2} justifyContent="flex-end">
                      <Button 
                        onClick={handleCancel}
                        variant="outlined"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                      >
                        {loading ? 'Creating...' : 'Create Offline Menu'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3}>
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                How Offline Searchables Work
              </Typography>
              
              <Typography variant="body2" paragraph>
                • Create a menu of your offline products or services
              </Typography>
              
              <Typography variant="body2" paragraph>
                • Customers can view your items and select quantities
              </Typography>
              
              <Typography variant="body2" paragraph>
                • They can purchase multiple items and quantities in one order
              </Typography>
              
              <Typography variant="body2" paragraph>
                • You handle fulfillment offline (pickup, delivery, etc.)
              </Typography>
              
              <Typography variant="body2" paragraph>
                • Payment is processed online through the platform
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OfflinePublishSearchable;