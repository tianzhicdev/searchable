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
import GalaxyMoving3D from '../../components/Galaxy3D/GalaxyMoving3D';
import { movingGalaxyConfigs } from '../../components/Galaxy3D/configs';

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
            variant={isMobile ? 'h4' : 'h3'} 
            // component="h2" 
            gutterBottom
            sx={{ 
              color: theme.palette.secondary.main,
              fontWeight: 'bold',
            }}
          >
            Talent Mines Crypto
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

          <Box 
            display="flex" 
                gap={2} 
                flexDirection={'column'}
                width={isMobile ? '100%' : 'auto'}
                >
          <Button
                  variant="contained"
                  color="primary"
                  onClick={handleJoinNow}
                  size="large"
                  sx={{ 
                  fontSize: isMobile ? '2.0rem' : '2.5rem', 
                  padding: '26px 32px', 
                  // fontWeight: 1200,
                  position: 'relative',
                  overflow: 'hidden',
                  '& .MuiButton-label': {
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontWeight: 1800,
                  }
                  }}
                >
                  WARP TO THE FUTURE
          </Button>
          <Typography 
            variant={isMobile ? 'h3' : 'h2'} 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold', 
              mb: 4, 
              fontSize: isMobile ? '1.5rem' : '2rem',
              color: theme.palette.primary.main,
            }}
          >
            {config.BRANDING_CONFIG.landingIntro}
          </Typography>
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