import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { LocationOn } from '@material-ui/icons';
import EnhancedBasePublishSearchable, {
  createPublishConfig,
  createFieldConfig,
  createSection
} from '../EnhancedBasePublishSearchable';
import { FormField } from '../common';

// Custom section component for location-specific fields
const LocationSection = ({ formData, handleInputChange, error, fieldConfig }) => (
  <Box>
    <FormField
      name="address"
      label="Address"
      value={formData.address || ''}
      onChange={handleInputChange}
      error={error?.address}
      required={fieldConfig?.address?.required}
      multiline
      rows={2}
      placeholder="Enter the complete address"
      startAdornment={<LocationOn />}
    />
    
    <Box mt={2}>
      <FormField
        name="city"
        label="City"
        value={formData.city || ''}
        onChange={handleInputChange}
        error={error?.city}
        required={fieldConfig?.city?.required}
      />
    </Box>
    
    <Box mt={2}>
      <FormField
        name="postalCode"
        label="Postal Code"
        value={formData.postalCode || ''}
        onChange={handleInputChange}
        error={error?.postalCode}
        required={fieldConfig?.postalCode?.required}
      />
    </Box>
  </Box>
);

// Custom header component
const CustomHeader = ({ formData }) => (
  <Box mb={3} p={2} bgcolor="primary.light" borderRadius={1}>
    <Typography variant="body2" color="primary.contrastText">
      Publishing as: {formData.publisherName || 'Anonymous'}
    </Typography>
  </Box>
);

// Example usage of the enhanced base component
const PublishOfflineExample = () => {
  // Configuration for the publish page
  const config = createPublishConfig({
    searchableType: 'offline',
    title: 'Publish Offline Searchable',
    subtitle: 'Create a listing for an offline item or service',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'My Searchables', path: '/searchables' },
      { label: 'Publish Offline' }
    ],
    submitText: 'Publish Offline Item',
    additionalActions: [
      {
        label: 'Save as Draft',
        onClick: () => console.log('Save as draft'),
        variant: 'outlined'
      }
    ]
  });

  // Field configuration with validation rules
  const fields = createFieldConfig({
    common: {
      title: { required: true, maxLength: 80 },
      description: { required: true, maxLength: 1000 },
      price: { required: true, min: 0, max: 99999 }
    },
    custom: {
      address: { required: true },
      city: { required: true },
      postalCode: { required: false }
    }
  });

  // Section configuration
  const sections = [
    createSection('common', 'Basic Information', 'common', {
      divider: true
    }),
    createSection('location', 'Location Details', 'location', {
      subtitle: 'Where can this item be found?',
      fieldConfig: fields.custom,
      divider: true
    }),
    createSection('availability', 'Availability', 'availability', {
      grid: { xs: 12, md: 6 }
    }),
    createSection('contact', 'Contact Information', 'contact', {
      grid: { xs: 12, md: 6 }
    })
  ];

  // Handlers
  const handlers = {
    validation: (formData) => {
      const errors = {};
      
      // Custom validation logic
      if (formData.price && formData.price < 10) {
        errors.price = 'Minimum price is $10';
      }
      
      if (formData.address && formData.address.length < 10) {
        errors.address = 'Please provide a complete address';
      }
      
      return errors;
    },
    
    getPayload: (formData) => ({
      // Transform data for API
      location: {
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode
      },
      availability: formData.availability,
      contact_method: formData.contactMethod
    }),
    
    onSuccess: (response) => {
      console.log('Published successfully:', response);
      // Custom success handling
    },
    
    isFormValid: (formData) => {
      // Additional form validation
      return !!(
        formData.title &&
        formData.description &&
        formData.price &&
        formData.address &&
        formData.city
      );
    }
  };

  // Custom components
  const components = {
    header: CustomHeader,
    sections: {
      location: LocationSection,
      availability: AvailabilitySection,
      contact: ContactSection
    }
  };

  // UI configuration
  const ui = {
    layout: 'two-column',
    spacing: 3,
    variant: 'outlined'
  };

  return (
    <EnhancedBasePublishSearchable
      config={config}
      fields={fields}
      sections={sections}
      handlers={handlers}
      components={components}
      ui={ui}
      initialData={{
        publisherName: 'John Doe',
        contactMethod: 'email'
      }}
    />
  );
};

// Additional custom sections (simplified for example)
const AvailabilitySection = ({ formData, handleInputChange }) => (
  <FormField
    name="availability"
    label="Availability"
    value={formData.availability || ''}
    onChange={handleInputChange}
    multiline
    rows={3}
    placeholder="When is this item available?"
  />
);

const ContactSection = ({ formData, handleInputChange }) => (
  <FormField
    name="contactMethod"
    label="Preferred Contact Method"
    value={formData.contactMethod || ''}
    onChange={handleInputChange}
    select
    SelectProps={{
      native: true
    }}
  >
    <option value="email">Email</option>
    <option value="phone">Phone</option>
    <option value="message">In-app Message</option>
  </FormField>
);

export default PublishOfflineExample;