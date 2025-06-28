import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import backend from '../views/utilities/Backend';
import { navigateWithStack } from '../utils/navigationUtils';

/**
 * Custom hook for shared PublishSearchable logic
 * Handles common state, form handling, and submission logic across all publish searchable types
 */
const usePublishSearchable = (searchableType, options = {}) => {
  const {
    initialFormData = {},
    customRedirectPath,
    customValidation,
    onSuccess,
    onError
  } = options;

  const history = useHistory();
  const account = useSelector((state) => state.account);

  // Common form data with type-specific defaults
  const defaultFormData = {
    title: '',
    description: '',
    currency: 'usd',
    ...initialFormData
  };

  // Common state across all PublishSearchable components
  const [formData, setFormData] = useState(defaultFormData);
  const [images, setImages] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Common form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImagesChange = (newImages) => {
    // Extract URIs from the image data objects
    const imageUris = newImages.map(img => img.uri);
    setImages(imageUris);
  };

  const handleTagsChange = (newTags) => {
    setSelectedTags(newTags);
  };

  // Common form validation
  const validateForm = () => {
    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return false;
    }

    // Custom validation if provided
    if (customValidation) {
      const customError = customValidation(formData);
      if (customError) {
        setError(customError);
        return false;
      }
    }

    return true;
  };

  // Common form reset
  const resetForm = () => {
    setFormData(defaultFormData);
    setImages([]);
    setSelectedTags([]);
    setError(null);
    setSuccess(false);
  };

  // Common submit handler with type-specific payload injection
  const handleSubmit = async (e, typeSpecificPayload = {}) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Base payload structure
      const searchableData = {
        payloads: {
          public: {
            title: formData.title,
            description: formData.description,
            currency: formData.currency,
            type: searchableType,
            images: images,
            visibility: {
              udf: "always_true",
              data: {}
            },
            ...typeSpecificPayload
          }
        }
      };

      const response = await backend.post('v1/searchable/create', searchableData);

      // Add tags if any were selected
      if (selectedTags.length > 0 && response.data?.searchable_id) {
        try {
          const tagIds = selectedTags.map(tag => tag.id);
          await backend.post(`v1/searchables/${response.data.searchable_id}/tags`, {
            tag_ids: tagIds
          });
        } catch (tagError) {
          console.error('Failed to add tags:', tagError);
          // Don't fail the whole operation if tags fail
        }
      }

      setSuccess(true);
      
      // Call custom success handler if provided
      if (onSuccess) {
        onSuccess(response);
      }

      // Reset form after successful submission
      resetForm();

      // Determine redirect path
      let redirectPath = '/landing';
      if (customRedirectPath) {
        redirectPath = typeof customRedirectPath === 'function' 
          ? customRedirectPath(response) 
          : customRedirectPath;
      } else if (searchableType === 'direct' && response.data.searchable_id) {
        redirectPath = `/direct-item/${response.data.searchable_id}`;
      }

      // Redirect after a delay
      setTimeout(() => {
        navigateWithStack(history, redirectPath);
      }, 1500);

    } catch (err) {
      console.error(`Error publishing ${searchableType} searchable:`, err);
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred while publishing';
      setError(errorMessage);
      
      // Call custom error handler if provided
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Common format currency function
  const formatUSD = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Navigation helper
  const navigateBack = () => {
    navigateWithStack(history, '/landing');
  };

  return {
    // State
    formData,
    images,
    selectedTags,
    loading,
    error,
    success,
    
    // Handlers
    handleInputChange,
    handleImagesChange,
    handleTagsChange,
    handleSubmit,
    resetForm,
    validateForm,
    navigateBack,
    
    // Utilities
    formatUSD,
    setError,
    setFormData,
    setImages,
    
    // Router/Redux
    history,
    account
  };
};

export default usePublishSearchable;