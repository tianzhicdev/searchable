import React from 'react';
import { useHistory } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  useTheme,
  useMediaQuery
} from '@material-ui/core';
import { useSelector } from 'react-redux';
import GalaxyMoving3D from '../../components/Galaxy3D/GalaxyMoving3D';
import { movingGalaxyConfigs } from '../../components/Galaxy3D/configs';

const Landing3DMoving4 = () => {
  const history = useHistory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const account = useSelector((state) => state.account);
  const isLoggedIn = account?.user?.id;

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
      {/* 3D Moving Galaxy Background */}
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
        <GalaxyMoving3D config={movingGalaxyConfigs.moving4} />
      </Box>

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
            backgroundColor: 'rgba(0, 8, 32, 0.95)',
            borderRadius: 2,
            p: 4,
            backdrop: 'blur(20px)',
            border: '1px solid rgba(0, 255, 255, 0.5)',
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)' },
              '50%': { boxShadow: '0 0 60px rgba(0, 255, 255, 0.5)' },
              '100%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)' }
            }
          }}
        >
          <Typography 
            variant={isMobile ? "h3" : "h1"} 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #ffffff, #00ffff, #aaffff)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient 2s ease infinite, hyperspace 0.5s ease infinite',
              '@keyframes gradient': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' }
              },
              '@keyframes hyperspace': {
                '0%': { textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' },
                '50%': { textShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.5)' },
                '100%': { textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }
              }
            }}
          >
            Hyperspace Jump
          </Typography>
          
          <Typography 
            variant={isMobile ? "h6" : "h4"} 
            component="h2" 
            gutterBottom
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 4,
              animation: 'flicker 1s ease infinite',
              '@keyframes flicker': {
                '0%': { opacity: 0.9 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.9 }
              }
            }}
          >
            Faster than light velocity achieved
          </Typography>

          <Typography 
            variant="body1" 
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 4,
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Experience the ultimate rush of faster-than-light travel. 
            Watch as reality stretches and stars become streaks of light during your hyperspace jump to distant galaxies.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleExplore}
              sx={{
                background: 'linear-gradient(45deg, #ffffff, #00ffff)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #00ffff, #ffffff)',
                },
                color: '#000',
                fontWeight: 'bold',
                px: 4,
                py: 1.5,
                animation: 'glow 2s ease infinite',
                '@keyframes glow': {
                  '0%': { boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)' },
                  '50%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.3)' },
                  '100%': { boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }
                }
              }}
            >
              {isLoggedIn ? 'Engage Hyperdrive' : 'Initialize Jump'}
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
              Abort Jump
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing3DMoving4;