import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import useComponentStyles from '../../themes/componentStyles';
import { 
  Grid, Typography, Button, Paper, Box, TextField, InputAdornment, Switch, FormControlLabel
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Alert from '@material-ui/lab/Alert';
import backend from '../utilities/Backend';
import PublishSearchableCommon from '../../components/PublishSearchableCommon';
import PublishSearchableActions from '../../components/PublishSearchableActions';

const PublishDirectSearchable = () => {
  console.log("PublishDirectSearchable component is being rendered");
  const classes = useComponentStyles();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    currency: 'usd'
  });
  
  // State for default amount and price setting
  const [hasDefaultAmount, setHasDefaultAmount] = useState(false);
  const [defaultAmount, setDefaultAmount] = useState(9.99);
  
  // State for preview images
  const [images, setImages] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle preview image changes from ImageUploader component
  const handleImagesChange = (newImages) => {
    // Extract URIs from the image data objects
    const imageUris = newImages.map(img => img.uri);
    setImages(imageUris);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Create searchable data following the Terminal/Searchable paradigm
      const searchableData = {
        payloads: {
          "public": {
            "title": formData.title,
            "description": formData.description,
            "currency": formData.currency,
            "type": "direct", // Mark this as direct type
            "images": images, // Store image URIs instead of base64
            "defaultAmount": hasDefaultAmount ? defaultAmount : null,
            "visibility": {
              "udf": "always_true",
              "data": {}
            }
          }
        }
      };

      // Send the request with JSON data
      const response = await backend.post(
        'v1/searchable/create',
        searchableData
      );

      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        currency: 'usd'
      });
      setImages([]);
      setHasDefaultAmount(false);
      setDefaultAmount(9.99);
      
      // Redirect to the searchable details page after a short delay
      setTimeout(() => {
        history.push(`/direct-item/${response.data.searchable_id}`);
      }, 1500);
    } catch (err) {
      console.error('Error publishing direct searchable:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred while publishing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Back button */}
      <Grid item xs={12}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => history.push('/searchables')}
          className={classes.backButton}
        >
          Back to Searchables
        </Button>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Box className={classes.errorMessage}>
            <Typography variant="body1">{error}</Typography>
          </Box>
        </Grid>
      )}
      
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
          <form onSubmit={handleSubmit}>
            <Grid container spacing={1}>
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="h4" gutterBottom>
                  Publish Direct Payment Item
                </Typography>
                
                <Typography variant="body2" color="textSecondary" style={{ marginBottom: 24 }}>
                  Create an item where buyers can choose or enter their payment amount
                </Typography>
              </Grid>

              <PublishSearchableCommon
                formData={formData}
                onInputChange={handleInputChange}
                images={images}
                onImagesChange={handleImagesChange}
                onError={setError}
                imageDescription="Add up to 10 images"
              />

              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Default Amount (Optional)
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={hasDefaultAmount}
                      onChange={(e) => setHasDefaultAmount(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Set a default amount"
                />
                <Typography variant="caption" className={classes.formHelp}>
                  If enabled, buyers will see your suggested amount but can still choose to pay more or less
                </Typography>
                
                {hasDefaultAmount && (
                  <Box mt={2}>
                    <TextField
                      type="number"
                      value={defaultAmount}
                      onChange={(e) => setDefaultAmount(parseFloat(e.target.value) || 0)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      inputProps={{ min: 0.01, step: 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      helperText="This will be the default amount shown to buyers. They can choose to pay a different amount."
                      className={classes.textInput}
                    />
                  </Box>
                )}
              </Grid>

              <PublishSearchableActions
                loading={loading}
                onSubmit={handleSubmit}
                disabled={!formData.title || !formData.description}
              />
            </Grid>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PublishDirectSearchable;