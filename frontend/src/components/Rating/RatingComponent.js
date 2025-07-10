import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert
} from '@material-ui/core';
import { Rating } from '@material-ui/lab';
import { StarBorder } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { componentSpacing, touchTargets } from '../../utils/spacing';
import { useTheme } from '@material-ui/core/styles';
import { useMediaQuery } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  dialogContent: componentSpacing.dialog(theme),
  button: componentSpacing.button(theme),
  dialog: {
    '& .MuiDialog-paper': {
      [theme.breakpoints.down('sm')]: {
        margin: theme.spacing(2),
        maxHeight: '90vh',
        width: 'calc(100vw - 32px)'
      }
    }
  },
  ratingContainer: {
    '& .MuiRating-root': {
      fontSize: '2rem',
      [theme.breakpoints.down('sm')]: {
        fontSize: '1.75rem'
      }
    },
    '& .MuiRating-icon': {
      padding: theme.spacing(0.5),
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(0.25)
      }
    }
  },
  chip: {
    minHeight: 32,
    fontSize: '0.875rem',
    [theme.breakpoints.down('sm')]: {
      minHeight: 28,
      fontSize: '0.75rem'
    }
  },
  itemInfo: {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1.5)
    }
  }
}));

const RatingComponent = ({ 
  open, 
  onClose, 
  purchase, 
  onSubmitRating,
  loading = false 
}) => {
  const styles = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      await onSubmitRating({
        invoice_id: purchase.invoice_id,
        rating: rating,
        review: review.trim()
      });
      
      // Reset form and close dialog
      setRating(0);
      setReview('');
      setError('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    setError('');
    onClose();
  };

  if (!purchase) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className={styles.dialog}
    >
      <DialogTitle>
        <Typography variant="h6">
          Rate Your Purchase
        </Typography>
      </DialogTitle>
      
      <DialogContent className={styles.dialogContent}>
        {error && (
          <Alert severity="error" style={{ marginBottom: 16 }}>
            {error}
          </Alert>
        )}
        
        <Box className={styles.itemInfo}>
          <Typography variant={isMobile ? "body1" : "subtitle1"} gutterBottom>
            Item: {purchase.item_title || 'Untitled Item'}
          </Typography>
          
          {purchase.item_description && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {purchase.item_description}
            </Typography>
          )}
          
          <Box 
            display="flex" 
            alignItems="center" 
            gap={isMobile ? 0.5 : 1} 
            mt={1}
            flexWrap={isMobile ? "wrap" : "nowrap"}
          >
            <Chip 
              label={`$${purchase.amount} ${purchase.currency?.toUpperCase()}`}
              size="small"
              color="primary"
              className={styles.chip}
            />
            <Typography variant="caption" color="textSecondary">
              Purchased: {new Date(purchase.payment_completed).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Box mb={isMobile ? 2 : 3} className={styles.ratingContainer}>
          <Typography component="legend" gutterBottom>
            How would you rate this item?
          </Typography>
          <Rating
            name="item-rating"
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
              setError(''); // Clear error when user selects rating
            }}
            emptyIcon={<StarBorder fontSize="inherit" />}
            size={isMobile ? "medium" : "large"}
          />
        </Box>

        <TextField
          multiline
          rows={4}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this item..."
          variant="outlined"
          fullWidth
          inputProps={{ maxLength: 500 }}
          helperText={`${review.length}/500 characters`}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading} className={styles.button}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || rating === 0}
          className={styles.button}
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingComponent;