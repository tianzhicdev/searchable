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

const ShareDialog = ({ open, onClose, searchableId, title }) => {
  const classes = useComponentStyles();
  const styles = useStyles();
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (searchableId) {
      const url = `${window.location.origin}/searchable-details/${searchableId}`;
      setShareUrl(url);
    }
  }, [searchableId]);

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
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth className={styles.dialog}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Share "{title}"</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.dialogContent}>
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
                />
                <IconButton
                  onClick={handleCopyToClipboard}
                  color="primary"
                  title="Copy to clipboard"
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
        
        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="contained" className={styles.button}>
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