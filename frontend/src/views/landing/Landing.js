import React from 'react';
import { useHistory } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Chip,
  useTheme,
  useMediaQuery,
  Link
} from '@material-ui/core';
import { useSelector } from 'react-redux';
import config from '../../config';
import Logo from '../../ui-component/Logo';
import backgroundImage from '../../assets/images/bg.png';
import GalaxyMoving3D from '../../components/Galaxy3D/GalaxyMoving3D';
import { movingGalaxyConfigs } from '../../components/Galaxy3D/configs';

import abitchaoticLogo from '../../assets/images/abitchaotic.gif';

const Landing = () => {
  const history = useHistory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const account = useSelector((state) => state.account);
  const isLoggedIn = account?.user?.id;
  
  const bulletPoints = [
  ];

  const handleJoinNow = () => {
    history.push('/onboarding-1');
  };

  const handleImBack = () => {
    if (isLoggedIn) {
      history.push('/search');
    } else {
      history.push('/login');
    }
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

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            py: 4
          }}
        >
          {/* Title */}
            <Typography 
            variant={isMobile ? 'h3' : 'h2'} 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold', 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              mb: 4, 
              fontSize: isMobile ? '2.5rem' : '3.5rem',
              color: theme.palette.primary.main,
            }}
          >
            {config.BRANDING_CONFIG.landingIntro}
          </Typography>
                      <Typography 
            variant={isMobile ? 'h3' : 'h2'} 
            component="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold', 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              mb: 4, 
              fontSize: isMobile ? '1.5rem' : '2.5rem',
              // color: 'white',
              // textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            {/* {config.BRANDING_CONFIG.landingIntro} */}
          </Typography>
          <Typography 
            variant={isMobile ? 'h4' : 'h3'} 
            // component="h2" 
            gutterBottom
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: theme.palette.primary.main,
            }}
          >
            Your Talent Mines Crypto Here
          </Typography>

          {/* Bullet Points */}
          <Box 
            sx={{ 
              mb: 6, 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2, 
              justifyContent: 'center',
              maxWidth: '900px'
            }}
          >
            {bulletPoints.map((point, index) => (
              <Typography
                key={index}
                label={point}
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  // color: '#333',
                  fontSize: isMobile ? '0.9rem' : '1.1rem',

                }}
              > {" - "}{point}</Typography>
            ))}
          </Box>

          {/* Buttons */}
          <Box 
            display="flex" 
            gap={2} 
            flexDirection={isMobile ? 'column' : 'row'}
            width={isMobile ? '100%' : 'auto'}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleJoinNow}
              size="large"
              sx={{ fontSize: isMobile ? '1.7rem' : '2rem', padding: '16px 32px', fontStyle: 'bold' }}
            >
              WARP TO THE FUTURE
            </Button>
          </Box>
          
          {/* I'm back link */}
          <Box sx={{ mt: 3 }}>
            <Link
              component="button"
              variant="body2"
              onClick={handleImBack}
              sx={{
                color: theme.palette.primary.main,
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                '&:hover': {
                  textDecoration: 'none',
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                }
              }}
            >
              I'm back
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing;