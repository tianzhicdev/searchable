import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import backend from '../views/utilities/Backend';
import { navigateWithStack } from '../utils/navigationUtils';
import { formatUSD } from '../utils/searchableUtils';

/**
 * Custom hook for shared SearchableDetails logic
 * Handles common state, data fetching, and business logic across all searchable detail types
 */
const useSearchableDetails = () => {
  const { id } = useParams();
  const account = useSelector((state) => state.account);
  const history = useHistory();
  const location = useLocation();

  // Common state across all SearchableDetails components
  const [SearchableItem, setSearchableItem] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Rating states
  const [searchableRating, setSearchableRating] = useState(null);
  const [loadingRatings, setLoadingRatings] = useState(true);
  
  // Balance state
  const [userBalance, setUserBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Common data fetching functions
  const fetchSearchableDetails = async () => {
    try {
      const response = await backend.get(`v1/searchable/${id}`);
      setSearchableItem(response.data);
      
      // Check if current user is the owner
      if (account && account.user && account.user._id === response.data.user_id) {
        setIsOwner(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch item details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    setLoadingRatings(true);
    try {
      // Fetch searchable item rating
      const searchableResponse = await backend.get(`v1/rating/searchable/${id}`);
      setSearchableRating(searchableResponse.data);
    } catch (err) {
      console.error("Error fetching ratings:", err);
      // Don't set an error state, as this is not critical functionality
    } finally {
      setLoadingRatings(false);
    }
  };

  const refreshPaymentsBySearchable = async () => {
    try {
      await backend.get(`v1/refresh-payments-by-searchable/${id}`);
    } catch (err) {
      console.error("Error refreshing payments for searchable:", err);
      // Don't show an alert as this is a background operation
    }
  };

  const fetchUserBalance = async () => {
    if (!account || !account.user) {
      
      setUserBalance(0);
      return;
    }

    setLoadingBalance(true);
    try {
      const response = await backend.get('/balance');
      // Balance response format: { "balance": { "usd": 123.45 } }
      const balance = response.data.balance?.usd || 0;

      setUserBalance(balance);
    } catch (err) {
      console.error("Error fetching user balance:", err);
      setUserBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Common remove item function
  const handleRemoveItem = async () => {
    if (!window.confirm('Are you sure you want to remove this item?')) {
      return;
    }

    setIsRemoving(true);
    try {
      await backend.put(`v1/searchable/remove/${id}`, {});
      navigateWithStack(history, '/search');
    } catch (err) {
      setError(err.message || 'Failed to remove item');
    } finally {
      setIsRemoving(false);
    }
  };

  // Common create invoice function - can be extended by specific types
  const createInvoice = async (invoiceData) => {
    setCreatingInvoice(true);
    try {
      const payload = {
        searchable_id: parseInt(id),
        invoice_type: 'stripe',
        success_url: `${window.location.origin}${window.location.pathname}`,
        cancel_url: `${window.location.origin}${window.location.pathname}`,
        ...invoiceData
      };

      // Add address and tel for logged-in users
      if (account?.user) {
        payload.address = account.user.address || '';
        payload.tel = account.user.tel || '';
      }

      const response = await backend.post('v1/create-invoice', payload);

      // Redirect to Stripe checkout
      if (response.data.url) {
        // Use replace to avoid back button issues with external URLs
        window.location.replace(response.data.url);
      } else if (response.data.session_id) {
        // For mock mode, use history API for internal navigation
        history.push(`${location.pathname}?payment=success`);
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to create payment invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Create balance payment
  const createBalancePayment = async (invoiceData) => {
    setCreatingInvoice(true);
    try {
      const payload = {
        searchable_id: parseInt(id),
        invoice_type: 'balance',
        ...invoiceData
      };

      // Add address and tel for logged-in users
      if (account?.user) {
        payload.delivery_info = {
          address: account.user.address || '',
          tel: account.user.tel || ''
        };
      }

      const response = await backend.post('v1/create-balance-invoice', payload);

      if (response.data.success) {
        // Payment successful - refresh the page to show updated state
        window.location.reload();
      }
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to process balance payment');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    
    fetchSearchableDetails();
    refreshPaymentsBySearchable();
    fetchRatings();
    fetchUserBalance();
  }, [id]);
  
  // Refresh balance when account changes
  useEffect(() => {
    fetchUserBalance();
  }, [account]);

  return {
    // State
    SearchableItem,
    isOwner,
    loading,
    error,
    isRemoving,
    creatingInvoice,
    searchableRating,
    loadingRatings,
    userBalance,
    loadingBalance,
    
    // Computed values
    publicData: SearchableItem?.payloads?.public || {},
    
    // Functions
    fetchSearchableDetails,
    fetchRatings,
    refreshPaymentsBySearchable,
    handleRemoveItem,
    createInvoice,
    createBalancePayment,
    formatUSD,
    fetchUserBalance,
    
    // Utils
    setError,
    setLoading,
    
    // Router values
    id,
    account,
    history,
    location
  };
};

export default useSearchableDetails;