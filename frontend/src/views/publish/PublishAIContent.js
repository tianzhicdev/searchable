import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Chip,
  Grid,
  Snackbar
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { Alert } from '@material-ui/lab';
import DeleteIcon from '@material-ui/icons/Delete';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import backend from '../utilities/Backend';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(4),
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  form: {
    '& > *': {
      marginBottom: theme.spacing(3),
    },
  },
  uploadButton: {
    marginTop: theme.spacing(2),
  },
  fileList: {
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  submitButton: {
    marginTop: theme.spacing(4),
  },
  fileInput: {
    display: 'none',
  },
  progressBar: {
    marginTop: theme.spacing(2),
  },
  fileChip: {
    marginRight: theme.spacing(1),
  },
}));

const PublishAIContent = () => {
  const classes = useStyles();
  const history = useHistory();
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadingFile, setCurrentUploadingFile] = useState('');

  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    // Validate file count
    if (files.length + selectedFiles.length > 10) {
      setError('Maximum 10 files allowed');
      return;
    }

    // Validate file sizes (500MB each)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      setError(`Files exceed 500MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload files one by one
      const uploadedFiles = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentUploadingFile(`Uploading ${file.name} (${i + 1}/${selectedFiles.length})...`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', `AI Content File: ${file.name}`);
        
        const response = await backend.post('/v1/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.success) {
          uploadedFiles.push({
            fileId: response.data.file_id,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
          });
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }

        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }
      setCurrentUploadingFile('');

      // Add uploaded files to state
      setFiles([...files, ...uploadedFiles]);
      // Reset the file input
      event.target.value = '';
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setCurrentUploadingFile('');
    }
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!instructions.trim()) {
      setError('Instructions are required');
      return;
    }

    if (files.length === 0) {
      setError('At least one file is required');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await backend.post('/v1/ai-content', {
        title: title.trim(),
        instructions: instructions.trim(),
        files: files,
      });

      if (response.data.success) {
        // Navigate to dashboard on success
        history.push('/dashboard', {
          message: 'AI content submitted successfully!',
        });
      } else {
        setError(response.data.msg || 'Failed to submit AI content');
      }
    } catch (err) {
      setError(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Container maxWidth="md">
      <Paper className={classes.paper}>
        <Typography variant="h4" gutterBottom>
          AI Content Manager
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Upload files and provide instructions for AI processing. Our team will process your content and create appropriate listings.
        </Typography>

        <Box className={classes.form}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title"
            variant="outlined"
            required
            inputProps={{ maxLength: 255 }}
            helperText={`${title.length}/255 characters`}
          />

          <TextField
            fullWidth
            label="Instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Provide detailed instructions for processing these files..."
            variant="outlined"
            required
            multiline
            rows={6}
            helperText="Explain what you want us to do with these files"
          />

          <Box>
            <Typography variant="h6" gutterBottom>
              Files ({files.length}/10)
            </Typography>
            
            <input
              accept="*"
              className={classes.fileInput}
              id="file-upload"
              multiple
              type="file"
              onChange={handleFileSelect}
              disabled={uploading || files.length >= 10}
            />
            <label htmlFor="file-upload">
              <Button
                variant="contained"
                component="span"
                className={classes.uploadButton}
                startIcon={<CloudUploadIcon />}
                disabled={uploading || files.length >= 10}
              >
                Choose Files
              </Button>
            </label>

            {uploading && (
              <Box>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  className={classes.progressBar}
                />
                {currentUploadingFile && (
                  <Typography variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
                    {currentUploadingFile}
                  </Typography>
                )}
              </Box>
            )}

            {files.length > 0 && (
              <List className={classes.fileList}>
                {files.map((file, index) => (
                  <ListItem key={index}>
                    <AttachFileIcon color="action" style={{ marginRight: 8 }} />
                    <ListItemText
                      primary={file.fileName}
                      secondary={
                        <Box>
                          <Chip 
                            label={formatFileSize(file.fileSize)} 
                            size="small" 
                            className={classes.fileChip}
                          />
                          <Chip 
                            label={file.mimeType} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading || submitting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className={classes.submitButton}
              >
                {submitting ? 'Submitting...' : 'Submit AI Content'}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                size="large"
                onClick={() => history.goBack()}
                disabled={submitting || uploading}
                className={classes.submitButton}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default PublishAIContent;