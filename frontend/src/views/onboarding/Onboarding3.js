import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Snackbar,
  Alert
} from '@material-ui/core';
import { ArrowBack, CloudUpload, Delete, AttachFile } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import backend from '../utilities/Backend';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    padding: theme.spacing(4),
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
  uploadSection: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
    padding: theme.spacing(4),
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    },
  },
  uploadIcon: {
    fontSize: 64,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  fileInput: {
    display: 'none',
  },
  fileList: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  nextButton: {
    marginTop: theme.spacing(4),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
}));

const Onboarding3 = () => {
  const classes = useStyles();
  const history = useHistory();
  const fileInputRef = useRef(null);
  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBack = () => {
    history.push('/onboarding-2');
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add metadata
        const metadata = {
          type: 'downloadable_content',
          purpose: 'onboarding'
        };
        formData.append('metadata', JSON.stringify(metadata));

        const response = await backend.post('v1/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          setUploadedFiles(prev => [...prev, {
            id: response.data.file_id,
            uuid: response.data.uuid,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
          }]);
        } else {
          throw new Error(response.data.msg || 'Upload failed');
        }
      }
      
      setSuccess(`Successfully uploaded ${files.length} file(s)`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleNext = () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one file to continue');
      return;
    }
    
    // Store uploaded files in sessionStorage to pass to next page
    sessionStorage.setItem('onboarding_files', JSON.stringify(uploadedFiles));
    history.push('/onboarding-3-1');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box className={classes.root}>
      <Container maxWidth="md">
        <Paper className={classes.paper} elevation={3}>
          {uploading && (
            <Box className={classes.loadingOverlay}>
              <CircularProgress />
            </Box>
          )}
          
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          
          <Typography variant="h3" gutterBottom>
            Upload Your Digital Content
          </Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Upload the files you want to sell in your store
          </Typography>

          <Box
            className={classes.uploadSection}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUpload className={classes.uploadIcon} />
            <Typography variant="h6">
              Drag & drop files here or click to browse
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported formats: PDF, ZIP, MP4, MP3, PNG, JPG, and more
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AttachFile />}
              style={{ marginTop: 16 }}
            >
              Select Files
            </Button>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className={classes.fileInput}
            accept=".pdf,.zip,.mp4,.mp3,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />

          {uploadedFiles.length > 0 && (
            <Box className={classes.fileList}>
              <Typography variant="h6" gutterBottom>
                Uploaded Files ({uploadedFiles.length})
              </Typography>
              <List>
                {uploadedFiles.map((file) => (
                  <ListItem key={file.id} divider>
                    <ListItemText
                      primary={file.name}
                      secondary={formatFileSize(file.size)}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveFile(file.id)}
                        disabled={uploading}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            className={classes.nextButton}
            onClick={handleNext}
            disabled={uploading}
          >
            Next
          </Button>
        </Paper>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
        >
          <Alert onClose={() => setSuccess('')} severity="success">
            {success}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Onboarding3;