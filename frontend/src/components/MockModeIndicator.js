import React from 'react';
import { Box, Typography, Chip } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { isMockMode } from '../mocks/mockBackend';

const MockModeIndicator = () => {
  const theme = useTheme();
  if (!isMockMode) return null;

  return (
    <Box 
      position="fixed" 
      top={8} 
      right={8} 
      zIndex={9999}
      style={{
        backgroundColor: theme.colors?.warning,
        padding: '8px 16px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <Typography variant="body2" style={{ color: theme.colors?.background, fontWeight: 'bold' }}>
        🔧 MOCK MODE
      </Typography>
    </Box>
  );
};

export default MockModeIndicator;