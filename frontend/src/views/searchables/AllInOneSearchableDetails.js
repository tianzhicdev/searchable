import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemText,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  InputAdornment,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton
} from '@material-ui/core';
import {
  CloudDownload,
  Storefront,
  Favorite,
  Edit,
  Delete,
  GetApp,
  ShoppingCart,
  AttachMoney
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import backend from '../utilities/Backend';
import { formatUSD } from '../../utils/format';
import PaymentSelection from '../../components/PaymentSelection';
import SearchableDetailsBase from '../../components/SearchableDetailsBase';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(2),
  },
  componentChip: {
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  tabPanel: {
    paddingTop: theme.spacing(3),
  },
  fileItem: {
    backgroundColor: theme.palette.background.paper,
    marginBottom: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  priceTag: {
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  actionButton: {
    marginTop: theme.spacing(2),
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: theme.palette.text.secondary,
  }
}));

const AllInOneSearchableDetails = () => {
  const classes = useStyles();
  const { id } = useParams();
  const history = useHistory();
  const account = useSelector((state) => state.account);
  const [searchable, setSearchable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedItems, setSelectedItems] = useState({
    downloadable: [],
    offline: [],
    donation: null
  });
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');

  useEffect(() => {
    fetchSearchableDetails();
  }, [id]);

  const fetchSearchableDetails = async () => {
    try {
      const response = await backend.get(`v1/searchable/${id}`);
      const data = response.data;
      
      // Verify this is an allinone searchable
      if (data.payloads?.public?.type !== 'allinone') {
        setError('Invalid searchable type');
        return;
      }
      
      setSearchable(data);
      
      // Set initial tab to first enabled component
      const components = data.payloads?.public?.components || {};
      if (components.downloadable?.enabled) {
        setActiveTab(0);
      } else if (components.offline?.enabled) {
        setActiveTab(1);
      } else if (components.donation?.enabled) {
        setActiveTab(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load searchable');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    history.push('/publish-allinone', {
      editMode: true,
      editData: searchable
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await backend.delete(`v1/searchable/${id}`);
      history.push('/dashboard');
    } catch (err) {
      setError('Failed to delete searchable');
    }
  };

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
    const components = searchable?.payloads?.public?.components || {};
    const donation = components.donation || {};
    
    if (donation.pricingMode === 'fixed') {
      setSelectedItems(prev => ({ ...prev, donation: donation.fixedAmount }));
    } else if (donation.pricingMode === 'preset' && selectedPreset) {
      setSelectedItems(prev => ({ ...prev, donation: parseFloat(selectedPreset) }));
    } else if (donation.pricingMode === 'flexible' && donationAmount) {
      setSelectedItems(prev => ({ ...prev, donation: parseFloat(donationAmount) }));
    }
  };

  const calculateTotal = () => {
    if (!searchable) return 0;
    
    const components = searchable.payloads?.public?.components || {};
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

  const handleProceedToPayment = () => {
    const total = calculateTotal();
    if (total > 0) {
      setShowPayment(true);
    }
  };

  const handlePaymentComplete = (paymentData) => {
    // Navigate to success page or refresh
    history.push('/my-downloads');
  };

  if (loading) return <Container><CircularProgress /></Container>;
  if (error) return <Container><Typography color="error">{error}</Typography></Container>;
  if (!searchable) return null;

  const publicData = searchable.payloads?.public || {};
  const components = publicData.components || {};
  const isOwner = account.user?._id === searchable.user_id;
  
  // Count enabled components
  const enabledComponents = Object.entries(components)
    .filter(([_, comp]) => comp.enabled)
    .map(([type, _]) => type);

  return (
    <Container maxWidth="lg">
      <SearchableDetailsBase
        searchable={searchable}
        onEdit={isOwner ? handleEdit : null}
        onDelete={isOwner ? handleDelete : null}
      >
        {/* Component chips */}
        <Box mb={2}>
          {enabledComponents.includes('downloadable') && (
            <Chip
              icon={<CloudDownload />}
              label="Digital Downloads"
              className={classes.componentChip}
              color="primary"
              variant="outlined"
            />
          )}
          {enabledComponents.includes('offline') && (
            <Chip
              icon={<Storefront />}
              label="Physical Items"
              className={classes.componentChip}
              color="primary"
              variant="outlined"
            />
          )}
          {enabledComponents.includes('donation') && (
            <Chip
              icon={<Favorite />}
              label="Donations"
              className={classes.componentChip}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Component tabs */}
        <Paper className={classes.root}>
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

          <Box className={classes.tabPanel}>
            {/* Downloadable tab */}
            {components.downloadable?.enabled && activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Available Files
                </Typography>
                {components.downloadable.files?.length > 0 ? (
                  <List>
                    {components.downloadable.files.map((file) => (
                      <ListItem
                        key={file.id}
                        className={classes.fileItem}
                        button
                        onClick={() => handleFileToggle(file.id)}
                        selected={selectedItems.downloadable.includes(file.id)}
                      >
                        <ListItemText
                          primary={file.name}
                          secondary={`Size: ${formatFileSize(file.size)}`}
                        />
                        <Typography className={classes.priceTag}>
                          {formatUSD(file.price)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography className={classes.emptyState}>
                    No files available
                  </Typography>
                )}
              </Box>
            )}

            {/* Offline tab */}
            {components.offline?.enabled && 
              activeTab === (components.downloadable?.enabled ? 1 : 0) && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Physical Items
                </Typography>
                {components.offline.items?.length > 0 ? (
                  <List>
                    {components.offline.items.map((item) => (
                      <ListItem
                        key={item.id}
                        className={classes.fileItem}
                        button
                        onClick={() => handleOfflineToggle(item.id)}
                        selected={selectedItems.offline.includes(item.id)}
                      >
                        <ListItemText primary={item.name} />
                        <Typography className={classes.priceTag}>
                          {formatUSD(item.price)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography className={classes.emptyState}>
                    No items available
                  </Typography>
                )}
              </Box>
            )}

            {/* Donation tab */}
            {components.donation?.enabled && 
              activeTab === 
                (components.downloadable?.enabled ? 1 : 0) + 
                (components.offline?.enabled ? 1 : 0) && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Support the Creator
                </Typography>
                
                {components.donation.pricingMode === 'fixed' && (
                  <Box>
                    <Typography variant="body1" paragraph>
                      Fixed donation amount:
                    </Typography>
                    <Typography variant="h4" className={classes.priceTag}>
                      {formatUSD(components.donation.fixedAmount)}
                    </Typography>
                  </Box>
                )}

                {components.donation.pricingMode === 'preset' && (
                  <Box>
                    <Typography variant="body1" paragraph>
                      Choose a donation amount:
                    </Typography>
                    <RadioGroup
                      value={selectedPreset}
                      onChange={(e) => setSelectedPreset(e.target.value)}
                    >
                      {components.donation.presetAmounts?.map((amount, index) => (
                        <FormControlLabel
                          key={index}
                          value={amount.toString()}
                          control={<Radio color="primary" />}
                          label={formatUSD(amount)}
                        />
                      ))}
                    </RadioGroup>
                  </Box>
                )}

                {components.donation.pricingMode === 'flexible' && (
                  <Box>
                    <Typography variant="body1" paragraph>
                      Enter your donation amount:
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
                    />
                    <Box mt={2}>
                      <Typography variant="caption" color="textSecondary">
                        Quick options:
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        {[5, 10, 20].map(amount => (
                          <Button
                            key={amount}
                            variant="outlined"
                            size="small"
                            onClick={() => setDonationAmount(amount.toString())}
                          >
                            ${amount}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  className={classes.actionButton}
                  onClick={handleDonationSelect}
                  disabled={
                    (components.donation.pricingMode === 'preset' && !selectedPreset) ||
                    (components.donation.pricingMode === 'flexible' && !donationAmount)
                  }
                >
                  Add Donation
                </Button>
              </Box>
            )}
          </Box>

          {/* Cart summary */}
          {(selectedItems.downloadable.length > 0 || 
            selectedItems.offline.length > 0 || 
            selectedItems.donation) && (
            <Box mt={3} p={2} bgcolor="background.default" borderRadius={1}>
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
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Total: {formatUSD(calculateTotal())}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleProceedToPayment}
                  startIcon={<ShoppingCart />}
                >
                  Proceed to Payment
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Payment modal */}
        {showPayment && (
          <PaymentSelection
            searchableId={id}
            amount={calculateTotal()}
            selections={{
              downloadable: selectedItems.downloadable,
              offline: selectedItems.offline,
              donation: selectedItems.donation
            }}
            onClose={() => setShowPayment(false)}
            onComplete={handlePaymentComplete}
          />
        )}
      </SearchableDetailsBase>
    </Container>
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