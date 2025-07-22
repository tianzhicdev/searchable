import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CloseIcon from '@material-ui/icons/Close';
import backend from '../../views/utilities/Backend';

const useStyles = makeStyles((theme) => ({
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing(1)
  },
  dialogContent: {
    paddingTop: theme.spacing(2)
  },
  textField: {
    marginTop: theme.spacing(2)
  },
  characterCount: {
    textAlign: 'right',
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem'
  },
  actions: {
    padding: theme.spacing(2, 3)
  }
}));

const FeedbackDialog = ({ open, onClose }) => {
  const classes = useStyles();
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleSubmit = async () => {
    // Validate
    const trimmedFeedback = feedback.trim();
    if (!trimmedFeedback) {
      setSnackbar({ open: true, message: 'Please enter your feedback', severity: 'warning' });
      return;
    }

    if (trimmedFeedback.length > 5000) {
      setSnackbar({ open: true, message: 'Feedback is too long (max 5000 characters)', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Collect viewport info
      const viewport = `${window.innerWidth}x${window.innerHeight}`;
      
      const response = await backend.post('/v1/feedback', {
        feedback: trimmedFeedback,
        viewport
      });

      if (response.data.success) {
        setSnackbar({ open: true, message: 'Thank you for your feedback!', severity: 'success' });
        setFeedback('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      
      // Handle specific error cases
      if (error.response?.status === 429) {
        setSnackbar({ open: true, message: 'Too many feedback submissions. Please try again tomorrow.', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to send feedback. Please try again.', severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleKeyPress = (event) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const characterCount = feedback.length;
  const isOverLimit = characterCount > 5000;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="feedback-dialog"
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="h6">Send Feedback</Typography>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
          data-testid="feedback-dialog-close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className={classes.dialogContent}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Your feedback helps us improve:
        </Typography>
        
        <TextField
          autoFocus
          multiline
          rows={5}
          fullWidth
          variant="outlined"
          placeholder="Tell us what you think..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          className={classes.textField}
          inputProps={{
            'data-testid': 'feedback-input',
            maxLength: 6000 // Allow some buffer for user experience
          }}
        />
        
        <Typography 
          className={classes.characterCount}
          color={isOverLimit ? 'error' : 'textSecondary'}
        >
          {characterCount}/5000 characters
        </Typography>
      </DialogContent>
      
      <DialogActions className={classes.actions}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          data-testid="feedback-cancel-button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !feedback.trim() || isOverLimit}
          data-testid="feedback-submit-button"
        >
          {loading ? (
            <>
              <CircularProgress size={20} color="inherit" style={{ marginRight: 8 }} />
              Sending...
            </>
          ) : (
            'Send Feedback'
          )}
        </Button>
      </DialogActions>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default FeedbackDialog;