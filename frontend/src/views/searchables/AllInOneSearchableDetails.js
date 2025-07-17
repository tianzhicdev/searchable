import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, Paper, Box, Tabs, Tab, Button,
  List, ListItem, ListItemText, Chip, TextField,
  InputAdornment, RadioGroup, FormControlLabel, Radio,
  Checkbox, FormGroup
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import {
  CloudDownload, Storefront, Favorite,
  ShoppingCart, AttachMoney
} from '@material-ui/icons';
import BaseSearchableDetails from '../../components/BaseSearchableDetails';
import useSearchableDetails from '../../hooks/useSearchableDetails';
import { formatUSD } from '../../utils/searchableUtils';
import useComponentStyles from '../../themes/componentStyles';
import { detailPageStyles } from '../../utils/detailPageSpacing';

const useStyles = makeStyles((theme) => ({
  componentChip: {
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  tabPanel: {
    paddingTop: theme.spacing(3),
  },
  fileItem: {
    ...detailPageStyles.card(theme),
    marginBottom: theme.spacing(1),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
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
  
  const {
    SearchableItem,
    createInvoice,
    createBalancePayment,
    formatCurrency
  } = useSearchableDetails();
  
  // Component state
  const [activeTab, setActiveTab] = useState(0);
  const [selectedItems, setSelectedItems] = useState({
    downloadable: [],
    offline: [],
    donation: null
  });
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [processing, setProcessing] = useState(false);
  
  useEffect(() => {
    if (SearchableItem) {
      const components = SearchableItem.payloads?.public?.components || {};
      // Set initial tab to first enabled component
      if (components.downloadable?.enabled) {
        setActiveTab(0);
      } else if (components.offline?.enabled) {
        setActiveTab(1);
      } else if (components.donation?.enabled) {
        setActiveTab(2);
      }
    }
  }, [SearchableItem]);

  const handleFileToggle = (fileId) => {
    setSelectedItems(prev => ({
      ...prev,
      downloadable: prev.downloadable.includes(fileId)
        ? prev.downloadable.filter(id => id !== fileId)
        : [...prev.downloadable, fileId]
    }));
  };

  const handleOfflineToggle = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      offline: prev.offline.includes(itemId)
        ? prev.offline.filter(id => id !== itemId)
        : [...prev.offline, itemId]
    }));
  };

  const handleDonationSelect = () => {
    const components = SearchableItem?.payloads?.public?.components || {};
    const donation = components.donation || {};
    
    if (donation.pricingMode === 'fixed') {
      setSelectedItems(prev => ({ ...prev, donation: donation.fixedAmount }));
    } else if ((donation.pricingMode === 'flexible' || donation.pricingMode === 'preset') && donationAmount) {
      // Handle both flexible and legacy preset mode the same way
      setSelectedItems(prev => ({ ...prev, donation: parseFloat(donationAmount) }));
    }
  };

  const calculateTotal = () => {
    if (!SearchableItem) return 0;
    
    const components = SearchableItem.payloads?.public?.components || {};
    let total = 0;
    
    // Add downloadable files
    if (components.downloadable?.enabled && selectedItems.downloadable.length > 0) {
      const files = components.downloadable.files || [];
      selectedItems.downloadable.forEach(fileId => {
        const file = files.find(f => f.id === fileId);
        if (file) total += file.price || 0;
      });
    }
    
    // Add offline items
    if (components.offline?.enabled && selectedItems.offline.length > 0) {
      const items = components.offline.items || [];
      selectedItems.offline.forEach(itemId => {
        const item = items.find(i => i.id === itemId);
        if (item) total += item.price || 0;
      });
    }
    
    // Add donation
    if (components.donation?.enabled && selectedItems.donation) {
      total += selectedItems.donation;
    }
    
    return total;
  };

  const handlePayment = async () => {
    if (!SearchableItem) return;
    
    setProcessing(true);
    try {
      const invoiceData = {
        searchable_id: SearchableItem.searchable_id,
        selections: {
          downloadable: selectedItems.downloadable,
          offline: selectedItems.offline,
          donation: selectedItems.donation
        }
      };
      
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
      const paymentData = {
        searchable_id: SearchableItem.searchable_id,
        amount: calculateTotal(),
        selections: {
          downloadable: selectedItems.downloadable,
          offline: selectedItems.offline,
          donation: selectedItems.donation
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
    const components = publicData.components || {};
    
    // Count enabled components for tab indexing
    let tabIndex = 0;
    const downloadableTabIndex = components.downloadable?.enabled ? tabIndex++ : -1;
    const offlineTabIndex = components.offline?.enabled ? tabIndex++ : -1;
    const donationTabIndex = components.donation?.enabled ? tabIndex++ : -1;
    
    return (
      <Grid item xs={12}>
        {/* Component chips */}
        <Box mb={2}>
          {components.downloadable?.enabled && (
            <Chip
              icon={<CloudDownload />}
              label="Digital Downloads"
              className={detailClasses.componentChip}
              color="primary"
              variant="outlined"
            />
          )}
          {components.offline?.enabled && (
            <Chip
              icon={<Storefront />}
              label="Physical Items"
              className={detailClasses.componentChip}
              color="primary"
              variant="outlined"
            />
          )}
          {components.donation?.enabled && (
            <Chip
              icon={<Favorite />}
              label="Donations"
              className={detailClasses.componentChip}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Component tabs */}
        <Paper elevation={1}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
          >
            {components.downloadable?.enabled && (
              <Tab label="Digital Downloads" icon={<CloudDownload />} />
            )}
            {components.offline?.enabled && (
              <Tab label="Physical Items" icon={<Storefront />} />
            )}
            {components.donation?.enabled && (
              <Tab label="Support Creator" icon={<Favorite />} />
            )}
          </Tabs>

          <Box className={detailClasses.tabPanel}>
            {/* Downloadable tab */}
            {components.downloadable?.enabled && activeTab === downloadableTabIndex && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Available Files
                </Typography>
                {components.downloadable.files?.length > 0 ? (
                  <List>
                    {components.downloadable.files.map((file) => (
                      <ListItem
                        key={file.id}
                        className={detailClasses.fileItem}
                        onClick={() => handleFileToggle(file.id)}
                      >
                        <Checkbox
                          checked={selectedItems.downloadable.includes(file.id)}
                          color="primary"
                        />
                        <ListItemText
                          primary={file.name}
                          secondary={formatFileSize(file.size)}
                        />
                        <Typography className={detailClasses.priceTag}>
                          {formatUSD(file.price)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography className={detailClasses.emptyState}>
                    No files available
                  </Typography>
                )}
              </Box>
            )}

            {/* Offline tab */}
            {components.offline?.enabled && activeTab === offlineTabIndex && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Physical Items
                </Typography>
                {components.offline.items?.length > 0 ? (
                  <List>
                    {components.offline.items.map((item) => (
                      <ListItem
                        key={item.id}
                        className={detailClasses.fileItem}
                        onClick={() => handleOfflineToggle(item.id)}
                      >
                        <Checkbox
                          checked={selectedItems.offline.includes(item.id)}
                          color="primary"
                        />
                        <ListItemText primary={item.name} />
                        <Typography className={detailClasses.priceTag}>
                          {formatUSD(item.price)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography className={detailClasses.emptyState}>
                    No items available
                  </Typography>
                )}
              </Box>
            )}

            {/* Donation tab */}
            {components.donation?.enabled && activeTab === donationTabIndex && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Support the Creator
                </Typography>
                
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
                      onClick={() => setSelectedItems(prev => ({ 
                        ...prev, 
                        donation: components.donation.fixedAmount 
                      }))}
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
              </Box>
            )}
          </Box>
        </Paper>

        {/* Cart summary */}
        {(selectedItems.downloadable.length > 0 || 
          selectedItems.offline.length > 0 || 
          selectedItems.donation) && (
          <Box className={detailClasses.totalSection} mt={3}>
            <Typography variant="h6" gutterBottom>
              Selected Items
            </Typography>
            
            {selectedItems.downloadable.length > 0 && (
              <Typography variant="body2">
                {selectedItems.downloadable.length} file(s) selected
              </Typography>
            )}
            
            {selectedItems.offline.length > 0 && (
              <Typography variant="body2">
                {selectedItems.offline.length} item(s) selected
              </Typography>
            )}
            
            {selectedItems.donation && (
              <Typography variant="body2">
                Donation: {formatUSD(selectedItems.donation)}
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