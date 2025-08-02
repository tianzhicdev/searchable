import React from 'react';
import { useHistory } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button,
  useTheme,
  useMediaQuery,
  Link
} from '@material-ui/core';
import { useSelector } from 'react-redux';
import config from '../../config';

// Import landing images
import landing1 from '../../assets/images/landing_1.png';
import landing2 from '../../assets/images/landing_2.png';
import landing3 from '../../assets/images/landing_3.png';
import landing4 from '../../assets/images/landing_4.png';

const LandingV2 = () => {
  const history = useHistory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const account = useSelector((state) => state.account);
  const isLoggedIn = account?.user?.id;

  const handleWarpToFuture = () => {
    history.push('/onboarding-1');
  };

  const handleImBack = () => {
    if (isLoggedIn) {
      history.push('/search');
    } else {
      history.push('/login');
    }
  };

  const sections = [
    {
      image: landing1,
      content: (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          p: 4,
          maxWidth: isMobile ? '90%' : '600px'
        }}>

          <Typography 
            variant={isMobile ? "h2" : "h3"} 
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
              color: theme.palette.secondary.main,
              mb: 4,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            Web3 Digital Content Marketplace
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleWarpToFuture}
            sx={{
              mb: 4,
              px: 4,
              py: 2,
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 6px 8px rgba(0,0,0,0.2)',
              }
            }}
          >
            Warp to the future
          </Button>
          <Typography 
            variant={isMobile ? "h2" : "h3"} 
            sx={{ 
              color: theme.palette.primary.main,
              fontWeight: 'bold',
              mb: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {config.BRANDING_CONFIG.landingIntro}
          </Typography>
          
          <Link
            component="button"
            variant="body2"
            onClick={handleImBack}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'underline',
              cursor: 'pointer',
              '&:hover': {
                color: 'white'
              }
            }}
          >
            I'm back
          </Link>
        </Box>
      )
    },
    {
      image: landing2,
      content: (
        <Box sx={{ 
          position: 'absolute',
          bottom: isMobile ? 20 : 40,
          right: isMobile ? 20 : 40,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: isMobile ? '12px 20px' : '20px 40px',
          borderRadius: '8px',
          backdropFilter: 'blur(5px)',
          zIndex: 2
        }}>
          <Typography 
            variant={isMobile ? "h5" : "h3"} 
            sx={{ 
              color: theme.palette.secondary.main,
              fontWeight: 'bold',
              textAlign: 'right',
              letterSpacing: '0.02em'
            }}
          >
            Lowest Fees on the planet
          </Typography>
        </Box>
      )
    },
    {
      image: landing3,
      content: (
        <Box sx={{ 
          position: 'absolute',
          bottom: isMobile ? 20 : 40,
          right: isMobile ? 20 : 40,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: isMobile ? '12px 20px' : '20px 40px',
          borderRadius: '8px',
          backdropFilter: 'blur(5px)',
          maxWidth: isMobile ? '70%' : '50%',
          zIndex: 2
        }}>
          <Typography 
            variant={isMobile ? "h6" : "h4"} 
            sx={{ 
              fontWeight: 'bold',
              color: theme.palette.secondary.main,
              textAlign: 'right',
              letterSpacing: '0.02em'
            }}
          >
            We convert buyers' USD to USDT for you
          </Typography>
        </Box>
      )
    },
    {
      image: landing4,
      content: (
        <Box sx={{ 
          position: 'absolute',
          bottom: isMobile ? 20 : 40,
          right: isMobile ? 20 : 40,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: isMobile ? '12px 20px' : '20px 40px',
          borderRadius: '8px',
          backdropFilter: 'blur(5px)',
          maxWidth: isMobile ? '70%' : '50%',
          zIndex: 2
        }}>
          <Typography 
            variant={isMobile ? "h6" : "h4"} 
            sx={{ 
              fontWeight: 'bold',
              color: theme.palette.secondary.main,
              textAlign: 'right',
              letterSpacing: '0.02em'
            }}
          >
            Withdraw USDT to your favourite Ethereum wallet, instantly
          </Typography>
        </Box>
      )
    }
  ];

  return (
    <Box >
      {sections.map((section, index) => (
        <Box
          key={index}
          sx={{
            position: 'relative',
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Background Image */}
          <Box
            component="img"
            src={section.image}
            alt={`Landing section ${index + 1}`}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          />
          
          {/* Overlay for better text visibility - only for first section */}
          {index === 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                zIndex: 1
              }}
            />
          )}
          
          {/* Content */}
          {index === 0 ? (
            <Container
              maxWidth="lg"
              sx={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {section.content}
            </Container>
          ) : (
            section.content
          )}
        </Box>
      ))}
    </Box>
  );
};

export default LandingV2;