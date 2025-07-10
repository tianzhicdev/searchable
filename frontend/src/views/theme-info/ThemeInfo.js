import React from 'react';
import { Paper, Typography, Box, Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import config from '../../config';
import { currentThemeName, currentThemePreset } from '../../themes/themeLoader';
import { themePresets } from '../../themes/presets';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
    maxWidth: 800,
    margin: '0 auto',
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 8,
    display: 'inline-block',
    marginRight: theme.spacing(2),
    border: '2px solid',
    borderColor: theme.palette.divider,
  },
  section: {
    marginBottom: theme.spacing(4),
  }
}));

const ThemeInfo = () => {
  const classes = useStyles();

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Current Theme Information
      </Typography>
      
      <Paper className={classes.root}>
        <Box className={classes.section}>
          <Typography variant="h6" gutterBottom>
            Active Theme
          </Typography>
          <Chip 
            label={currentThemeName} 
            color="primary" 
            style={{ fontSize: '1.2rem', padding: '20px' }}
          />
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
            {currentThemePreset.description}
          </Typography>
        </Box>

        <Box className={classes.section}>
          <Typography variant="h6" gutterBottom>
            Theme Colors
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {Object.entries(currentThemePreset.colors).map(([name, color]) => (
              <Box key={name} textAlign="center">
                <div 
                  className={classes.colorSwatch} 
                  style={{ backgroundColor: color }}
                />
                <Typography variant="caption">
                  {name}
                </Typography>
                <Typography variant="caption" display="block" color="textSecondary">
                  {color}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box className={classes.section}>
          <Typography variant="h6" gutterBottom>
            Environment Variable
          </Typography>
          <Typography variant="body1" component="pre" style={{ 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            padding: '12px',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            REACT_APP_THEME={config.APP_THEME || 'neonTokyo (default)'}
          </Typography>
        </Box>

        <Box className={classes.section}>
          <Typography variant="h6" gutterBottom>
            How to Change Theme
          </Typography>
          <Typography variant="body2" paragraph>
            1. Stop the development server (Ctrl+C)
          </Typography>
          <Typography variant="body2" paragraph>
            2. Run with a different theme:
          </Typography>
          <Typography variant="body2" component="pre" style={{ 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            padding: '12px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}>
{`# Examples:
REACT_APP_THEME=matrix npm run start:mock
REACT_APP_THEME=cyberpunk npm run start:mock
REACT_APP_THEME=vaporwave npm run start:mock
REACT_APP_THEME=synthwave npm run start:mock
REACT_APP_THEME=hacker npm run start:mock`}
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            All Available Themes ({Object.keys(themePresets).length})
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
            {Object.entries(themePresets).map(([key, preset]) => (
              <Chip 
                key={key}
                label={key} 
                size="small"
                style={{ 
                  backgroundColor: preset.colors.primary,
                  color: preset.text.inverse,
                  fontWeight: key === currentThemeName ? 'bold' : 'normal',
                  border: key === currentThemeName ? '2px solid' : 'none',
                  borderColor: preset.colors.secondary
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" display="block" style={{ marginTop: 16 }}>
            Theme Categories: Cartoon (3), Light (3), Elegant (3), Nature (3), Retro (3), Fantasy (3), Minimal (3), Seasonal (3), Original (10)
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ThemeInfo;