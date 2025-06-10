import React from 'react';
import { Box, Typography, Chip } from '@material-ui/core';
import { isMockMode } from '../mocks/mockBackend';

const MockModeIndicator = () => {
  if (!isMockMode) return null;

  return (
    <Box 
      position="fixed" 
      top={8} 
      right={8} 
      zIndex={9999}
      style={{
        backgroundColor: '#ff9800',
        padding: '8px 16px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <Typography variant="body2" style={{ color: '#000', fontWeight: 'bold' }}>
        🔧 MOCK MODE
      </Typography>
    </Box>
  );
};

export default MockModeIndicator;