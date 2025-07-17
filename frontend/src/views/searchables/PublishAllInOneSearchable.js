import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Grid,
  Typography,
  Box,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  InputAdornment,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Paper,
  Divider
} from '@material-ui/core';
import {
  CloudUpload,
  Delete,
  AttachFile,
  Add,
  Storefront,
  Favorite,
  CloudDownload
} from '@material-ui/icons';
import { v4 as uuidv4 } from 'uuid';
import PublishSearchableCommon from '../../components/PublishSearchableCommon';
import PublishSearchableActions from '../../components/PublishSearchableActions';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';

const PublishAllInOneSearchable = ({ existingSearchable = null, initialPreset = null }) => {
  const classes = useComponentStyles();
  const history = useHistory();
  const account = useSelector((state) => state.account);
  const fileInputRef = useRef(null);
  
  // Common form data
  const [formData, setFormData] = useState({
    title: existingSearchable?.payloads?.public?.title || '',
    description: existingSearchable?.payloads?.public?.description || ''
  });
  
  // Component states
  const [components, setComponents] = useState(() => {
    const existing = existingSearchable?.payloads?.public?.components;
    const existingType = existingSearchable?.payloads?.public?.type || existingSearchable?.type;
    
    // If there's an initial preset and no existing searchable, enable only that component
    if (initialPreset && !existingSearchable) {
      return {
        downloadable: {
          enabled: initialPreset === 'downloadable',
          files: []
        },
        offline: {
          enabled: initialPreset === 'offline',
          items: []
        },
        donation: {
          enabled: initialPreset === 'donation',
          pricingMode: 'flexible',
          fixedAmount: 10.00,
          presetAmounts: [5, 10, 20]
        }
      };
    }
    
    // Handle conversion from old searchable types
    if (existingSearchable && existingType !== 'allinone') {
      const publicData = existingSearchable.payloads?.public || {};
      
      if (existingType === 'downloadable') {
        return {
          downloadable: {
            enabled: true,
            files: publicData.files || []
          },
          offline: {
            enabled: false,
            items: []
          },
          donation: {
            enabled: false,
            pricingMode: 'flexible',
            fixedAmount: 10.00,
            presetAmounts: [5, 10, 20]
          }
        };
      } else if (existingType === 'offline') {
        return {
          downloadable: {
            enabled: false,
            files: []
          },
          offline: {
            enabled: true,
            items: publicData.items || []
          },
          donation: {
            enabled: false,
            pricingMode: 'flexible',
            fixedAmount: 10.00,
            presetAmounts: [5, 10, 20]
          }
        };
      } else if (existingType === 'direct') {
        return {
          downloadable: {
            enabled: false,
            files: []
          },
          offline: {
            enabled: false,
            items: []
          },
          donation: {
            enabled: true,
            pricingMode: publicData.pricingMode || 'flexible',
            fixedAmount: publicData.fixedAmount || publicData.defaultAmount || 10.00,
            presetAmounts: publicData.presetAmounts || [5, 10, 20]
          }
        };
      }
    }
    
    // Otherwise use existing allinone data or defaults
    return {
      downloadable: {
        enabled: existing?.downloadable?.enabled || false,
        files: existing?.downloadable?.files || []
      },
      offline: {
        enabled: existing?.offline?.enabled || false,
        items: existing?.offline?.items || []
      },
      donation: {
        enabled: existing?.donation?.enabled || false,
        pricingMode: existing?.donation?.pricingMode || 'flexible',
        fixedAmount: existing?.donation?.fixedAmount || 10.00,
        presetAmounts: existing?.donation?.presetAmounts || [5, 10, 20]
      }
    };
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // New item states
  const [newOfflineItem, setNewOfflineItem] = useState({ name: '', price: '' });
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Error state
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComponentToggle = (component) => {
    setComponents(prev => ({
      ...prev,
      [component]: {
        ...prev[component],
        enabled: !prev[component].enabled
      }
    }));
  };

  // Downloadable component handlers
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingFiles(true);
    try {
      // In a real implementation, you would upload files here
      // For now, we'll create file objects
      const newFiles = files.map(file => ({
        id: uuidv4(),
        name: file.name,
        size: file.size,
        price: 9.99 // Default price
      }));
      
      setComponents(prev => ({
        ...prev,
        downloadable: {
          ...prev.downloadable,
          files: [...prev.downloadable.files, ...newFiles]
        }
      }));
    } catch (err) {
      setError('Failed to process files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFileRemove = (fileId) => {
    setComponents(prev => ({
      ...prev,
      downloadable: {
        ...prev.downloadable,
        files: prev.downloadable.files.filter(f => f.id !== fileId)
      }
    }));
  };

  const handleFilePrice = (fileId, price) => {
    setComponents(prev => ({
      ...prev,
      downloadable: {
        ...prev.downloadable,
        files: prev.downloadable.files.map(f => 
          f.id === fileId ? { ...f, price: parseFloat(price) || 0 } : f
        )
      }
    }));
  };

  // Offline component handlers
  const handleAddOfflineItem = () => {
    if (!newOfflineItem.name || !newOfflineItem.price) {
      setError('Please enter item name and price');
      return;
    }
    
    const item = {
      id: uuidv4(),
      name: newOfflineItem.name,
      price: parseFloat(newOfflineItem.price)
    };
    
    setComponents(prev => ({
      ...prev,
      offline: {
        ...prev.offline,
        items: [...prev.offline.items, item]
      }
    }));
    
    setNewOfflineItem({ name: '', price: '' });
    setError('');
  };

  const handleRemoveOfflineItem = (itemId) => {
    setComponents(prev => ({
      ...prev,
      offline: {
        ...prev.offline,
        items: prev.offline.items.filter(i => i.id !== itemId)
      }
    }));
  };

  // Donation component handlers
  const handleDonationModeChange = (e) => {
    setComponents(prev => ({
      ...prev,
      donation: {
        ...prev.donation,
        pricingMode: e.target.value
      }
    }));
  };

  const handlePresetAmountChange = (index, value) => {
    const amount = parseFloat(value) || 0;
    setComponents(prev => ({
      ...prev,
      donation: {
        ...prev.donation,
        presetAmounts: prev.donation.presetAmounts.map((v, i) => 
          i === index ? amount : v
        )
      }
    }));
  };

  const handleAddPresetAmount = () => {
    if (components.donation.presetAmounts.length < 3) {
      setComponents(prev => ({
        ...prev,
        donation: {
          ...prev.donation,
          presetAmounts: [...prev.donation.presetAmounts, 10]
        }
      }));
    }
  };

  const handleRemovePresetAmount = (index) => {
    setComponents(prev => ({
      ...prev,
      donation: {
        ...prev.donation,
        presetAmounts: prev.donation.presetAmounts.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async () => {
    // Validate at least one component is enabled
    const hasEnabledComponent = Object.values(components).some(c => c.enabled);
    if (!hasEnabledComponent) {
      setError('Please enable at least one component');
      return;
    }
    
    // Validate title
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const searchableData = {
        payloads: {
          public: {
            type: 'allinone',
            title: formData.title,
            description: formData.description,
            components: components
          }
        }
      };
      
      let response;
      if (existingSearchable) {
        response = await backend.put(
          `v1/searchable/${existingSearchable.searchable_id}`,
          searchableData
        );
      } else {
        response = await backend.post('v1/searchable/create', searchableData);
      }
      
      if (response.data.searchable_id) {
        history.push(`/allinone-item/${response.data.searchable_id}`);
      } else if (existingSearchable) {
        history.push(`/allinone-item/${existingSearchable.searchable_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save searchable');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          {existingSearchable ? 'Edit' : 'Create'} All-In-One Offering
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Combine digital downloads, physical items, and donations in a single listing
        </Typography>
      </Grid>

      {/* Common fields */}
      <PublishSearchableCommon
        formData={formData}
        onInputChange={handleInputChange}
      />

      {/* Component toggles */}
      <Grid item xs={12}>
        <Paper elevation={1} style={{ padding: 16, marginBottom: 16 }}>
          <Typography variant="h6" gutterBottom>
            Enable Components
          </Typography>
          <Box display="flex" gap={3} flexWrap="wrap">
            <FormControlLabel
              control={
                <Switch
                  checked={components.downloadable.enabled}
                  onChange={() => handleComponentToggle('downloadable')}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <CloudDownload style={{ marginRight: 8 }} />
                  Digital Downloads
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={components.offline.enabled}
                  onChange={() => handleComponentToggle('offline')}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <Storefront style={{ marginRight: 8 }} />
                  Physical Items
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={components.donation.enabled}
                  onChange={() => handleComponentToggle('donation')}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <Favorite style={{ marginRight: 8 }} />
                  Donations
                </Box>
              }
            />
          </Box>
        </Paper>
      </Grid>

      {/* Component tabs */}
      {(components.downloadable.enabled || components.offline.enabled || components.donation.enabled) && (
        <Grid item xs={12}>
          <Paper elevation={1}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              indicatorColor="primary"
              textColor="primary"
            >
              {components.downloadable.enabled && (
                <Tab label="Digital Downloads" icon={<CloudDownload />} />
              )}
              {components.offline.enabled && (
                <Tab label="Physical Items" icon={<Storefront />} />
              )}
              {components.donation.enabled && (
                <Tab label="Donation Settings" icon={<Favorite />} />
              )}
            </Tabs>
            
            <Box p={3}>
              {/* Downloadable tab content */}
              {components.downloadable.enabled && activeTab === 0 && (
                <Box>
                  <Box
                    border={2}
                    borderColor="divider"
                    borderRadius={2}
                    p={3}
                    textAlign="center"
                    style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CloudUpload style={{ fontSize: 48, color: '#ccc' }} />
                    <Typography variant="h6">
                      Click to upload files
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Supported formats: PDF, ZIP, MP4, MP3, PNG, JPG, and more
                    </Typography>
                  </Box>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept=".pdf,.zip,.mp4,.mp3,.png,.jpg,.jpeg,.doc,.docx"
                  />
                  
                  {components.downloadable.files.length > 0 && (
                    <Box mt={3}>
                      <Typography variant="h6" gutterBottom>
                        Uploaded Files ({components.downloadable.files.length})
                      </Typography>
                      <List>
                        {components.downloadable.files.map((file) => (
                          <ListItem key={file.id} divider>
                            <ListItemText
                              primary={file.name}
                              secondary={formatFileSize(file.size)}
                            />
                            <TextField
                              type="number"
                              value={file.price}
                              onChange={(e) => handleFilePrice(file.id, e.target.value)}
                              style={{ width: 120, marginRight: 16 }}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => handleFileRemove(file.id)}
                              >
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Offline tab content */}
              {components.offline.enabled && activeTab === (components.downloadable.enabled ? 1 : 0) && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Add Physical Items
                  </Typography>
                  
                  <Box display="flex" gap={2} mb={3}>
                    <TextField
                      value={newOfflineItem.name}
                      onChange={(e) => setNewOfflineItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Item name"
                      variant="outlined"
                      size="small"
                      style={{ flex: 2 }}
                    />
                    <TextField
                      type="number"
                      value={newOfflineItem.price}
                      onChange={(e) => setNewOfflineItem(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="Price"
                      variant="outlined"
                      size="small"
                      style={{ flex: 1 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddOfflineItem}
                      startIcon={<Add />}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  {components.offline.items.length > 0 && (
                    <List>
                      {components.offline.items.map((item) => (
                        <ListItem key={item.id} divider>
                          <ListItemText
                            primary={item.name}
                            secondary={formatUSD(item.price)}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveOfflineItem(item.id)}
                            >
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
              
              {/* Donation tab content */}
              {components.donation.enabled && activeTab === 
                (components.downloadable.enabled ? 1 : 0) + 
                (components.offline.enabled ? 1 : 0)
              && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Donation Settings
                  </Typography>
                  
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend">Pricing Mode</FormLabel>
                    <RadioGroup
                      value={components.donation.pricingMode}
                      onChange={handleDonationModeChange}
                    >
                      <FormControlLabel
                        value="fixed"
                        control={<Radio color="primary" />}
                        label="Fixed Amount - Supporters donate exactly this amount"
                      />
                      <FormControlLabel
                        value="preset"
                        control={<Radio color="primary" />}
                        label="Preset Options - Supporters choose from preset amounts"
                      />
                      <FormControlLabel
                        value="flexible"
                        control={<Radio color="primary" />}
                        label="Flexible - Supporters can choose any amount"
                      />
                    </RadioGroup>
                  </FormControl>
                  
                  {components.donation.pricingMode === 'fixed' && (
                    <Box mt={2}>
                      <TextField
                        type="number"
                        value={components.donation.fixedAmount}
                        onChange={(e) => setComponents(prev => ({
                          ...prev,
                          donation: {
                            ...prev.donation,
                            fixedAmount: parseFloat(e.target.value) || 0
                          }
                        }))}
                        fullWidth
                        variant="outlined"
                        label="Fixed Amount"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Box>
                  )}
                  
                  {components.donation.pricingMode === 'preset' && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Preset Amount Options (1-3 options)
                      </Typography>
                      {components.donation.presetAmounts.map((amount, index) => (
                        <Box key={index} display="flex" alignItems="center" mb={1}>
                          <TextField
                            type="number"
                            value={amount}
                            onChange={(e) => handlePresetAmountChange(index, e.target.value)}
                            variant="outlined"
                            size="small"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            style={{ flex: 1, marginRight: 8 }}
                          />
                          {components.donation.presetAmounts.length > 1 && (
                            <IconButton
                              onClick={() => handleRemovePresetAmount(index)}
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                      {components.donation.presetAmounts.length < 3 && (
                        <Button
                          onClick={handleAddPresetAmount}
                          variant="outlined"
                          size="small"
                          style={{ marginTop: 8 }}
                        >
                          Add Option
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      )}

      {/* Error display */}
      {error && (
        <Grid item xs={12}>
          <Typography color="error">{error}</Typography>
        </Grid>
      )}

      {/* Actions */}
      <PublishSearchableActions
        loading={loading}
        onSubmit={handleSubmit}
        submitText={existingSearchable ? 'Update' : 'Publish'}
        disabled={!formData.title || !Object.values(components).some(c => c.enabled)}
      />
    </Grid>
  );
};

export default PublishAllInOneSearchable;