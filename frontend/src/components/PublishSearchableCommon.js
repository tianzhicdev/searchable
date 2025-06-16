import React from 'react';
import { Grid, Typography, TextField } from '@material-ui/core';
import ImageUploader from './ImageUploader';
import useComponentStyles from '../themes/componentStyles';

const PublishSearchableCommon = ({
  formData,
  onInputChange,
  images,
  onImagesChange,
  onError,
  imageDescription = "Add up to 10 images to showcase your products",
  showCurrency = true
}) => {
  const classes = useComponentStyles();

  return (
    <>
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
        />
      </Grid>
      
      {showCurrency && (
        <Grid item xs={12} className={classes.formGroup}>
          <Typography variant="subtitle1" className={classes.formLabel}>
            Currency
          </Typography>
          <TextField
            fullWidth
            id="currency"
            name="currency"
            value="USD"
            variant="outlined"
            size="small"
            disabled
            className={classes.textInput}
          />
        </Grid>
      )}
      
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
        />
      </Grid>
    </>
  );
};

export default PublishSearchableCommon;