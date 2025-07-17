import React from 'react';
import { Grid, Typography, TextField } from '@material-ui/core';
import ImageUploader from './ImageUploader';
import TagSelector from './Tags/TagSelector';
import useComponentStyles from '../themes/componentStyles';

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

  return (
    <>
      <Grid item xs={12} className={classes.formGroup}>
        <Typography variant="subtitle1" className={classes.formLabel}>
          Title *
        </Typography>
        <TextField
          fullWidth
          id="publish-input-title"
          data-testid="publish-input-title"
          name="title"
          value={formData.title}
          onChange={onInputChange}
          variant="outlined"
          size="small"
          required
          className={classes.textInput}
        />
      </Grid>
      
      <Grid item xs={12} className={classes.formGroup}>
        <Typography variant="subtitle1" className={classes.formLabel}>
          Description
        </Typography>
        <TextField
          fullWidth
          id="publish-input-description"
          data-testid="publish-input-description"
          name="description"
          value={formData.description}
          onChange={onInputChange}
          variant="outlined"
          multiline
          rows={4}
          className={classes.textInput}
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
      )}
    </>
  );
};

export default PublishSearchableCommon;