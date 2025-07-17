import React from 'react';
import { Grid, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import PublishSearchableCommon from './PublishSearchableCommon';
import PublishSearchableActions from './PublishSearchableActions';
import useComponentStyles from '../themes/componentStyles';
import usePublishSearchable from '../hooks/usePublishSearchable';
import { componentSpacing } from '../utils/spacing';
import PageHeaderButton from './Navigation/PageHeaderButton';
import { PageLayout, SectionHeader, ErrorState, LoadingState } from './common';
import { testIdProps } from '../utils/testIds';

const useStyles = makeStyles((theme) => ({
  section: {
    marginBottom: componentSpacing.section(theme)
  }
}));

/**
 * Enhanced base component for all PublishSearchable components
 * Provides more flexible configuration and better composition patterns
 */
const EnhancedBasePublishSearchable = ({
  // Page configuration
  config = {
    searchableType: 'direct',
    title: 'Publish Searchable',
    subtitle: '',
    showBackButton: true,
    showCurrency: true,
    imageDescription: "Add up to 10 images",
    submitText: "Publish",
    loadingText: "Publishing...",
    successMessage: "Successfully published! Redirecting...",
    breadcrumbs: []
  },
  
  // Field configuration
  fields = {
    common: {
      title: { required: true, maxLength: 100 },
      description: { required: true, maxLength: 500 },
      tags: { required: true, maxTags: 10 },
      images: { maxImages: 10, required: false },
      price: { required: true, min: 0 }
    },
    custom: []
  },
  
  // Sections configuration
  sections = [
    {
      id: 'common',
      title: 'Basic Information',
      component: 'common', // built-in common fields
      grid: { xs: 12 }
    }
  ],
  
  // Type-specific handlers
  handlers = {
    validation: null,
    getPayload: null,
    onSuccess: null,
    onError: null,
    isFormValid: () => true
  },
  
  // Custom components
  components = {
    header: null,
    footer: null,
    sections: {}
  },
  
  // Initial data
  initialData = {},
  
  // UI options
  ui = {
    layout: 'single-column', // 'single-column', 'two-column', 'custom'
    spacing: 3,
    elevation: 1,
    variant: 'outlined' // 'outlined', 'elevation', 'none'
  }
}) => {
  const classes = useComponentStyles();
  const styles = useStyles();
  
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
  } = usePublishSearchable(config.searchableType, {
    customValidation: handlers.validation,
    customRedirectPath: config.customRedirectPath,
    onSuccess: handlers.onSuccess,
    onError: handlers.onError,
    initialFormData: initialData
  });

  // Handle form submission with type-specific payload
  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!handlers.isFormValid(formData)) {
      return;
    }
    
    const typeSpecificPayload = handlers.getPayload 
      ? handlers.getPayload(formData) 
      : {};
    
    await handleSubmit(e, typeSpecificPayload);
  };

  // Render a section based on its configuration
  const renderSection = (section) => {
    // Built-in common fields section
    if (section.component === 'common') {
      return (
        <PublishSearchableCommon
          formData={formData}
          onInputChange={handleInputChange}
          images={images}
          onImagesChange={handleImagesChange}
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
          onError={setError}
          imageDescription={config.imageDescription}
          showCurrency={config.showCurrency}
          isMinimalMode={config.isMinimalMode}
          fieldConfig={fields.common}
        />
      );
    }
    
    // Custom section component
    if (components.sections[section.component]) {
      const CustomSection = components.sections[section.component];
      return (
        <CustomSection
          formData={formData}
          handleInputChange={handleInputChange}
          error={error}
          setError={setError}
          loading={loading}
          fieldConfig={section.fieldConfig}
          {...section.props}
        />
      );
    }
    
    return null;
  };

  // Get layout configuration
  const getLayoutConfig = () => {
    switch (ui.layout) {
      case 'two-column':
        return {
          left: { xs: 12, md: 8 },
          right: { xs: 12, md: 4 }
        };
      case 'single-column':
      default:
        return {
          full: { xs: 12 }
        };
    }
  };

  const layoutConfig = getLayoutConfig();

  // Handle loading state
  if (loading && config.showFullPageLoading) {
    return <LoadingState text={config.loadingText} />;
  }

  // Handle error state
  if (error && config.showFullPageError) {
    return <ErrorState message={error} onRetry={() => setError('')} />;
  }

  return (
    <PageLayout
      title={config.title}
      subtitle={config.subtitle}
      breadcrumbs={config.breadcrumbs}
      headerActions={config.showBackButton && (
        <PageHeaderButton onClick={navigateBack} />
      )}
      showPaper={ui.variant !== 'none'}
      paperProps={{
        elevation: ui.variant === 'elevation' ? ui.elevation : 0,
        variant: ui.variant
      }}
    >
      <form onSubmit={onSubmit} {...testIdProps('form', 'publish-searchable', 'container')}>
        <Grid container spacing={ui.spacing}>
          {/* Custom header component */}
          {components.header && (
            <Grid item xs={12}>
              {components.header({ formData, loading, error })}
            </Grid>
          )}
          
          {/* Success message */}
          {success && (
            <Grid item xs={12}>
              <Box className={classes.successMessage}>
                <Typography variant="body1">
                  {config.successMessage}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {/* Error message */}
          {error && !config.showFullPageError && (
            <Grid item xs={12}>
              <Box className={classes.errorMessage}>
                <Typography variant="body1">{error}</Typography>
              </Box>
            </Grid>
          )}
          
          {/* Render sections based on layout */}
          {sections.map((section) => (
            <Grid 
              key={section.id} 
              item 
              {...(section.grid || layoutConfig.full)}
            >
              <Box className={styles.section}>
                {section.title && (
                  <SectionHeader
                    title={section.title}
                    subtitle={section.subtitle}
                    divider={section.divider}
                  />
                )}
                {renderSection(section)}
              </Box>
            </Grid>
          ))}
          
          {/* Action buttons */}
          <Grid item xs={12}>
            <PublishSearchableActions
              loading={loading}
              disabled={!handlers.isFormValid(formData)}
              submitText={config.submitText}
              loadingText={config.loadingText}
              additionalActions={config.additionalActions}
            />
          </Grid>
          
          {/* Custom footer component */}
          {components.footer && (
            <Grid item xs={12}>
              {components.footer({ formData, loading, error })}
            </Grid>
          )}
        </Grid>
      </form>
    </PageLayout>
  );
};

// Export configuration helpers
export const createPublishConfig = (overrides = {}) => ({
  searchableType: 'direct',
  title: 'Publish Searchable',
  subtitle: '',
  showBackButton: true,
  showCurrency: true,
  imageDescription: "Add up to 10 images",
  submitText: "Publish",
  loadingText: "Publishing...",
  successMessage: "Successfully published! Redirecting...",
  breadcrumbs: [],
  ...overrides
});

export const createFieldConfig = (overrides = {}) => ({
  common: {
    title: { required: true, maxLength: 100 },
    description: { required: true, maxLength: 500 },
    tags: { required: true, maxTags: 10 },
    images: { maxImages: 10, required: false },
    price: { required: true, min: 0 },
    ...overrides.common
  },
  custom: overrides.custom || []
});

export const createSection = (id, title, component, options = {}) => ({
  id,
  title,
  component,
  subtitle: options.subtitle,
  divider: options.divider || false,
  grid: options.grid || { xs: 12 },
  fieldConfig: options.fieldConfig,
  props: options.props || {}
});

export default EnhancedBasePublishSearchable;