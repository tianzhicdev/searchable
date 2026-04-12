import React, { useState, useEffect } from 'react';
import { Grid, Typography, TextField, InputAdornment, CircularProgress } from '@material-ui/core';
import ImageUploader from './ImageUploader';
import TagSelector from './Tags/TagSelector';
import useComponentStyles from '../themes/componentStyles';
import { testIds } from '../utils/testIds';
import axios from 'axios';
import configData from '../config';

const PublishSearchableCommon = ({
  formData,
  onInputChange,
  images,
  onImagesChange,
  onError,
  imageDescription = "Add up to 10 images",
  selectedTags = [],
  onTagsChange,
  isMinimalMode = false,
}) => {
  const classes = useComponentStyles();
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainError, setSubdomainError] = useState('');

  // Check subdomain availability
  useEffect(() => {
    const checkSubdomain = async () => {
      const subdomain = formData.business_subdomain;

      if (!subdomain || subdomain.length < 3) {
        setSubdomainAvailable(null);
        setSubdomainError('');
        return;
      }

      setCheckingSubdomain(true);
      try {
        const response = await axios.get(
          `${configData.API_SERVER}v1/searchable-subdomain/check/${subdomain.toLowerCase()}`
        );
        setSubdomainAvailable(response.data.available && response.data.valid);
        if (!response.data.valid) {
          setSubdomainError(response.data.message);
        } else {
          setSubdomainError('');
        }
      } catch (error) {
        console.error('Error checking subdomain:', error);
        setSubdomainAvailable(false);
        setSubdomainError('Error checking subdomain availability');
      } finally {
        setCheckingSubdomain(false);
      }
    };

    const timer = setTimeout(() => {
      checkSubdomain();
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [formData.business_subdomain]);

  return (
    <div data-testid={testIds.form.container('publish-searchable')}>
      <Grid item xs={12} className={classes.formGroup}>
        <Typography variant="subtitle1" className={classes.formLabel}>
          Title *
        </Typography>
        <TextField
          fullWidth
          id="title"
          name="title"
          value={formData.title}
          onChange={onInputChange}
          variant="outlined"
          size="small"
          required
          className={classes.textInput}
          data-testid={testIds.input.field('publish', 'title')}
        />
      </Grid>
      
      <Grid item xs={12} className={classes.formGroup}>
        <Typography variant="subtitle1" className={classes.formLabel}>
          Description
        </Typography>
        <TextField
          fullWidth
          id="description"
          name="description"
          value={formData.description}
          onChange={onInputChange}
          variant="outlined"
          multiline
          rows={4}
          className={classes.textInput}
          data-testid={testIds.input.field('publish', 'description')}
        />
      </Grid>

      <Grid item xs={12} className={classes.formGroup}>
        <Typography variant="subtitle1" className={classes.formLabel}>
          Business Subdomain (Optional)
        </Typography>
        <TextField
          fullWidth
          id="business_subdomain"
          name="business_subdomain"
          value={formData.business_subdomain || ''}
          onChange={(e) => {
            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
            onInputChange({ target: { name: 'business_subdomain', value } });
          }}
          variant="outlined"
          size="small"
          placeholder="my-store"
          error={Boolean(subdomainError)}
          helperText={
            subdomainError ||
            (formData.business_subdomain?.length === 0 || !formData.business_subdomain
              ? `Choose a custom subdomain for this store (e.g., "my-store" → my-store.${configData.BRANDING_CONFIG.domain})`
              : formData.business_subdomain.length < 3
              ? `${3 - formData.business_subdomain.length} more characters needed (min 3)`
              : subdomainAvailable === true
              ? `✓ Available: ${formData.business_subdomain}.${configData.BRANDING_CONFIG.domain}`
              : subdomainAvailable === false
              ? "✗ Subdomain is already taken"
              : '')
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {checkingSubdomain && <CircularProgress size={20} />}
                {!checkingSubdomain && subdomainAvailable === true && (
                  <Typography variant="body2" style={{ color: '#4caf50' }}>✓</Typography>
                )}
                {!checkingSubdomain && subdomainAvailable === false && (
                  <Typography variant="body2" color="error">✗</Typography>
                )}
              </InputAdornment>
            )
          }}
          className={classes.textInput}
          data-testid={testIds.input.field('publish', 'business-subdomain')}
        />
      </Grid>

      {!isMinimalMode && (
        <>
          <Grid item xs={12} className={classes.formGroup}>
            <Typography variant="subtitle1" className={classes.formLabel}>
              Tags (Optional)
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 8 }}>
              Add up to 3 tags to help users find your content
            </Typography>
            <TagSelector
              tagType="searchable"
              selectedTags={selectedTags}
              onTagsChange={onTagsChange}
              maxTags={3}
              placeholder="Select tags..."
              data-testid={testIds.input.field('publish', 'tags')}
            />
          </Grid>
          
          <Grid item xs={12} className={classes.formGroup}>
            <ImageUploader
              images={images.map(uri => ({ uri, preview: uri }))}
              onImagesChange={onImagesChange}
              maxImages={10}
              title="Preview Images (Optional)"
              description={imageDescription}
              imageSize={100}
              onError={onError}
              data-testid={testIds.input.field('publish', 'images')}
            />
          </Grid>
        </>
      )}
    </div>
  );
};

export default PublishSearchableCommon;