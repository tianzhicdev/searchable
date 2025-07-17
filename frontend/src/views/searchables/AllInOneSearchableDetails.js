import React, { useState, useEffect, useMemo } from 'react';
import { 
  Grid, Typography, Button, Paper, Box, CircularProgress, 
  Accordion, AccordionSummary, AccordionDetails,
  TextField, IconButton, ButtonGroup, InputAdornment
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CheckIcon from '@material-ui/icons/Check';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import GetAppIcon from '@material-ui/icons/GetApp';
import AttachMoney from '@material-ui/icons/AttachMoney';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import BaseSearchableDetails from '../../components/BaseSearchableDetails';
import useSearchableDetails from '../../hooks/useSearchableDetails';
import backend from '../utilities/Backend';
import { detailPageStyles } from '../../utils/detailPageSpacing';
import { formatUSD } from '../../utils/searchableUtils';

// Create styles for all-in-one details
const useStyles = makeStyles((theme) => ({
  sectionContainer: {
    ...detailPageStyles.sectionWrapper(theme),
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    ...detailPageStyles.sectionTitle(theme),
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  sectionDescription: {
    ...detailPageStyles.description(theme),
    marginBottom: theme.spacing(2),
  },
  
  // Downloadable files styles
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
      boxShadow: 'none',
    },
  },
  fileInfo: {
    ...detailPageStyles.itemInfo(theme),
  },
  fileName: {
    ...detailPageStyles.itemTitle(theme),
  },
  fileDescription: {
    ...detailPageStyles.description(theme),
  },
  filePrice: {
    ...detailPageStyles.value(theme),
    fontWeight: 'bold',
  },
  downloadButton: {
    ...detailPageStyles.button(theme),
  },
  
  // Offline items styles
  itemCard: {
    ...detailPageStyles.card(theme),
    padding: theme.spacing(2),
  },
  itemContainer: {
    ...detailPageStyles.itemContainer(theme),
  },
  itemName: {
    ...detailPageStyles.sectionTitle(theme),
    marginTop: 0,
    marginBottom: theme.spacing(1),
  },
  itemDescription: {
    ...detailPageStyles.description(theme),
    marginBottom: theme.spacing(1),
  },
  itemPrice: {
    ...detailPageStyles.value(theme),
    fontWeight: 'bold',
  },
  purchasedLabel: {
    ...detailPageStyles.caption(theme),
    color: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  quantityControls: {
    ...detailPageStyles.buttonGroup(theme),
  },
  
  // Direct payment styles
  amountSection: {
    ...detailPageStyles.subSection(theme),
    textAlign: 'center',
  },
  paymentTitle: {
    ...detailPageStyles.sectionTitle(theme),
  },
  fixedAmountLabel: {
    ...detailPageStyles.label(theme),
  },
  fixedAmountValue: {
    ...detailPageStyles.value(theme),
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.palette.primary.main,
  },
  buttonGroupSection: {
    ...detailPageStyles.buttonGroup(theme),
  },
  customAmountSection: {
    ...detailPageStyles.formField(theme),
  },
  alertSection: {
    ...detailPageStyles.alert(theme),
  },
  
  // Common styles
  accordionContainer: {
    marginBottom: theme.spacing(2),
    '& .MuiAccordionSummary-root': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  checkoutSection: {
    ...detailPageStyles.card(theme),
    padding: theme.spacing(3),
    marginTop: theme.spacing(3),
    position: 'sticky',
    top: theme.spacing(2),
  }
}));

const AllInOneSearchableDetails = () => {
  const classes = useStyles();
  
  // Use the shared hook for common functionality
  const { 
    searchableData, 
    isLoading, 
    error,
    user,
    isOwner,
    purchasedInvoices,
    handlePurchase,
    purchaseLoading,
    purchaseError,
    purchaseAlert,
    setPurchaseAlert,
    setPurchaseError
  } = useSearchableDetails();

  // State for downloadable files
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const [downloadStatus, setDownloadStatus] = useState({});
  
  // State for offline items
  const [selectedItems, setSelectedItems] = useState({});
  
  // State for direct payment
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPresetAmount, setSelectedPresetAmount] = useState(null);

  // State for overall checkout
  const [totalAmount, setTotalAmount] = useState(0);

  // Get the payload data with useMemo to prevent re-renders
  const payloadData = useMemo(() => searchableData?.payloads?.public || {}, [searchableData]);
  const downloadableFiles = useMemo(() => payloadData.downloadableFiles || [], [payloadData]);
  const offlineItems = useMemo(() => payloadData.offlineItems || [], [payloadData]);
  
  // Direct payment configuration
  const pricingMode = useMemo(() => payloadData.pricingMode || 'flexible', [payloadData]);
  const fixedAmount = useMemo(() => payloadData.fixedAmount, [payloadData]);
  const presetAmounts = useMemo(() => payloadData.presetAmounts || [], [payloadData]);

  // Calculate total amount whenever selections change
  useEffect(() => {
    let total = 0;
    
    // Add downloadable files
    selectedFiles.forEach(fileId => {
      const file = downloadableFiles.find(f => f.fileId === fileId);
      if (file) total += file.price;
    });
    
    // Add offline items
    Object.entries(selectedItems).forEach(([itemId, quantity]) => {
      const item = offlineItems.find(i => i.itemId === parseInt(itemId));
      if (item && quantity > 0) total += item.price * quantity;
    });
    
    // Add direct payment amount
    if (offlineItems.length > 0 || downloadableFiles.length > 0) {
      // Direct payment is optional when other items exist
      if (selectedPresetAmount) {
        total += selectedPresetAmount;
      } else if (customAmount && parseFloat(customAmount) > 0) {
        total += parseFloat(customAmount);
      }
    } else {
      // Direct payment is the only option
      if (pricingMode === 'fixed') {
        total = fixedAmount || 0;
      } else if (pricingMode === 'preset' && selectedPresetAmount) {
        total = selectedPresetAmount;
      } else if (customAmount && parseFloat(customAmount) > 0) {
        total = parseFloat(customAmount);
      }
    }
    
    setTotalAmount(total);
  }, [selectedFiles, selectedItems, selectedPresetAmount, customAmount, downloadableFiles, offlineItems, pricingMode, fixedAmount]);

  // Check if an item has been purchased
  const isItemPurchased = (itemId, itemType) => {
    return purchasedInvoices.some(invoice => {
      const metadata = invoice.metadata || {};
      return metadata.itemId === itemId && metadata.itemType === itemType;
    });
  };

  // Check if a file has been purchased
  const isFilePurchased = (fileId) => {
    return isItemPurchased(fileId, 'downloadable_file');
  };

  // Handle file selection
  const toggleFileSelection = (fileId) => {
    if (isFilePurchased(fileId)) return; // Can't select already purchased files
    
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Handle item quantity change
  const updateItemQuantity = (itemId, quantity) => {
    if (isItemPurchased(itemId, 'offline_item')) return; // Can't change quantity of purchased items
    
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: Math.max(0, quantity)
    }));
  };

  // Handle preset amount selection
  const selectPresetAmount = (amount) => {
    setSelectedPresetAmount(amount);
    setCustomAmount(''); // Clear custom amount when preset is selected
  };

  // Handle custom amount change
  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value) {
      setSelectedPresetAmount(null); // Clear preset when custom amount is entered
    }
  };

  // Handle file download
  const handleFileDownload = async (file) => {
    if (!isFilePurchased(file.fileId)) {
      setPurchaseError('You must purchase this file before downloading');
      return;
    }

    try {
      setDownloadingFiles(prev => new Set([...prev, file.fileId]));
      setDownloadStatus(prev => ({ ...prev, [file.fileId]: 'downloading' }));

      const response = await backend.get(`v1/files/download/${file.fileId}`, {
        responseType: 'blob'
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setDownloadStatus(prev => ({ ...prev, [file.fileId]: 'success' }));
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus(prev => ({ ...prev, [file.fileId]: 'error' }));
      setPurchaseError('Failed to download file. Please try again.');
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.fileId);
        return newSet;
      });
    }
  };

  // Handle purchase
  const handleAllInOnePurchase = () => {
    if (totalAmount <= 0) {
      setPurchaseError('Please select items or enter an amount to purchase');
      return;
    }

    // Prepare purchase metadata
    const purchaseData = {
      selectedFiles,
      selectedItems: Object.entries(selectedItems).filter(([_, qty]) => qty > 0),
      directPayment: selectedPresetAmount || (customAmount ? parseFloat(customAmount) : 0),
      totalAmount
    };

    handlePurchase(totalAmount, purchaseData);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if there's any content to show
  const hasDownloadable = downloadableFiles.length > 0;
  const hasOffline = offlineItems.length > 0;
  const hasDirect = pricingMode && (pricingMode !== 'flexible' || (!hasDownloadable && !hasOffline));

  // Main render function
  const renderTypeSpecificContent = () => (
    <Grid container spacing={3}>
      {/* Downloadable Files Section */}
      {hasDownloadable && (
        <Grid item xs={12}>
          <Accordion defaultExpanded className={classes.accordionContainer}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" className={classes.sectionTitle}>
                Digital Content ({downloadableFiles.length} files)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box width="100%">
                <Typography variant="body2" className={classes.sectionDescription}>
                  Select files to purchase and download
                </Typography>
                
                {downloadableFiles.map((file) => {
                  const isPurchased = isFilePurchased(file.fileId);
                  const isSelected = selectedFiles.includes(file.fileId);
                  const isDownloading = downloadingFiles.has(file.fileId);
                  const downloadState = downloadStatus[file.fileId];
                  
                  return (
                    <Box
                      key={file.fileId}
                      className={`${classes.fileItem} ${
                        isSelected ? classes.fileItemSelected : ''
                      } ${isPurchased ? classes.fileItemPaid : ''}`}
                      onClick={() => !isPurchased && toggleFileSelection(file.fileId)}
                    >
                      <Box className={classes.fileInfo}>
                        <Typography variant="subtitle1" className={classes.fileName}>
                          {file.name}
                        </Typography>
                        {file.description && (
                          <Typography variant="body2" className={classes.fileDescription}>
                            {file.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="textSecondary">
                          {file.fileName} • {formatFileSize(file.fileSize)}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h6" className={classes.filePrice}>
                          {formatUSD(file.price)}
                        </Typography>
                        
                        {isPurchased ? (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={
                              isDownloading ? (
                                <CircularProgress size={16} />
                              ) : downloadState === 'success' ? (
                                <CheckIcon />
                              ) : downloadState === 'error' ? (
                                <ErrorIcon />
                              ) : (
                                <GetAppIcon />
                              )
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDownload(file);
                            }}
                            disabled={isDownloading}
                            className={classes.downloadButton}
                          >
                            {isDownloading ? 'Downloading...' : 
                             downloadState === 'success' ? 'Downloaded' :
                             downloadState === 'error' ? 'Error' : 'Download'}
                          </Button>
                        ) : (
                          <Box className={classes.purchasedLabel}>
                            {isSelected && <CheckIcon fontSize="small" />}
                            <Typography variant="caption">
                              {isSelected ? 'Selected' : 'Click to select'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      )}

      {/* Offline Items Section */}
      {hasOffline && (
        <Grid item xs={12}>
          <Accordion defaultExpanded className={classes.accordionContainer}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" className={classes.sectionTitle}>
                Physical Items ({offlineItems.length} items)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box width="100%">
                <Typography variant="body2" className={classes.sectionDescription}>
                  Select quantity for each item you want to purchase
                </Typography>
                
                <Box className={classes.itemContainer}>
                  {offlineItems.map((item) => {
                    const isPurchased = isItemPurchased(item.itemId, 'offline_item');
                    const quantity = selectedItems[item.itemId] || 0;
                    
                    return (
                      <Paper key={item.itemId} className={classes.itemCard}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1}>
                            <Typography variant="h6" className={classes.itemName}>
                              {item.name}
                            </Typography>
                            {item.description && (
                              <Typography variant="body2" className={classes.itemDescription}>
                                {item.description}
                              </Typography>
                            )}
                            <Typography variant="h6" className={classes.itemPrice}>
                              {formatUSD(item.price)}
                            </Typography>
                            
                            {isPurchased && (
                              <Box className={classes.purchasedLabel}>
                                <CheckIcon fontSize="small" />
                                <Typography variant="caption">Purchased</Typography>
                              </Box>
                            )}
                          </Box>
                          
                          {!isPurchased && (
                            <Box className={classes.quantityControls}>
                              <ButtonGroup size="small" variant="outlined">
                                <IconButton
                                  onClick={() => updateItemQuantity(item.itemId, quantity - 1)}
                                  disabled={quantity <= 0}
                                >
                                  <RemoveIcon />
                                </IconButton>
                                <Button disabled>{quantity}</Button>
                                <IconButton
                                  onClick={() => updateItemQuantity(item.itemId, quantity + 1)}
                                >
                                  <AddIcon />
                                </IconButton>
                              </ButtonGroup>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      )}

      {/* Direct Payment Section */}
      {hasDirect && (
        <Grid item xs={12}>
          <Accordion defaultExpanded className={classes.accordionContainer}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" className={classes.sectionTitle}>
                Direct Payment {(hasDownloadable || hasOffline) && '(Optional)'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box width="100%" className={classes.amountSection}>
                {pricingMode === 'fixed' && (
                  <Box>
                    <Typography variant="body2" className={classes.fixedAmountLabel}>
                      Fixed Amount
                    </Typography>
                    <Typography variant="h3" className={classes.fixedAmountValue}>
                      {formatUSD(fixedAmount || 0)}
                    </Typography>
                  </Box>
                )}

                {pricingMode === 'preset' && presetAmounts.length > 0 && (
                  <Box>
                    <Typography variant="body2" style={{ marginBottom: 16 }}>
                      Choose an amount
                    </Typography>
                    <ButtonGroup className={classes.buttonGroupSection}>
                      {presetAmounts.map((amount, index) => (
                        <Button
                          key={index}
                          variant={selectedPresetAmount === amount ? "contained" : "outlined"}
                          onClick={() => selectPresetAmount(amount)}
                          startIcon={<AttachMoney />}
                        >
                          {formatUSD(amount)}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </Box>
                )}

                {(pricingMode === 'flexible' || pricingMode === 'preset') && (
                  <Box className={classes.customAmountSection}>
                    <TextField
                      label="Custom Amount"
                      type="number"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      variant="outlined"
                      size="small"
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      )}

      {/* Purchase Section */}
      {!isOwner && (
        <Grid item xs={12}>
          <Paper className={classes.checkoutSection}>
            <Typography variant="h6" gutterBottom>
              Checkout
            </Typography>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                Total: {formatUSD(totalAmount)}
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleAllInOnePurchase}
                disabled={purchaseLoading || totalAmount <= 0}
                startIcon={purchaseLoading ? <CircularProgress size={20} /> : null}
              >
                {purchaseLoading ? 'Processing...' : `Purchase ${formatUSD(totalAmount)}`}
              </Button>
            </Box>

            {purchaseError && (
              <Alert severity="error" className={classes.alertSection}>
                {purchaseError}
              </Alert>
            )}

            {purchaseAlert && (
              <Collapse in={!!purchaseAlert}>
                <Alert
                  severity={purchaseAlert.type}
                  action={
                    <IconButton
                      color="inherit"
                      size="small"
                      onClick={() => setPurchaseAlert(null)}
                    >
                      <CloseIcon />
                    </IconButton>
                  }
                  className={classes.alertSection}
                >
                  {purchaseAlert.message}
                </Alert>
              </Collapse>
            )}
            
            {totalAmount <= 0 && (
              <Typography variant="caption" color="textSecondary">
                {(hasDownloadable || hasOffline) 
                  ? "Select items or enter a payment amount above"
                  : "Enter a payment amount above"
                }
              </Typography>
            )}
          </Paper>
        </Grid>
      )}
    </Grid>
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!searchableData) {
    return (
      <Alert severity="warning">
        All-in-one item not found.
      </Alert>
    );
  }

  return (
    <BaseSearchableDetails
      searchableData={searchableData}
      user={user}
      isOwner={isOwner}
      typeSpecificContent={renderTypeSpecificContent()}
      showInvoiceList={true}
    />
  );
};

export default AllInOneSearchableDetails;