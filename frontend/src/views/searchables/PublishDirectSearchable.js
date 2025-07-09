import React, { useState } from 'react';
import { 
  Grid, Typography, TextField, InputAdornment, Switch, FormControlLabel, Box
} from '@material-ui/core';
import BasePublishSearchable from '../../components/BasePublishSearchable';

const PublishDirectSearchable = () => {
  console.log("PublishDirectSearchable component is being rendered");
  
  // State for default amount and price setting
  const [hasDefaultAmount, setHasDefaultAmount] = useState(false);
  const [defaultAmount, setDefaultAmount] = useState(9.99);

  // Create type-specific payload for direct searchable
  const getTypeSpecificPayload = (formData) => ({
    defaultAmount: hasDefaultAmount ? defaultAmount : null
  });

  // Custom redirect path for direct searchables
  const customRedirectPath = (response) => `/direct-item/${response.data.searchable_id}`;

  // Form validation
  const isFormValid = () => {
    return true; // Basic validation handled by base component
  };

  // Render type-specific content for direct payment
  const renderDirectPaymentOptions = ({ formData, handleInputChange }) => (
    <Grid item xs={12}>
      <Typography variant="subtitle1">
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
      <Typography variant="caption">
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
          />
        </Box>
      )}
    </Grid>
  );

  return (
    <BasePublishSearchable
      searchableType="direct"
      title="Publish Direct Payment Item"
      subtitle="Create an item where buyers can choose or enter their payment amount"
      renderTypeSpecificContent={renderDirectPaymentOptions}
      getTypeSpecificPayload={getTypeSpecificPayload}
      customRedirectPath={customRedirectPath}
      isFormValid={isFormValid}
    />
  );
};

export default PublishDirectSearchable;