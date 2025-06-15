import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import configData from '../../config';
import { Grid, Typography, Button, Paper, Box, CircularProgress, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Checkbox, FormControlLabel, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import CheckIcon from '@material-ui/icons/Check';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import GetAppIcon from '@material-ui/icons/GetApp';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Alert from '@material-ui/lab/Alert';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import InvoiceList from '../payments/InvoiceList';
import { useDispatch } from 'react-redux';
import { SET_USER } from '../../store/actions';
import backend from '../utilities/Backend';
import ZoomableImage from '../../components/ZoomableImage';
import RatingDisplay from '../../components/Rating/RatingDisplay';
import PostedBy from '../../components/PostedBy';
import useComponentStyles from '../../themes/componentStyles';

const DownloadableSearchableDetails = () => {
  const classes = useComponentStyles();
  const dispatch = useDispatch();

  // Item data
  const [SearchableItem, setSearchableItem] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [searchablePayments, setSearchablePayments] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  
  
  // Rating states
  const [searchableRating, setSearchableRating] = useState(null);
  const [terminalRating, setTerminalRating] = useState(null);
  const [loadingRatings, setLoadingRatings] = useState(true);
  
  const { id } = useParams();
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  const paymentCheckRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Alert states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  
  // File selection states (changed from selectedVariations to selectedFiles)
  const [selectedFiles, setSelectedFiles] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Currency state
  const [currency, setCurrency] = useState('usd');
  
  // Download states
  const [downloadingFiles, setDownloadingFiles] = useState({});
  const [paidFiles, setPaidFiles] = useState(new Set());
  const [userPaidFiles, setUserPaidFiles] = useState(new Set());
  
  useEffect(() => {
    // User must be logged in to access this page (enforced by AuthGuard)
    fetchItemDetails();
    refreshPaymentsBySearchable();
    fetchRatings();
  }, [id]);
  
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        console.log("User:", account.user);
        console.log("Item:", SearchableItem);
        if (account && account.user && SearchableItem && SearchableItem.terminal_id === String(account.user._id)) {
          setIsOwner(true);
        } 
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };

    if (SearchableItem) {
      checkOwnership();
    }
  }, [SearchableItem, account]);
  
  useEffect(() => {
    if (SearchableItem) {
      // Set the currency based on the item's configuration
      if (SearchableItem.payloads.public.currency === 'usdt') {
        setCurrency('usdt');
      } else {
        setCurrency('usd');
      }
    }
  }, [SearchableItem]);
  
  useEffect(() => {
    if (SearchableItem) {
      fetchUserPaidFiles();
    }
  }, [SearchableItem]);
  
  useEffect(() => {
    // Calculate total price based on selected files
    if (SearchableItem && SearchableItem.payloads.public.downloadableFiles) {
      let total = 0;
      Object.entries(selectedFiles).forEach(([id, isSelected]) => {
        const downloadable = SearchableItem.payloads.public.downloadableFiles.find(
          file => file.fileId.toString() === id
        );
        if (downloadable && isSelected) {
          total += downloadable.price;
        }
      });
      setTotalPrice(total);
      
      // No need to convert prices anymore - all prices are in USD
    }
  }, [selectedFiles, SearchableItem, currency]);
  
  useEffect(() => {
    // Initialize selectedFiles when SearchableItem is loaded
    if (SearchableItem && SearchableItem.payloads.public.downloadableFiles) {
      const initialSelections = {};
      SearchableItem.payloads.public.downloadableFiles.forEach(file => {
        initialSelections[file.fileId] = false;
      });
      setSelectedFiles(initialSelections);
    }
  }, [SearchableItem]);
  
  useEffect(() => {
    // Update paid files from payment history (for display purposes only - shows files purchased by anyone)
    if (searchablePayments && searchablePayments.length > 0) {
      const paidFileIds = new Set();
      searchablePayments.forEach(payment => {
        if (payment.public && payment.public.status === 'complete' && payment.public.selections) {
          // Use the selections data from the payment
          payment.public.selections.forEach(selection => {
            if (selection.type === 'downloadable') {
              paidFileIds.add(selection.id.toString());
            }
          });
        }
      });
      setPaidFiles(paidFileIds);
    }
  }, [searchablePayments, SearchableItem]);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (paymentCheckRef.current) {
        clearTimeout(paymentCheckRef.current);
      }
    };
  }, []);
  
  const fetchItemDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await backend.get(`v1/searchable/${id}`);
      setSearchableItem(response.data);
    } catch (err) {
      console.error("Error fetching item details:", err);
      setError("Failed to load item details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch ratings for both the searchable item and the seller
  const fetchRatings = async () => {
    setLoadingRatings(true);
    try {
      // Fetch searchable item rating
      const searchableResponse = await backend.get(`v1/rating/searchable/${id}`);
      setSearchableRating(searchableResponse.data);
      
      // Fetch terminal (seller) rating if terminal_id is available
      if (SearchableItem.terminal_id) {
        try {
          const terminalResponse = await backend.get(`v1/rating/terminal/${SearchableItem.terminal_id}`);
          setTerminalRating(terminalResponse.data);
        } catch (terminalErr) {
          console.error("Error fetching terminal ratings:", terminalErr);
          // Set empty rating data if fetch fails
          setTerminalRating({ average_rating: 0, total_ratings: 0 });
        }
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
      // Don't set an error state, as this is not critical functionality
    } finally {
      setLoadingRatings(false);
    }
  };
  
  
  const handleFileSelection = (id, checked) => {
    setSelectedFiles(prev => ({ ...prev, [id]: checked }));
  };
  
  const createInvoice = async (invoiceType = 'stripe') => {
    if (!SearchableItem) return;
    
    // Validate if we have any file selections
    const hasSelections = Object.values(selectedFiles).some(isSelected => isSelected);
    
    if (!hasSelections) {
      showAlert("Please select at least one file to purchase", "warning");
      return;
    }
    
    setCreatingInvoice(true);
    try {
      // Get buyer ID - use account.user._id if available, otherwise use visitor ID
      const buyerId = account?.user?._id;
      
      // Prepare common payload properties
      const payload = {
        searchable_id: id,
        invoice_type: invoiceType,
      };
      
      // Add selected files
      const selections = [];
      Object.entries(selectedFiles).forEach(([id, isSelected]) => {
        if (isSelected) {
          const downloadable = SearchableItem.payloads.public.downloadableFiles.find(
            file => file.fileId.toString() === id
          );
          if (downloadable) {
            selections.push({
              id: downloadable.fileId,
              name: downloadable.name,
              price: downloadable.price,
              type: 'downloadable'
            });
          }
        }
      });
      payload.selections = selections;
      payload.total_price = totalPrice;
      
      // Add Stripe-specific properties if needed
      if (invoiceType === 'stripe') {
        payload.success_url = `${window.location.origin}${window.location.pathname}`;
        payload.cancel_url = `${window.location.origin}${window.location.pathname}`;
      }
      
      // Add address and tel for logged-in users
      if (account?.user) {
        payload.address = account.user.address;
        payload.tel = account.user.tel;
      }
      
      const response = await backend.post('v1/create-invoice', payload);
      
      if (invoiceType === 'stripe' && response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error(`Error creating ${invoiceType} invoice:`, err);
      showAlert(`Failed to create payment invoice. Please try again.`, "error");
    } finally {
      setCreatingInvoice(false);
    }
  };
  

  
  const handleRemoveItem = async () => {
    if (!window.confirm("Are you sure you want to remove this item?")) {
      return;
    }
    
    setIsRemoving(true);
    try {
      await backend.put(
        `v1/searchable/remove/${id}`,
        {}
      );
      showAlert("Item removed successfully");
      history.push('/searchables');
    } catch (error) {
      console.error("Error removing item:", error);
      showAlert("Failed to remove the item", "error");
    } finally {
      setIsRemoving(false);
    }
  };
  
  const fetchProfileData = async () => {
    if (!account.user || !account.token) return;
    
    try {
      const response = await backend.get('profile');
      
      // Update Redux store with new profile data
      dispatch({
        type: SET_USER,
        payload: {
          ...account.user,
          address: response.data.address,
          tel: response.data.tel
        }
      });

    } catch (err) {
      console.error('Error fetching user profile data:', err);
    }
  };

  // Function to show alerts
  const showAlert = (message, severity = 'success') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setAlertOpen(false);
    }, 5000);
  };
  
  
  const handleStripePayButtonClick = async () => {
    // Check if user is logged in
    const isUserLoggedIn = !!account?.user;
    
    if (isUserLoggedIn) {
      fetchProfileData();
      
      // Check if price meets minimum payment requirement
      if (totalPrice < 1) {
        showAlert("Amount too low for payment. Minimum amount is $1.00", "warning");
        return;
      }
    }
    
    // Create Stripe checkout session
    createInvoice('stripe');
  };
  
  const fetchPayments = async () => {
    try {
      const response = await backend.get(`v1/payments-by-searchable/${id}`);
      setSearchablePayments(response.data.receipts);
    } catch (err) {
      console.error("Error fetching payments:", err);
      showAlert("Failed to load payment history", "error");
    }
  };
  
  // Add this new function to refresh payments by searchable id
  const refreshPaymentsBySearchable = async () => {
    try {
      await backend.get(`v1/refresh-payments-by-searchable/${id}`);
      
    } catch (err) {
      console.error("Error refreshing payments for searchable:", err);
      // Don't show an alert as this is a background operation
    }
  };
  
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
      return `$${amount.toFixed(2)}`;
  };
  
  // Add new function to fetch user-specific paid files
  const fetchUserPaidFiles = async () => {
    try {
      const response = await backend.get(`v1/user-paid-files/${id}`);
      const userPaidFileIds = new Set(response.data.paid_file_ids);
      setUserPaidFiles(userPaidFileIds);
    } catch (err) {
      console.error("Error fetching user paid files:", err);
      // Set empty set if there's an error (user probably hasn't paid)
      setUserPaidFiles(new Set());
    }
  };
  
  // Download file function
  const downloadFile = async (fileId, fileName) => {
    // Check if user has paid for this specific file
    if (!userPaidFiles.has(fileId.toString())) {
      showAlert("You haven't paid for this file yet", "error");
      return;
    }
    
    setDownloadingFiles(prev => ({ ...prev, [fileId]: true }));
    
    try {
      const response = await backend.get(`v1/download-file/${id}/${fileId}`, {
        responseType: 'blob'
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showAlert(`Successfully downloaded ${fileName}`);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (error.response && error.response.status === 403) {
        showAlert("Payment required to download this file", "error");
      } else if (error.response && error.response.status === 401) {
        showAlert("Please log in to download files", "error");
      } else {
        showAlert(`Failed to download ${fileName}`, "error");
      }
    } finally {
      setDownloadingFiles(prev => ({ ...prev, [fileId]: false }));
    }
  };
  
  // Render downloadable files selection UI
  const renderDownloadableFiles = () => {
    if (!SearchableItem || !SearchableItem.payloads.public.downloadableFiles) {
      return null;
    }
    
    return (
      <Box>
        {SearchableItem.payloads.public.downloadableFiles.map((file) => {
          const isPaidByCurrentUser = userPaidFiles.has(file.fileId.toString());
          const isPaidBySomeone = paidFiles.has(file.fileId.toString());
          const isDownloading = downloadingFiles[file.fileId];
          
          return (
            <Paper key={file.fileId} >
              <Box flex={1}>
                <Box display="flex" alignItems="center">
                  {!isPaidByCurrentUser ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedFiles[file.fileId] || false}
                          onChange={(e) => handleFileSelection(file.fileId, e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                      style={{ marginRight: 8 }}
                    />
                  ) : (
                    <CheckIcon style={{ color: 'green', marginRight: 16 }} />
                  )}
                  <Box>
                    <Typography variant="body1" className={classes.staticText}>{file.name}</Typography>
                    <Typography variant="body2" className={classes.userText}>
                      {file.description}
                    </Typography>
                    <Typography variant="body2" className={classes.userText}>{formatCurrency(file.price)}</Typography>
                    {isPaidBySomeone && !isPaidByCurrentUser && (
                      <Typography variant="caption" className={classes.userText}>
                        (Purchased by others)
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
              
              {isPaidByCurrentUser && (
                <Button
                 variant='contained'
                  onClick={() => downloadFile(file.fileId, file.name)}
                  disabled={isDownloading}
                  startIcon={isDownloading ? <CircularProgress size={20} /> : <GetAppIcon />}
                >
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
              )}
            </Paper>
          );
        })}
        
        {totalPrice > 0 && (
          <Box mt={2} display="flex" justifyContent="flex-end" width="100%">
            <Typography variant="h6">
              Total: {formatCurrency(totalPrice)}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box>
              <Button 
                color="primary" 
                variant='contained'
                onClick={() => history.push('/searchables')}
              >
                <ChevronLeftIcon />
              </Button>
        </Box>
      </Grid>
      
      {/* Alert notification */}
      <Box>
        <Collapse in={alertOpen}>
          <Alert
            severity={alertSeverity}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setAlertOpen(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            icon={alertSeverity === 'success' ? <CheckIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
          >
            {alertMessage}
          </Alert>
        </Collapse>
      </Box>
      
      {loading && (
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </Grid>
      )}
      
      {error && (
        <Grid item xs={12}>
          <Paper>
            <Typography variant="body1">{error}</Typography>
          </Paper>
        </Grid>
      )}
      
      {!loading && SearchableItem && (
        <Grid item xs={12}>
          <Paper>
            {/* Title and Rating Summary */}
            <Typography variant="h3" className={classes.userText}>
              {SearchableItem.payloads.public.title || `Downloads #${SearchableItem.searchable_id}`}
            </Typography>
            <Divider />
            
            {!loadingRatings && searchableRating && (
              <Box>
                <Typography variant="body1" className={classes.staticText}>
                  Rating: {searchableRating.average_rating?.toFixed(1)}/5 ({searchableRating.total_ratings} reviews)
                </Typography>
              </Box>
            )}            
            {/* Posted by section */}
            <PostedBy 
              username={SearchableItem.username} 
              terminalId={SearchableItem.terminal_id} 
              maxLength={30}
            />


            <Divider />
            
            {/* Description */}
            {SearchableItem.payloads.public.description && (
              <Box >
                <Typography variant="body1" className={classes.userText}>
                  {SearchableItem.payloads.public.description}
                </Typography>
              </Box>
            )}

            <Divider />

            {/* Images */}
            {SearchableItem.payloads.public.images && SearchableItem.payloads.public.images.length > 0 && (
              <div  style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SearchableItem.payloads.public.images.map((image, index) => {
                  // Check if it's a URL (mock mode) or base64
                  const isUrl = typeof image === 'string' && (image.startsWith('http') || image.startsWith('/') || image.includes('static/media'));
                  const imageSrc = isUrl ? image : `data:image/jpeg;base64,${image}`;
                  
                  // console.log(`[DEBUG] Image ${index}: isUrl=${isUrl}, src=${imageSrc?.substring(0, 50)}...`);
                  
                  return (
                    <ZoomableImage 
                      key={index}
                      src={imageSrc} 
                      alt={`${SearchableItem.payloads.public.title} - image ${index + 1}`} 
                      style={{ maxWidth: '300px'}}
                    />
                  );
                })}
              </div>
            )}
            
            {/* Files Section */}
            {renderDownloadableFiles()}
            
            {/* Payment Summary and Button */}
            {totalPrice > 0 && (
              <Box mt={2} p={2} bgcolor="background.paper">
                <Typography variant="subtitle2" className={classes.staticText}>
                  Payment Summary:
                </Typography>
                <Typography variant="body2" className={classes.userText}>
                  Subtotal: {formatCurrency(totalPrice)}
                </Typography>
                <Typography variant="body2" className={classes.userText}>
                  Stripe Fee (3.5%): {formatCurrency(totalPrice * 0.035)}
                </Typography>
                <Divider style={{ margin: '8px 0' }} />
                <Typography variant="body1" className={classes.userText} style={{ fontWeight: 'bold' }}>
                  Total to Pay: {formatCurrency(totalPrice * 1.035)}
                </Typography>
                <Typography variant="caption" className={classes.systemText}>
                  Note: Platform fee (0.1%) will be deducted from seller's earnings
                </Typography>
              </Box>
            )}
            
            {/* Payment Button */}
            <div style={{ margin: '8px', display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleStripePayButtonClick}
                disabled={creatingInvoice || totalPrice === 0}
              >
                <Typography variant="body2" className={classes.staticText}>
                  Pay {formatCurrency(totalPrice * 1.035)}
                </Typography>
              </Button>
            </div>
            
            {/* Remove Button for Owner */}
            {isOwner && (
              <div style={{ margin: '4px', display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleRemoveItem}
                  disabled={isRemoving}
                  fullWidth
                >
                  Remove Item
                </Button>
              </div>
            )}
          </Paper>
          
          {/* Collapsible Reviews Section */}
          {!loadingRatings && searchableRating && searchableRating.individual_ratings && searchableRating.individual_ratings.length > 0 && (
            
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className={classes.iconColor} />}
                aria-controls="reviews-content"
                id="reviews-header"
              >
                <Typography className={classes.staticText}>
                  Recent Reviews ({searchableRating.individual_ratings.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box width="100%">
                  <RatingDisplay
                    averageRating={searchableRating.average_rating || 0}
                    totalRatings={searchableRating.total_ratings || 0}
                    individualRatings={searchableRating.individual_ratings || []}
                    showIndividualRatings={true}
                    maxIndividualRatings={10}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
          
          <InvoiceList 
            searchableId={id} 
            onRatingSubmitted={() => {
              fetchRatings();
            }}
          />
        </Grid>
      )}

    </Grid>
  );
};

export default DownloadableSearchableDetails;
