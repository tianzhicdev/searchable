import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import config from '../config';
import { currentThemeName } from '../themes/themeLoader';

const ThemeDebug = () => {
  const theme = useTheme();
  
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }
  
  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        backgroundColor: theme.palette.background.paper,
        padding: '8px 12px',
        borderRadius: 4,
        border: `1px solid ${theme.palette.primary.main}`,
        zIndex: 9999,
        fontSize: '12px',
        opacity: 0.9
      }}
    >
      <Typography variant="caption" style={{ color: theme.palette.primary.main }}>
        Theme: {currentThemeName} | Mode: {theme.palette.mode}
      </Typography>
    </Box>
  );
};

export default ThemeDebug;