import React from 'react';
import { Grid, Typography, Button, Paper, Box } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import PublishSearchableCommon from './PublishSearchableCommon';
import PublishSearchableActions from './PublishSearchableActions';
import useComponentStyles from '../themes/componentStyles';
import usePublishSearchable from '../hooks/usePublishSearchable';

/**
 * Base component for all PublishSearchable components
 * Provides common layout, state management, and shared functionality
 */
const BasePublishSearchable = ({
  // Required props
  searchableType,
  title,
  subtitle,
  
  // Type-specific content and validation
  renderTypeSpecificContent,
  customValidation,
  
  // Type-specific submission
  getTypeSpecificPayload,
  customRedirectPath,
  
  // Optional customizations
  showCurrency = true,
  imageDescription = "Add up to 10 images",
  submitText = "Publish",
  loadingText = "Publishing...",
  
  // Custom handlers
  onSuccess,
  onError,
  
  // Additional form validation
  isFormValid = () => true,
  
  // Minimal mode for onboarding
  isMinimalMode = false,
  hideBackButton = false,
  initialFormData = {},
}) => {
  const classes = useComponentStyles();
  
  const {
    formData,
    images,
    loading,
    error,
    success,
    selectedTags,
    handleInputChange,
    handleImagesChange,
    handleTagsChange,
    handleSubmit,
    navigateBack,
    setError
  } = usePublishSearchable(searchableType, {
    customValidation,
    customRedirectPath,
    onSuccess,
    onError,
    initialFormData
  });

  // Handle form submission with type-specific payload
  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Check additional form validation
    if (!isFormValid()) {
      return;
    }
    
    // Get type-specific payload if provided
    const typeSpecificPayload = getTypeSpecificPayload 
      ? getTypeSpecificPayload(formData) 
      : {};
    
    await handleSubmit(e, typeSpecificPayload);
  };

  return (
    <Grid container className={classes.container}>
      {/* Back button */}
      {!hideBackButton && (
        <Grid item xs={12} className={classes.header}>
          <Button 
            variant="contained" 
            onClick={navigateBack}
            startIcon={<ArrowBackIcon />}
          >
            Back to Searchables
          </Button>
        </Grid>
      )}
      
      {/* Error message */}
      {error && (
        <Grid item xs={12}>
          <Box className={classes.errorMessage}>
            <Typography variant="body1">{error}</Typography>
          </Box>
        </Grid>
      )}
      
      {/* Success message */}
      {success && (
        <Grid item xs={12}>
          <Box className={classes.successMessage}>
            <Typography variant="body1">Successfully published! Redirecting...</Typography>
          </Box>
        </Grid>
      )}
      
      {/* Main content */}
      <Grid item xs={12}>
        <Paper elevation={3}>
          <form onSubmit={onSubmit}>
            <Grid container spacing={1}>
              {/* Title section */}
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="h4" gutterBottom>
                  {title}
                </Typography>
                
                {subtitle && (
                  <Typography variant="body2" color="textSecondary" style={{ marginBottom: 24 }}>
                    {subtitle}
                  </Typography>
                )}
              </Grid>

              {/* Common fields: title, description, tags, images */}
              <PublishSearchableCommon
                formData={formData}
                onInputChange={handleInputChange}
                images={images}
                onImagesChange={handleImagesChange}
                selectedTags={selectedTags}
                onTagsChange={handleTagsChange}
                onError={setError}
                imageDescription={imageDescription}
                showCurrency={showCurrency}
                isMinimalMode={isMinimalMode}
              />
              
              {/* Type-specific content */}
              {renderTypeSpecificContent && renderTypeSpecificContent({
                formData,
                handleInputChange,
                error,
                setError,
                loading
              })}
              
              {/* Action buttons */}
              <PublishSearchableActions
                loading={loading}
                disabled={!isFormValid()}
                onSubmit={null} // Form submission handled by form onSubmit
                submitText={submitText}
                loadingText={loadingText}
              />
            </Grid>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default BasePublishSearchable;