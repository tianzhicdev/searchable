import React from 'react';
import { useHistory } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Chip,
  useTheme,
  useMediaQuery
} from '@material-ui/core';
import config from '../../config';
import Logo from '../../ui-component/Logo';
import backgroundImage from '../../assets/images/bg.png';

import abitchaoticLogo from '../../assets/images/abitchaotic.gif';

const Landing = () => {
  const history = useHistory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const bulletPoints = [
    'Built for creators, by creators',
    'Skip the middleman, keep the crypto',
    'Industry\'s lowest fees, guaranteed',
    'Monetize any digital content with crypto',
    'Instant payouts, Globally available',
  ];

  const handleJoinNow = () => {
    history.push('/visitor');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: `url(${abitchaoticLogo})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        // '&::before': {
        //   content: '""',
        //   position: 'absolute',
        //   top: 0,
        //   left: 0,
        //   right: 0,
        //   bottom: 0,
        //   backgroundColor: 'rgba(0, 0, 0, 0.5)',
        //   zIndex: 1
        // }
      }}
    >
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
          {/* Logo */}
          {/* <Box sx={{ mb: 4, maxWidth: isMobile ? '80%' : '60%', width: '100%' }}>
            <Logo />
          </Box> */}

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
              // color: 'white',
              // textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            WARP TO THE FUTURE
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
            {config.BRANDING_CONFIG.landingIntro}
          </Typography>
          <Typography 
            variant={isMobile ? 'h3' : 'h2'} 
            component="h2" 
            gutterBottom
            sx={{ 
              // fontWeight: 'bold', 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              // mb: 4, 
              // fontSize: isMobile ? '1.5rem' : '2.5rem',
              // color: 'white',
              // textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            Web3 Digital Content Marketplace
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
            >
              Enter Marketplace
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing;