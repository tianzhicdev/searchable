import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Snackbar,
  Alert
} from '@material-ui/core';
import { ContentCopy, Close as CloseIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import QRCode from 'react-qr-code';
import useComponentStyles from '../themes/componentStyles';
import { componentSpacing } from '../utils/spacing';
import { testIdProps } from '../utils/testIds';

const useStyles = makeStyles((theme) => ({
  dialogContent: componentSpacing.dialog(theme),
  button: componentSpacing.button(theme),
  dialog: {
    '& .MuiDialog-paper': {
      [theme.breakpoints.down('sm')]: {
        margin: theme.spacing(2),
        maxHeight: '90vh'
      }
    }
  }
}));

const ShareDialog = ({ open, onClose, searchableId, title, searchableType }) => {
  const classes = useComponentStyles();
  const styles = useStyles();
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (searchableId && searchableType) {
      let route;
      switch (searchableType) {
        case 'downloadable':
          route = 'searchable-item';
          break;
        case 'offline':
          route = 'offline-item';
          break;
        case 'direct':
          route = 'direct-item';
          break;
        default:
          route = 'searchable-item'; // Default fallback
      }
      const url = `${window.location.origin}/${route}/${searchableId}`;
      setShareUrl(url);
    }
  }, [searchableId, searchableType]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleClose = () => {
    setCopySuccess(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth className={styles.dialog} {...testIdProps('dialog', 'share', 'container')}>
        <DialogTitle {...testIdProps('dialog', 'share', 'title')}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Share "{title}"</Typography>
            <IconButton onClick={handleClose} size="small" {...testIdProps('button', 'share', 'close')}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.dialogContent} {...testIdProps('dialog', 'share', 'content')}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
            {/* QR Code */}
            <Box
              p={2}
              bgcolor="white"
              borderRadius="8px"
              boxShadow={2}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <QRCode
                value={shareUrl}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </Box>
            
            {/* Share URL */}
            <Box width="100%">
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Share this link:
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <TextField
                  value={shareUrl}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  {...testIdProps('input', 'share', 'url-field')}
                />
                <IconButton
                  onClick={handleCopyToClipboard}
                  color="primary"
                  title="Copy to clipboard"
                  {...testIdProps('button', 'share', 'copy-url')}
                >
                  <ContentCopy />
                </IconButton>
              </Box>
            </Box>
            
            {/* Instructions */}
            <Box textAlign="center">
              <Typography variant="body2" color="textSecondary">
                Scan the QR code or copy the link to share this posting
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions {...testIdProps('dialog', 'share', 'actions')}>
          <Button onClick={handleClose} color="primary" variant="contained" className={styles.button} {...testIdProps('button', 'share', 'close-action')}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopySuccess(false)} severity="success">
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareDialog;