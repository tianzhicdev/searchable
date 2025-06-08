import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Card, CardContent, Typography, Divider, Grid, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, Box, Paper,
  Chip, Collapse, IconButton, List, ListItem, ListItemText, Avatar
} from '@material-ui/core';
import { 
  ExpandMore, ExpandLess, Message, Star, Person, 
  AccountCircle, Comment, Send 
} from '@material-ui/icons';
import { Rating } from '@material-ui/lab';
import PropTypes from 'prop-types';
import Backend from '../utilities/Backend';
import RatingComponent from '../../components/Rating/RatingComponent';

const Invoice = ({ invoice, userRole, onRatingSubmitted }) => {
    const account = useSelector((state) => state.account);
    
    // State for UI controls
    const [expanded, setExpanded] = useState(false);
    const [notesExpanded, setNotesExpanded] = useState(false);
    const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
    
    // State for notes
    const [notes, setNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    
    // State for ratings
    const [hasRated, setHasRated] = useState(false);
    const [loadingRatingStatus, setLoadingRatingStatus] = useState(false);

    // Check if user can rate this invoice
    useEffect(() => {
        if (userRole === 'buyer' && invoice.id) {
            checkCanRate();
        }
    }, [invoice.id, userRole]);

    const checkCanRate = async () => {
        try {
            setLoadingRatingStatus(true);
            const response = await Backend.get(`v1/rating/can-rate/${invoice.id}`);
            setHasRated(!response.data.can_rate);
        } catch (error) {
            console.error('Error checking rating status:', error);
        } finally {
            setLoadingRatingStatus(false);
        }
    };

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const handleNotesExpandClick = async () => {
        if (!notesExpanded && notes.length === 0) {
            await fetchNotes();
        }
        setNotesExpanded(!notesExpanded);
    };

    const fetchNotes = async () => {
        try {
            setLoadingNotes(true);
            const response = await Backend.get(`v1/invoice/${invoice.id}/notes`);
            setNotes(response.data.notes || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleSubmitNote = async () => {
        if (!newNote.trim()) return;

        try {
            setSubmittingNote(true);
            const response = await Backend.post(`v1/invoice/${invoice.id}/notes`, {
                content: newNote.trim()
            });
            
            // Add the new note to the list
            const newNoteData = {
                ...response.data.note,
                username: account.user?.username || 'You',
                created_at: new Date().toISOString()
            };
            setNotes([...notes, newNoteData]);
            setNewNote('');
        } catch (error) {
            console.error('Error submitting note:', error);
        } finally {
            setSubmittingNote(false);
        }
    };

    const handleRatingSubmit = async (ratingData) => {
        try {
            await Backend.post('v1/rating/submit', ratingData);
            setHasRated(true);
            setRatingDialogOpen(false);
            if (onRatingSubmitted) {
                onRatingSubmitted();
            }
        } catch (error) {
            throw error; // Re-throw to be handled by RatingComponent
        }
    };

    const formatCurrency = (amount, currency) => {
        if (currency === 'usd') {
            return `$${amount.toFixed(2)}`;
        }
        return `${amount} ${currency?.toUpperCase() || 'USD'}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusChip = () => {
        let label = invoice.payment_status || 'Unknown';
        let color = 'default';
        
        if (invoice.payment_status === 'complete') {
            color = 'primary';
            label = 'Paid';
        }
        
        return <Chip label={label} color={color} size="small" />;
    };

    const getRoleChip = () => {
        return (
            <Chip 
                label={userRole === 'buyer' ? 'Purchased' : 'Sold'} 
                color={userRole === 'buyer' ? 'secondary' : 'primary'}
                size="small"
                icon={userRole === 'buyer' ? <Person /> : <AccountCircle />}
            />
        );
    };

    // Parse selections from metadata
    const getSelections = () => {
        if (invoice.metadata && invoice.metadata.selections) {
            return invoice.metadata.selections;
        }
        return [];
    };

    const selections = getSelections();

    return (
        <>
            <Paper style={{ marginBottom: '16px' }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h6">
                                Invoice #{invoice.id}
                            </Typography>
                            {getStatusChip()}
                            {getRoleChip()}
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h6" color="primary">
                                {formatCurrency(invoice.amount, invoice.currency)}
                            </Typography>
                            <IconButton size="small" onClick={handleExpandClick}>
                                {expanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </Box>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="textSecondary">
                            {userRole === 'buyer' ? 'Seller' : 'Buyer'}: {invoice.other_party_username || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {formatDate(invoice.payment_date)}
                        </Typography>
                    </Box>

                    <Collapse in={expanded}>
                        <Divider style={{ margin: '16px 0' }} />
                        
                        {/* Invoice Details */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Payment Details
                                </Typography>
                                <Typography variant="body2">
                                    Type: {invoice.type?.toUpperCase() || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    Created: {formatDate(invoice.created_at)}
                                </Typography>
                                {invoice.fee > 0 && (
                                    <Typography variant="body2">
                                        Fee: {formatCurrency(invoice.fee, invoice.currency)}
                                    </Typography>
                                )}
                            </Grid>
                            
                            {selections.length > 0 && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Items Purchased
                                    </Typography>
                                    {selections.map((selection, index) => (
                                        <Typography key={index} variant="body2">
                                            {selection.name || `Item ${selection.id}`}
                                        </Typography>
                                    ))}
                                </Grid>
                            )}
                        </Grid>

                        {/* Action Buttons */}
                        <Box mt={2} display="flex" gap={1}>
                            <Button
                                startIcon={<Message />}
                                onClick={handleNotesExpandClick}
                                size="small"
                            >
                                Notes ({notes.length})
                            </Button>
                            
                            {userRole === 'buyer' && !hasRated && !loadingRatingStatus && (
                                <Button
                                    startIcon={<Star />}
                                    onClick={() => setRatingDialogOpen(true)}
                                    color="primary"
                                    size="small"
                                >
                                    Rate Purchase
                                </Button>
                            )}
                        </Box>

                        {/* Notes Section */}
                        <Collapse in={notesExpanded}>
                            <Box mt={2}>
                                <Divider style={{ marginBottom: '16px' }} />
                                <Typography variant="subtitle2" gutterBottom>
                                    Communication
                                </Typography>
                                
                                {/* Notes List */}
                                {notes.length > 0 ? (
                                    <List dense>
                                        {notes.map((note) => (
                                            <ListItem key={note.id} alignItems="flex-start">
                                                <Avatar style={{ marginRight: 8, width: 32, height: 32 }}>
                                                    {note.buyer_seller === 'buyer' ? 'B' : 'S'}
                                                </Avatar>
                                                <ListItemText
                                                    primary={
                                                        <Box display="flex" justifyContent="space-between">
                                                            <Typography variant="body2">
                                                                {note.username} ({note.buyer_seller})
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {formatDate(note.created_at)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={note.content}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
                                        No messages yet
                                    </Typography>
                                )}

                                {/* Add Note Input */}
                                <Box display="flex" gap={1} mt={2}>
                                    <TextField
                                        fullWidth
                                        placeholder="Add a message..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmitNote();
                                            }
                                        }}
                                        multiline
                                        maxRows={3}
                                        size="small"
                                    />
                                    <Button
                                        onClick={handleSubmitNote}
                                        disabled={!newNote.trim() || submittingNote}
                                        color="primary"
                                        variant="contained"
                                        size="small"
                                        style={{ minWidth: '40px', padding: '8px' }}
                                    >
                                        <Send fontSize="small" />
                                    </Button>
                                </Box>
                            </Box>
                        </Collapse>
                    </Collapse>
                </CardContent>
            </Paper>

            {/* Rating Dialog */}
            {userRole === 'buyer' && (
                <RatingComponent
                    open={ratingDialogOpen}
                    onClose={() => setRatingDialogOpen(false)}
                    purchase={{
                        invoice_id: invoice.id,
                        item_title: `Invoice #${invoice.id}`,
                        item_description: selections.map(s => s.name).join(', '),
                        amount: invoice.amount,
                        currency: invoice.currency,
                        payment_completed: invoice.payment_date
                    }}
                    onSubmitRating={handleRatingSubmit}
                />
            )}
        </>
    );
};

Invoice.propTypes = {
    invoice: PropTypes.object.isRequired,
    userRole: PropTypes.oneOf(['buyer', 'seller']).isRequired,
    onRatingSubmitted: PropTypes.func
};

export default Invoice;