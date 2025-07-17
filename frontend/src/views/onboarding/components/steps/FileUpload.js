import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
  Paper,
} from '@material-ui/core';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { useOnboarding } from '../../OnboardingProvider';
import backend from '../../../../views/utilities/Backend';
import { testIdProps } from '../../../../utils/testIds';

const useStyles = makeStyles((theme) => ({
  dropzone: {
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: theme.palette.background.default,
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    },
  },
  dropzoneActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light,
  },
  uploadIcon: {
    fontSize: 48,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  fileList: {
    marginTop: theme.spacing(3),
    boxShadow: 'none !important',
    border: 'none !important',
    background: 'transparent !important',
  },
  fileItem: {
    marginBottom: theme.spacing(1),
  },
  continueButton: {
    marginTop: theme.spacing(3),
  },
  progressBar: {
    marginTop: theme.spacing(1),
  },
  error: {
    marginTop: theme.spacing(2),
  },
}));

const FileUpload = ({ stepConfig }) => {
  const classes = useStyles();
  const { uploadedFiles, setUploadedFiles, handleNext, setError } = useOnboarding();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localError, setLocalError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    setLocalError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      for (const file of files) {
        // Validate file type
        const allowedTypes = stepConfig.validation?.allowedTypes || [];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {
          throw new Error(`File type "${fileExtension}" is not allowed`);
        }

        // Validate file size
        const maxSize = stepConfig.validation?.maxSize || '100MB';
        const maxSizeBytes = parseInt(maxSize) * 1024 * 1024;
        
        if (file.size > maxSizeBytes) {
          throw new Error(`File "${file.name}" exceeds maximum size of ${maxSize}`);
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', 'onboarding');

        // Upload file
        const response = await backend.post('/v1/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        });

        if (response.data.success) {
          const newFile = {
            id: response.data.file_id,
            name: file.name,
            size: file.size,
            type: file.type,
            url: response.data.url,
          };
          
          setUploadedFiles(prev => [...prev, newFile]);
        } else {
          throw new Error(response.data.msg || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setLocalError(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleContinue = () => {
    if (uploadedFiles.length === 0 && stepConfig.validation?.required) {
      setLocalError('Please upload at least one file to continue');
      return;
    }
    handleNext();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box {...testIdProps('component', 'file-upload', 'container')}>
      <Box
        className={`${classes.dropzone} ${isDragOver ? classes.dropzoneActive : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...testIdProps('zone', 'file-upload', 'dropzone')}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          style={{ display: 'none' }}
          accept={stepConfig.validation?.allowedTypes?.map(type => `.${type}`).join(',')}
          {...testIdProps('input', 'file-upload', 'file-input')}
        />
        <CloudUploadIcon className={classes.uploadIcon} {...testIdProps('icon', 'file-upload', 'upload')} />
        <Typography variant="h6" {...testIdProps('text', 'file-upload', 'title')}>
          {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography 
          variant="body2" 
          color="textSecondary"
          {...testIdProps('text', 'file-upload', 'subtitle')}
        >
          or click to browse
        </Typography>
        {stepConfig.validation?.allowedTypes && (
          <Typography 
            variant="caption" 
            color="textSecondary"
            {...testIdProps('text', 'file-upload', 'formats')}
          >
            Supported formats: {stepConfig.validation.allowedTypes.join(', ')}
          </Typography>
        )}
      </Box>

      {uploading && (
        <LinearProgress
          variant="determinate"
          value={uploadProgress}
          className={classes.progressBar}
          {...testIdProps('progress', 'file-upload', 'bar')}
        />
      )}

      {localError && (
        <Alert 
          severity="error" 
          className={classes.error} 
          onClose={() => setLocalError(null)}
          {...testIdProps('alert', 'file-upload', 'error')}
        >
          {localError}
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Paper className={classes.fileList} elevation={0} {...testIdProps('list', 'uploaded-files', 'container')}>
          <List {...testIdProps('list', 'uploaded-files', 'list')}>
            {uploadedFiles.map((file) => (
              <ListItem key={file.id} className={classes.fileItem} {...testIdProps('list', 'uploaded-files', `item-${file.id}`)}>
                <ListItemIcon>
                  <FileIcon {...testIdProps('icon', 'file', 'document')} />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                  {...testIdProps('text', 'file', 'details')}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveFile(file.id)}
                    disabled={uploading}
                    {...testIdProps('button', 'file', 'delete')}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        className={classes.continueButton}
        onClick={handleContinue}
        disabled={uploading}
        {...testIdProps('button', 'file-upload', 'continue')}
      >
        {stepConfig.nextButton?.text || 'Continue'}
      </Button>
    </Box>
  );
};

export default FileUpload;