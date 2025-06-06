import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles';
import { 
  Grid, Typography, Button, Paper, Box, TextField, 
  CircularProgress, Divider, IconButton, MenuItem, Switch
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import DeleteIcon from '@material-ui/icons/Delete';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import { compressImage, fileToDataURL } from '../../utils/imageCompression';
import backend from '../utilities/Backend';

const PublishDownloadableSearchable = () => {
  console.log("PublishDownloadableSearchable component is being rendered");
  const classes = useComponentStyles();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    currency: 'sats' // Default currency selection
  });
  
  // State for downloadable files
  const [downloadableFiles, setDownloadableFiles] = useState([]);
  const [newFile, setNewFile] = useState({ name: '', price: '', file: null });
  
  // State for preview images (optional for the downloadable)
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // State variables for USD conversion
  const [btcPrice, setBtcPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  const fileInputRef = useRef(null);
  const downloadableFileInputRef = useRef(null);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle preview image uploads (optional)
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const validPreviews = [];
    setError(null);
    
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError(`File "${file.name}" is not an image.`);
          continue;
        }
        
        const processedFile = await compressImage(file, 200);
        validFiles.push(processedFile);
        
        const dataUrl = await fileToDataURL(processedFile);
        validPreviews.push(dataUrl);
      }
      
      setImages([...images, ...validFiles]);
      setPreviewImages([...previewImages, ...validPreviews]);
      
    } catch (error) {
      console.error("Error processing images:", error);
      setError("An error occurred while processing images. Please try again.");
    }
  };
  
  // Remove a preview image
  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...previewImages];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviewImages(newPreviews);
  };
  
  // Handle downloadable file selection
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFile({
        ...newFile,
        file: file,
        name: newFile.name || file.name // Use filename as default name if not set
      });
    }
  };
  
  // Handle downloadable file data changes
  const handleFileDataChange = (e) => {
    const { name, value } = e.target;
    setNewFile({
      ...newFile,
      [name]: value
    });
  };
  
  // Add downloadable file to the list
  const addDownloadableFile = () => {
    if (newFile.name.trim() && newFile.price && newFile.file) {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        setDownloadableFiles([
          ...downloadableFiles,
          { 
            id: Date.now(),
            name: newFile.name,
            price: parseInt(newFile.price),
            fileName: newFile.file.name,
            fileType: newFile.file.type,
            fileSize: newFile.file.size,
            fileData: base64String.split(',')[1] // Remove data:type;base64, prefix
          }
        ]);
        // Reset the input fields
        setNewFile({ name: '', price: '', file: null });
        if (downloadableFileInputRef.current) {
          downloadableFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(newFile.file);
    }
  };
  
  // Remove downloadable file from the list
  const removeDownloadableFile = (id) => {
    setDownloadableFiles(downloadableFiles.filter(item => item.id !== id));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate that at least one downloadable file is added
      if (downloadableFiles.length === 0) {
        setError("Please add at least one downloadable file.");
        setLoading(false);
        return;
      }
      
      // Create searchable data following the Terminal/Searchable paradigm
      const searchableData = {
        payloads: {
          "public": {
            "title": formData.title,
            "description": formData.description,
            "currency": formData.currency,
            "type": "downloadable", // Mark this as downloadable type
            "images": previewImages.map(base64String => {
              return base64String.split(',')[1];
            }),
            "downloadableFiles": downloadableFiles.map(file => ({
              name: file.name,
              price: file.price,
              fileName: file.fileName,
              fileType: file.fileType,
              fileSize: file.fileSize,
              fileData: file.fileData
            })),
            "visibility": {
              "udf": "always_true",
              "data": {}
            }
          }
        }
      };
      
      // Send the request with JSON data
      const response = await backend.post(
        'v1/searchable/create',
        searchableData
      );
      
      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        currency: 'sats'
      });
      setImages([]);
      setPreviewImages([]);
      setDownloadableFiles([]);
      
      // Redirect to searchables page after a delay
      setTimeout(() => {
        history.push('/searchables');
      }, 2000);
      
    } catch (err) {
      console.error("Error publishing downloadable searchable:", err);
      setError(err.response?.data?.message || "An error occurred while publishing. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Add effect to fetch BTC price when component mounts
  useEffect(() => {
    fetchBtcPrice();
  }, []);
  
  // Function to fetch current BTC price
  const fetchBtcPrice = async () => {
    setPriceLoading(true);
    try {
      const response = await backend.get(
        'v1/get-btc-price'
      );
      if (response.data && response.data.bitcoin && response.data.bitcoin.usd) {
        setBtcPrice(response.data.bitcoin.usd);
      }
    } catch (error) {
      console.error("Error fetching BTC price:", error);
    } finally {
      setPriceLoading(false);
    }
  };
  
  // Calculate USD price for a given satoshi amount
  const calculateUsdPrice = (satoshis) => {
    if (satoshis && btcPrice) {
      return (parseFloat(satoshis) / 100000000) * btcPrice;
    }
    return null;
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
  
  // Function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <Grid container className={classes.container}>
      <Grid item xs={12} className={classes.header}>
        <Button 
          variant="contained" 
          className={classes.iconButton} 
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
        <Paper elevation={3} >
          <form onSubmit={handleSubmit}>
            <Grid container spacing={1}>
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Title *
                </Typography>
                <TextField
                  fullWidth
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  required
                  className={classes.textInput}
                />
              </Grid>
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Currency Settings
                </Typography>

                <Box display="flex" alignItems="center" mb={2}>
                  <Typography variant="body2">Use Satoshis</Typography>
                  <Box mx={1}>
                    <Switch
                      checked={formData.currency === 'sats'}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          currency: e.target.checked ? 'sats' : 'usdt'
                        });
                      }}
                      name="currency_switch"
                    />
                  </Box>
                  <Typography variant="caption" className={classes.formHelp}>
                    Toggle to switch between Satoshis and USD
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Description
                </Typography>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  variant="outlined"
                  multiline
                  rows={4}
                  className={classes.textInput}
                />
              </Grid>
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Preview Images (Optional)
                </Typography>
                <Typography variant="caption" className={classes.formHelp}>
                  Add images to showcase your downloadable content
                </Typography>
                <input
                  type="file"
                  id="images"
                  name="images"
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  className={classes.fileInput}
                />
                <label htmlFor="images" className={classes.fileInputLabel}>
                  Choose Images
                </label>

                <Box className={classes.imagePreviewContainer}>
                  {previewImages.map((src, index) => (
                    <Box key={index} className={classes.imagePreview}>
                      <img src={src} alt={`Preview ${index}`} className={classes.previewImage} />
                      <IconButton 
                        size="small"
                        className={classes.removeImageButton} 
                        onClick={() => removeImage(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Downloadable Files *
                </Typography>
                <Typography variant="caption" className={classes.formHelp}>
                  Add files that customers can download after purchase
                </Typography>
                
                <Box mt={2}>
                  <TextField
                    placeholder="File Description"
                    size="small"
                    name="name"
                    value={newFile.name}
                    onChange={handleFileDataChange}
                    fullWidth
                    style={{ marginBottom: 8 }}
                  />
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <input
                      type="file"
                      id="downloadableFile"
                      onChange={handleFileUpload}
                      ref={downloadableFileInputRef}
                      className={classes.fileInput}
                    />
                    <label htmlFor="downloadableFile" className={classes.fileInputLabel}>
                      <AttachFileIcon fontSize="small" style={{ marginRight: 4 }} />
                      Choose File
                    </label>
                    {newFile.file && (
                      <Typography variant="caption" style={{ marginLeft: 16 }}>
                        {newFile.file.name} ({formatFileSize(newFile.file.size)})
                      </Typography>
                    )}
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <TextField
                      placeholder={formData.currency === 'sats' ? "Price (Sats)" : "Price (USD)"}
                      type="number"
                      size="small"
                      name="price"
                      value={newFile.price}
                      onChange={handleFileDataChange}
                      style={{ marginRight: 16, flex: 1 }}
                    />
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={addDownloadableFile}
                      disabled={!newFile.name.trim() || !newFile.price || !newFile.file}
                    >
                      Add File
                    </Button>
                  </Box>
                </Box>
                
                <Box mt={2}>
                  {downloadableFiles.length > 0 ? (
                    downloadableFiles.map((item) => (
                      <Box 
                        key={item.id} 
                        display="flex" 
                        alignItems="center" 
                        p={2} 
                        mb={1}
                        border="1px solid #ff3c00"
                      >
                        <Box style={{ flex: 3 }}>
                          <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.fileName} ({formatFileSize(item.fileSize)})
                          </Typography>
                        </Box>
                        <Box style={{ flex: 1, textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formData.currency === 'sats' ? 
                              `${item.price} sats` : 
                              `${formatUSD(item.price)}`}
                          </Typography>
                          {formData.currency === 'sats' && btcPrice && (
                            <Typography variant="caption" display="block" style={{ marginTop: 2 }}>
                              ≈ {formatUSD(calculateUsdPrice(item.price))}
                            </Typography>
                          )}
                          {formData.currency === 'usdt' && btcPrice && (
                            <Typography variant="caption" display="block" style={{ marginTop: 2 }}>
                              ≈ {Math.round((item.price * 100000000) / btcPrice)} sats
                            </Typography>
                          )}
                        </Box>
                        <IconButton 
                          size="small" 
                          onClick={() => removeDownloadableFile(item.id)}
                          style={{ marginLeft: 8 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No files added yet. Add at least one downloadable file to continue.
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box className={classes.formActions}>
                  <Button 
                    type="button" 
                    variant="outlined"
                    className={classes.button} 
                    onClick={() => history.push('/searchables')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    className={classes.button}
                    disabled={loading || downloadableFiles.length === 0}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Publish'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PublishDownloadableSearchable;
