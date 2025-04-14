import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, Typography, Divider, Grid, Button, Dialog, 
         DialogTitle, DialogContent, DialogActions, TextField, Slider, 
         DialogContentText } from '@material-ui/core';
import Rating from '@material-ui/lab/Rating';
import PropTypes from 'prop-types';
import { Box, Paper } from '@material-ui/core';
import configData from '../../config';
import Backend from '../utilities/Backend';

const Payment = ({ payment }) => {
    const account = useSelector((state) => state.account);
    const visitorId = localStorage.getItem('visitorId');
    // Get all payment properties and convert to array of [key, value] pairs
    // Filter out entries with empty string values
    const publicPaymentEntries = Object.entries(payment.public || {}).filter(([key, value]) => 
        value !== '' && value !== null && value !== undefined
    );
    
    // State for dialogs
    const [rateDialogOpen, setRateDialogOpen] = useState(false);
    const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
    const [ratingValue, setRatingValue] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');

    // Dialog handlers
    const handleRateDialogOpen = () => setRateDialogOpen(true);
    const handleRateDialogClose = () => setRateDialogOpen(false);
    const handleTrackingDialogOpen = () => setTrackingDialogOpen(true);
    const handleTrackingDialogClose = () => setTrackingDialogOpen(false);

    // Get the current user's ID (either logged in or visitor)
    const isLoggedIn = account && account.isLoggedIn;
    const currentUserId = isLoggedIn && account.user ? account.user._id?.toString() : visitorId;

    // Submit handlers (to be implemented later)
    const handleRatingSubmit = () => {
        // API call to update rating and review
        const updateRating = async () => {
            try {
                // todo: need to debug this cuz when ratingValue is 4.5 it is sent as 4
                const payload = {
                    rating: ratingValue,
                    review: reviewText,
                    payment_id: payment.public.id
                };
                
                await Backend.post(
                    `v1/rating`,
                    payload
                );
                
                console.log('Rating and review updated successfully');
            } catch (error) {
                console.error('Error updating rating and review:', error);
            }
        };
        
        // Call the update function
        updateRating();
        handleRateDialogClose();
    };

    const handleTrackingSubmit = () => {
        // API call to update tracking number
        const updateTracking = async () => {
            try {
                const payload = {
                    tracking: trackingNumber,
                    payment_id: payment.public.id
                };
                
                await Backend.post(
                    `v1/tracking`,
                    payload
                );
                
                console.log('Tracking information updated successfully');
            } catch (error) {
                console.error('Error updating tracking:', error);
            }
        };
        
        // Call the update function
        updateTracking();
        handleTrackingDialogClose();
    };

    // Check if user is the buyer and tracking exists
    const isWithdrawal = payment.private && 
                         payment.private.withdrawer_id !== undefined && 
                         payment.private.withdrawer_id !== null && 
                         payment.private.withdrawer_id.trim() !== ''
                         && payment.private.withdrawer_id === account.user._id.toString();

    console.log("isWithdrawal");
    console.log(isWithdrawal);
    console.log(payment.private);
    console.log(account.user._id);

    const isUserBuyer = payment.private && payment.private.buyer_id === currentUserId
                       
    const hasTracking = payment.public && 
                       payment.public.tracking !== undefined && 
                       payment.public.tracking !== null && 
                       payment.public.tracking.trim() !== '';
                       
    // Check if user is the seller and tracking doesn't exist
    const isUserSeller = payment.private && payment.private.seller_id === currentUserId

    const needsTracking = (!hasTracking) && isUserSeller;
    // Show Rate It button if user is buyer and has tracking
    const showRateButton = isUserBuyer && hasTracking && (payment.public.rating === null || payment.public.rating === undefined || payment.public.rating === "");
    
    // Show Add Tracking button if user is seller and tracking is null
    const showTrackingButton = isUserSeller && needsTracking;
    console.log(payment);
    console.log(account);
    return (
        <>
            <Paper 
                id="searchable-profile"
                style={{ marginBottom: '16px', cursor: 'pointer' }}
            >
                        <Box display="flex" flexDirection="row" flexWrap="wrap" alignItems="center">
                            {publicPaymentEntries.map(([key, value]) => (
                                <Typography 
                                    key={key} 
                                    variant="body1" 
                                    style={{ 
                                        marginRight: '16px',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        maxWidth: '100%'
                                    }}
                                >
                                    <span style={{ color: '#3899ef' }}>{key}:</span> <span>{typeof value === 'number' && key.includes('amount') ? `${value}` : value}</span>
                                </Typography>
                            ))}
                 
                            <Typography variant="body1" style={{ marginRight: '16px' }}>
                                    {isWithdrawal ? '[WITHDRAWAL]' : ''} 
                            </Typography>
                            
                            <Typography variant="body1" style={{ marginRight: '16px' }}>
                                {isUserBuyer ? '[PAID]' : ''} 
                            </Typography>
                            <Typography variant="body1" style={{ marginRight: '16px' }}>    
                                {isUserSeller ? '[SOLD]' : ''}
                                </Typography>
                            
                            {/* Action Buttons moved here */}
                            {showRateButton && (
                                <Button 
                                    variant="outlined" 
                                    onClick={handleRateDialogOpen}
                                    style={{ marginRight: '8px' }}
                                    size="small"
                                >
                                    Rate It
                                </Button>
                            )}
                            
                            {needsTracking && (
                                <Button 
                                    variant="outlined" 
                                    onClick={handleTrackingDialogOpen}
                                    size="small"
                                >
                                    Add Tracking #
                                </Button>
                            )}
                        </Box>
            </Paper>

            {/* Rating Dialog */}
            <Dialog open={rateDialogOpen} onClose={handleRateDialogClose}>
                <DialogTitle>Rate Your Purchase</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please rate your purchase from 0 to 5 stars and leave a review.
                    </DialogContentText>
                    <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
                        <Typography gutterBottom>Rating:</Typography>
                        <Rating
                            name="purchase-rating"
                            value={ratingValue}
                            onChange={(event, newValue) => {
                                console.log("ratingValue", newValue);
                                setRatingValue(newValue);
                            }}
                            precision={0.5}
                            size="large"
                        />
                    </Box>
                    <TextField
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRateDialogClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleRatingSubmit} color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Tracking Number Dialog */}
            <Dialog open={trackingDialogOpen} onClose={handleTrackingDialogClose}>
                <DialogTitle>Add Tracking Number</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter the tracking number for this order.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        fullWidth
                        variant="outlined"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleTrackingDialogClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleTrackingSubmit} color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

Payment.propTypes = {
    payment: PropTypes.object.isRequired
};

export default Payment; 