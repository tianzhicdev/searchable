/**
 * Custom hook for handling payment operations
 * Centralizes payment logic across different searchable types
 */

import { useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import backend from '../views/utilities/Backend';
import { 
  buildAllInOneSelections, 
  formatSelectionsForBalancePayment,
  validatePaymentAmount,
  PAYMENT_CONSTANTS 
} from '../utils/paymentCalculations';

export const usePaymentHandlers = (searchableItem, onSuccess, onError) => {
  const history = useHistory();
  const account = useSelector(state => state.account);
  const user = account?.user;
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create Stripe invoice
   */
  const createStripeInvoice = useCallback(async (invoiceData) => {
    setProcessing(true);
    setError(null);
    
    try {
      const payload = {
        ...invoiceData,
        invoice_type: 'stripe',
        success_url: invoiceData.success_url || `${window.location.origin}${window.location.pathname}`,
        cancel_url: invoiceData.cancel_url || `${window.location.origin}${window.location.pathname}`
      };

      const response = await backend.post('v1/create-invoice', payload);
      
      if (response.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to create payment session');
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Payment failed';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [onSuccess, onError]);

  /**
   * Create balance payment
   */
  const createBalancePayment = useCallback(async (paymentData) => {
    setProcessing(true);
    setError(null);
    
    try {
      // Validate user is logged in
      if (!user) {
        throw new Error('Please log in to use balance payment');
      }

      if (!searchableItem) {
        throw new Error('Searchable item not loaded');
      }

      const payload = {
        searchable_id: searchableItem.searchable_id,
        invoice_type: 'balance',
        selections: paymentData.selections,
        ...paymentData
      };

      const response = await backend.post('v1/create-balance-invoice', payload);
      
      if (response.data?.success) {
        // Show success message and refresh
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.data?.error || 'Balance payment failed');
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Balance payment failed';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [user, searchableItem, onSuccess, onError]);

  /**
   * Handle AllInOne searchable payment
   */
  const handleAllInOnePayment = useCallback(async (selectedFiles, selectedOfflineItems, selectedDonation, totalAmount) => {
    if (!searchableItem) {
      setError('Searchable item not loaded');
      return;
    }
    
    const publicData = searchableItem.payloads?.public || {};
    const components = publicData.components;
    
    if (!components) {
      setError('Invalid searchable configuration');
      return;
    }
    
    // Build selections
    const selections = buildAllInOneSelections(
      components,
      selectedFiles,
      selectedOfflineItems,
      selectedDonation
    );
    
    if (selections.length === 0) {
      setError('Please select at least one item');
      return;
    }
    
    const invoiceData = {
      searchable_id: searchableItem.searchable_id,
      selections: selections
    };
    
    return createStripeInvoice(invoiceData);
  }, [searchableItem, createStripeInvoice]);

  /**
   * Handle AllInOne balance payment
   */
  const handleAllInOneBalancePayment = useCallback(async (selectedFiles, selectedOfflineItems, selectedDonation, totalAmount) => {
    if (!searchableItem) {
      setError('Searchable item not loaded');
      return;
    }
    
    const publicData = searchableItem.payloads?.public || {};
    const components = publicData.components;
    
    if (!components) {
      setError('Invalid searchable configuration');
      return;
    }
    
    // Build selections
    const selections = buildAllInOneSelections(
      components,
      selectedFiles,
      selectedOfflineItems,
      selectedDonation
    );
    
    if (selections.length === 0) {
      setError('Please select at least one item');
      return;
    }
    
    // Format selections for balance payment
    const formattedSelections = formatSelectionsForBalancePayment(searchableItem, selections);
    
    const paymentData = {
      selections: formattedSelections,
      total_price: totalAmount
    };
    
    return createBalancePayment(paymentData);
  }, [searchableItem, createBalancePayment]);

  /**
   * Handle simple searchable payment (downloadable, offline, direct)
   */
  const handleSimplePayment = useCallback(async (selections, totalAmount, paymentType = 'stripe') => {
    if (!searchableItem) {
      setError('Searchable item not loaded');
      return;
    }
    
    if (!selections || selections.length === 0) {
      setError('Please select at least one item');
      return;
    }
    
    const invoiceData = {
      searchable_id: searchableItem.searchable_id,
      selections: selections
    };
    
    if (paymentType === 'balance') {
      const formattedSelections = formatSelectionsForBalancePayment(searchableItem, selections);
      return createBalancePayment({
        selections: formattedSelections,
        total_price: totalAmount
      });
    } else {
      return createStripeInvoice(invoiceData);
    }
  }, [searchableItem, createStripeInvoice, createBalancePayment]);

  /**
   * Handle direct payment (donation)
   */
  const handleDirectPayment = useCallback(async (amount, paymentType = 'stripe') => {
    if (!searchableItem) {
      setError('Searchable item not loaded');
      return;
    }
    
    // Validate amount
    const validation = validatePaymentAmount(amount, 'donation');
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    
    const selections = [{
      amount: parseFloat(amount),
      type: 'direct'
    }];
    
    return handleSimplePayment(selections, parseFloat(amount), paymentType);
  }, [searchableItem, handleSimplePayment]);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Payment handlers
    createStripeInvoice,
    createBalancePayment,
    handleAllInOnePayment,
    handleAllInOneBalancePayment,
    handleSimplePayment,
    handleDirectPayment,
    
    // State
    processing,
    error,
    clearError,
    
    // Constants
    PAYMENT_CONSTANTS
  };
};