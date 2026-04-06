import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Link,
  Grid
} from '@material-ui/core';
import { useSelector } from 'react-redux';
import config from '../../config';

// Import logo
import eccentricLogo from '../../assets/images/eccentricprotocol.gif';

// CSS keyframes injected via style tag
const keyframes = `
  @keyframes logoFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scrollIndicator {
    0%, 100% { opacity: 0.3; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(8px); }
  }
  @keyframes borderGlow {
    0%, 100% { border-color: #E09CDE; box-shadow: 0 0 15px rgba(224, 156, 222, 0.2); }
    50% { border-color: #8BE8C6; box-shadow: 0 0 25px rgba(139, 232, 198, 0.3); }
  }
`;

const FeatureCard = ({ icon, title, description, delay, isMobile, theme }) => (
  <Box
    sx={{
      position: 'relative',
      padding: isMobile ? '28px 24px' : '36px 32px',
      borderRadius: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(224, 156, 222, 0.2)',
      transition: 'all 0.4s ease',
      animation: `fadeInUp 0.8s ease ${delay}s both`,
      cursor: 'default',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(139, 232, 198, 0.4)',
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 32px rgba(139, 232, 198, 0.15)',
      }
    }}
  >
    <Typography
      sx={{
        fontSize: isMobile ? '2rem' : '2.5rem',
        mb: 2,
        lineHeight: 1,
      }}
    >
      {icon}
    </Typography>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        mb: 1.5,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {title}
    </Typography>
    <Typography
      variant="body1"
      sx={{
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 1.6,
        fontSize: isMobile ? '0.9rem' : '1rem',
      }}
    >
      {description}
    </Typography>
  </Box>
);

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

  const features = [
    {
      icon: '⚡',
      title: 'Lowest Fees on the Planet',
      description: 'Keep more of what you earn. Our fee structure is designed to be the most competitive in the Web3 marketplace space.',
    },
    {
      icon: '🔄',
      title: 'Seamless USD → USDT',
      description: "We handle the conversion for your buyers automatically. They pay in USD, you receive USDT. It's that simple.",
    },
    {
      icon: '🏦',
      title: 'Instant USDT Withdrawals',
      description: 'Withdraw to your favourite Ethereum wallet instantly. No waiting periods, no unnecessary holds.',
    },
  ];

  return (
    <Box sx={{ backgroundColor: '#000', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{keyframes}</style>

      {/* ===== HERO SECTION ===== */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          px: 2,
        }}
      >
        {/* Radial glow behind logo */}
        <Box
          sx={{
            position: 'absolute',
            width: isMobile ? '300px' : '500px',
            height: isMobile ? '300px' : '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(224, 156, 222, 0.15) 0%, rgba(139, 232, 198, 0.08) 40%, transparent 70%)`,
            animation: 'pulseGlow 4s ease-in-out infinite',
            pointerEvents: 'none',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -55%)',
          }}
        />

        {/* Animated Logo */}
        <Box
          component="img"
          src={eccentricLogo}
          alt={config.BRANDING_CONFIG.landingIntro}
          data-testid="landing-logo"
          id="landing-logo"
          sx={{
            width: isMobile ? '220px' : '340px',
            height: 'auto',
            animation: 'logoFloat 6s ease-in-out infinite',
            position: 'relative',
            zIndex: 1,
            mb: 4,
            filter: 'drop-shadow(0 0 20px rgba(224, 156, 222, 0.3))',
          }}
        />

        {/* Tagline */}
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          data-testid="landing-tagline"
          id="landing-tagline"
          sx={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontWeight: 300,
            letterSpacing: '0.08em',
            textAlign: 'center',
            mb: 5,
            animation: 'fadeInUp 0.8s ease 0.2s both',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Web3 Digital Content Marketplace
        </Typography>

        {/* CTA Button */}
        <Button
          variant="contained"
          size="large"
          onClick={handleWarpToFuture}
          data-testid="landing-cta"
          id="landing-cta"
          sx={{
            px: isMobile ? 4 : 6,
            py: 1.5,
            fontSize: isMobile ? '1rem' : '1.2rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            borderRadius: '50px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: '#000',
            border: 'none',
            position: 'relative',
            zIndex: 1,
            animation: 'fadeInUp 0.8s ease 0.4s both',
            boxShadow: '0 4px 24px rgba(224, 156, 222, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
              boxShadow: '0 6px 32px rgba(139, 232, 198, 0.4)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          Get Started
        </Button>

        {/* I'm back link */}
        <Link
          component="button"
          variant="body2"
          onClick={handleImBack}
          data-testid="landing-imback"
          id="landing-imback"
          sx={{
            mt: 3,
            color: 'rgba(255, 255, 255, 0.4)',
            textDecoration: 'none',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
            animation: 'fadeInUp 0.8s ease 0.6s both',
            transition: 'color 0.3s ease',
            '&:hover': {
              color: theme.palette.secondary.main,
              textDecoration: 'none',
            },
          }}
        >
          I'm back →
        </Link>

        {/* Scroll indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'scrollIndicator 2s ease-in-out infinite',
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: '1.5rem',
            zIndex: 1,
          }}
        >
          ↓
        </Box>
      </Box>

      {/* ===== FEATURES SECTION ===== */}
      <Box
        sx={{
          py: isMobile ? 8 : 12,
          px: 2,
          position: 'relative',
        }}
      >
        {/* Subtle top divider line */}
        <Box
          sx={{
            width: '80px',
            height: '2px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            margin: '0 auto',
            mb: isMobile ? 4 : 6,
          }}
        />

        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          data-testid="landing-features-title"
          id="landing-features-title"
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            mb: isMobile ? 6 : 8,
            color: '#fff',
            animation: 'fadeInUp 0.8s ease 0.1s both',
          }}
        >
          Why{' '}
          <Box
            component="span"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {config.BRANDING_CONFIG.landingIntro}
          </Box>
          ?
        </Typography>

        <Container maxWidth="lg">
          <Grid container spacing={isMobile ? 3 : 4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={0.2 + index * 0.15}
                  isMobile={isMobile}
                  theme={theme}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ===== BOTTOM CTA SECTION ===== */}
      <Box
        sx={{
          py: isMobile ? 8 : 10,
          px: 2,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Gradient glow behind CTA */}
        <Box
          sx={{
            position: 'absolute',
            width: '60%',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(224, 156, 222, 0.08) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          data-testid="landing-bottom-cta-title"
          id="landing-bottom-cta-title"
          sx={{
            fontWeight: 600,
            color: '#fff',
            mb: 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Ready to start selling?
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            maxWidth: '500px',
            margin: '0 auto 32px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Join the marketplace where creators keep more and buyers pay less.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleWarpToFuture}
          data-testid="landing-bottom-cta"
          id="landing-bottom-cta"
          sx={{
            px: isMobile ? 4 : 6,
            py: 1.5,
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: 600,
            borderRadius: '50px',
            background: 'transparent',
            color: theme.palette.primary.main,
            border: `1px solid ${theme.palette.primary.main}`,
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: '#000',
              borderColor: 'transparent',
              boxShadow: '0 4px 24px rgba(224, 156, 222, 0.3)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          Create Your Store
        </Button>

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 8,
            color: 'rgba(255, 255, 255, 0.2)',
            letterSpacing: '0.05em',
          }}
        >
          {config.BRANDING_CONFIG.domain}
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingV2;
