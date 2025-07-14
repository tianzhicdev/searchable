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
import Galaxy3D from '../../components/Galaxy3D';
import { galaxyConfigs } from '../../components/Galaxy3D/configs';

const Landing3D2 = () => {
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
        <Galaxy3D config={galaxyConfigs.variant2} />
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
            backgroundColor: 'rgba(0, 30, 50, 0.8)',
            borderRadius: 2,
            p: 4,
            backdrop: 'blur(10px)',
            border: '1px solid rgba(0, 255, 136, 0.3)'
          }}
        >
          <Typography 
            variant={isMobile ? "h3" : "h1"} 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #00ff88, #0088ff, #00dddd)',
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
            Cosmic Web
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
            Navigate the emerald pathways of the universe
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
            Traverse the intricate network that connects all celestial bodies. 
            Follow the green streams of energy that flow between worlds.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleExplore}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #0088ff)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #0088ff, #00ff88)',
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

export default Landing3D2;