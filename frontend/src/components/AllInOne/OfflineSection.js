import React from 'react';
import { 
  Paper, Box, Typography, IconButton, TextField
} from '@material-ui/core';
import {
  Storefront, Add as AddIcon, Remove as RemoveIcon
} from '@material-ui/icons';
import { formatCurrency } from '../../utils/searchableUtils';
import { testIdProps } from '../../utils/testIds';

const OfflineSection = ({
  components,
  selectedOfflineItems,
  handleItemSelection,
  incrementCount,
  decrementCount,
  theme,
  classes
}) => {
  if (!components.offline?.enabled) return null;

  return (
    <Paper 
      elevation={1} 
      style={{ marginBottom: 16, padding: 16, backgroundColor: theme.palette.background.paper }}
      {...testIdProps('section', 'allinone-offline', 'container')}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <Storefront style={{ marginRight: 8, color: theme.palette.primary.main }} />
        <Typography variant="h6" color="primary">
          Physical Items
        </Typography>
      </Box>
      {components.offline.items?.length > 0 ? (
        <Box>
          {components.offline.items.map((item, index) => {
            const currentCount = selectedOfflineItems[item.id] || 0;
            
            return (
              <Box 
                key={item.id} 
                className={classes.itemDivider}
                {...testIdProps('item', 'allinone-offline', item.id)}
              >
                <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 4 }}>
                  {item.name}
                </Typography>
                {item.description && (
                  <Typography variant="body2" style={{ marginBottom: 8 }}>
                    {item.description}
                  </Typography>
                )}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" className={classes.priceTag}>
                    {formatCurrency(item.price)}
                  </Typography>
                  <Box className={classes.quantityControls}>
                    <IconButton
                      onClick={() => decrementCount(item.id)}
                      disabled={currentCount === 0}
                      {...testIdProps('button', 'decrement', item.id)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <TextField
                      type="number"
                      value={currentCount}
                      onChange={(e) => handleItemSelection(item.id, parseInt(e.target.value) || 0)}
                      variant="outlined"
                      size="small"
                      className={classes.quantityInput}
                      inputProps={{ min: 0, style: { textAlign: 'center' } }}
                      {...testIdProps('input', 'quantity', item.id)}
                    />
                    <IconButton
                      onClick={() => incrementCount(item.id)}
                      {...testIdProps('button', 'increment', item.id)}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography className={classes.emptyState} {...testIdProps('text', 'allinone-offline', 'empty')}>
          No items available
        </Typography>
      )}
    </Paper>
  );
};

export default OfflineSection;