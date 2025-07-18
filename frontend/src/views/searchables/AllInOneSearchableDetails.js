import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, Paper, Box, Button,
  List, ListItem, ListItemText, Chip, TextField,
  InputAdornment, RadioGroup, FormControlLabel, Radio,
  Checkbox, FormGroup, Divider, IconButton
} from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';
import {
  CloudDownload, Storefront, Favorite,
  ShoppingCart, AttachMoney, Check as CheckIcon,
  Add as AddIcon, Remove as RemoveIcon
} from '@material-ui/icons';
import BaseSearchableDetails from '../../components/BaseSearchableDetails';
import useSearchableDetails from '../../hooks/useSearchableDetails';
import { formatUSD } from '../../utils/searchableUtils';
import useComponentStyles from '../../themes/componentStyles';
import { detailPageStyles } from '../../utils/detailPageSpacing';

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
  
  const {
    SearchableItem,
    createInvoice,
    createBalancePayment,
    formatCurrency
  } = useSearchableDetails();
  
  // Component state
  const [selectedFiles, setSelectedFiles] = useState({});  // For downloadable files
  const [selectedOfflineItems, setSelectedOfflineItems] = useState({});  // For offline items with counts
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [processing, setProcessing] = useState(false);

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

  const calculateTotal = () => {
    if (!SearchableItem) return 0;
    
    const publicData = SearchableItem.payloads?.public || {};
    const searchableType = publicData.type || SearchableItem.type;
    let total = 0;
    
    // Handle allinone searchables
    if (publicData.components) {
      const components = publicData.components;
      
      // Add downloadable files
      if (components.downloadable?.enabled) {
        const files = components.downloadable.files || [];
        Object.entries(selectedFiles).forEach(([fileId, isSelected]) => {
          if (isSelected) {
            const file = files.find(f => f.id === fileId);
            if (file) total += file.price || 0;
          }
        });
      }
      
      // Add offline items with quantities
      if (components.offline?.enabled) {
        const items = components.offline.items || [];
        Object.entries(selectedOfflineItems).forEach(([itemId, count]) => {
          if (count > 0) {
            const item = items.find(i => i.id === itemId);
            if (item) total += (item.price || 0) * count;
          }
        });
      }
      
      // Add donation
      if (components.donation?.enabled && selectedDonation) {
        total += selectedDonation;
      }
    } else {
      // Handle old searchable types
      if (searchableType === 'downloadable') {
        const files = publicData.downloadableFiles || publicData.files || [];
        Object.entries(selectedFiles).forEach(([fileId, isSelected]) => {
          if (isSelected) {
            const file = files.find(f => (f.fileId === fileId || f.id === fileId));
            if (file) total += file.price || 0;
          }
        });
      } else if (searchableType === 'offline') {
        const items = publicData.offlineItems || publicData.items || [];
        Object.entries(selectedOfflineItems).forEach(([itemId, count]) => {
          if (count > 0) {
            const item = items.find(i => (i.itemId === itemId || i.id === itemId));
            if (item) total += (item.price || 0) * count;
          }
        });
      } else if (searchableType === 'direct' && selectedDonation) {
        total += selectedDonation;
      }
    }
    
    return total;
  };

  const handlePayment = async () => {
    if (!SearchableItem) return;
    
    setProcessing(true);
    try {
      const publicData = SearchableItem.payloads?.public || {};
      const searchableType = publicData.type || SearchableItem.type;
      
      let invoiceData;
      
      // For old searchable types, use the appropriate format
      if (!publicData.components && searchableType !== 'allinone') {
        if (searchableType === 'downloadable') {
          // Get selected file IDs
          const fileIds = Object.entries(selectedFiles)
            .filter(([id, selected]) => selected)
            .map(([id]) => id);
          invoiceData = {
            searchable_id: SearchableItem.searchable_id,
            file_ids: fileIds
          };
        } else if (searchableType === 'offline') {
          // Get selected items with counts
          const itemIds = Object.entries(selectedOfflineItems)
            .filter(([id, count]) => count > 0)
            .map(([id]) => id);
          invoiceData = {
            searchable_id: SearchableItem.searchable_id,
            item_ids: itemIds
          };
        } else if (searchableType === 'direct') {
          invoiceData = {
            searchable_id: SearchableItem.searchable_id,
            amount: selectedDonation
          };
        }
      } else {
        // For allinone searchables
        const downloadableIds = Object.entries(selectedFiles)
          .filter(([id, selected]) => selected)
          .map(([id]) => id);
        const offlineIds = Object.entries(selectedOfflineItems)
          .filter(([id, count]) => count > 0)
          .map(([id]) => id);
          
        invoiceData = {
          searchable_id: SearchableItem.searchable_id,
          selections: {
            downloadable: downloadableIds,
            offline: offlineIds,
            donation: selectedDonation
          }
        };
      }
      
      await createInvoice(invoiceData);
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
      const searchableType = publicData.type || SearchableItem.type;
      
      const downloadableIds = Object.entries(selectedFiles)
        .filter(([id, selected]) => selected)
        .map(([id]) => id);
      const offlineIds = Object.entries(selectedOfflineItems)
        .filter(([id, count]) => count > 0)
        .map(([id]) => id);
        
      const paymentData = {
        searchable_id: SearchableItem.searchable_id,
        amount: calculateTotal(),
        selections: {
          downloadable: downloadableIds,
          offline: offlineIds,
          donation: selectedDonation
        }
      };
      
      await createBalancePayment(paymentData);
    } catch (error) {
      console.error('Balance payment failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const renderTypeSpecificContent = () => {
    if (!SearchableItem) return null;
    
    const publicData = SearchableItem.payloads?.public || {};
    const searchableType = publicData.type || SearchableItem.type;
    
    // Debug logging
    console.log('AllInOneSearchableDetails - SearchableItem:', SearchableItem);
    console.log('AllInOneSearchableDetails - publicData:', publicData);
    console.log('AllInOneSearchableDetails - searchableType:', searchableType);
    console.log('AllInOneSearchableDetails - components:', publicData.components);
    
    // Handle backward compatibility for old searchable types
    let components = publicData.components || {};
    
    if (searchableType === 'downloadable' && !publicData.components) {
      // Convert old downloadable format
      components = {
        downloadable: {
          enabled: true,
          files: (publicData.downloadableFiles || publicData.files || []).map((file, index) => ({
            id: file.fileId || file.id || `file-${index}`,
            fileId: file.fileId || file.id,  // Keep original ID for backend
            name: file.name || file.fileName || '',
            description: file.description || '',
            price: file.price || 0,
            size: file.size || file.fileSize || 0
          }))
        },
        offline: { enabled: false, items: [] },
        donation: { enabled: false }
      };
    } else if (searchableType === 'offline' && !publicData.components) {
      // Convert old offline format
      components = {
        downloadable: { enabled: false, files: [] },
        offline: {
          enabled: true,
          items: (publicData.offlineItems || publicData.items || []).map((item, index) => ({
            id: item.itemId || item.id || `item-${index}`,
            itemId: item.itemId || item.id,  // Keep original ID for backend
            name: item.name || '',
            description: item.description || '',
            price: item.price || 0
          }))
        },
        donation: { enabled: false }
      };
    } else if (searchableType === 'direct' && !publicData.components) {
      // Convert old direct (donation) format
      components = {
        downloadable: { enabled: false, files: [] },
        offline: { enabled: false, items: [] },
        donation: {
          enabled: true,
          pricingMode: publicData.pricingMode || 'flexible',
          fixedAmount: publicData.fixedAmount || publicData.defaultAmount || 10.00,
          presetAmounts: publicData.presetAmounts || [4.99, 9.99, 19.99],
          allowCustomAmount: true
        }
      };
    }
    
    return (
      <Grid item xs={12}>
        {/* Downloadable section */}
        {components.downloadable?.enabled && (
          <Paper elevation={1} style={{ marginBottom: 16, padding: 16, backgroundColor: theme.palette.background.paper }}>
            <Box display="flex" alignItems="center" mb={2}>
              <CloudDownload style={{ marginRight: 8, color: theme.palette.primary.main }} />
              <Typography variant="h6" color="primary">
                Digital Downloads
              </Typography>
            </Box>
            {components.downloadable.files?.length > 0 ? (
              <Box>
                {components.downloadable.files.map((file) => (
                  <Paper 
                    key={file.id}
                    className={`${detailClasses.fileItem} ${selectedFiles[file.id] ? detailClasses.fileItemSelected : ''}`}
                    onClick={() => handleFileSelection(file.id, !selectedFiles[file.id])}
                    style={{ marginBottom: 8 }}
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
                      {selectedFiles[file.id] && (
                        <CheckIcon style={{ color: '#1976d2', fontSize: 28 }} />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography className={detailClasses.emptyState}>
                No files available
              </Typography>
            )}
          </Paper>
        )}

        {/* Offline section */}
        {components.offline?.enabled && (
          <Paper elevation={1} style={{ marginBottom: 16, padding: 16, backgroundColor: theme.palette.background.paper }}>
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
                    <Box key={item.id} className={detailClasses.itemDivider}>
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
                          />
                          <IconButton 
                            size="small"
                            onClick={() => incrementCount(item.id)}
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
              <Typography className={detailClasses.emptyState}>
                No items available
              </Typography>
            )}
          </Paper>
        )}

        {/* Donation section */}
        {components.donation?.enabled && (
          <Paper elevation={1} style={{ marginBottom: 16, padding: 16, backgroundColor: theme.palette.background.paper }}>
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
                  onClick={() => setSelectedDonation(components.donation.fixedAmount)}
                  style={{ marginTop: 16 }}
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
                />
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDonationSelect}
                  disabled={!donationAmount || parseFloat(donationAmount) <= 0}
                  style={{ marginTop: 16 }}
                  fullWidth
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
          <Box className={detailClasses.totalSection} mt={3}>
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

  return (
    <BaseSearchableDetails
      renderTypeSpecificContent={renderTypeSpecificContent}
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