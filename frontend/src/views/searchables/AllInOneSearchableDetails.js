import React, { useState, useEffect } from 'react';
import { Grid, Box } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';
import { useHistory, useParams } from 'react-router-dom';
import BaseSearchableDetails from '../../components/BaseSearchableDetails';
import useSearchableDetails from '../../hooks/useSearchableDetails';
import InvoiceList from '../payments/InvoiceList';
import { calculateAllInOneTotal } from '../../utils/paymentCalculations';
import { usePaymentHandlers } from '../../hooks/usePaymentHandlers';
import { handleApiError, withErrorHandling } from '../../utils/errorHandling';
import useComponentStyles from '../../themes/componentStyles';
import { detailPageStyles } from '../../utils/detailPageSpacing';
import backend from '../utilities/Backend';
import { testIdProps } from '../../utils/testIds';
import DownloadableSection from '../../components/AllInOne/DownloadableSection';
import OfflineSection from '../../components/AllInOne/OfflineSection';
import DonationSection from '../../components/AllInOne/DonationSection';
import CartSummary from '../../components/AllInOne/CartSummary';

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
    loading,
    error
  } = useSearchableDetails();
  
  // Use payment handlers hook
  const {
    handleAllInOnePayment,
    handleAllInOneBalancePayment,
    processing: paymentProcessing,
    error: paymentError
  } = usePaymentHandlers(SearchableItem);
  
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

  // Fetch user's paid files
  useEffect(() => {
    if (SearchableItem && SearchableItem.searchable_id) {
      fetchUserPaidFiles();
    }
  }, [SearchableItem]);

  const fetchUserPaidFiles = async () => {
    const result = await withErrorHandling(
      async () => {
        const response = await backend.get(`v1/user-paid-files/${id}`);
        const userPaidFileIds = new Set(response.data.paid_file_ids);
        setUserPaidFiles(userPaidFileIds);
        return response.data;
      },
      {
        context: 'Fetch User Paid Files',
        defaultMessage: 'Failed to load purchase history'
      }
    );
    
    // If failed, set empty set so component still works
    if (!result) {
      setUserPaidFiles(new Set());
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
    await withErrorHandling(
      async () => {
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
        
        // Clean up
        window.URL.revokeObjectURL(url);
      },
      {
        context: 'File Download',
        defaultMessage: 'Failed to download file. Please try again.',
      }
    );
  };

  const calculateTotal = () => {
    return calculateAllInOneTotal(SearchableItem, selectedFiles, selectedOfflineItems, selectedDonation);
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await handleAllInOnePayment(
        selectedFiles,
        selectedOfflineItems,
        selectedDonation,
        calculateTotal()
      );
      // Refresh paid files after successful payment
      setTimeout(() => {
        fetchUserPaidFiles();
        window.location.reload();
      }, 2000);
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setProcessing(false);
    }
  };

  const handleBalancePayment = async () => {
    setProcessing(true);
    try {
      await handleAllInOneBalancePayment(
        selectedFiles,
        selectedOfflineItems,
        selectedDonation,
        calculateTotal()
      );
      // Refresh paid files after successful payment
      setTimeout(() => {
        fetchUserPaidFiles();
        window.location.reload();
      }, 2000);
    } catch (error) {
      // Error is handled by the hook
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
        <DownloadableSection
          components={components}
          selectedFiles={selectedFiles}
          userPaidFiles={userPaidFiles}
          handleFileSelection={handleFileSelection}
          handleDownload={handleDownload}
          theme={theme}
          classes={detailClasses}
        />
        
        <OfflineSection
          components={components}
          selectedOfflineItems={selectedOfflineItems}
          handleItemSelection={handleItemSelection}
          incrementCount={incrementCount}
          decrementCount={decrementCount}
          theme={theme}
          classes={detailClasses}
        />
        
        <DonationSection
          components={components}
          donationAmount={donationAmount}
          setDonationAmount={setDonationAmount}
          selectedDonation={selectedDonation}
          setSelectedDonation={setSelectedDonation}
          handleDonationSelect={handleDonationSelect}
          theme={theme}
          classes={detailClasses}
        />
        
        <CartSummary
          selectedFiles={selectedFiles}
          selectedOfflineItems={selectedOfflineItems}
          selectedDonation={selectedDonation}
          classes={detailClasses}
        />
      </Grid>
    );
  };

  const totalPrice = calculateTotal();

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
      renderReceiptsContent={renderReceiptsContent}
      onPayment={handlePayment}
      onBalancePayment={handleBalancePayment}
      totalPrice={totalPrice}
      payButtonText="Pay Now"
      disabled={totalPrice === 0 || processing}
    />
  );
};

export default AllInOneSearchableDetails;