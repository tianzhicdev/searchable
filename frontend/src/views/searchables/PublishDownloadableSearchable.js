import React, { useState, useRef, useEffect } from 'react';
import { 
  Grid, Typography, Box, TextField, Button, IconButton, CircularProgress, Paper, Divider
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/styles';
import { useLocation } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import AddIcon from '@material-ui/icons/Add';
import BasePublishSearchable from '../../components/BasePublishSearchable';
import backend from '../utilities/Backend';
import { detailPageStyles } from '../../utils/detailPageSpacing';

// Create styles for publish downloadable
const useStyles = makeStyles((theme) => ({
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
  }
}));

const PublishDownloadableSearchable = () => {
  console.log("PublishDownloadableSearchable component is being rendered");
  const theme = useTheme();
  const classes = useStyles();
  const location = useLocation();
  
  // Check if we're in edit mode
  const editMode = location.state?.editMode || false;
  const editData = location.state?.editData || null;
  
  // State for downloadable files
  const [downloadableFiles, setDownloadableFiles] = useState([]);
  const [newFile, setNewFile] = useState({ name: '', description: '', price: '', file: null });
  const [fileLoading, setFileLoading] = useState(false);
  
  const downloadableFileInputRef = useRef(null);

  // Initialize downloadable files if in edit mode
  useEffect(() => {
    if (editMode && editData) {
      const downloadableFilesData = editData.payloads?.public?.downloadableFiles || editData.downloadableFiles;
      if (downloadableFilesData) {
        console.log('Initializing downloadable files for edit mode:', downloadableFilesData);
        setDownloadableFiles(downloadableFilesData.map((file, index) => ({
          id: file.id || Date.now() + index,
          fileId: file.fileId,
          uuid: file.uuid,
          name: file.name,
          description: file.description || '',
          price: file.price || 0,
          fileName: file.fileName || file.name,
          fileType: file.fileType || '',
          fileSize: file.fileSize || 0
        })));
      }
    }
  }, [editMode, editData]);

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

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  // Create type-specific payload for downloadable searchable
  const getTypeSpecificPayload = (formData) => ({
    downloadableFiles: downloadableFiles.map(file => ({
      name: file.name,
      description: file.description,
      price: file.price,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      fileId: file.fileId // Only send the file_id, not the file data
    }))
  });

  // Form validation
  const isFormValid = () => {
    return downloadableFiles.length > 0; // At least one file required
  };

  // Custom validation for downloadable-specific requirements
  const customValidation = () => {
    if (downloadableFiles.length === 0) {
      return "Please add at least one downloadable content item.";
    }
    return null;
  };

  // Render type-specific content for downloadable files
  const renderDownloadableContent = ({ formData, handleInputChange, setError }) => (
    <Grid item xs={12}>
      <Typography variant="subtitle1">
        Downloadable Content *
      </Typography>
      <Typography variant="caption">
        Add content that customers can download after purchase
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
            Added Items ({downloadableFiles.length})
          </Typography>
          <Box style={{ flex: 1, height: 1, backgroundColor: theme.palette.primary.main }} />
        </Box>
      )}
      
      <Box className={classes.fileList}>
        {downloadableFiles.length > 0 ? (
          downloadableFiles.map((item) => (
            <Box key={item.id} style={{ marginBottom: theme.spacing(2) }}>
              <TextField
                value={item.name}
                onChange={(e) => updateFileData(item.id, 'name', e.target.value)}
                size="small"
                fullWidth
                variant="outlined"
                placeholder="File name"
                style={{ marginBottom: 4 }}
              />
              <TextField
                value={item.description}
                onChange={(e) => updateFileData(item.id, 'description', e.target.value)}
                size="small"
                fullWidth
                variant="outlined"
                placeholder="Description (optional)"
                style={{ marginBottom: 8 }}
              />
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <TextField
                  value={item.price}
                  onChange={(e) => updateFileData(item.id, 'price', e.target.value)}
                  size="small"
                  type="number"
                  variant="outlined"
                  placeholder="Price"
                  InputProps={{
                    startAdornment: '$'
                  }}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <IconButton 
                  size="small" 
                  onClick={() => removeDownloadableFile(item.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            No content added yet. Add at least one downloadable item to continue.
          </Typography>
        )}
      </Box>
    </Grid>
  );

  return (
    <BasePublishSearchable
      searchableType="downloadable"
      title={editMode ? "Edit Downloadable Item" : "Publish Downloadable Item"}
      subtitle={editMode ? "Update your downloadable item details" : "Create an item with files that customers can download after purchase"}
      renderTypeSpecificContent={renderDownloadableContent}
      getTypeSpecificPayload={getTypeSpecificPayload}
      isFormValid={isFormValid}
      customValidation={customValidation}
      showCurrency={true}
      imageDescription="Add up to 10 images"
      submitText={editMode ? "Update" : "Publish"}
      loadingText={editMode ? "Updating..." : "Publishing..."}
    />
  );
};

export default PublishDownloadableSearchable;