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

const RatingComponent = ({ 
  open, 
  onClose, 
  purchase, 
  onSubmitRating,
  loading = false 
}) => {
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
    >
      <DialogTitle>
        <Typography variant="h6">
          Rate Your Purchase
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" style={{ marginBottom: 16 }}>
            {error}
          </Alert>
        )}
        
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Item: {purchase.item_title || 'Untitled Item'}
          </Typography>
          
          {purchase.item_description && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {purchase.item_description}
            </Typography>
          )}
          
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <Chip 
              label={`$${purchase.amount} ${purchase.currency?.toUpperCase()}`}
              size="small"
              color="primary"
            />
            <Typography variant="caption" color="textSecondary">
              Purchased: {new Date(purchase.payment_completed).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Box mb={3}>
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
            size="large"
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
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || rating === 0}
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingComponent;