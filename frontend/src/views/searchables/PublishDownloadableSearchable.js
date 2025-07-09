import React, { useState, useRef } from 'react';
import { 
  Grid, Typography, Box, TextField, Button, IconButton, CircularProgress
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import BasePublishSearchable from '../../components/BasePublishSearchable';
import backend from '../utilities/Backend';

const PublishDownloadableSearchable = () => {
  
  const theme = useTheme();
  
  // State for downloadable files
  const [downloadableFiles, setDownloadableFiles] = useState([]);
  const [newFile, setNewFile] = useState({ name: '', description: '', price: '', file: null });
  const [fileLoading, setFileLoading] = useState(false);
  
  const downloadableFileInputRef = useRef(null);

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
      return "Please add at least one downloadable file.";
    }
    return null;
  };

  // Render type-specific content for downloadable files
  const renderDownloadableContent = ({ formData, handleInputChange, setError }) => (
    <Grid item xs={12}>
      <Typography variant="subtitle1">
        Downloadable Files *
      </Typography>
      <Typography variant="caption">
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
            onClick={() => {
              addDownloadableFile().catch(err => setError(err.message));
            }}
            disabled={!newFile.file || !newFile.price || fileLoading}
          >
            {fileLoading ? <CircularProgress size={20} /> : 'Add File'}
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
  );

  return (
    <BasePublishSearchable
      searchableType="downloadable"
      title="Publish Downloadable Item"
      subtitle="Create an item with files that customers can download after purchase"
      renderTypeSpecificContent={renderDownloadableContent}
      getTypeSpecificPayload={getTypeSpecificPayload}
      isFormValid={isFormValid}
      customValidation={customValidation}
      showCurrency={true}
      imageDescription="Add up to 10 images"
    />
  );
};

export default PublishDownloadableSearchable;