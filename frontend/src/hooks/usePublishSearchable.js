import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const account = useSelector((state) => state.account);

  // Check if we're in edit mode
  const editMode = location.state?.editMode || false;
  const editData = location.state?.editData || null;

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
  const [isEditMode, setIsEditMode] = useState(editMode);
  const [searchableId, setSearchableId] = useState(null);

  // Initialize form with edit data if in edit mode
  useEffect(() => {
    if (editMode && editData) {
      console.log('Initializing edit mode with data:', editData);
      
      // Extract the public payload data
      const publicData = editData.payloads?.public || {};
      
      // Set common fields from public payload
      setFormData({
        title: publicData.title || '',
        description: publicData.description || '',
        currency: publicData.currency || 'usd',
        ...initialFormData
      });

      // Set images if available
      if (publicData.images && Array.isArray(publicData.images)) {
        setImages(publicData.images);
      }

      // Set tags if available
      if (editData.tags && Array.isArray(editData.tags)) {
        setSelectedTags(editData.tags);
      }

      // Store the searchable ID for updates
      setSearchableId(editData.searchable_id || editData.id || editData._id);
      setIsEditMode(true);
    }
  }, [editMode, editData]);

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

      let response;
      
      if (isEditMode && searchableId) {
        // Note: The backend doesn't currently support updating searchables
        // Create a new searchable and remove the old one
        
        // Create as new searchable
        response = await backend.post('v1/searchable/create', searchableData);
        
        // Remove the old searchable after successful creation
        if (response.data?.searchable_id) {
          try {
            await backend.put(`v1/searchable/remove/${searchableId}`, {});
            console.log(`Successfully removed old searchable ${searchableId}`);
          } catch (removeError) {
            console.error('Failed to remove old searchable:', removeError);
            // Don't fail the whole operation if removal fails
          }
        }
      } else {
        // Create new searchable
        response = await backend.post('v1/searchable/create', searchableData);
      }

      // Add tags if any were selected
      const searchableIdToUse = isEditMode ? searchableId : response.data?.searchable_id;
      if (selectedTags.length > 0 && searchableIdToUse) {
        try {
          const tagIds = selectedTags.map(tag => tag.id);
          await backend.post(`v1/searchables/${searchableIdToUse}/tags`, {
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

      // Determine redirect path based on searchable type
      let redirectPath = '/search';
      const newSearchableId = response.data?.searchable_id;
      
      if (customRedirectPath) {
        redirectPath = typeof customRedirectPath === 'function' 
          ? customRedirectPath(response) 
          : customRedirectPath;
      } else if (newSearchableId) {
        // Redirect to the appropriate detail page based on type
        switch (searchableType) {
          case 'downloadable':
            redirectPath = `/searchable-item/${newSearchableId}`;
            break;
          case 'offline':
            redirectPath = `/offline-item/${newSearchableId}`;
            break;
          case 'direct':
            redirectPath = `/direct-item/${newSearchableId}`;
            break;
          default:
            redirectPath = `/searchable-item/${newSearchableId}`;
        }
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
    navigateWithStack(history, '/search');
  };

  return {
    // State
    formData,
    images,
    selectedTags,
    loading,
    error,
    success,
    isEditMode,
    searchableId,
    
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