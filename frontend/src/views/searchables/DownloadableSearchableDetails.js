import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress, 
  Accordion, AccordionSummary, AccordionDetails,
  IconButton
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CheckIcon from '@material-ui/icons/Check';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import GetAppIcon from '@material-ui/icons/GetApp';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import InvoiceList from '../payments/InvoiceList';
import BaseSearchableDetails from '../../components/BaseSearchableDetails';
import useSearchableDetails from '../../hooks/useSearchableDetails';
import RatingDisplay from '../../components/Rating/RatingDisplay';
import useComponentStyles from '../../themes/componentStyles';
import backend from '../utilities/Backend';
import { detailPageStyles } from '../../utils/detailPageSpacing';

// Create styles for downloadable details
const useStyles = makeStyles((theme) => ({
  fileItem: {
    ...detailPageStyles.card(theme),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    userSelect: 'none',
    border: `2px dashed ${theme.palette.divider}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[3],
      borderColor: theme.palette.primary.main,
      borderStyle: 'solid',
    },
  },
  fileItemSelected: {
    backgroundColor: theme.palette.action.selected,
    border: `2px solid ${theme.palette.primary.main}`,
  },
  fileItemPaid: {
    cursor: 'default',
    border: `2px solid transparent`,
    '&:hover': {
      transform: 'none',
      boxShadow: theme.shadows[1],
      borderColor: 'transparent',
    },
  },
  fileList: {
    ...detailPageStyles.itemContainer(theme),
  },
  alertSection: {
    ...detailPageStyles.alert(theme),
  },
  totalSection: {
    ...detailPageStyles.subSection(theme),
    display: 'flex',
    justifyContent: 'flex-end',
  }
}));

const DownloadableSearchableDetails = () => {
  const classes = useComponentStyles();
  const detailClasses = useStyles();
  
  const {
    SearchableItem,
    searchableRating,
    loadingRatings,
    fetchRatings,
    createInvoice,
    createBalancePayment,
    formatCurrency,
    id
  } = useSearchableDetails();
  
  const [searchablePayments, setSearchablePayments] = useState([]);
  
  // Alert states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  
  // File selection states
  const [selectedFiles, setSelectedFiles] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Download states
  const [downloadingFiles, setDownloadingFiles] = useState({});
  const [paidFiles, setPaidFiles] = useState(new Set());
  const [userPaidFiles, setUserPaidFiles] = useState(new Set());

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
          file => file.fileId && file.fileId.toString() === id
        );
        if (downloadable && isSelected) {
          total += downloadable.price;
        }
      });
      setTotalPrice(total);
    }
  }, [selectedFiles, SearchableItem]);
  
  useEffect(() => {
    // Initialize selectedFiles when SearchableItem is loaded
    if (SearchableItem && SearchableItem.payloads.public.downloadableFiles) {
      const initialSelections = {};
      SearchableItem.payloads.public.downloadableFiles.forEach(file => {
        if (file.fileId) {
          initialSelections[file.fileId] = false;
        }
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
              if (selection.id) {
                paidFileIds.add(selection.id.toString());
              }
            }
          });
        }
      });
      setPaidFiles(paidFileIds);
    }
  }, [searchablePayments, SearchableItem]);
  
  const handleFileSelection = (id, checked) => {
    setSelectedFiles(prev => ({ ...prev, [id]: checked }));
  };
  
  // Handle payment creation with downloadable-specific logic
  const handlePayment = async () => {
    if (!SearchableItem) return;
    
    // Validate if we have any file selections
    const hasSelections = Object.values(selectedFiles).some(isSelected => isSelected);
    
    if (!hasSelections) {
      showAlert("Please select at least one content item to purchase", "warning");
      return;
    }
    
    try {
      // Add selected files
      const selections = [];
      Object.entries(selectedFiles).forEach(([id, isSelected]) => {
        if (isSelected) {
          const downloadable = SearchableItem.payloads.public.downloadableFiles.find(
            file => file.fileId && file.fileId.toString() === id
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
      
      await createInvoice({
        selections,
        total_price: totalPrice
      });
    } catch (err) {
      console.error('Error creating invoice:', err);
      showAlert('Failed to create payment invoice. Please try again.', 'error');
    }
  };

  const handleStripePayButtonClick = async () => {
    // Check if price meets minimum payment requirement
    if (totalPrice < 1) {
      showAlert("Amount too low for payment. Minimum amount is $1.00", "warning");
      return;
    }
    
    // Create payment
    handlePayment();
  };

  const handleDepositPayment = async (depositData) => {
    // Check if price meets minimum payment requirement
    if (totalPrice < 1) {
      showAlert("Amount too low for payment. Minimum amount is $1.00", "warning");
      return;
    }

    // For deposit payments, we show a success message and let the user know to deposit
    showAlert(`Deposit address created! Send $${totalPrice.toFixed(2)} USDT to complete your purchase.`, "info");
    
    // Optionally, you can store the deposit information for tracking
    console.log('Deposit created for downloadable files:', {
      depositData,
      totalPrice,
      selectedFiles
    });
  };
  
  const handleBalancePayment = async () => {
    // Check if price meets minimum payment requirement
    if (totalPrice < 1) {
      showAlert("Amount too low for payment. Minimum amount is $1.00", "warning");
      return;
    }
    
    // Validate if we have any file selections
    const hasSelections = Object.values(selectedFiles).some(isSelected => isSelected);
    
    if (!hasSelections) {
      showAlert("Please select at least one content item to purchase", "warning");
      return;
    }
    
    try {
      // Create selections array for balance payment
      const selections = [];
      Object.entries(selectedFiles).forEach(([fileId, isSelected]) => {
        if (isSelected) {
          const downloadable = SearchableItem.payloads.public.downloadableFiles.find(
            file => file.fileId && file.fileId.toString() === fileId
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
      
      await createBalancePayment({
        selections,
        total_price: totalPrice
      });
    } catch (err) {
      console.error('Error creating balance payment:', err);
      showAlert(err.message || 'Failed to process balance payment. Please try again.', 'error');
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
    if (!fileId) {
      showAlert("Invalid file ID", "error");
      return;
    }
    
    // Check if user has paid for this specific file
    if (!userPaidFiles.has(fileId.toString())) {
      showAlert("You haven't paid for this content yet", "error");
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
        showAlert("Payment required to download this content", "error");
      } else if (error.response && error.response.status === 401) {
        showAlert("Please log in to download content", "error");
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
      <Box className={detailClasses.fileList}>
        {SearchableItem.payloads.public.downloadableFiles.map((file) => {
          // Ensure fileId exists before using it
          const fileIdStr = file.fileId ? file.fileId.toString() : '';
          if (!file.fileId) {
            console.error('File missing fileId:', file);
            return null;
          }
          
          const isPaidByCurrentUser = userPaidFiles.has(fileIdStr);
          const isPaidBySomeone = paidFiles.has(fileIdStr);
          const isDownloading = downloadingFiles[file.fileId];
          
          return (
            <Paper 
              key={file.fileId} 
              className={`${detailClasses.fileItem} ${selectedFiles[file.fileId] && !isPaidByCurrentUser ? detailClasses.fileItemSelected : ''} ${isPaidByCurrentUser ? detailClasses.fileItemPaid : ''}`}
              onClick={() => !isPaidByCurrentUser && handleFileSelection(file.fileId, !selectedFiles[file.fileId])}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {isPaidByCurrentUser && (
                      <CheckIcon style={{ color: 'green' }} />
                    )}
                    <Typography variant="body1" style={{ fontWeight: 500 }}>{file.name}</Typography>
                  </Box>
                  {file.description && (
                    <Typography variant="body2" style={{ marginTop: 4, marginLeft: isPaidByCurrentUser ? 28 : 0 }}>
                      {file.description}
                    </Typography>
                  )}
                  <Typography variant="body2" style={{ marginTop: 4, fontWeight: 500, marginLeft: isPaidByCurrentUser ? 28 : 0 }}>
                    {formatCurrency(file.price)}
                  </Typography>
                  {isPaidBySomeone && !isPaidByCurrentUser && (
                    <Typography variant="caption" style={{ marginTop: 4, display: 'block', marginLeft: isPaidByCurrentUser ? 28 : 0 }}>
                      (Purchased by others)
                    </Typography>
                  )}
                </Box>
                
                {isPaidByCurrentUser ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(file.fileId, file.name);
                    }}
                    disabled={isDownloading}
                    startIcon={isDownloading ? <CircularProgress size={20} /> : <GetAppIcon />}
                  >
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </Button>
                ) : (
                  selectedFiles[file.fileId] && (
                    <CheckIcon style={{ color: '#1976d2', fontSize: 28 }} />
                  )
                )}
              </Box>
            </Paper>
          );
        })}
        
        {totalPrice > 0 && (
          <Box className={detailClasses.totalSection}>
            <Typography variant="h6">
              Total: {formatCurrency(totalPrice)}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };
  
  // Render type-specific content for downloadable files
  const renderDownloadableContent = ({ SearchableItem }) => (
    <Box>
      {/* Alert notification */}
      <Collapse in={alertOpen}>
        <Alert
          className={detailClasses.alertSection}
          severity={alertSeverity}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setAlertOpen(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          icon={alertSeverity === 'success' ? <CheckIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
        >
          {alertMessage}
        </Alert>
      </Collapse>

      {/* Files Section */}
      {renderDownloadableFiles()}
    </Box>
  );

  // Render reviews content separately
  const renderReviewsContent = ({ searchableRating, loadingRatings }) => {
    if (!searchableRating || !searchableRating.individual_ratings || searchableRating.individual_ratings.length === 0) {
      return null;
    }
    
    return (
      <Paper style={{ marginTop: 16, padding: 16, width: '100%' }}>
        <Typography variant="h6" className={classes.staticText} gutterBottom>
          Recent Reviews ({searchableRating.individual_ratings.length})
        </Typography>
        <Box width="100%">
          <RatingDisplay
            averageRating={searchableRating.average_rating || 0}
            totalRatings={searchableRating.total_ratings || 0}
            individualRatings={searchableRating.individual_ratings || []}
            showIndividualRatings={true}
            maxIndividualRatings={10}
          />
        </Box>
      </Paper>
    );
  };

  // Render receipts content separately
  const renderReceiptsContent = ({ id }) => (
    <InvoiceList 
      searchableId={id} 
      onRatingSubmitted={() => {
        fetchRatings();
      }}
    />
  );

  return (
    <BaseSearchableDetails
      renderTypeSpecificContent={renderDownloadableContent}
      renderReviewsContent={renderReviewsContent}
      renderReceiptsContent={renderReceiptsContent}
      onPayment={handleStripePayButtonClick}
      onDepositPayment={handleDepositPayment}
      onBalancePayment={handleBalancePayment}
      totalPrice={totalPrice}
      payButtonText="Pay"
      disabled={totalPrice === 0}
    />
  );
};

export default DownloadableSearchableDetails;