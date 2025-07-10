import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Card, CardContent, Typography, Divider, Grid, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, Box, Paper,
  Chip, Collapse, IconButton, List, ListItem, ListItemText, Avatar,
  useTheme, useMediaQuery
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { 
  ExpandMore, ExpandLess, Message, Star, Person, 
  AccountCircle, Comment, Send 
} from '@material-ui/icons';
import { Rating } from '@material-ui/lab';
import PropTypes from 'prop-types';
import Backend from '../utilities/Backend';
import RatingComponent from '../../components/Rating/RatingComponent';
import useComponentStyles from '../../themes/componentStyles';
import { touchTargets, componentSpacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  listItem: {
    minHeight: touchTargets.clickable.minHeight,
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1)
    }
  },
  notesList: {
    padding: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.5)
    }
  },
  messageInput: {
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.875rem'
    }
  },
  communicationSection: {
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5)
    }
  }
}));

const Invoice = ({ invoice, userRole, onRatingSubmitted }) => {
    const account = useSelector((state) => state.account);
    const classes = useComponentStyles();
    const styles = useStyles();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // State for UI controls
    const [expanded, setExpanded] = useState(false);
    const [notesExpanded, setNotesExpanded] = useState(false);
    const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
    
    // State for notes
    const [notes, setNotes] = useState([]);
    const [noteCount, setNoteCount] = useState(0);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    
    // State for ratings
    const [hasRated, setHasRated] = useState(false);
    const [loadingRatingStatus, setLoadingRatingStatus] = useState(false);

    // Initialize component data
    useEffect(() => {
        if (invoice.id) {
            // Fetch note count for display
            fetchNoteCount();
            
            // Check if user can rate this invoice (buyers only)
            if (userRole === 'buyer') {
                checkCanRate();
            }
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

    const fetchNoteCount = async () => {
        try {
            const response = await Backend.get(`v1/invoice/${invoice.id}/notes`);
            const fetchedNotes = response.data.notes || [];
            setNoteCount(fetchedNotes.length);
        } catch (error) {
            console.error('Error fetching note count:', error);
            setNoteCount(0);
        }
    };

    const fetchNotes = async () => {
        try {
            setLoadingNotes(true);
            const response = await Backend.get(`v1/invoice/${invoice.id}/notes`);
            const fetchedNotes = response.data.notes || [];
            setNotes(fetchedNotes);
            setNoteCount(fetchedNotes.length);
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
            setNoteCount(noteCount + 1);
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
        let color = 'primary';
        
        if (invoice.payment_status === 'complete') {
            label = 'Paid';
        } else if (invoice.payment_status === 'pending') {
            label = 'Pending Payment';
        }
        
        return (
            <Typography 
                variant="body2" 
                className={classes.systemText}
                style={{ 
                    color: invoice.payment_status === 'complete' ? '#1976d2' : 
                           invoice.payment_status === 'pending' ? '#ff9800' : 'inherit',
                    fontWeight: 'bold',
                    marginRight: '12px'
                }}
            >
                {label}
            </Typography>
        );
    };

    const getRoleChip = () => {
        return (
            <Typography variant="body2" className={classes.staticText}>
                {userRole === 'buyer' ? 'Buyer' : 'Seller'}
            </Typography>
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
            <Paper className={`${classes.invoiceCard} ${classes.minimalSpacing}`}>
                <CardContent className={classes.paddingSm}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" className={classes.marginSm}>
                        <Box display="flex" alignItems="center" className={classes.marginXs}>
                            {getStatusChip()}
                            <Typography 
                                variant="h6" 
                                className={classes.invoiceTitle}
                                style={{ marginRight: '12px' }}
                            >
                                Invoice #{invoice.id}
                            </Typography>
                            
                            {getRoleChip()}
                        </Box>
                        
                        <Box display="flex" alignItems="center" className={classes.marginXs}>
                            <Typography variant="h6" className={classes.invoiceAmount}>
                                {formatCurrency(invoice.amount, invoice.currency)}
                            </Typography>
                            <IconButton size="small" onClick={handleExpandClick} className={classes.iconButton}>
                                {expanded ? <ExpandLess className={classes.iconColor} /> : <ExpandMore className={classes.iconColor} />}
                            </IconButton>
                        </Box>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" className={classes.marginSm}>
                        <Typography variant="body2" className={classes.systemText}>
                            {userRole === 'buyer' ? 'Seller' : 'Buyer'}: {invoice.other_party_username || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" className={classes.systemText}>
                            {formatDate(invoice.payment_date)}
                        </Typography>
                    </Box>

                    <Collapse in={expanded}>
                        <Divider className={classes.divider} />
                        
                        {/* Invoice Details */}
                        <Grid container spacing={1} className={classes.paddingSm}>
                            <Grid item xs={12} className={classes.paddingXs}>
                                <Typography variant="subtitle2" className={classes.systemText}>
                                    Purchase Breakdown
                                </Typography>
                                
                                {/* Items with individual prices */}
                                {selections.length > 0 && (
                                    <Box mb={1}>
                                        {/* List each item and its price */}
                                        {selections.map((selection, index) => (
                                            <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" className={classes.userText}>
                                                    {selection.name || `Item ${selection.id}`}
                                                    {selection.count && selection.count > 1 && (
                                                        <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>
                                                            x{selection.count}
                                                        </span>
                                                    )}
                                                </Typography>
                                                <Typography variant="body2" className={classes.userText}>
                                                    {formatCurrency((selection.price || 0) * (selection.count || 1), invoice.currency)}
                                                </Typography>
                                            </Box>
                                        ))}

                                        {/* Payment Fee (Stripe) */}
                                        {invoice.metadata?.stripe_fee > 0 && (
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" className={classes.systemText}>
                                                    Payment Fee (Stripe)
                                                </Typography>
                                                <Typography variant="body2" className={classes.systemText}>
                                                    {formatCurrency(invoice.metadata.stripe_fee, invoice.currency)}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Buyer Paid */}
                                        {invoice.metadata?.stripe_fee > 0 && (
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                                                    Buyer Paid:
                                                </Typography>
                                                <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                                                    {formatCurrency(invoice.amount + (invoice.metadata?.stripe_fee || 0), invoice.currency)}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Divider style={{ margin: '8px 0' }} />

                                        {/* Total Price */}
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                                                Total Price
                                            </Typography>
                                            <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                                                {formatCurrency(invoice.amount, invoice.currency)}
                                            </Typography>
                                        </Box>

                                        {/* Platform Fee */}
                                        {invoice.fee > 0 && (
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" className={classes.systemText}>
                                                    Platform Fee
                                                </Typography>
                                                <Typography variant="body2" className={classes.systemText}>
                                                    {formatCurrency(invoice.fee, invoice.currency)}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                {/* Complete Fee breakdown - always show all fees */}
                                <Box mb={1}>
                                    
                                    {/* Seller Receive */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center" style={{ borderTop: '1px solid #eee', paddingTop: '4px', marginTop: '4px' }}>
                                        <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                                            Seller Receive:
                                        </Typography>
                                        <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                                            {formatCurrency(invoice.amount - (invoice.fee || 0), invoice.currency)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Payment details */}
                                <Box mt={2}>
                                    <Typography variant="body2" className={classes.systemText}>
                                        Type: {invoice.type?.toUpperCase() || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" className={classes.systemText}>
                                        Created: {formatDate(invoice.created_at)}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Action Buttons */}
                        <Box className={`${classes.marginMd} ${classes.paddingXs}`} display="flex">
                            <Button
                                startIcon={<Message className={classes.iconColor} />}
                                onClick={handleNotesExpandClick}
                                size="small"
                                className={`${classes.systemText} ${classes.marginXs}`}
                            >
                                <Typography variant="body2" className={classes.systemText}>
                                    Notes ({noteCount})
                                </Typography>
                            </Button>
                            
                            {userRole === 'buyer' && !hasRated && !loadingRatingStatus && (
                                <Button
                                    startIcon={<Star className={classes.iconColor} />}
                                    onClick={() => setRatingDialogOpen(true)}
                                    size="small"
                                    className={`${classes.eightBitDragonFont} ${classes.systemText} ${classes.marginXs}`}
                                >
                                    Rate Purchase
                                </Button>
                            )}
                        </Box>

                        {/* Notes Section */}
                        <Collapse in={notesExpanded}>
                            <Box className={styles.communicationSection}>
                                <Divider className={classes.divider} />
                                <Typography variant="subtitle2" className={classes.systemText} style={{ marginBottom: theme.spacing(1) }}>
                                    Communication
                                </Typography>
                                
                                {/* Notes List */}
                                {notes.length > 0 ? (
                                    <List dense className={styles.notesList}>
                                        {notes.map((note) => (
                                            <ListItem key={note.id} alignItems="flex-start" className={styles.listItem}>
                                                <Avatar style={{ marginRight: theme.spacing(1), width: isMobile ? 28 : 32, height: isMobile ? 28 : 32 }}>
                                                    {note.buyer_seller === 'buyer' ? 'B' : 'S'}
                                                </Avatar>
                                                <ListItemText
                                                    primary={
                                                        <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                                                            <Typography variant="body2" className={classes.systemText}>
                                                                {note.username} ({note.buyer_seller})
                                                            </Typography>
                                                            <Typography variant="caption" className={classes.systemText}>
                                                                {isMobile ? formatDate(note.created_at).split(' ')[0] : formatDate(note.created_at)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography variant="body2" className={classes.userText} style={{ wordBreak: 'break-word' }}>
                                                            {note.content}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" className={classes.systemText}>
                                        No messages yet
                                    </Typography>
                                )}

                                {/* Add Note Input */}
                                <Box display="flex" style={{ marginTop: theme.spacing(2), gap: theme.spacing(1) }}>
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
                                        className={`${classes.eightBitDragonFont} ${styles.messageInput}`}
                                    />
                                    <Button
                                        onClick={handleSubmitNote}
                                        disabled={!newNote.trim() || submittingNote}
                                        variant="contained"
                                        size="small"
                                        className={`${classes.paddingXs} ${classes.iconButton}`}
                                        style={{ minWidth: '32px' }}
                                    >
                                        <Send fontSize="small" className={classes.iconColor} />
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
                        item_description: selections.map(s => {
                            const name = s.name || `Item ${s.id}`;
                            return s.count && s.count > 1 ? `${name} x${s.count}` : name;
                        }).join(', '),
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