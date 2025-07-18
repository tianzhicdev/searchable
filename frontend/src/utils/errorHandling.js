/**
 * Error handling utilities for consistent error management
 */

/**
 * Standard error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  DOWNLOAD_FAILED: 'File download failed. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  INSUFFICIENT_BALANCE: 'Insufficient balance. Please add funds to your account.',
};

/**
 * Extract user-friendly error message from error object
 * @param {Error|Object} error - The error object
 * @param {string} defaultMessage - Default message if no specific message found
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = ERROR_MESSAGES.GENERIC_ERROR) => {
  // Handle axios errors
  if (error.response) {
    const { status, data } = error.response;
    
    // Check for specific error message in response
    if (data?.error) {
      return data.error;
    }
    
    if (data?.message) {
      return data.message;
    }
    
    // Handle common HTTP status codes
    switch (status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 422:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      default:
        if (status >= 500) {
          return 'Server error. Please try again later.';
        }
    }
  }
  
  // Handle network errors
  if (error.request && !error.response) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  // Handle regular Error objects
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
};

/**
 * Log error for debugging (only in development)
 * @param {string} context - Where the error occurred
 * @param {Error} error - The error object
 * @param {Object} additionalInfo - Any additional context
 */
export const logError = (context, error, additionalInfo = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] Error:`, {
      error,
      message: error.message,
      stack: error.stack,
      response: error.response,
      ...additionalInfo
    });
  }
};

/**
 * Handle API errors
 * @param {Error} error - The error object
 * @param {string} context - Context for logging
 * @param {Object} options - Additional options
 * @returns {string} Error message
 */
export const handleApiError = (error, context = 'API', options = {}) => {
  const {
    defaultMessage,
    onError,
    additionalInfo = {}
  } = options;
  
  // Log the error
  logError(context, error, additionalInfo);
  
  // Get user-friendly message
  const message = getErrorMessage(error, defaultMessage);
  
  // Call custom error handler if provided
  if (onError) {
    onError(error, message);
  }
  
  return message;
};

/**
 * Async wrapper with error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Promise} Result or null on error
 */
export const withErrorHandling = async (asyncFn, options = {}) => {
  try {
    return await asyncFn();
  } catch (error) {
    handleApiError(error, options.context || 'Operation', options);
    return null;
  }
};

/**
 * Create an error boundary fallback component
 * @param {Error} error - The error that was caught
 * @param {Function} resetErrorBoundary - Function to reset the error boundary
 * @returns {JSX.Element} Fallback UI
 */
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div role="alert" style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <p>{getErrorMessage(error)}</p>
      <button onClick={resetErrorBoundary} style={{ marginTop: '10px' }}>
        Try again
      </button>
    </div>
  );
};