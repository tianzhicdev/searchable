import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, TextField, InputAdornment, FormControlLabel, Box,
  FormControl, FormLabel, RadioGroup, Radio, Button, IconButton
} from '@material-ui/core';
import { useLocation } from 'react-router-dom';
import { Delete } from '@material-ui/icons';
import BasePublishSearchable from '../../components/BasePublishSearchable';

const PublishDirectSearchable = () => {
  console.log("PublishDirectSearchable component is being rendered");
  const location = useLocation();
  
  // Check if we're in edit mode
  const editMode = location.state?.editMode || false;
  const editData = location.state?.editData || null;
  
  // State for pricing mode and amounts
  const [pricingMode, setPricingMode] = useState('flexible'); // 'fixed', 'preset', 'flexible'
  const [fixedAmount, setFixedAmount] = useState(9.99);
  const [presetAmounts, setPresetAmounts] = useState([4.99, 9.99, 14.99]); // Up to 3 preset amounts

  // Initialize state if in edit mode
  useEffect(() => {
    if (editMode && editData) {
      console.log('Initializing direct payment for edit mode:', editData);
      const publicPayload = editData.payloads?.public || {};
      
      // Check for new pricing mode structure
      if (publicPayload.pricingMode) {
        setPricingMode(publicPayload.pricingMode);
        
        if (publicPayload.pricingMode === 'fixed' && publicPayload.fixedAmount) {
          setFixedAmount(publicPayload.fixedAmount);
        } else if (publicPayload.pricingMode === 'preset' && publicPayload.presetAmounts) {
          setPresetAmounts(publicPayload.presetAmounts);
        }
      } else {
        // Backward compatibility: if old defaultAmount exists, treat as fixed price
        const defaultAmountValue = publicPayload.defaultAmount ?? editData.defaultAmount;
        if (defaultAmountValue !== null && defaultAmountValue !== undefined) {
          setPricingMode('fixed');
          setFixedAmount(defaultAmountValue);
        }
      }
    }
  }, [editMode, editData]);

  // Create type-specific payload for direct searchable
  const getTypeSpecificPayload = (formData) => {
    if (pricingMode === 'fixed') {
      return {
        pricingMode: 'fixed',
        fixedAmount: fixedAmount,
        // Backward compatibility
        defaultAmount: fixedAmount
      };
    } else if (pricingMode === 'preset') {
      // Filter out empty values and ensure we have 1-3 valid amounts
      const validAmounts = presetAmounts.filter(amount => amount && amount > 0);
      return {
        pricingMode: 'preset',
        presetAmounts: validAmounts,
        // Backward compatibility - use first preset as default
        defaultAmount: validAmounts.length > 0 ? validAmounts[0] : null
      };
    } else {
      return {
        pricingMode: 'flexible',
        // No default amount for flexible mode
        defaultAmount: null
      };
    }
  };

  // Custom redirect path for direct searchables
  const customRedirectPath = (response) => `/direct-item/${response.data.searchable_id}`;

  // Form validation
  const isFormValid = () => {
    if (pricingMode === 'fixed') {
      return fixedAmount && fixedAmount > 0;
    } else if (pricingMode === 'preset') {
      const validAmounts = presetAmounts.filter(amount => amount && amount > 0);
      return validAmounts.length >= 1 && validAmounts.length <= 3;
    }
    return true; // Flexible mode doesn't need validation
  };

  // Helper functions for preset amounts
  const addPresetAmount = () => {
    if (presetAmounts.length < 3) {
      setPresetAmounts([...presetAmounts, 0]);
    }
  };

  const updatePresetAmount = (index, value) => {
    const newAmounts = [...presetAmounts];
    newAmounts[index] = parseFloat(value) || 0;
    setPresetAmounts(newAmounts);
  };

  const removePresetAmount = (index) => {
    if (presetAmounts.length > 1) {
      const newAmounts = presetAmounts.filter((_, i) => i !== index);
      setPresetAmounts(newAmounts);
    }
  };

  // Render type-specific content for direct payment
  const renderDirectPaymentOptions = ({ formData, handleInputChange }) => (
    <Grid item xs={12}>
      <Typography variant="subtitle1" gutterBottom>
        Donation Options
      </Typography>
      <Typography variant="caption" color="textSecondary" paragraph>
        Choose how supporters can donate
      </Typography>
      
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend">Pricing Mode</FormLabel>
        <RadioGroup 
          id="publish-direct-radio-pricing-mode"
          data-testid="publish-direct-radio-pricing-mode"
          value={pricingMode} 
          onChange={(e) => setPricingMode(e.target.value)}
        >
          <FormControlLabel 
            value="fixed" 
            control={<Radio id="publish-direct-radio-fixed" data-testid="publish-direct-radio-fixed" color="primary" />} 
            label="Fixed Amount - Supporters donate exactly this amount" 
          />
          <FormControlLabel 
            value="preset" 
            control={<Radio id="publish-direct-radio-preset" data-testid="publish-direct-radio-preset" color="primary" />} 
            label="Preset Options - Supporters choose from up to 3 preset amounts" 
          />
          <FormControlLabel 
            value="flexible" 
            control={<Radio id="publish-direct-radio-flexible" data-testid="publish-direct-radio-flexible" color="primary" />} 
            label="Flexible - Supporters can choose any amount" 
          />
        </RadioGroup>
      </FormControl>

      {pricingMode === 'fixed' && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Fixed Amount
          </Typography>
          <TextField
            id="publish-direct-input-fixed-amount"
            data-testid="publish-direct-input-fixed-amount"
            type="number"
            value={fixedAmount}
            onChange={(e) => setFixedAmount(parseFloat(e.target.value) || 0)}
            fullWidth
            variant="outlined"
            size="small"
            inputProps={{ min: 0.01, step: 0.01 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText="Supporters will donate exactly this amount and cannot change it."
          />
        </Box>
      )}

      {pricingMode === 'preset' && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Preset Amount Options (1-3 options)
          </Typography>
          {presetAmounts.map((amount, index) => (
            <Box key={index} display="flex" alignItems="center" mb={1}>
              <TextField
                id={`publish-direct-input-preset-${index}`}
                data-testid={`publish-direct-input-preset-${index}`}
                type="number"
                value={amount}
                onChange={(e) => updatePresetAmount(index, e.target.value)}
                variant="outlined"
                size="small"
                inputProps={{ min: 0.01, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                style={{ flexGrow: 1, marginRight: 8 }}
              />
              {presetAmounts.length > 1 && (
                <IconButton 
                  id={`publish-direct-button-remove-preset-${index}`}
                  data-testid={`publish-direct-button-remove-preset-${index}`}
                  onClick={() => removePresetAmount(index)}
                  size="small"
                  color="secondary"
                >
                  <Delete />
                </IconButton>
              )}
            </Box>
          ))}
          {presetAmounts.length < 3 && (
            <Button 
              id="publish-direct-button-add-preset"
              data-testid="publish-direct-button-add-preset"
              onClick={addPresetAmount}
              variant="outlined" 
              size="small"
              style={{ marginTop: 8 }}
            >
              Add Option
            </Button>
          )}
          <Typography variant="caption" color="textSecondary" display="block" mt={1}>
            Supporters will choose from these preset amounts only.
          </Typography>
        </Box>
      )}

      {pricingMode === 'flexible' && (
        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            Supporters can enter any amount they want to donate. Default quick options ($4.99, $9.99, $14.99) will be shown.
          </Typography>
        </Box>
      )}
    </Grid>
  );

  return (
    <BasePublishSearchable
      searchableType="direct"
      title={editMode ? "Edit Donation Item" : "Publish Donation Item"}
      subtitle={editMode ? "Update your donation item details" : "Create an item where supporters can choose or enter their donation amount"}
      renderTypeSpecificContent={renderDirectPaymentOptions}
      getTypeSpecificPayload={getTypeSpecificPayload}
      customRedirectPath={customRedirectPath}
      isFormValid={isFormValid}
      submitText={editMode ? "Update" : "Publish"}
      loadingText={editMode ? "Updating..." : "Publishing..."}
    />
  );
};

export default PublishDirectSearchable;