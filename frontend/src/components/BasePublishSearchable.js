import React from 'react';
import { Grid, Typography, Paper, Box, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import PublishSearchableCommon from './PublishSearchableCommon';
import PublishSearchableActions from './PublishSearchableActions';
import useComponentStyles from '../themes/componentStyles';
import usePublishSearchable from '../hooks/usePublishSearchable';
import { detailPageStyles } from '../utils/detailPageSpacing';
import { componentSpacing } from '../utils/spacing';
import PageHeaderButton from './Navigation/PageHeaderButton';

// Create styles for publish pages
const useStyles = makeStyles((theme) => ({
  mainContent: {
    ...detailPageStyles.card(theme),
  },
  typeSpecificSection: {
    ...detailPageStyles.sectionWrapper(theme),
  },
  commonSection: {
    ...detailPageStyles.subSection(theme),
  },
  actionSection: {
    ...detailPageStyles.subSection(theme),
  }
}));

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
  const publishClasses = useStyles();
  const theme = useTheme();
  
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
    <Grid container sx={componentSpacing.pageContainer(theme)}>
      {/* Back button */}
      {!hideBackButton && (
        <Grid item xs={12} sx={componentSpacing.pageHeader(theme)}>
          <PageHeaderButton
            onClick={navigateBack}
          />
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
        <Paper elevation={3} className={publishClasses.mainContent}>
          <form onSubmit={onSubmit}>
            <Grid container spacing={3}>
              {/* Title section */}
              <Grid item xs={12}>
                <Typography variant="h4" gutterBottom>
                  {title}
                </Typography>
                
                {subtitle && (
                  <Typography variant="body2" color="textSecondary">
                    {subtitle}
                  </Typography>
                )}
              </Grid>

              {/* Common fields: title, description, tags, images */}
              <Grid item xs={12}>
                <Box className={publishClasses.commonSection}>
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
                </Box>
              </Grid>
              
              {/* Type-specific content */}
              {renderTypeSpecificContent && (
                <Grid item xs={12}>
                  <Box className={publishClasses.typeSpecificSection}>
                    {renderTypeSpecificContent({
                      formData,
                      handleInputChange,
                      error,
                      setError,
                      loading
                    })}
                  </Box>
                </Grid>
              )}
              
              {/* Action buttons */}
              <Grid item xs={12}>
                <Box className={publishClasses.actionSection}>
                  <PublishSearchableActions
                    loading={loading}
                    disabled={!isFormValid()}
                    onSubmit={null} // Form submission handled by form onSubmit
                    submitText={submitText}
                    loadingText={loadingText}
                  />
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default BasePublishSearchable;