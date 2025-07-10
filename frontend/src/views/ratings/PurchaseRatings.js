import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { Rating } from '@material-ui/lab';
import { Star, StarBorder, RateReview } from '@material-ui/icons';
import { formatDate } from '../utilities/Date';
import RatingComponent from '../../components/Rating/RatingComponent';
import config from '../../config';
import { touchTargets, componentSpacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  tableContainer: {
    overflowX: 'auto',
    [theme.breakpoints.down('sm')]: {
      marginLeft: -theme.spacing(2),
      marginRight: -theme.spacing(2),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      '& table': {
        minWidth: 650
      }
    }
  },
  tableCell: {
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
      fontSize: '0.875rem'
    }
  },
  headerCell: {
    fontWeight: 600,
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
      fontSize: '0.875rem'
    }
  },
  tableRow: {
    minHeight: touchTargets.clickable.minHeight,
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },
  emptyPaper: {
    ...componentSpacing.card(theme),
    textAlign: 'center'
  },
  actionButton: {
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1)
    }
  },
  mobileHide: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  pageContainer: {
    ...componentSpacing.pageContainer(theme)
  }
}));

const PurchaseRatings = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to view your purchases');
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.API_SERVER}/api/v1/user/purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch purchases: ${response.status}`);
      }

      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (err) {
      setError(err.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleRateItem = (purchase) => {
    setSelectedPurchase(purchase);
    setRatingDialogOpen(true);
  };

  const handleSubmitRating = async (ratingData) => {
    try {
      setSubmittingRating(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_SERVER}/api/v1/rating/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ratingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      // Refresh purchases to show updated rating status
      await fetchPurchases();
      
      // Show success message (you might want to add a snackbar for this)
      console.log('Rating submitted successfully');
      
    } catch (err) {
      throw err; // Re-throw to be handled by RatingComponent
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusChip = (purchase) => {
    if (purchase.already_rated) {
      return <Chip label="Rated" color="primary" size="small" />;
    }
    if (purchase.can_rate) {
      return <Chip label="Can Rate" color="secondary" size="small" />;
    }
    return <Chip label="Complete" color="default" size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={classes.pageContainer}>
      <Typography variant="h4" gutterBottom>
        My Purchases & Ratings
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        View your purchase history and rate items you've bought.
      </Typography>

      {error && (
        <Alert severity="error" style={{ marginBottom: theme.spacing(2) }}>
          {error}
        </Alert>
      )}

      {purchases.length === 0 ? (
        <Paper className={classes.emptyPaper}>
          <Typography variant="h6" color="textSecondary">
            No purchases found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            When you buy items, they'll appear here for you to rate.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell className={classes.headerCell}>Item</TableCell>
                <TableCell className={`${classes.headerCell} ${classes.mobileHide}`}>Amount</TableCell>
                <TableCell className={classes.headerCell}>Date</TableCell>
                <TableCell className={classes.headerCell}>Status</TableCell>
                <TableCell className={classes.headerCell} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.invoice_id} className={classes.tableRow}>
                  <TableCell className={classes.tableCell}>
                    <Box>
                      <Typography variant="subtitle2">
                        {purchase.item_title || 'Untitled Item'}
                      </Typography>
                      {purchase.item_description && !isMobile && (
                        <Typography variant="caption" color="textSecondary">
                          {purchase.item_description.length > 100 
                            ? `${purchase.item_description.substring(0, 100)}...`
                            : purchase.item_description
                          }
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell className={`${classes.tableCell} ${classes.mobileHide}`}>
                    <Typography variant="body2">
                      ${purchase.amount.toFixed(2)} {purchase.currency?.toUpperCase()}
                    </Typography>
                  </TableCell>
                  
                  <TableCell className={classes.tableCell}>
                    <Typography variant="body2">
                      {isMobile ? formatDate(purchase.payment_completed).split(' ')[0] : formatDate(purchase.payment_completed)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell className={classes.tableCell}>
                    {getStatusChip(purchase)}
                  </TableCell>
                  
                  <TableCell className={classes.tableCell} align="center">
                    {purchase.can_rate && !purchase.already_rated && (
                      <Tooltip title="Rate this item">
                        <IconButton
                          className={classes.actionButton}
                          color="primary"
                          onClick={() => handleRateItem(purchase)}
                          size="small"
                        >
                          <RateReview />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {purchase.already_rated && (
                      <Tooltip title="Already rated">
                        <IconButton className={classes.actionButton} disabled size="small">
                          <Star color="action" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Rating Dialog */}
      <RatingComponent
        open={ratingDialogOpen}
        onClose={() => setRatingDialogOpen(false)}
        purchase={selectedPurchase}
        onSubmitRating={handleSubmitRating}
        loading={submittingRating}
      />
    </Box>
  );
};

export default PurchaseRatings;