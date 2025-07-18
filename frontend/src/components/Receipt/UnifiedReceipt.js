import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  Paper, CardContent, Typography, Divider, Box, Chip, IconButton, Collapse, Link
} from '@material-ui/core';
import { ExpandMore, ExpandLess } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import { navigateWithStack } from '../../utils/navigationUtils';

const useStyles = makeStyles((theme) => ({
  receiptPaper: {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1.5)
    }
  }
}));

const UnifiedReceipt = ({ 
  type, // 'purchase', 'sale', 'withdrawal', 'deposit', 'reward'
  data,
  formatCurrency,
  formatDate,
  children // For any additional custom content
}) => {
  const classes = useComponentStyles();
  const styles = useStyles();
  const history = useHistory();
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleSearchableClick = () => {
    if (data.searchable_id) {
      // Always use allinone-item route for backward compatibility
      navigateWithStack(history, `/allinone-item/${data.searchable_id}`);
    }
  };

  const getStatusChip = () => {
    if (!data.status) return null;
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'paid':
        case 'complete':
        case 'completed':
          return '#4caf50';
        case 'pending':
          return '#ff9800';
        case 'failed':
        case 'cancelled':
          return '#f44336';
        default:
          return 'inherit';
      }
    };

    return (
      <Typography 
        variant="caption"
        style={{
          backgroundColor: getStatusColor(data.status),
          color: '#fff',
          padding: '2px 8px',
          borderRadius: '4px',
          fontWeight: 'bold',
          marginRight: '12px'
        }}
      >
        {data.status.toUpperCase()}
      </Typography>
    );
  };

  const getTitle = () => {
    switch (type) {
      case 'purchase':
        return `Invoice #${data.id}`;
      case 'sale':
        return `Invoice #${data.id}`;
      case 'withdrawal':
        return `#${data.id}`;
      case 'deposit':
        return `#${data.id}`;
      case 'reward':
        return `Reward`;
      default:
        return `Transaction #${data.id}`;
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case 'purchase':
        return `Seller: ${data.other_party_username || 'Unknown'}`;
      case 'sale':
        return `Buyer: ${data.other_party_username || 'Unknown'}`;
      case 'withdrawal':
        return data.metadata?.address ? `To: ${data.metadata.address}` : '';
      case 'deposit':
        return data.metadata?.address ? `Address: ${data.metadata.address}` : '';
      case 'reward':
        return data.description || '';
      default:
        return '';
    }
  };

  const renderBreakdown = () => {
    switch (type) {
      case 'purchase':
      case 'sale':
        return renderInvoiceBreakdown();
      case 'withdrawal':
        return renderWithdrawalBreakdown();
      case 'deposit':
        return renderDepositBreakdown();
      case 'reward':
        return renderRewardBreakdown();
      default:
        return null;
    }
  };

  const renderInvoiceBreakdown = () => {
    const selections = data.metadata?.selections || [];
    const isBuyer = type === 'purchase';
    
    return (
      <Box>
        <Typography variant="subtitle2" className={classes.systemText}>
          Purchase Breakdown
        </Typography>
        
        {/* Items with prices */}
        {selections.length > 0 && (
          <Box mb={1}>
            {selections.map((selection, index) => (
              <Box key={selection.id || `selection-${index}`} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" className={`${classes.userText} ${classes.titleText}`} style={{ flex: 1, marginRight: '8px' }}>
                  {selection.name || `Item ${selection.id}`}
                  {selection.count && selection.count > 1 && (
                    <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>
                      x{selection.count}
                    </span>
                  )}
                </Typography>
                <Typography variant="body2" className={classes.userText}>
                  {formatCurrency((selection.price || 0) * (selection.count || 1), data.currency)}
                </Typography>
              </Box>
            ))}

            {/* Payment Fee for buyers */}
            {isBuyer && data.metadata?.stripe_fee > 0 && (
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" className={classes.systemText}>
                  Payment Fee (Stripe)
                </Typography>
                <Typography variant="body2" className={classes.systemText}>
                  {formatCurrency(data.metadata.stripe_fee, data.currency)}
                </Typography>
              </Box>
            )}

            {/* Buyer Paid */}
            {isBuyer && data.metadata?.stripe_fee > 0 && (
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                  Buyer Paid:
                </Typography>
                <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                  {formatCurrency(data.amount + (data.metadata?.stripe_fee || 0), data.currency)}
                </Typography>
              </Box>
            )}

            <Divider style={{ margin: '8px 0' }} />

            {/* Total Price */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                Total Price
              </Typography>
              <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                {formatCurrency(data.amount, data.currency)}
              </Typography>
            </Box>

            {/* Platform Fee */}
            {data.fee > 0 && (
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" className={classes.systemText}>
                  Platform Fee
                </Typography>
                <Typography variant="body2" className={classes.systemText}>
                  {formatCurrency(data.fee, data.currency)}
                </Typography>
              </Box>
            )}

            {/* Seller Receive */}
            <Box display="flex" justifyContent="space-between" alignItems="center" style={{ borderTop: '1px solid #eee', paddingTop: '4px', marginTop: '4px' }}>
              <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                Seller Receive:
              </Typography>
              <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
                {formatCurrency(data.amount - (data.fee || 0), data.currency)}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderWithdrawalBreakdown = () => (
    <Box>
      <Typography variant="subtitle2" className={classes.systemText}>
        Withdrawal Breakdown
      </Typography>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
        <Typography variant="body2" className={classes.userText}>
          Amount:
        </Typography>
        <Typography variant="body2" className={classes.userText}>
          {formatCurrency(data.amount, data.currency)}
        </Typography>
      </Box>
      
      {data.fee > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" className={classes.systemText}>
            Platform Fee (0.1%):
          </Typography>
          <Typography variant="body2" className={classes.systemText}>
            -{formatCurrency(data.fee, data.currency)}
          </Typography>
        </Box>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" style={{ borderTop: '1px solid #eee', paddingTop: '4px', marginTop: '4px' }}>
        <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
          Received Amount:
        </Typography>
        <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
          {formatCurrency(data.amount - (data.fee || 0), data.currency)}
        </Typography>
      </Box>
    </Box>
  );

  const renderDepositBreakdown = () => (
    <Box>
      <Typography variant="subtitle2" className={classes.systemText}>
        Deposit Details
      </Typography>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
        <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
          Amount Deposited:
        </Typography>
        <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
          {formatCurrency(data.amount, data.currency)}
        </Typography>
      </Box>
      
      {data.metadata?.tx_hash && (
        <Box mt={1}>
          <Typography variant="body2" className={classes.systemText}>
            Transaction Hash:
          </Typography>
          <Typography variant="body2" className={classes.userText} style={{ wordBreak: 'break-all' }}>
            {data.metadata.tx_hash}
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderRewardBreakdown = () => (
    <Box>
      <Typography variant="subtitle2" className={classes.systemText}>
        Reward Details
      </Typography>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
        <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
          Reward Amount:
        </Typography>
        <Typography variant="body2" className={classes.userText} style={{ fontWeight: 'bold' }}>
          {formatCurrency(data.amount, data.currency)}
        </Typography>
      </Box>
      
      {data.type && (
        <Typography variant="body2" className={classes.systemText} mt={1}>
          Type: {data.type.replace(/_/g, ' ').toUpperCase()}
        </Typography>
      )}
    </Box>
  );

  return (
    <Paper className={`${classes.invoiceCard} ${classes.minimalSpacing} ${styles.receiptPaper}`}>
      <CardContent className={classes.paddingSm}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" className={classes.marginSm}>
          <Box display="flex" alignItems="center" className={classes.marginXs}>
            {getStatusChip()}
            <Typography 
              variant="h6" 
              className={`${classes.invoiceTitle} ${classes.titleText}`}
              style={{ marginRight: '12px' }}
            >
              {getTitle()}
            </Typography>
            
            {(type === 'purchase' || type === 'sale') && (
              <Typography variant="body2" className={classes.staticText}>
                {type === 'purchase' ? 'Buyer' : 'Seller'}
              </Typography>
            )}
          </Box>
          
          <Box display="flex" alignItems="center" className={classes.marginXs}>
            <Typography variant="h6" className={classes.invoiceAmount}>
              {formatCurrency(data.amount, data.currency)}
            </Typography>
            <IconButton size="small" onClick={handleExpandClick} className={classes.iconButton}>
              {expanded ? <ExpandLess className={classes.iconColor} /> : <ExpandMore className={classes.iconColor} />}
            </IconButton>
          </Box>
        </Box>

        {/* Subtitle and Date */}
        <Box display="flex" justifyContent="space-between" alignItems="center" className={classes.marginSm}>
          <Box style={{ flex: 1, marginRight: '8px' }}>
            <Typography 
              variant="body2" 
              className={`${classes.systemText} ${type === 'withdrawal' || type === 'deposit' ? classes.addressText : ''}`}
            >
              {getSubtitle()}
            </Typography>
            {/* Searchable title for purchases and sales */}
            {(type === 'purchase' || type === 'sale') && data.searchable_title && (
              <Link 
                component="button" 
                variant="body2" 
                onClick={handleSearchableClick}
                className={classes.userText}
                style={{ 
                  textAlign: 'left',
                  display: 'block',
                  marginTop: '4px'
                }}
              >
                {data.searchable_title}
              </Link>
            )}
          </Box>
          <Typography variant="body2" className={classes.systemText}>
            {formatDate(data.created_at || data.payment_date)}
          </Typography>
        </Box>

        {/* Expandable Details */}
        <Collapse in={expanded}>
          <Divider className={classes.divider} />
          
          <Box className={classes.paddingSm}>
            {renderBreakdown()}
            
            {/* Additional metadata */}
            <Box mt={2}>
              {data.type && (
                <Typography variant="body2" className={classes.systemText}>
                  Type: {data.type.toUpperCase()}
                </Typography>
              )}
              {/* Only show Created date if it's different from payment_date */}
              {type !== 'deposit' && (
                <Typography variant="body2" className={classes.systemText}>
                  Created: {formatDate(data.created_at)}
                </Typography>
              )}
            </Box>
            
            {/* Custom content */}
            {children}
          </Box>
        </Collapse>
      </CardContent>
    </Paper>
  );
};

export default UnifiedReceipt;