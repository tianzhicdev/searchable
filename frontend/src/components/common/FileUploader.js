import React, { useCallback } from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { 
  CloudUpload as UploadIcon, 
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  Image as ImageIcon
} from '@material-ui/icons';
import { useDropzone } from 'react-dropzone';
import { spacing } from '../../utils/spacing';
import ActionButton from './ActionButton';

const useStyles = makeStyles((theme) => ({
  dropzone: {
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover
    }
  },
  dropzoneActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.selected
  },
  dropzoneError: {
    borderColor: theme.palette.error.main
  },
  icon: {
    fontSize: spacing(6),
    color: theme.palette.text.secondary,
    marginBottom: spacing(2)
  },
  text: {
    marginBottom: spacing(1)
  },
  hint: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem'
  },
  preview: {
    position: 'relative',
    display: 'inline-block',
    margin: spacing(1)
  },
  previewImage: {
    width: spacing(15),
    height: spacing(15),
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`
  },
  previewFile: {
    width: spacing(15),
    height: spacing(15),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper
  },
  removeButton: {
    position: 'absolute',
    top: -spacing(1),
    right: -spacing(1),
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText
    }
  },
  fileName: {
    fontSize: '0.75rem',
    marginTop: spacing(1),
    textAlign: 'center',
    wordBreak: 'break-word'
  },
  error: {
    color: theme.palette.error.main,
    marginTop: spacing(1),
    fontSize: '0.875rem'
  }
}));

const FileUploader = ({
  onDrop,
  onRemove,
  accept,
  maxSize,
  maxFiles = 1,
  files = [],
  loading = false,
  error,
  preview = true,
  text = 'Drag & drop files here, or click to select',
  hint,
  className
}) => {
  const classes = useStyles();

  const handleDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (onDrop) {
      onDrop(acceptedFiles, rejectedFiles);
    }
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
    maxFiles,
    multiple: maxFiles > 1,
    disabled: loading || (files.length >= maxFiles)
  });

  const getAcceptHint = () => {
    if (hint) return hint;
    
    const formats = [];
    if (accept) {
      if (accept['image/*']) formats.push('images');
      if (accept['application/pdf']) formats.push('PDF');
      if (accept['video/*']) formats.push('videos');
      if (accept['audio/*']) formats.push('audio');
    }
    
    if (formats.length === 0) return 'All file types accepted';
    return `Accepted: ${formats.join(', ')}`;
  };

  const isImage = (file) => {
    return file.type && file.type.startsWith('image/');
  };

  const renderPreview = (file, index) => {
    if (isImage(file)) {
      const url = typeof file === 'string' ? file : URL.createObjectURL(file);
      
      return (
        <Box key={index} className={classes.preview}>
          <img 
            src={url} 
            alt={file.name || 'Preview'} 
            className={classes.previewImage}
          />
          {onRemove && (
            <IconButton
              size="small"
              className={classes.removeButton}
              onClick={() => onRemove(index)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }

    return (
      <Box key={index} className={classes.preview}>
        <Box className={classes.previewFile}>
          <FileIcon fontSize="large" color="action" />
          <Typography 
            variant="caption" 
            className={classes.fileName}
            noWrap
          >
            {file.name}
          </Typography>
        </Box>
        {onRemove && (
          <IconButton
            size="small"
            className={classes.removeButton}
            onClick={() => onRemove(index)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  };

  const getDropzoneClass = () => {
    const classNames = [classes.dropzone];
    if (isDragActive) classNames.push(classes.dropzoneActive);
    if (error) classNames.push(classes.dropzoneError);
    if (className) classNames.push(className);
    return classNames.join(' ');
  };

  return (
    <Box>
      {files.length < maxFiles && (
        <Box {...getRootProps()} className={getDropzoneClass()}>
          <input {...getInputProps()} />
          
          {loading ? (
            <CircularProgress size={40} />
          ) : (
            <>
              <UploadIcon className={classes.icon} />
              <Typography variant="body1" className={classes.text}>
                {text}
              </Typography>
              <Typography variant="body2" className={classes.hint}>
                {getAcceptHint()}
                {maxSize && ` • Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
              </Typography>
            </>
          )}
        </Box>
      )}

      {error && (
        <Typography className={classes.error}>
          {error}
        </Typography>
      )}

      {preview && files.length > 0 && (
        <Box mt={2} display="flex" flexWrap="wrap">
          {files.map((file, index) => renderPreview(file, index))}
        </Box>
      )}
    </Box>
  );
};

export default FileUploader;