import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import {
  Grid,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Paper,
  CircularProgress
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
import { useTheme } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/styles';
import PublishSearchableCommon from '../../components/PublishSearchableCommon';
import PublishSearchableActions from '../../components/PublishSearchableActions';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';

const useStyles = makeStyles((theme) => ({
  addButton: {
    borderRadius: 0,
    transition: 'all 0.3s ease',
    '&.ready': {
      backgroundColor: theme.palette.primary.main,
      color: 'white',
      animation: '$pulse 1.5s infinite',
      border: `2px solid ${theme.palette.primary.light}`,
    },
    '&:hover.ready': {
      backgroundColor: theme.palette.primary.dark,
      animation: 'none',
    }
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${theme.palette.primary.main}`,
      borderColor: theme.palette.primary.main,
    },
    '50%': {
      boxShadow: `0 0 0 8px rgba(25, 118, 210, 0)`,
      borderColor: theme.palette.primary.light,
    },
    '100%': {
      boxShadow: `0 0 0 0 rgba(25, 118, 210, 0)`,
      borderColor: theme.palette.primary.main,
    }
  }
}));

const PublishAllInOneSearchable = () => {
  const componentClasses = useComponentStyles();
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { id } = useParams();
  const account = useSelector((state) => state.account);
  const fileInputRef = useRef(null);
  
  // Loading state for fetching existing data
  const [fetchingData, setFetchingData] = useState(false);
  const [existingSearchable, setExistingSearchable] = useState(null);
  
  // Common form data
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  
  // Images and tags state
  const [images, setImages] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Component states
  const [components, setComponents] = useState({
    downloadable: {
      enabled: false,
      files: []
    },
    offline: {
      enabled: false,
      items: []
    },
    donation: {
      enabled: false,
      pricingMode: 'flexible',
      fixedAmount: 10.00,
      presetAmounts: [4.99, 9.99, 19.99],
      allowCustomAmount: true
    }
  });
  
  // New item states
  const [newFile, setNewFile] = useState({ name: '', description: '', price: '', file: null });
  const [newOfflineItem, setNewOfflineItem] = useState({ name: '', description: '', price: '' });
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Error state
  const [error, setError] = useState('');

  // Fetch existing searchable data if ID is provided
  useEffect(() => {
    if (id) {
      fetchSearchableData();
    }
  }, [id]);

  const fetchSearchableData = async () => {
    setFetchingData(true);
    try {
      const response = await backend.get(`v1/searchable/${id}`);
      const data = response.data;
      
      // Verify ownership
      if (data.user_id !== account.user?._id) {
        setError('You do not have permission to edit this item');
        return;
      }
      
      setExistingSearchable(data);
      
      // Load common data
      setFormData({
        title: data.payloads?.public?.title || '',
        description: data.payloads?.public?.description || ''
      });
      
      setImages(data.payloads?.public?.images || []);
      setSelectedTags(data.tags || []);
      
      // Load component data based on type
      const publicData = data.payloads?.public || {};
      const searchableType = publicData.type || data.type;
      
      if (searchableType === 'allinone') {
        // Load allinone data
        const componentsData = publicData.components || {};
        setComponents({
          downloadable: {
            enabled: componentsData.downloadable?.enabled || false,
            files: (componentsData.downloadable?.files || []).map(file => ({
              id: file.id || uuidv4(),
              fileId: file.fileId,
              uuid: file.uuid,
              name: file.name || '',
              description: file.description || '',
              price: file.price || 0,
              fileName: file.fileName,
              fileType: file.fileType,
              size: file.fileSize || file.size || 0
            }))
          },
          offline: {
            enabled: componentsData.offline?.enabled || false,
            items: (componentsData.offline?.items || []).map(item => ({
              id: item.id || uuidv4(),
              name: item.name || '',
              description: item.description || '',
              price: item.price || 0
            }))
          },
          donation: {
            enabled: componentsData.donation?.enabled || false,
            pricingMode: componentsData.donation?.pricingMode === 'preset' ? 'flexible' : (componentsData.donation?.pricingMode || 'flexible'),
            fixedAmount: componentsData.donation?.fixedAmount || 10.00,
            presetAmounts: componentsData.donation?.presetAmounts || [5, 10, 20],
            allowCustomAmount: componentsData.donation?.allowCustomAmount !== false
          }
        });
      } else {
        // Convert old searchable types to allinone
        if (searchableType === 'downloadable') {
          setComponents({
            downloadable: {
              enabled: true,
              files: (publicData.downloadableFiles || publicData.files || []).map(file => ({
                id: file.id || file.fileId || uuidv4(),
                name: file.name || '',
                description: file.description || '',
                price: file.price || 0,
                size: file.size || 0
              }))
            },
            offline: {
              enabled: false,
              items: []
            },
            donation: {
              enabled: false,
              pricingMode: 'flexible',
              fixedAmount: 10.00,
              presetAmounts: [4.99, 9.99, 19.99],
              allowCustomAmount: true
            }
          });
        } else if (searchableType === 'offline') {
          setComponents({
            downloadable: {
              enabled: false,
              files: []
            },
            offline: {
              enabled: true,
              items: (publicData.offlineItems || publicData.items || []).map(item => ({
                id: item.id || item.itemId || uuidv4(),
                name: item.name || '',
                description: item.description || '',
                price: item.price || 0
              }))
            },
            donation: {
              enabled: false,
              pricingMode: 'flexible',
              fixedAmount: 10.00,
              presetAmounts: [4.99, 9.99, 19.99],
              allowCustomAmount: true
            }
          });
        } else if (searchableType === 'direct') {
          setComponents({
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
              pricingMode: publicData.pricingMode === 'preset' ? 'flexible' : (publicData.pricingMode || 'flexible'),
              fixedAmount: publicData.fixedAmount || publicData.defaultAmount || 10.00,
              presetAmounts: publicData.presetAmounts || [5, 10, 20],
              allowCustomAmount: true
            }
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load searchable data');
    } finally {
      setFetchingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImagesChange = (newImages) => {
    setImages(newImages.map(img => img.uri || img));
  };
  
  const handleTagsChange = (tags) => {
    setSelectedTags(tags);
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
    const file = e.target.files?.[0];
    if (!file) return;
    
    setNewFile(prev => ({
      ...prev,
      file: file,
      name: file.name
    }));
  };

  const handleAddFile = async () => {
    if (!newFile.file || !newFile.price) {
      setError('Please select a file and enter a price');
      return;
    }
    
    setUploadingFiles(true);
    try {
      // Upload file to get fileId
      const formData = new FormData();
      formData.append('file', newFile.file);
      
      // Add metadata
      const metadata = {
        description: newFile.description,
        type: 'downloadable_content'
      };
      formData.append('metadata', JSON.stringify(metadata));
      
      const uploadResponse = await backend.post('v1/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (uploadResponse.data.success) {
        const fileItem = {
          id: uuidv4(),
          fileId: uploadResponse.data.file_id,
          uuid: uploadResponse.data.uuid,
          name: newFile.name,
          description: newFile.description,
          fileName: newFile.file.name,
          fileType: newFile.file.type,
          size: newFile.file.size,
          price: parseFloat(newFile.price)
        };
        
        setComponents(prev => ({
          ...prev,
          downloadable: {
            ...prev.downloadable,
            files: [...prev.downloadable.files, fileItem]
          }
        }));
        
        setNewFile({ name: '', description: '', price: '', file: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
        setError('');
      } else {
        throw new Error("Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error.response?.data?.error || "Failed to upload file. Please try again.");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleUpdateFile = (fileId, field, value) => {
    setComponents(prev => ({
      ...prev,
      downloadable: {
        ...prev.downloadable,
        files: prev.downloadable.files.map(f => 
          f.id === fileId ? { ...f, [field]: field === 'price' ? parseFloat(value) || 0 : value } : f
        )
      }
    }));
  };

  const handleRemoveFile = (fileId) => {
    setComponents(prev => ({
      ...prev,
      downloadable: {
        ...prev.downloadable,
        files: prev.downloadable.files.filter(f => f.id !== fileId)
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
      description: newOfflineItem.description,
      price: parseFloat(newOfflineItem.price)
    };
    
    setComponents(prev => ({
      ...prev,
      offline: {
        ...prev.offline,
        items: [...prev.offline.items, item]
      }
    }));
    
    setNewOfflineItem({ name: '', description: '', price: '' });
    setError('');
  };

  const handleUpdateOfflineItem = (itemId, field, value) => {
    setComponents(prev => ({
      ...prev,
      offline: {
        ...prev.offline,
        items: prev.offline.items.map(i => 
          i.id === itemId ? { ...i, [field]: field === 'price' ? parseFloat(value) || 0 : value } : i
        )
      }
    }));
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
      // Format the components data for backend
      const formattedComponents = {
        downloadable: {
          enabled: components.downloadable.enabled,
          files: components.downloadable.files.map(file => ({
            id: file.id,
            fileId: file.fileId,
            name: file.name,
            description: file.description,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.size,
            price: file.price
          }))
        },
        offline: {
          enabled: components.offline.enabled,
          items: components.offline.items.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price
          }))
        },
        donation: components.donation
      };
      
      const searchableData = {
        payloads: {
          public: {
            type: 'allinone',
            title: formData.title,
            description: formData.description,
            images: images,
            components: formattedComponents
          }
        },
        tags: selectedTags
      };
      
      let response;
      if (existingSearchable) {
        // Use the new update endpoint
        response = await backend.put(`v1/searchable/${existingSearchable.searchable_id}`, searchableData);
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

  if (fetchingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
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
      <Grid item xs={12}>
        <PublishSearchableCommon
          formData={formData}
          onInputChange={handleInputChange}
          images={images}
          onImagesChange={handleImagesChange}
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
          onError={setError}
        />
      </Grid>

      {/* Downloadable component section */}
      <Grid item xs={12}>
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
              <Typography variant="h6">Digital Downloads</Typography>
            </Box>
          }
        />
        
        {components.downloadable.enabled && (
          <Box mt={2} pl={2}>
            <Typography variant="body2" color="textSecondary" paragraph>
              Add digital content that customers can download after purchase
            </Typography>
            
            {/* Add new file section */}
            <Paper elevation={1} style={{ padding: 16, marginBottom: 16 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<AttachFile />}
                style={{ marginBottom: 12 }}
              >
                Choose File
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  hidden
                />
              </Button>
              {newFile.file && (
                <Typography variant="caption" display="block" gutterBottom>
                  Selected: {newFile.file.name} ({formatFileSize(newFile.file.size)})
                </Typography>
              )}
              
              <TextField
                value={newFile.name}
                onChange={(e) => setNewFile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="File name"
                fullWidth
                variant="outlined"
                size="small"
                style={{ marginBottom: 8 }}
              />
              
              <TextField
                value={newFile.description}
                onChange={(e) => setNewFile(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={2}
                style={{ marginBottom: 8 }}
              />
              
              <Box display="flex" alignItems="center">
                <TextField
                  value={newFile.price}
                  onChange={(e) => setNewFile(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Price"
                  type="number"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <IconButton
                  onClick={handleAddFile}
                  disabled={!newFile.file || !newFile.price || uploadingFiles}
                  className={`${classes.addButton} ${newFile.file && newFile.price ? 'ready' : ''}`}
                >
                  {uploadingFiles ? <CircularProgress size={20} style={{ color: 'white' }} /> : <Add />}
                </IconButton>
              </Box>
            </Paper>
            
            {/* File list */}
            {components.downloadable.files.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Added Files ({components.downloadable.files.length})
                </Typography>
                {components.downloadable.files.map((file) => (
                  <Box key={file.id} style={{ marginBottom: 16 }}>
                    <TextField
                      value={file.name}
                      onChange={(e) => handleUpdateFile(file.id, 'name', e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      style={{ marginBottom: 4 }}
                    />
                    <TextField
                      value={file.description}
                      onChange={(e) => handleUpdateFile(file.id, 'description', e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Description (optional)"
                      style={{ marginBottom: 8 }}
                    />
                    <Box display="flex" alignItems="center">
                      <TextField
                        value={file.price}
                        onChange={(e) => handleUpdateFile(file.id, 'price', e.target.value)}
                        type="number"
                        variant="outlined"
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <IconButton
                        onClick={() => handleRemoveFile(file.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </>
            )}
          </Box>
        )}
      </Grid>

      {/* Offline component section */}
      <Grid item xs={12}>
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
              <Typography variant="h6">Physical Items</Typography>
            </Box>
          }
        />
        
        {components.offline.enabled && (
          <Box mt={2} pl={2}>
            <Typography variant="body2" color="textSecondary" paragraph>
              Add physical products or services
            </Typography>
            
            {/* Add new item section */}
            <Paper elevation={1} style={{ padding: 16, marginBottom: 16 }}>
              <TextField
                value={newOfflineItem.name}
                onChange={(e) => setNewOfflineItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Item name"
                fullWidth
                variant="outlined"
                size="small"
                style={{ marginBottom: 8 }}
              />
              
              <TextField
                value={newOfflineItem.description}
                onChange={(e) => setNewOfflineItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={2}
                style={{ marginBottom: 8 }}
              />
              
              <Box display="flex" alignItems="center">
                <TextField
                  value={newOfflineItem.price}
                  onChange={(e) => setNewOfflineItem(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Price"
                  type="number"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <IconButton
                  onClick={handleAddOfflineItem}
                  disabled={!newOfflineItem.name || !newOfflineItem.price}
                  className={`${classes.addButton} ${newOfflineItem.name && newOfflineItem.price ? 'ready' : ''}`}
                >
                  <Add />
                </IconButton>
              </Box>
            </Paper>
            
            {/* Item list */}
            {components.offline.items.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Added Items ({components.offline.items.length})
                </Typography>
                {components.offline.items.map((item) => (
                  <Box key={item.id} style={{ marginBottom: 16 }}>
                    <TextField
                      value={item.name}
                      onChange={(e) => handleUpdateOfflineItem(item.id, 'name', e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      style={{ marginBottom: 4 }}
                    />
                    <TextField
                      value={item.description}
                      onChange={(e) => handleUpdateOfflineItem(item.id, 'description', e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Description (optional)"
                      style={{ marginBottom: 8 }}
                    />
                    <Box display="flex" alignItems="center">
                      <TextField
                        value={item.price}
                        onChange={(e) => handleUpdateOfflineItem(item.id, 'price', e.target.value)}
                        type="number"
                        variant="outlined"
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <IconButton
                        onClick={() => handleRemoveOfflineItem(item.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </>
            )}
          </Box>
        )}
      </Grid>

      {/* Donation component section */}
      <Grid item xs={12}>
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
              <Typography variant="h6">Donations</Typography>
            </Box>
          }
        />
        
        {components.donation.enabled && (
          <Box mt={2} pl={2}>
            <Typography variant="body2" color="textSecondary" paragraph>
              Accept donations from supporters
            </Typography>
            
            <Paper elevation={1} style={{ padding: 16 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Donation Type</FormLabel>
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
                    value="flexible"
                    control={<Radio color="primary" />}
                    label="Flexible - Supporters can choose from preset amounts or enter their own"
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
                    label="Fixed Donation Amount"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Box>
              )}
              
              {components.donation.pricingMode === 'flexible' && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Quick Amount Options (1-3 options)
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                    Set up to 3 quick selection amounts. Users can also enter custom amounts.
                  </Typography>
                  {components.donation.presetAmounts.map((amount, index) => (
                    <Box key={index} display="flex" alignItems="center" mb={1}>
                      <TextField
                        type="number"
                        value={amount}
                        onChange={(e) => handlePresetAmountChange(index, e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="Quick amount option"
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
                      startIcon={<Add />}
                      style={{ marginTop: 8 }}
                    >
                      Add Quick Option
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Grid>

      {/* Error display */}
      {error && (
        <Grid item xs={12}>
          <Typography color="error">{error}</Typography>
        </Grid>
      )}

      {/* Actions */}
      <Grid item xs={12}>
        <PublishSearchableActions
          loading={loading}
          onSubmit={handleSubmit}
          submitText={existingSearchable ? 'Update' : 'Publish'}
          disabled={!formData.title || !Object.values(components).some(c => c.enabled)}
        />
      </Grid>
      </Grid>
    </Box>
  );
};

export default PublishAllInOneSearchable;