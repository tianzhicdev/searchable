import React, { useState, useRef, useEffect } from 'react';
import { 
  Grid, Typography, Box, TextField, Button, IconButton,
  FormControl, FormLabel, RadioGroup, Radio, FormControlLabel, CircularProgress,
  InputAdornment
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useLocation } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import AddIcon from '@material-ui/icons/Add';
import BasePublishSearchable from '../../components/BasePublishSearchable';
import backend from '../utilities/Backend';
import { detailPageStyles } from '../../utils/detailPageSpacing';

// Create styles for publish all-in-one
const useStyles = makeStyles((theme) => ({
  sectionContainer: {
    ...detailPageStyles.sectionWrapper(theme),
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    ...detailPageStyles.sectionTitle(theme),
    marginBottom: theme.spacing(2),
  },
  sectionDescription: {
    ...detailPageStyles.description(theme),
    marginBottom: theme.spacing(2),
  },
  enabledSection: {
    opacity: 1,
  },
  disabledSection: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  fileInput: {
    ...detailPageStyles.formField(theme),
  },
  fileItem: {
    ...detailPageStyles.card(theme),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  fileList: {
    ...detailPageStyles.itemContainer(theme),
  },
  addFileSection: {
    ...detailPageStyles.subSection(theme),
  },
  buttonGroup: {
    ...detailPageStyles.buttonGroup(theme),
  },
  toggleSection: {
    ...detailPageStyles.subSection(theme),
    padding: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
  },
  errorText: {
    color: theme.palette.error.main,
    marginTop: theme.spacing(1),
  }
}));

const PublishAllInOneSearchable = () => {
  console.log("PublishAllInOneSearchable component is being rendered");
  const classes = useStyles();
  const location = useLocation();
  
  // Check if we're in edit mode
  const editMode = location.state?.editMode || false;
  const editData = location.state?.editData || null;
  
  // State for toggling sections
  const [enableDownloadable, setEnableDownloadable] = useState(false);
  const [enableOffline, setEnableOffline] = useState(false);
  const [enableDirect, setEnableDirect] = useState(false);
  
  // State for downloadable files
  const [downloadableFiles, setDownloadableFiles] = useState([]);
  const [newFile, setNewFile] = useState({ name: '', description: '', price: '', file: null });
  const [fileLoading, setFileLoading] = useState(false);
  const downloadableFileInputRef = useRef(null);
  
  // State for offline items
  const [offlineItems, setOfflineItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '' });
  
  // State for direct payment (pricing mode and amounts)
  const [pricingMode, setPricingMode] = useState('flexible'); // 'fixed', 'preset', 'flexible'
  const [fixedAmount, setFixedAmount] = useState(9.99);
  const [presetAmounts, setPresetAmounts] = useState([4.99, 9.99, 14.99]); // Up to 3 preset amounts

  // Initialize state if in edit mode
  useEffect(() => {
    if (editMode && editData) {
      console.log('Initializing all-in-one for edit mode:', editData);
      const publicPayload = editData.payloads?.public || {};
      
      // Initialize section enables based on what data exists
      if (publicPayload.downloadableFiles && publicPayload.downloadableFiles.length > 0) {
        setEnableDownloadable(true);
        setDownloadableFiles(publicPayload.downloadableFiles.map((file, index) => ({
          id: Date.now() + index + Math.random(),
          name: file.name,
          description: file.description || '',
          price: file.price || 0,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          fileId: file.fileId,
          uuid: file.uuid
        })));
      }
      
      if (publicPayload.offlineItems && publicPayload.offlineItems.length > 0) {
        setEnableOffline(true);
        setOfflineItems(publicPayload.offlineItems.map((item, index) => ({
          itemId: item.itemId || Date.now() + index + Math.random(),
          name: item.name,
          description: item.description || '',
          price: item.price || 0
        })));
      }
      
      // Check for direct payment data
      if (publicPayload.pricingMode || publicPayload.defaultAmount !== null) {
        setEnableDirect(true);
        
        if (publicPayload.pricingMode) {
          setPricingMode(publicPayload.pricingMode);
          
          if (publicPayload.pricingMode === 'fixed' && publicPayload.fixedAmount) {
            setFixedAmount(publicPayload.fixedAmount);
          } else if (publicPayload.pricingMode === 'preset' && publicPayload.presetAmounts) {
            setPresetAmounts(publicPayload.presetAmounts);
          }
        } else {
          // Backward compatibility: if old defaultAmount exists, treat as fixed price
          const defaultAmountValue = publicPayload.defaultAmount ?? editData.defaultAmount;
          if (defaultAmountValue !== null && defaultAmountValue !== undefined) {
            setPricingMode('fixed');
            setFixedAmount(defaultAmountValue);
          }
        }
      }
    }
  }, [editMode, editData]);

  // ========== DOWNLOADABLE FUNCTIONS ==========
  
  // Handle file input change
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFile({ ...newFile, file: file });
    }
  };

  // Handle file data changes
  const handleFileDataChange = (e) => {
    const { name, value } = e.target;
    setNewFile({ ...newFile, [name]: value });
  };

  // Add downloadable file to the list
  const addDownloadableFile = async () => {
    if (newFile.file && newFile.price) {
      try {
        setFileLoading(true);

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', newFile.file);

        // Add metadata with description
        const metadata = {
          description: newFile.description,
          type: 'downloadable_content'
        };
        formData.append('metadata', JSON.stringify(metadata));

        // Upload file using the upload API
        const uploadResponse = await backend.post('v1/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (uploadResponse.data.success) {
          // Add file info with file_id to the list, include description
          setDownloadableFiles([
            ...downloadableFiles,
            { 
              id: Date.now(),
              name: newFile.name,
              description: newFile.description,
              price: Number(parseFloat(newFile.price).toFixed(2)),
              fileName: newFile.file.name,
              fileType: newFile.file.type,
              fileSize: newFile.file.size,
              fileId: uploadResponse.data.file_id,
              uuid: uploadResponse.data.uuid
            }
          ]);

          // Reset the input fields
          setNewFile({ name: '', description: '', price: '', file: null });
          if (downloadableFileInputRef.current) {
            downloadableFileInputRef.current.value = '';
          }
        } else {
          throw new Error("Failed to upload file. Please try again.");
        }

      } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error(error.response?.data?.error || "Failed to upload file. Please try again.");
      } finally {
        setFileLoading(false);
      }
    }
  };
  
  // Remove downloadable file from the list
  const removeDownloadableFile = (id) => {
    setDownloadableFiles(downloadableFiles.filter(item => item.id !== id));
  };

  // Update file data
  const updateFileData = (id, field, value) => {
    setDownloadableFiles(downloadableFiles.map(file => 
      file.id === id ? { ...file, [field]: field === 'price' ? Number(parseFloat(value).toFixed(2)) : value } : file
    ));
  };

  // ========== OFFLINE FUNCTIONS ==========
  
  // Handle offline item data changes
  const handleItemDataChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
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

  // Update item data
  const updateItemData = (itemId, field, value) => {
    setOfflineItems(offlineItems.map(item => 
      item.itemId === itemId ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value } : item
    ));
  };

  // ========== DIRECT PAYMENT FUNCTIONS ==========
  
  // Helper functions for preset amounts
  const addPresetAmount = () => {
    if (presetAmounts.length < 3) {
      setPresetAmounts([...presetAmounts, 0]);
    }
  };

  const updatePresetAmount = (index, value) => {
    const newAmounts = [...presetAmounts];
    newAmounts[index] = parseFloat(value) || 0;
    setPresetAmounts(newAmounts);
  };

  const removePresetAmount = (index) => {
    const newAmounts = presetAmounts.filter((_, i) => i !== index);
    setPresetAmounts(newAmounts);
  };

  // ========== SHARED FUNCTIONS ==========
  
  // Function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Create type-specific payload for all-in-one searchable
  const getTypeSpecificPayload = (formData) => {
    const payload = {};
    
    // Add downloadable files if enabled
    if (enableDownloadable && downloadableFiles.length > 0) {
      payload.downloadableFiles = downloadableFiles.map(file => ({
        name: file.name,
        description: file.description,
        price: file.price,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        fileId: file.fileId // Only send the file_id, not the file data
      }));
    }
    
    // Add offline items if enabled
    if (enableOffline && offlineItems.length > 0) {
      payload.offlineItems = offlineItems;
    }
    
    // Add direct payment data if enabled
    if (enableDirect) {
      if (pricingMode === 'fixed') {
        payload.pricingMode = 'fixed';
        payload.fixedAmount = fixedAmount;
        payload.defaultAmount = fixedAmount; // Backward compatibility
      } else if (pricingMode === 'preset') {
        const validAmounts = presetAmounts.filter(amount => amount && amount > 0);
        payload.pricingMode = 'preset';
        payload.presetAmounts = validAmounts;
        payload.defaultAmount = validAmounts.length > 0 ? validAmounts[0] : null; // Backward compatibility
      } else {
        payload.pricingMode = 'flexible';
        payload.defaultAmount = null; // No default amount for flexible mode
      }
    }
    
    return payload;
  };

  // Custom redirect path for all-in-one searchables
  const customRedirectPath = (response) => `/allinone-item/${response.data.searchable_id}`;

  // Form validation
  const isFormValid = () => {
    // Must have at least one section enabled
    if (!enableDownloadable && !enableOffline && !enableDirect) {
      return false;
    }
    
    // Validate downloadable section if enabled
    if (enableDownloadable && downloadableFiles.length === 0) {
      return false;
    }
    
    // Validate offline section if enabled
    if (enableOffline && offlineItems.length === 0) {
      return false;
    }
    
    // Validate direct payment section if enabled
    if (enableDirect) {
      if (pricingMode === 'fixed') {
        return fixedAmount && fixedAmount > 0;
      } else if (pricingMode === 'preset') {
        const validAmounts = presetAmounts.filter(amount => amount && amount > 0);
        return validAmounts.length >= 1 && validAmounts.length <= 3;
      }
    }
    
    return true;
  };

  // Custom validation for all-in-one specific requirements
  const customValidation = () => {
    if (!enableDownloadable && !enableOffline && !enableDirect) {
      return "Please enable at least one section: Digital Content, Physical Items, or Direct Payment.";
    }
    
    if (enableDownloadable && downloadableFiles.length === 0) {
      return "Please add at least one downloadable content item or disable the Digital Content section.";
    }
    
    if (enableOffline && offlineItems.length === 0) {
      return "Please add at least one physical item or disable the Physical Items section.";
    }
    
    if (enableDirect) {
      if (pricingMode === 'fixed' && (!fixedAmount || fixedAmount <= 0)) {
        return "Please enter a valid fixed amount for direct payments.";
      }
      if (pricingMode === 'preset') {
        const validAmounts = presetAmounts.filter(amount => amount && amount > 0);
        if (validAmounts.length === 0) {
          return "Please add at least one preset amount for direct payments.";
        }
      }
    }
    
    return null;
  };

  // Render type-specific content for all-in-one
  const renderTypeSpecificContent = ({ formData, handleInputChange, setError, theme }) => (
    <>
      {/* Section Enable/Disable Controls */}
      <Grid item xs={12}>
        <Typography variant="h6" className={classes.sectionTitle}>
          Configure Sections
        </Typography>
        <Typography variant="body2" className={classes.sectionDescription}>
          Choose which types of products/services you want to offer. You must enable at least one section.
        </Typography>
        
        <Box className={classes.toggleSection}>
          <FormControlLabel
            control={
              <input
                type="checkbox"
                checked={enableDownloadable}
                onChange={(e) => setEnableDownloadable(e.target.checked)}
              />
            }
            label="Digital Content - Sell downloadable files and digital products"
          />
        </Box>
        
        <Box className={classes.toggleSection}>
          <FormControlLabel
            control={
              <input
                type="checkbox"
                checked={enableOffline}
                onChange={(e) => setEnableOffline(e.target.checked)}
              />
            }
            label="Physical Items - Sell physical products or services"
          />
        </Box>
        
        <Box className={classes.toggleSection}>
          <FormControlLabel
            control={
              <input
                type="checkbox"
                checked={enableDirect}
                onChange={(e) => setEnableDirect(e.target.checked)}
              />
            }
            label="Direct Payment - Accept donations or flexible payments"
          />
        </Box>
        
        {!enableDownloadable && !enableOffline && !enableDirect && (
          <Typography variant="caption" className={classes.errorText}>
            Please enable at least one section above.
          </Typography>
        )}
      </Grid>

      {/* Digital Content Section */}
      {enableDownloadable && (
        <Grid item xs={12}>
          <Box className={`${classes.sectionContainer} ${enableDownloadable ? classes.enabledSection : classes.disabledSection}`}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Digital Content
            </Typography>
            <Typography variant="body2" className={classes.sectionDescription}>
              Add downloadable files that customers can purchase and download
            </Typography>
            
            <Box className={classes.addFileSection}>
              <Box display="flex" alignItems="center" mb={2}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<AttachFileIcon />}
                >
                  Choose Content
                  <input
                    type="file"
                    id="downloadableFile"
                    onChange={handleFileUpload}
                    ref={downloadableFileInputRef}
                    hidden
                  />
                </Button>
                {newFile.file && (
                  <Typography variant="caption" style={{ marginLeft: 16 }}>
                    {newFile.file.name} ({formatFileSize(newFile.file.size)})
                  </Typography>
                )}
              </Box>
              
              <TextField
                placeholder="File Description"
                size="small"
                name="description"
                value={newFile.description}
                onChange={handleFileDataChange}
                fullWidth
                variant="outlined"
                style={{ marginBottom: 8 }}
              />
              
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <TextField
                  placeholder="Price (USD)"
                  type="number"
                  size="small"
                  name="price"
                  value={newFile.price}
                  onChange={handleFileDataChange}
                  variant="outlined"
                  InputProps={{
                    startAdornment: '$'
                  }}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    addDownloadableFile().catch(err => setError(err.message));
                  }}
                  disabled={!newFile.file || !newFile.price || fileLoading}
                >
                  {fileLoading ? <CircularProgress size={20} /> : <AddIcon />}
                </IconButton>
              </Box>
            </Box>
            
            {downloadableFiles.length > 0 && (
              <Box display="flex" alignItems="center" style={{ margin: '16px 0' }}>
                <Typography variant="subtitle2" style={{ marginRight: 8 }}>
                  Added Files ({downloadableFiles.length})
                </Typography>
                <Box style={{ flex: 1, height: 1, backgroundColor: theme.palette.primary.main }} />
              </Box>
            )}
            
            <Box className={classes.fileList}>
              {downloadableFiles.map((item) => (
                <Box key={item.id} className={classes.fileItem}>
                  <TextField
                    value={item.name}
                    onChange={(e) => updateFileData(item.id, 'name', e.target.value)}
                    size="small"
                    fullWidth
                    variant="outlined"
                    placeholder="File Name"
                    style={{ marginRight: 8 }}
                  />
                  <TextField
                    value={item.description}
                    onChange={(e) => updateFileData(item.id, 'description', e.target.value)}
                    size="small"
                    fullWidth
                    variant="outlined"
                    placeholder="Description"
                    style={{ marginRight: 8 }}
                  />
                  <TextField
                    value={item.price}
                    onChange={(e) => updateFileData(item.id, 'price', e.target.value)}
                    size="small"
                    type="number"
                    variant="outlined"
                    InputProps={{ startAdornment: '$' }}
                    style={{ width: 100, marginRight: 8 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeDownloadableFile(item.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      )}

      {/* Physical Items Section */}
      {enableOffline && (
        <Grid item xs={12}>
          <Box className={`${classes.sectionContainer} ${enableOffline ? classes.enabledSection : classes.disabledSection}`}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Physical Items
            </Typography>
            <Typography variant="body2" className={classes.sectionDescription}>
              Add physical products or services that customers can purchase
            </Typography>
            
            <Box className={classes.addFileSection}>
              <TextField
                placeholder="Item Name"
                size="small"
                name="name"
                value={newItem.name}
                onChange={handleItemDataChange}
                fullWidth
                variant="outlined"
                style={{ marginBottom: 8 }}
              />
              
              <TextField
                placeholder="Item Description"
                size="small"
                name="description"
                value={newItem.description}
                onChange={handleItemDataChange}
                fullWidth
                variant="outlined"
                style={{ marginBottom: 8 }}
              />
              
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <TextField
                  placeholder="Price (USD)"
                  type="number"
                  size="small"
                  name="price"
                  value={newItem.price}
                  onChange={handleItemDataChange}
                  variant="outlined"
                  InputProps={{
                    startAdornment: '$'
                  }}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <IconButton
                  size="small"
                  onClick={() => addOfflineItem(setError)}
                  disabled={!newItem.name || !newItem.price}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
            
            {offlineItems.length > 0 && (
              <Box display="flex" alignItems="center" style={{ margin: '16px 0' }}>
                <Typography variant="subtitle2" style={{ marginRight: 8 }}>
                  Added Items ({offlineItems.length})
                </Typography>
                <Box style={{ flex: 1, height: 1, backgroundColor: theme.palette.primary.main }} />
              </Box>
            )}
            
            <Box className={classes.fileList}>
              {offlineItems.map((item) => (
                <Box key={item.itemId} className={classes.fileItem}>
                  <TextField
                    value={item.name}
                    onChange={(e) => updateItemData(item.itemId, 'name', e.target.value)}
                    size="small"
                    fullWidth
                    variant="outlined"
                    placeholder="Item Name"
                    style={{ marginRight: 8 }}
                  />
                  <TextField
                    value={item.description}
                    onChange={(e) => updateItemData(item.itemId, 'description', e.target.value)}
                    size="small"
                    fullWidth
                    variant="outlined"
                    placeholder="Description"
                    style={{ marginRight: 8 }}
                  />
                  <TextField
                    value={item.price}
                    onChange={(e) => updateItemData(item.itemId, 'price', e.target.value)}
                    size="small"
                    type="number"
                    variant="outlined"
                    InputProps={{ startAdornment: '$' }}
                    style={{ width: 100, marginRight: 8 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeOfflineItem(item.itemId)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      )}

      {/* Direct Payment Section */}
      {enableDirect && (
        <Grid item xs={12}>
          <Box className={`${classes.sectionContainer} ${enableDirect ? classes.enabledSection : classes.disabledSection}`}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Direct Payment
            </Typography>
            <Typography variant="body2" className={classes.sectionDescription}>
              Configure how customers can make direct payments or donations
            </Typography>
            
            <FormControl component="fieldset" style={{ marginBottom: 16 }}>
              <FormLabel component="legend">Payment Type</FormLabel>
              <RadioGroup
                value={pricingMode}
                onChange={(e) => setPricingMode(e.target.value)}
                row
              >
                <FormControlLabel value="flexible" control={<Radio />} label="Flexible Amount" />
                <FormControlLabel value="fixed" control={<Radio />} label="Fixed Amount" />
                <FormControlLabel value="preset" control={<Radio />} label="Preset Options" />
              </RadioGroup>
            </FormControl>

            {pricingMode === 'fixed' && (
              <TextField
                label="Fixed Amount"
                type="number"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                variant="outlined"
                size="small"
                style={{ marginBottom: 16 }}
              />
            )}

            {pricingMode === 'preset' && (
              <Box>
                <Typography variant="subtitle2" style={{ marginBottom: 8 }}>
                  Preset Amounts (1-3 options)
                </Typography>
                {presetAmounts.map((amount, index) => (
                  <Box key={index} display="flex" alignItems="center" style={{ marginBottom: 8 }}>
                    <TextField
                      type="number"
                      value={amount}
                      onChange={(e) => updatePresetAmount(index, e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      variant="outlined"
                      size="small"
                      style={{ marginRight: 8 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removePresetAmount(index)}
                      disabled={presetAmounts.length <= 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                {presetAmounts.length < 3 && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addPresetAmount}
                  >
                    Add Amount
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Grid>
      )}
    </>
  );

  return (
    <BasePublishSearchable
      searchableType="allinone"
      title="Publish All-in-One Store"
      subtitle="Create a comprehensive store with digital content, physical items, and direct payments"
      renderTypeSpecificContent={renderTypeSpecificContent}
      customValidation={customValidation}
      getTypeSpecificPayload={getTypeSpecificPayload}
      customRedirectPath={customRedirectPath}
      isFormValid={isFormValid}
      submitText="Publish Store"
      loadingText="Publishing Store..."
    />
  );
};

export default PublishAllInOneSearchable;