import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, Paper, Box, Button,
  List, ListItem, ListItemText, Chip, TextField,
  InputAdornment, RadioGroup, FormControlLabel, Radio,
  Checkbox, FormGroup, Divider, IconButton, Accordion,
  AccordionSummary, AccordionDetails
} from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';
import {
  CloudDownload, Storefront, Favorite,
  ShoppingCart, AttachMoney, Check as CheckIcon,
  Add as AddIcon, Remove as RemoveIcon, GetApp as GetAppIcon,
  ExpandMore as ExpandMoreIcon
} from '@material-ui/icons';
import { useHistory, useParams } from 'react-router-dom';
import BaseSearchableDetails from '../../components/BaseSearchableDetails';
import useSearchableDetails from '../../hooks/useSearchableDetails';
import InvoiceList from '../payments/InvoiceList';
import RatingDisplay from '../../components/Rating/RatingDisplay';
import { formatUSD } from '../../utils/searchableUtils';
import useComponentStyles from '../../themes/componentStyles';
import { detailPageStyles } from '../../utils/detailPageSpacing';
import backend from '../utilities/Backend';
import { generateTestId, testIdProps } from '../../utils/testIds';

const useStyles = makeStyles((theme) => ({
  // Downloadable file styles (from DownloadableSearchableDetails)
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
  // Offline item styles (from OfflineSearchableDetails)
  itemCard: {
    ...detailPageStyles.card(theme),
    padding: theme.spacing(2),
  },
  itemDivider: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(2),
    marginBottom: theme.spacing(2),
    '&:last-child': {
      borderBottom: 'none',
      paddingBottom: 0,
      marginBottom: 0,
    }
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    '& .MuiIconButton-root': {
      padding: theme.spacing(0.5),
    }
  },
  quantityInput: {
    width: 60,
    '& input': {
      textAlign: 'center',
      padding: theme.spacing(0.5, 1),
    },
    '& .MuiOutlinedInput-root': {
      height: 32,
    }
  },
  priceTag: {
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: theme.palette.text.secondary,
  },
  totalSection: {
    ...detailPageStyles.subSection(theme),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
  }
}));

const AllInOneSearchableDetails = () => {
  const classes = useComponentStyles();
  const detailClasses = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { id } = useParams();
  
  const {
    SearchableItem,
    createInvoice,
    createBalancePayment,
    formatCurrency,
    loading,
    error,
    searchableRating,
    loadingRatings,
    fetchRatings
  } = useSearchableDetails();
  
  // Component state
  const [selectedFiles, setSelectedFiles] = useState({});  // For downloadable files
  const [selectedOfflineItems, setSelectedOfflineItems] = useState({});  // For offline items with counts
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [userPaidFiles, setUserPaidFiles] = useState(new Set());  // Files current user has paid for

  // Redirect if not an allinone searchable
  useEffect(() => {
    if (SearchableItem && !loading) {
      const publicData = SearchableItem.payloads?.public || {};
      const searchableType = publicData.type || SearchableItem.type;
      
      // If this is not an allinone searchable, redirect to the appropriate route
      if (searchableType !== 'allinone') {
        let redirectPath = '';
        switch (searchableType) {
          case 'downloadable':
            redirectPath = `/searchable-item/${id}`;
            break;
          case 'offline':
            redirectPath = `/offline-item/${id}`;
            break;
          case 'direct':
            redirectPath = `/direct-item/${id}`;
            break;
          default:
            // Unknown type, stay on current page
            return;
        }
        
        // Redirect to the appropriate searchable details page
        history.replace(redirectPath);
      }
    }
  }, [SearchableItem, loading, id, history]);

  // Initialize file selections and fetch user's paid files
  useEffect(() => {
    if (SearchableItem && SearchableItem.searchable_id) {
      fetchUserPaidFiles();
      
      // Initialize selectedFiles for downloadable files that have fileId
      const publicData = SearchableItem.payloads?.public || {};
      const components = publicData.components;
      if (components?.downloadable?.enabled && components.downloadable.files) {
        const initialSelections = {};
        components.downloadable.files.forEach(file => {
          if (file.fileId) {
            initialSelections[file.fileId] = false;
          }
        });
        setSelectedFiles(initialSelections);
      }
    }
  }, [SearchableItem]);

  const fetchUserPaidFiles = async () => {
    try {
      const response = await backend.get(`v1/user-paid-files/${id}`);
      const userPaidFileIds = new Set(response.data.paid_file_ids);
      setUserPaidFiles(userPaidFileIds);
    } catch (err) {
      console.error("Error fetching user paid files:", err);
    }
  };

  // Downloadable file selection (from DownloadableSearchableDetails)
  const handleFileSelection = (fileId, selected) => {
    setSelectedFiles(prev => ({ ...prev, [fileId]: selected }));
  };

  // Offline item quantity handlers (from OfflineSearchableDetails)
  const handleItemSelection = (itemId, count) => {
    setSelectedOfflineItems(prev => ({ ...prev, [itemId]: Math.max(0, count) }));
  };

  const incrementCount = (itemId) => {
    setSelectedOfflineItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const decrementCount = (itemId) => {
    setSelectedOfflineItems(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1)
    }));
  };

  const handleDonationSelect = () => {
    const components = SearchableItem?.payloads?.public?.components || {};
    const donation = components.donation || {};
    
    if (donation.pricingMode === 'fixed') {
      setSelectedDonation(donation.fixedAmount);
    } else if ((donation.pricingMode === 'flexible' || donation.pricingMode === 'preset') && donationAmount) {
      // Handle both flexible and legacy preset mode the same way
      setSelectedDonation(parseFloat(donationAmount));
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await backend.get(
        `v1/download-file/${SearchableItem.searchable_id}/${fileId}`,
        { responseType: 'blob' }
      );
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const calculateTotal = () => {
    if (!SearchableItem) return 0;
    
    const publicData = SearchableItem.payloads?.public || {};
    const components = publicData.components;
    
    // This component only handles allinone searchables
    if (!components) return 0;
    
    let total = 0;
    
    // Add downloadable files
    if (components.downloadable?.enabled) {
      const files = components.downloadable.files || [];
      Object.entries(selectedFiles).forEach(([fileId, isSelected]) => {
        if (isSelected) {
          const file = files.find(f => f.fileId && String(f.fileId) === String(fileId));
          if (file && file.price) {
            total += parseFloat(file.price) || 0;
          }
        }
      });
    }
    
    // Add offline items with quantities
    if (components.offline?.enabled) {
      const items = components.offline.items || [];
      Object.entries(selectedOfflineItems).forEach(([itemId, count]) => {
        if (count > 0) {
          const item = items.find(i => String(i.id) === String(itemId));
          if (item) {
            total += (parseFloat(item.price) || 0) * count;
          }
        }
      });
    }
    
    // Add donation
    if (components.donation?.enabled && selectedDonation) {
      total += parseFloat(selectedDonation) || 0;
    }
    
    return total;
  };

  const handlePayment = async () => {
    if (!SearchableItem) return;
    
    setProcessing(true);
    try {
      const publicData = SearchableItem.payloads?.public || {};
      const components = publicData.components;
      
      // This component only handles allinone searchables
      if (!components) {
        console.error('Invalid searchable type for AllInOneSearchableDetails');
        return;
      }
      
      // Build selections array in the format expected by backend
      const selections = [];
      
      // Add downloadable files
      if (components.downloadable?.enabled) {
        Object.entries(selectedFiles).forEach(([fileId, isSelected]) => {
          if (isSelected) {
            const file = components.downloadable.files.find(f => 
              f.fileId && String(f.fileId) === String(fileId)
            );
            if (file) {
              selections.push({
                id: file.fileId,
                component: 'downloadable',
                count: 1
              });
            }
          }
        });
      }
      
      // Add offline items
      if (components.offline?.enabled) {
        Object.entries(selectedOfflineItems).forEach(([itemId, count]) => {
          if (count > 0) {
            const item = components.offline.items.find(i => 
              String(i.id) === String(itemId)
            );
            if (item) {
              selections.push({
                id: item.id,
                component: 'offline',
                count: count
              });
            }
          }
        });
      }
      
      // Add donation
      if (components.donation?.enabled && selectedDonation) {
        selections.push({
          component: 'donation',
          amount: selectedDonation
        });
      }
      
      const invoiceData = {
        searchable_id: SearchableItem.searchable_id,
        invoice_type: 'stripe',
        selections: selections
      };
      
      await createInvoice(invoiceData);
      // Refresh paid files after successful payment
      setTimeout(() => {
        fetchUserPaidFiles();
        window.location.reload(); // Refresh to update receipt list
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleBalancePayment = async () => {
    if (!SearchableItem) return;
    
    setProcessing(true);
    try {
      const publicData = SearchableItem.payloads?.public || {};
      const components = publicData.components;
      
      // This component only handles allinone searchables
      if (!components) {
        console.error('Invalid searchable type for AllInOneSearchableDetails');
        return;
      }
      
      // Build selections array in the same format as handlePayment for consistency
      const selections = [];
      
      // Add downloadable files
      if (components.downloadable?.enabled) {
        Object.entries(selectedFiles).forEach(([fileId, isSelected]) => {
          if (isSelected) {
            const file = components.downloadable.files.find(f => 
              f.fileId && String(f.fileId) === String(fileId)
            );
            if (file) {
              selections.push({
                id: file.fileId,
                component: 'downloadable',
                count: 1
              });
            }
          }
        });
      }
      
      // Add offline items
      if (components.offline?.enabled) {
        Object.entries(selectedOfflineItems).forEach(([itemId, count]) => {
          if (count > 0) {
            const item = components.offline.items.find(i => 
              String(i.id) === String(itemId)
            );
            if (item) {
              selections.push({
                id: item.id,
                component: 'offline',
                count: count
              });
            }
          }
        });
      }
      
      // Add donation
      if (components.donation?.enabled && selectedDonation) {
        selections.push({
          component: 'donation',
          amount: selectedDonation
        });
      }
      
      // Send in the same format as stripe payment
      const invoiceData = {
        searchable_id: SearchableItem.searchable_id,
        invoice_type: 'balance',
        selections: selections
      };
      
      await createBalancePayment(invoiceData);
      // Refresh paid files after successful payment
      setTimeout(() => {
        fetchUserPaidFiles();
        window.location.reload(); // Refresh to update receipt list
      }, 2000);
    } catch (error) {
      console.error('Balance payment failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const renderTypeSpecificContent = () => {
    if (!SearchableItem) return null;
    
    const publicData = SearchableItem.payloads?.public || {};
    const components = publicData.components || {};
    
    // This component only handles allinone searchables
    // Non-allinone types are redirected in useEffect
    
    return (
      <Grid item xs={12} {...testIdProps('page', 'allinone-details', 'content')}>
        {/* Downloadable section */}
        {components.downloadable?.enabled && (
          <Paper 
            elevation={1} 
            style={{ marginBottom: 16, padding: 16, backgroundColor: theme.palette.background.paper }}
            {...testIdProps('section', 'allinone-downloadable', 'container')}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <CloudDownload style={{ marginRight: 8, color: theme.palette.primary.main }} />
              <Typography variant="h6" color="primary">
                Digital Downloads
              </Typography>
            </Box>
            {components.downloadable.files?.length > 0 ? (
              <Box>
                {components.downloadable.files.map((file) => {
                  // Skip files without fileId
                  if (!file.fileId) {
                    console.warn('File missing fileId:', file);
                    return null;
                  }
                  const fileIdStr = file.fileId.toString();
                  const isPaid = userPaidFiles.has(fileIdStr);
                  return (
                    <Paper 
                      key={file.fileId}
                      className={`${detailClasses.fileItem} ${selectedFiles[file.fileId] ? detailClasses.fileItemSelected : ''}`}
                      onClick={() => !isPaid && handleFileSelection(file.fileId, !selectedFiles[file.fileId])}
                      style={{ marginBottom: 8, cursor: isPaid ? 'default' : 'pointer' }}
                      {...testIdProps('item', 'allinone-file', file.fileId)}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                        <Box flex={1}>
                          <Typography variant="body1" style={{ fontWeight: 500 }}>{file.name}</Typography>
                          {file.description && (
                            <Typography variant="body2" style={{ marginTop: 4 }}>
                              {file.description}
                            </Typography>
                          )}
                          <Typography variant="body2" style={{ marginTop: 4, fontWeight: 500 }}>
                            {formatUSD(file.price)}
                          </Typography>
                        </Box>
                        {isPaid ? (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<GetAppIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              // console.log("Downloading paid file:", file);
                              handleDownload(file.fileId, file.name);
                            }}
                            {...testIdProps('button', 'download-file', file.fileId)}
                          >
                            Download
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
              </Box>
            ) : (
              <Typography className={detailClasses.emptyState} {...testIdProps('text', 'allinone-downloadable', 'empty')}>
                No files available
              </Typography>
            )}
          </Paper>
        )}

        {/* Offline section */}
        {components.offline?.enabled && (
          <Paper 
            elevation={1} 
            style={{ marginBottom: 16, padding: 16, backgroundColor: theme.palette.background.paper }}
            {...testIdProps('section', 'allinone-offline', 'container')}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <Storefront style={{ marginRight: 8, color: theme.palette.primary.main }} />
              <Typography variant="h6" color="primary">
                Physical Items
              </Typography>
            </Box>
            {components.offline.items?.length > 0 ? (
              <Box>
                {components.offline.items.map((item, index) => {
                  const currentCount = selectedOfflineItems[item.id] || 0;
                  
                  return (
                    <Box 
                      key={item.id} 
                      className={detailClasses.itemDivider}
                      {...testIdProps('item', 'allinone-offline', item.id)}
                    >
                      <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 4 }}>
                        {item.name}
                      </Typography>
                      {item.description && (
                        <Typography variant="body2" style={{ marginBottom: 8 }}>
                          {item.description}
                        </Typography>
                      )}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Typography variant="body1" style={{ fontWeight: 500, fontSize: '1.1rem', color: theme.palette.primary.main }}>
                          {formatUSD(item.price)}
                        </Typography>
                        
                        <Box className={detailClasses.quantityControls}>
                          <IconButton 
                            size="small"
                            onClick={() => decrementCount(item.id)}
                            disabled={currentCount === 0}
                            {...testIdProps('button', 'offline-decrement', item.id)}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            type="number"
                            value={currentCount}
                            onChange={(e) => handleItemSelection(item.id, parseInt(e.target.value) || 0)}
                            inputProps={{ min: 0 }}
                            variant="outlined"
                            size="small"
                            className={detailClasses.quantityInput}
                            {...testIdProps('input', 'offline-quantity', item.id)}
                          />
                          <IconButton 
                            size="small"
                            onClick={() => incrementCount(item.id)}
                            {...testIdProps('button', 'offline-increment', item.id)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography className={detailClasses.emptyState} {...testIdProps('text', 'allinone-offline', 'empty')}>
                No items available
              </Typography>
            )}
          </Paper>
        )}

        {/* Donation section */}
        {components.donation?.enabled && (
          <Paper 
            elevation={1} 
            style={{ marginBottom: 16, padding: 16, backgroundColor: theme.palette.background.paper }}
            {...testIdProps('section', 'allinone-donation', 'container')}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <Favorite style={{ marginRight: 8, color: theme.palette.primary.main }} />
              <Typography variant="h6" color="primary">
                Support the Creator
              </Typography>
            </Box>
            
            {components.donation.pricingMode === 'fixed' && (
              <Box>
                <Typography variant="body1" paragraph>
                  Fixed donation amount:
                </Typography>
                <Typography variant="h4" className={detailClasses.priceTag}>
                  {formatUSD(components.donation.fixedAmount)}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setSelectedDonation(parseFloat(components.donation.fixedAmount))}
                  style={{ marginTop: 16 }}
                  {...testIdProps('button', 'donation-fixed', 'select')}
                >
                  Select Amount
                </Button>
              </Box>
            )}

            {(components.donation.pricingMode === 'flexible' || components.donation.pricingMode === 'preset') && (
              <Box>
                <Typography variant="body1" paragraph>
                  Choose or enter a donation amount:
                </Typography>
                
                {/* Quick amount buttons */}
                {components.donation.presetAmounts?.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Quick Selection:
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {components.donation.presetAmounts.map((amount, index) => (
                        <Button
                          key={index}
                          variant={donationAmount === amount.toString() ? "contained" : "outlined"}
                          color="primary"
                          onClick={() => setDonationAmount(amount.toString())}
                          style={{ marginRight: 8, marginBottom: 8 }}
                          {...testIdProps('button', 'donation-preset', amount)}
                        >
                          {formatUSD(amount)}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Custom amount input */}
                <Typography variant="subtitle2" gutterBottom>
                  Or enter custom amount:
                </Typography>
                <TextField
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{ min: 0.01, step: 0.01 }}
                  placeholder="Enter any amount"
                  {...testIdProps('input', 'donation-custom', 'amount')}
                />
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDonationSelect}
                  disabled={!donationAmount || parseFloat(donationAmount) <= 0}
                  style={{ marginTop: 16 }}
                  fullWidth
                  {...testIdProps('button', 'donation-custom', 'select')}
                >
                  Select Amount: {donationAmount ? formatUSD(parseFloat(donationAmount)) : '$0.00'}
                </Button>
              </Box>
            )}
          </Paper>
        )}

        {/* Cart summary */}
        {(Object.values(selectedFiles).some(selected => selected) || 
          Object.values(selectedOfflineItems).some(count => count > 0) || 
          selectedDonation) && (
          <Box className={detailClasses.totalSection} mt={3} {...testIdProps('section', 'allinone-cart', 'summary')}>
            <Typography variant="h6" gutterBottom>
              Selected Items
            </Typography>
            
            {Object.values(selectedFiles).filter(selected => selected).length > 0 && (
              <Typography variant="body2">
                {Object.values(selectedFiles).filter(selected => selected).length} file(s) selected
              </Typography>
            )}
            
            {Object.entries(selectedOfflineItems).filter(([id, count]) => count > 0).length > 0 && (
              <Typography variant="body2">
                {Object.entries(selectedOfflineItems)
                  .filter(([id, count]) => count > 0)
                  .reduce((total, [id, count]) => total + count, 0)} item(s) selected
              </Typography>
            )}
            
            {selectedDonation && (
              <Typography variant="body2">
                Donation: {formatUSD(selectedDonation)}
              </Typography>
            )}
          </Box>
        )}

      </Grid>
    );
  };

  const totalPrice = calculateTotal();

  // Render reviews content separately (collapsible)
  const renderReviewsContent = ({ searchableRating, loadingRatings }) => {
    if (!searchableRating || !searchableRating.individual_ratings || searchableRating.individual_ratings.length === 0) {
      return null;
    }
    
    return (
      <Accordion defaultExpanded={false} {...testIdProps('section', 'allinone-reviews', 'accordion')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="reviews-content"
          id="reviews-header"
        >
          <Typography variant="h6">
            Reviews ({searchableRating.total_ratings || 0})
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
    );
  };

  // Render receipts content separately
  const renderReceiptsContent = ({ id }) => (
    <InvoiceList 
      searchableId={id} 
      refreshUserPaidFiles={fetchUserPaidFiles}
    />
  );

  return (
    <BaseSearchableDetails
      renderTypeSpecificContent={renderTypeSpecificContent}
      renderReviewsContent={renderReviewsContent}
      renderReceiptsContent={renderReceiptsContent}
      onPayment={handlePayment}
      onBalancePayment={handleBalancePayment}
      totalPrice={totalPrice}
      payButtonText="Pay Now"
      disabled={totalPrice === 0 || processing}
    />
  );
};

// Helper function
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default AllInOneSearchableDetails;