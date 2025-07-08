import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useOnboarding } from '../../OnboardingProvider';

const useStyles = makeStyles((theme) => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },
  field: {
    marginBottom: theme.spacing(2),
  },
  helperText: {
    marginTop: theme.spacing(1),
    fontSize: '0.75rem',
  },
  continueButton: {
    marginTop: theme.spacing(3),
  },
  preview: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  previewTitle: {
    marginBottom: theme.spacing(1),
  },
}));

const StoreSetup = ({ stepConfig }) => {
  const classes = useStyles();
  const { answers, handleNext } = useOnboarding();
  const [storeName, setStoreName] = useState(answers['4']?.storeName || '');
  const [storeSlug, setStoreSlug] = useState(answers['4']?.storeSlug || '');
  const [storeDescription, setStoreDescription] = useState(answers['4']?.storeDescription || '');
  const [errors, setErrors] = useState({});

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleStoreNameChange = (event) => {
    const name = event.target.value;
    setStoreName(name);
    
    // Auto-generate slug if user hasn't manually edited it
    if (!storeSlug || storeSlug === generateSlug(storeName)) {
      setStoreSlug(generateSlug(name));
    }
    
    // Clear error
    if (errors.storeName) {
      setErrors(prev => ({ ...prev, storeName: null }));
    }
  };

  const handleSlugChange = (event) => {
    const slug = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setStoreSlug(slug);
    
    if (errors.storeSlug) {
      setErrors(prev => ({ ...prev, storeSlug: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const validation = stepConfig.validation;

    // Validate store name
    if (validation?.storeName?.required && !storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    } else if (validation?.storeName?.minLength && storeName.length < validation.storeName.minLength) {
      newErrors.storeName = `Store name must be at least ${validation.storeName.minLength} characters`;
    } else if (validation?.storeName?.maxLength && storeName.length > validation.storeName.maxLength) {
      newErrors.storeName = `Store name must be less than ${validation.storeName.maxLength} characters`;
    }

    // Validate slug
    if (!storeSlug.trim()) {
      newErrors.storeSlug = 'Store URL is required';
    } else if (storeSlug.length < 3) {
      newErrors.storeSlug = 'Store URL must be at least 3 characters';
    }

    // Validate description
    if (validation?.storeDescription?.maxLength && storeDescription.length > validation.storeDescription.maxLength) {
      newErrors.storeDescription = `Description must be less than ${validation.storeDescription.maxLength} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      handleNext({
        storeName,
        storeSlug,
        storeDescription,
      });
    }
  };

  return (
    <Box>
      <Box className={classes.form}>
        <TextField
          label="Store Name"
          value={storeName}
          onChange={handleStoreNameChange}
          error={!!errors.storeName}
          helperText={errors.storeName || 'This is the name customers will see'}
          fullWidth
          required
          className={classes.field}
        />

        <TextField
          label="Store URL"
          value={storeSlug}
          onChange={handleSlugChange}
          error={!!errors.storeSlug}
          helperText={errors.storeSlug || 'This will be your unique store address'}
          fullWidth
          required
          className={classes.field}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                searchable.com/store/
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Store Description"
          value={storeDescription}
          onChange={(e) => setStoreDescription(e.target.value)}
          error={!!errors.storeDescription}
          helperText={errors.storeDescription || 'Tell customers what you sell (optional)'}
          fullWidth
          multiline
          rows={4}
          className={classes.field}
        />
      </Box>

      {storeName && (
        <Box className={classes.preview}>
          <Typography variant="subtitle2" className={classes.previewTitle}>
            Preview
          </Typography>
          <Typography variant="h6">{storeName}</Typography>
          <Typography variant="body2" color="textSecondary">
            searchable.com/store/{storeSlug}
          </Typography>
          {storeDescription && (
            <Typography variant="body2" style={{ marginTop: 8 }}>
              {storeDescription}
            </Typography>
          )}
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        className={classes.continueButton}
        onClick={handleContinue}
      >
        {stepConfig.nextButton?.text || 'Continue'}
      </Button>
    </Box>
  );
};

export default StoreSetup;