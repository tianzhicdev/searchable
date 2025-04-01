import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, Typography, Divider, Grid, Button, Dialog, 
         DialogTitle, DialogContent, DialogActions, TextField, Slider, 
         DialogContentText } from '@material-ui/core';
import Rating from '@material-ui/lab/Rating';
import PropTypes from 'prop-types';
import { Box, Paper } from '@material-ui/core';
import axios from 'axios';
import configData from '../../config';

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
    const currentUserId = account && account.user ? account.user._id.toString() : visitorId;

    // Submit handlers (to be implemented later)
    const handleRatingSubmit = () => {
        // API call to update rating and review
        const updateRating = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                // Add authorization header if user is logged in
                if (account && account.token) {
                    headers['Authorization'] = account.token;
                } else if (visitorId) {
                    headers['X-Visitor-ID'] = visitorId;
                }
                
                const response = await axios.put(
                    `${configData.API_SERVER}kv?type=payment&pkey=${payment.public.Id}&fkey=${payment.public.Item}`, 
                    {
                        rating: ratingValue,
                        review: reviewText
                    },
                    { headers }
                );
                
                // Axios automatically throws errors for non-2xx responses
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
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                // Add authorization header if user is logged in
                if (account && account.token) {
                    headers['Authorization'] = account.token;
                } else if (visitorId) {
                    headers['X-Visitor-ID'] = visitorId;
                }
                
                const response = await axios.put(
                    `${configData.API_SERVER}kv?type=payment&pkey=${payment.public.Id}&fkey=${payment.public.Item}`, 
                    {
                        tracking: trackingNumber
                    },
                    { headers }
                );
                
                // Axios automatically throws errors for non-2xx responses
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

    const isUserBuyer = payment.private && 
                       ((account && account.user && payment.private.buyer_id === account.user._id.toString()) || 
                       (!account.user && payment.private.buyer_id === visitorId));
                       
    const hasTracking = payment.public && 
                       payment.public.tracking !== undefined && 
                       payment.public.tracking !== null && 
                       payment.public.tracking.trim() !== '';
                       
    // Check if user is the seller and tracking doesn't exist
    const isUserSeller = payment.private && 
                        ((account && account.user && payment.private.seller_id === account.user._id.toString()) || 
                        (!account.user && payment.private.seller_id === visitorId));

    const needsTracking = (!hasTracking) && isUserSeller;
    // Show Rate It button if user is buyer and has tracking
    const showRateButton = isUserBuyer && hasTracking && (payment.public.rating === null || payment.public.rating === undefined);
    
    // Show Add Tracking button if user is seller and tracking is null
    const showTrackingButton = isUserSeller && needsTracking;
    console.log(payment);
    console.log(account);
    return (
        <Grid item xs={12}>
            <Paper 
                id="searchable-profile"
                style={{ marginBottom: '16px', cursor: 'pointer' }}
            >
                <Box display="flex" flexDirection="row">
                    <Box id="item-details" flex="1 1 auto">
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
                                    <span style={{ color: '#3899ef' }}>{key}:</span> <span>{typeof value === 'number' && key.includes('amount') ? `${value} Sats` : value}</span>
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
                    </Box>
                </Box>
            </Paper>

            {/* Rating Dialog */}
            <Dialog open={rateDialogOpen} onClose={handleRateDialogClose}>
                <DialogTitle>Rate Your Purchase</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please rate your purchase from -3 to 3 and leave a review.
                    </DialogContentText>
                    <Box mt={2} mb={2}>
                        <Typography gutterBottom>Rating:</Typography>
                        <Slider
                            value={ratingValue}
                            onChange={(e, newValue) => setRatingValue(newValue)}
                            min={-3}
                            max={3}
                            step={1}
                            marks={[
                                { value: -3, label: '-3' },
                                { value: -2, label: '-2' },
                                { value: -1, label: '-1' },
                                { value: 0, label: '0' },
                                { value: 1, label: '1' },
                                { value: 2, label: '2' },
                                { value: 3, label: '3' }
                            ]}
                            valueLabelDisplay="on"
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
        </Grid>
    );
};

Payment.propTypes = {
    payment: PropTypes.object.isRequired
};

export default Payment; 