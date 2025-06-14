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
import { useTheme } from '@material-ui/core/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import DeleteIcon from '@material-ui/icons/Delete';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import backend from '../utilities/Backend';
import ImageUploader from '../../components/ImageUploader';

const PublishDownloadableSearchable = () => {
  console.log("PublishDownloadableSearchable component is being rendered");
  const classes = useComponentStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    currency: 'usd' // Default currency selection
  });
  
  // State for downloadable files
  const [downloadableFiles, setDownloadableFiles] = useState([]);
  const [newFile, setNewFile] = useState({ name: '', description: '', price: '', file: null });
  
  // State for preview images (optional for the downloadable)
  const [images, setImages] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  const downloadableFileInputRef = useRef(null);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle preview image changes from ImageUploader component
  const handleImagesChange = (newImages) => {
    // Extract URIs from the image data objects
    const imageUris = newImages.map(img => img.uri);
    setImages(imageUris);
  };
  
  // Handle downloadable file selection
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFile({
        ...newFile,
        file: file,
        name: file.name // Always use the actual file name
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
  const addDownloadableFile = async () => {
    if (newFile.file && newFile.price) {
      try {
        setLoading(true);
        setError(null);

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
          setError("Failed to upload file. Please try again.");
        }

      } catch (error) {
        console.error("Error uploading file:", error);
        setError(error.response?.data?.error || "Failed to upload file. Please try again.");
      } finally {
        setLoading(false);
      }
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
            "images": images, // Store image URIs instead of base64
            "downloadableFiles": downloadableFiles.map(file => ({
              name: file.name,
              description: file.description,
              price: file.price,
              fileName: file.fileName,
              fileType: file.fileType,
              fileSize: file.fileSize,
              fileId: file.fileId // Only send the file_id, not the file data
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
        currency: 'usd'
      });
      setImages([]);
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
                <ImageUploader
                  images={images.map(uri => ({ uri, preview: uri }))}
                  onImagesChange={handleImagesChange}
                  maxImages={10}
                  title="Preview Images (Optional)"
                  description="Add up to 10 images to showcase your downloadable content"
                  imageSize={100}
                  onError={setError}
                />
              </Grid>
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Downloadable Files *
                </Typography>
                <Typography variant="caption" className={classes.formHelp}>
                  Add files that customers can download after purchase
                </Typography>
                
                <Box mt={2}>
                                    <Box display="flex" alignItems="center" mb={1}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<AttachFileIcon />}
                    >
                      Choose File
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
                    style={{ marginBottom: 8 }}
                  />
                  

                  
                  <Box display="flex" alignItems="center">
                    <TextField
                      placeholder="Price (USD)"
                      type="number"
                      size="small"
                      name="price"
                      value={newFile.price}
                      onChange={handleFileDataChange}
                      style={{ marginRight: 16, flex: 1 }}
                    />
                    <Button 
                      variant="contained" 
                      onClick={addDownloadableFile}
                      disabled={!newFile.file || !newFile.price || loading}
                    >
                      {loading ? <CircularProgress size={20} /> : 'Add File'}
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
                        border={`1px solid ${theme.palette.primary.main}`}
                      >
                        <Box style={{ flex: 3 }}>
                          <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                            {item.name}
                          </Typography>
                          {item.description && (
    <Typography variant="caption" color="textSecondary">
      {item.description}
    </Typography>
  )}
                          <Typography variant="caption" color="textSecondary">
                            {item.fileName} ({formatFileSize(item.fileSize)})
                          </Typography>
                        </Box>
                        <Box style={{ flex: 1, textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formatUSD(item.price)}
                          </Typography>
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
                    variant="contained"
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
