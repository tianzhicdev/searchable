import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery
} from '@material-ui/core';
import { ExpandMore, ExpandLess, Refresh, Save } from '@material-ui/icons';
import { useSelector } from 'react-redux';
import Galaxy3D from '../../components/Galaxy3D';
import { galaxyConfigs } from '../../components/Galaxy3D/configs';

const Landing3DDemo = () => {
  const history = useHistory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const account = useSelector((state) => state.account);
  const isLoggedIn = account?.user?.id;

  // Control panel state
  const [controlsOpen, setControlsOpen] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('default');
  
  // Galaxy configuration state
  const [config, setConfig] = useState({ ...galaxyConfigs.default });

  const handleExplore = () => {
    if (isLoggedIn) {
      history.push('/search');
    } else {
      history.push('/onboarding-1');
    }
  };

  const handleBack = () => {
    history.push('/landing');
  };

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    setConfig({ ...galaxyConfigs[preset] });
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setConfig({ ...galaxyConfigs.default });
    setSelectedPreset('default');
  };

  const formatValue = (value, type) => {
    if (type === 'float') return value.toFixed(4);
    if (type === 'int') return Math.round(value);
    return value;
  };

  const controls = [
    { key: 'particlesCount', label: 'Particles', min: 1000, max: 15000, step: 500, type: 'int' },
    { key: 'galaxyRadius', label: 'Galaxy Size', min: 3, max: 20, step: 0.5, type: 'float' },
    { key: 'rotationSpeed', label: 'Rotation Speed', min: 0, max: 0.01, step: 0.0001, type: 'float' },
    { key: 'wobbleSpeed', label: 'Wobble Speed', min: 0, max: 0.005, step: 0.0001, type: 'float' },
    { key: 'wobbleIntensity', label: 'Wobble Intensity', min: 0, max: 0.5, step: 0.01, type: 'float' },
    { key: 'branches', label: 'Spiral Arms', min: 2, max: 8, step: 1, type: 'int' },
    { key: 'spinAngle', label: 'Spiral Tightness', min: 0.1, max: 1.0, step: 0.1, type: 'float' },
    { key: 'randomnessIntensity', label: 'Randomness', min: 0, max: 0.1, step: 0.001, type: 'float' },
    { key: 'randomRadiusIntensity', label: 'Radius Variation', min: 0, max: 1.0, step: 0.05, type: 'float' },
    { key: 'verticalSpread', label: 'Height Spread', min: 0.1, max: 1.0, step: 0.05, type: 'float' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 3D Galaxy Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}
      >
        <Galaxy3D config={config} />
      </Box>

      {/* Demo Controls Panel */}
      <Paper
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: isMobile ? 20 : 'auto',
          width: isMobile ? 'auto' : 350,
          zIndex: 3,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              Galaxy Controls
            </Typography>
            <Box>
              <IconButton size="small" onClick={handleReset} sx={{ color: 'white', mr: 1 }}>
                <Refresh />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => setControlsOpen(!controlsOpen)} 
                sx={{ color: 'white' }}
              >
                {controlsOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>

          <Collapse in={controlsOpen}>
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'white' }}>Preset</InputLabel>
                <Select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  sx={{ 
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '.MuiSvgIcon-root': { color: 'white' }
                  }}
                >
                  <MenuItem value="default">Original Galaxy</MenuItem>
                  <MenuItem value="variant1">Red Spiral Nebula</MenuItem>
                  <MenuItem value="variant2">Cosmic Web</MenuItem>
                  <MenuItem value="variant3">Purple Void</MenuItem>
                  <MenuItem value="variant4">Golden Storm</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Grid container spacing={2}>
              {controls.map((control) => (
                <Grid item xs={12} key={control.key}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {control.label}: {formatValue(config[control.key], control.type)}
                  </Typography>
                  <Slider
                    value={config[control.key]}
                    onChange={(e, value) => handleConfigChange(control.key, value)}
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    sx={{
                      color: '#ffaa00',
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#ffaa00',
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: '#ffaa00',
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: 'rgba(255, 170, 0, 0.3)',
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, display: 'block' }}>
                Colors
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <input
                    type="color"
                    value={config.innerColor}
                    onChange={(e) => handleConfigChange('innerColor', e.target.value)}
                    style={{ width: '100%', height: '30px', border: 'none', borderRadius: '4px' }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Inner Color
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <input
                    type="color"
                    value={config.outerColor}
                    onChange={(e) => handleConfigChange('outerColor', e.target.value)}
                    style={{ width: '100%', height: '30px', border: 'none', borderRadius: '4px' }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Outer Color
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Box>
      </Paper>

      {/* Content Overlay */}
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
          py: 4
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 2,
            p: 4,
            backdrop: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            ml: isMobile ? 0 : '400px', // Offset for controls panel
            mr: isMobile ? 0 : '50px'
          }}
        >
          <Typography 
            variant={isMobile ? "h4" : "h2"} 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #ffaa00, #4444ff, #ff6b6b)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient 3s ease infinite',
              '@keyframes gradient': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' }
              }
            }}
          >
            Galaxy Laboratory
          </Typography>
          
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            component="h2" 
            gutterBottom
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 4
            }}
          >
            Experiment with cosmic parameters
          </Typography>

          <Typography 
            variant="body2" 
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 4,
              maxWidth: '500px',
              mx: 'auto'
            }}
          >
            Use the controls on the left to customize your galaxy. Adjust colors, movement, 
            and structure to create your perfect cosmic scene.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleExplore}
              sx={{
                background: 'linear-gradient(45deg, #ffaa00, #ff6b6b)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #ff6b6b, #ffaa00)',
                },
                color: 'white',
                fontWeight: 'bold',
                px: 4,
                py: 1.5
              }}
            >
              {isLoggedIn ? 'Explore Universe' : 'Begin Journey'}
            </Button>
            
            <Button 
              variant="outlined" 
              size="large"
              onClick={handleBack}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                px: 4,
                py: 1.5
              }}
            >
              Back to Main
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing3DDemo;