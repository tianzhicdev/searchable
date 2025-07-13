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

const Landing3DMoving1 = () => {
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
        <GalaxyMoving3D config={movingGalaxyConfigs.moving1} />
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
            backgroundColor: 'rgba(0, 20, 40, 0.9)',
            borderRadius: 2,
            p: 4,
            backdrop: 'blur(15px)',
            border: '1px solid rgba(0, 170, 255, 0.4)',
            boxShadow: '0 0 30px rgba(0, 170, 255, 0.2)'
          }}
        >
          <Typography 
            variant={isMobile ? "h3" : "h1"} 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #00aaff, #ffffff, #88ddff)',
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
            Space Tunnel Flight
          </Typography>
          
          <Typography 
            variant={isMobile ? "h6" : "h4"} 
            component="h2" 
            gutterBottom
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 4
            }}
          >
            Journey through the cosmic highway
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
            Feel the exhilaration of flying through an endless tunnel of stars. 
            Experience the rush of interstellar travel as you navigate the cosmic pathways of the universe.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleExplore}
              sx={{
                background: 'linear-gradient(45deg, #00aaff, #ffffff)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #ffffff, #00aaff)',
                },
                color: '#000',
                fontWeight: 'bold',
                px: 4,
                py: 1.5
              }}
            >
              {isLoggedIn ? 'Enter Hyperspace' : 'Begin Flight'}
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
              Back to Station
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing3DMoving1;