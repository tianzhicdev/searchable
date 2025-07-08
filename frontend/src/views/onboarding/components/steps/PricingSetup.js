import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Paper,
  Chip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useOnboarding } from '../../OnboardingProvider';

const useStyles = makeStyles((theme) => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  radioGroup: {
    marginTop: theme.spacing(1),
  },
  priceInput: {
    marginTop: theme.spacing(2),
  },
  continueButton: {
    marginTop: theme.spacing(3),
  },
  infoBox: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.info.light,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(3),
  },
  pricingOption: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  selectedOption: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light,
  },
  optionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
  },
  chip: {
    marginLeft: theme.spacing(1),
  },
}));

const PricingSetup = ({ stepConfig }) => {
  const classes = useStyles();
  const { answers, handleNext } = useOnboarding();
  const previousAnswers = answers['5'] || {};
  
  const [pricingModel, setPricingModel] = useState(previousAnswers.pricingModel || 'fixed');
  const [defaultPrice, setDefaultPrice] = useState(previousAnswers.defaultPrice || '');
  const [minPrice, setMinPrice] = useState(previousAnswers.minPrice || '');
  const [currency] = useState(stepConfig.validation?.currency?.default || 'usd');
  const [errors, setErrors] = useState({});

  const pricingModels = [
    {
      id: 'fixed',
      title: 'Fixed Pricing',
      description: 'Set a single price for your products',
      recommended: true,
    },
    {
      id: 'pwyw',
      title: 'Pay What You Want',
      description: 'Let customers choose how much to pay (with optional minimum)',
      recommended: false,
    },
    {
      id: 'free',
      title: 'Free',
      description: 'Offer your content for free (you can accept tips)',
      recommended: false,
    },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (pricingModel === 'fixed' && !defaultPrice) {
      newErrors.defaultPrice = 'Please set a price for your products';
    } else if (pricingModel === 'fixed' && parseFloat(defaultPrice) < 0.99) {
      newErrors.defaultPrice = 'Minimum price is $0.99';
    }

    if (pricingModel === 'pwyw' && minPrice && parseFloat(minPrice) < 0) {
      newErrors.minPrice = 'Minimum price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      handleNext({
        pricingModel,
        defaultPrice: pricingModel === 'fixed' ? defaultPrice : null,
        minPrice: pricingModel === 'pwyw' ? minPrice : null,
        currency,
      });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <Box>
      <Box className={classes.infoBox}>
        <Typography variant="body2">
          💡 You can always change your pricing later or set different prices for individual products
        </Typography>
      </Box>

      <Box className={classes.section}>
        <FormLabel component="legend">Choose your pricing model</FormLabel>
        
        {pricingModels.map((model) => (
          <Paper
            key={model.id}
            className={`${classes.pricingOption} ${pricingModel === model.id ? classes.selectedOption : ''}`}
            onClick={() => setPricingModel(model.id)}
            elevation={0}
          >
            <Box display="flex" alignItems="center">
              <Typography variant="subtitle1" className={classes.optionTitle}>
                {model.title}
              </Typography>
              {model.recommended && (
                <Chip
                  label="Recommended"
                  color="primary"
                  size="small"
                  className={classes.chip}
                />
              )}
            </Box>
            <Typography variant="body2" color="textSecondary">
              {model.description}
            </Typography>
          </Paper>
        ))}
      </Box>

      {pricingModel === 'fixed' && (
        <TextField
          label="Default Product Price"
          type="number"
          value={defaultPrice}
          onChange={(e) => setDefaultPrice(e.target.value)}
          error={!!errors.defaultPrice}
          helperText={errors.defaultPrice || 'This will be the default price for new products'}
          fullWidth
          className={classes.priceInput}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            inputProps: { min: 0.99, step: 0.01 },
          }}
        />
      )}

      {pricingModel === 'pwyw' && (
        <TextField
          label="Minimum Price (Optional)"
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          error={!!errors.minPrice}
          helperText={errors.minPrice || 'Leave blank to allow any amount'}
          fullWidth
          className={classes.priceInput}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            inputProps: { min: 0, step: 0.01 },
          }}
        />
      )}

      {pricingModel === 'free' && (
        <Box className={classes.infoBox}>
          <Typography variant="body2">
            Your products will be free to download. You can still accept tips from generous supporters!
          </Typography>
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

export default PricingSetup;