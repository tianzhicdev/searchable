import React from 'react';
import { Typography, Box, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { AttachMoney as MoneyIcon } from '@material-ui/icons';
import useComponentStyles from '../../themes/componentStyles';
import { spacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  priceContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing(0.5)
  },
  priceText: {
    fontWeight: 600,
    color: theme.palette.primary.main
  },
  currency: {
    fontSize: '0.85em',
    opacity: 0.8
  },
  originalPrice: {
    textDecoration: 'line-through',
    opacity: 0.6,
    marginRight: spacing(1)
  },
  discount: {
    color: theme.palette.success.main,
    fontWeight: 600,
    marginLeft: spacing(1)
  },
  free: {
    color: theme.palette.success.main,
    fontWeight: 600
  },
  icon: {
    fontSize: '1.2em'
  }
}));

const PriceDisplay = ({
  amount,
  currency = 'USDT',
  showIcon = false,
  variant = 'body1',
  className,
  originalAmount,
  showFree = true,
  freeText = 'Free',
  decimals = 2,
  compact = false,
  tooltip,
  color = 'primary'
}) => {
  const classes = useStyles();
  const componentClasses = useComponentStyles();

  const formatPrice = (value) => {
    if (value === 0 || value === '0') {
      return showFree ? freeText : '0.00';
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.00';
    
    if (compact && numValue >= 1000) {
      if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(1)}M`;
      }
      return `${(numValue / 1000).toFixed(1)}K`;
    }
    
    return numValue.toFixed(decimals);
  };

  const calculateDiscount = () => {
    if (!originalAmount || originalAmount <= amount) return null;
    const discountPercent = ((originalAmount - amount) / originalAmount * 100).toFixed(0);
    return `-${discountPercent}%`;
  };

  const renderPrice = () => {
    const formattedPrice = formatPrice(amount);
    const isFree = amount === 0 || amount === '0';

    return (
      <Box className={`${classes.priceContainer} ${className || ''}`}>
        {showIcon && <MoneyIcon className={classes.icon} />}
        
        {originalAmount && originalAmount > amount && (
          <Typography
            variant={variant}
            component="span"
            className={classes.originalPrice}
          >
            {formatPrice(originalAmount)} {currency}
          </Typography>
        )}

        <Typography
          variant={variant}
          component="span"
          className={isFree ? classes.free : classes.priceText}
          style={{ color: color !== 'primary' ? color : undefined }}
        >
          {formattedPrice}
          {!isFree && (
            <span className={classes.currency}> {currency}</span>
          )}
        </Typography>

        {calculateDiscount() && (
          <Typography
            variant="body2"
            component="span"
            className={classes.discount}
          >
            {calculateDiscount()}
          </Typography>
        )}
      </Box>
    );
  };

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="top">
        {renderPrice()}
      </Tooltip>
    );
  }

  return renderPrice();
};

export default PriceDisplay;