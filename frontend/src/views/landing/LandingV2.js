import React, { useEffect } from 'react';
import useDarkBackground from '../../hooks/useDarkBackground';
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
import DecorativeIcons from '../../components/DecorativeIcons';
import PixelIcon from '../../components/PixelIcon';
import {
  smileyHappy,
  heartPixel,
  floppyDisk,
  sparkleStarPurple,
  robotPixel,
  catPixel,
  coinDollar,
  coinDollarGold,
  coinGeneric,
  percentGrowth,
  walletCircuit,
  networkNodes,
} from '../../assets/images/icons';
import { CRYPTO_PAYMENT_ASSET, CRYPTO_PAYMENT_NETWORK_SHORT } from '../../utils/cryptoPaymentConfig';

// Import logo
import eccentricLogo from '../../assets/images/eccentricprotocol.gif';

// CSS keyframes
const keyframes = `
  @keyframes logoFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scrollIndicator {
    0%, 100% { opacity: 0.3; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(8px); }
  }
  @keyframes neonFlicker {
    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { text-shadow: 0 0 7px currentColor, 0 0 10px currentColor, 0 0 21px currentColor; }
    20%, 24%, 55% { text-shadow: none; }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes iconDrift {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-6px) rotate(2deg); }
    75% { transform: translateY(6px) rotate(-2deg); }
  }
`;

const heroIcons = [
  { src: smileyHappy, alt: 'smiley', top: '15%', left: '8%', size: 40, opacity: 0.12 },
  { src: heartPixel, alt: 'heart', top: '25%', right: '10%', size: 36, opacity: 0.1 },
  { src: floppyDisk, alt: 'floppy', bottom: '20%', left: '12%', size: 44, opacity: 0.1 },
  { src: sparkleStarPurple, alt: 'sparkle', top: '35%', left: '85%', size: 32, opacity: 0.15 },
  { src: robotPixel, alt: 'robot', bottom: '30%', right: '8%', size: 48, opacity: 0.08 },
  { src: catPixel, alt: 'cat', top: '60%', left: '5%', size: 36, opacity: 0.1 },
];

const FeatureCard = ({ icon, iconSrc, iconAlt, pixelIconSrc, title, description, delay, isMobile, theme }) => (
  <Box
    data-testid={`feature-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    id={`feature-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    sx={{
      position: 'relative',
      padding: isMobile ? '28px 24px' : '36px 32px',
      background: `${theme.palette.background.paper}`,
      border: `1px solid ${theme.palette.divider || 'rgba(167,139,250,0.2)'}`,
      borderRadius: '12px',
      transition: 'all 0.4s ease',
      animation: `fadeInUp 0.8s ease ${delay}s both`,
      cursor: 'default',
      overflow: 'hidden',
      '&:hover': {
        background: `${theme.palette.background.paper}`,
        border: `1px solid ${theme.palette.primary.main}40`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 15px ${theme.palette.primary.main}15`,
        transform: 'translateY(-4px)',
      }
    }}
  >
    {/* Pixel icon accent in top right */}
    {pixelIconSrc && (
      <Box sx={{ position: 'absolute', top: 12, right: 12, opacity: 0.15 }}>
        <PixelIcon src={pixelIconSrc} size={28} />
      </Box>
    )}
    {iconSrc ? (
      <Box sx={{ mb: 2, display: 'inline-flex' }}>
        <PixelIcon
          src={iconSrc}
          alt={iconAlt || title}
          size={isMobile ? 44 : 56}
          opacity={1}
          animation="float"
          sx={{
            filter: `drop-shadow(0 0 12px ${theme.palette.primary.main}40)`,
          }}
        />
      </Box>
    ) : (
      <Typography
        sx={{
          fontSize: isMobile ? '2rem' : '2.5rem',
          mb: 2,
          lineHeight: 1,
        }}
      >
        {icon}
      </Typography>
    )}
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
        color: theme.palette.text.secondary,
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
      iconSrc: percentGrowth,
      iconAlt: 'fee savings',
      pixelIconSrc: coinDollar,
      title: 'Lowest Fees on the Planet',
      description: 'Keep more of what you earn. Our fee structure is designed to be the most competitive in the Web3 marketplace space.',
    },
    {
      iconSrc: networkNodes,
      iconAlt: 'currency conversion',
      pixelIconSrc: coinDollarGold,
      title: `Seamless USD → ${CRYPTO_PAYMENT_ASSET}`,
      description: `We handle the conversion path for your buyers automatically. They pay in USD, and your crypto rail runs through ${CRYPTO_PAYMENT_ASSET} on ${CRYPTO_PAYMENT_NETWORK_SHORT}.`,
    },
    {
      iconSrc: walletCircuit,
      iconAlt: 'instant withdrawals',
      pixelIconSrc: coinGeneric,
      title: `Instant ${CRYPTO_PAYMENT_ASSET} Withdrawals`,
      description: `Withdraw to your favourite ${CRYPTO_PAYMENT_NETWORK_SHORT} wallet without extra custody steps or manual conversion.`,
    },
  ];

  const iconRowItems = [
    smileyHappy, heartPixel, floppyDisk, sparkleStarPurple,
    robotPixel, catPixel, coinDollar, coinDollarGold,
  ];

  useDarkBackground();

  return (
    <Box sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      <style>{keyframes}</style>

      {/* Scanline CRT overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 2px)',
          pointerEvents: 'none',
          zIndex: 999,
        }}
      />

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
        {/* Floating pixel icons in hero background */}
        <DecorativeIcons icons={heroIcons} />

        {/* Radial glow behind logo */}
        <Box
          sx={{
            position: 'absolute',
            width: isMobile ? '300px' : '500px',
            height: isMobile ? '300px' : '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.palette.primary.main}33 0%, ${theme.palette.secondary.main}1A 40%, transparent 70%)`,
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
            filter: `drop-shadow(0 0 20px ${theme.palette.primary.main}80) drop-shadow(0 0 40px ${theme.palette.secondary.main}40)`,
          }}
        />

        {/* Tagline with neon glow */}
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          data-testid="landing-tagline"
          id="landing-tagline"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 300,
            letterSpacing: '0.08em',
            textAlign: 'center',
            mb: 5,
            animation: 'fadeInUp 0.8s ease 0.2s both',
            position: 'relative',
            zIndex: 1,
            textShadow: `0 0 10px ${theme.palette.primary.main}60, 0 0 20px ${theme.palette.secondary.main}30`,
          }}
        >
          Web3 Digital Content Marketplace
        </Typography>

        {/* CTA Button with neon glow */}
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
            borderRadius: '8px',
            border: `1px solid ${theme.palette.primary.main}60`,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: theme.palette.text.inverse,
            position: 'relative',
            zIndex: 1,
            animation: 'fadeInUp 0.8s ease 0.4s both',
            boxShadow: `0 0 15px ${theme.palette.primary.main}80, 0 0 30px ${theme.palette.secondary.main}40`,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
              boxShadow: `0 0 25px ${theme.palette.secondary.main}80, 0 0 50px ${theme.palette.primary.main}40`,
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
            color: theme.palette.text.disabled,
            textDecoration: 'none',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
            animation: 'fadeInUp 0.8s ease 0.6s both',
            transition: 'color 0.3s ease, text-shadow 0.3s ease',
            '&:hover': {
              color: theme.palette.secondary.main,
              textDecoration: 'none',
              textShadow: `0 0 8px ${theme.palette.secondary.main}80`,
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
            color: theme.palette.primary.main,
            fontSize: '1.5rem',
            zIndex: 1,
            textShadow: `0 0 8px ${theme.palette.primary.main}80`,
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
        {/* Neon divider line */}
        <Box
          sx={{
            width: '120px',
            height: '2px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            margin: '0 auto',
            mb: isMobile ? 4 : 6,
            boxShadow: `0 0 10px ${theme.palette.primary.main}80`,
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
            color: theme.palette.text.primary,
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
              textShadow: 'none',
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
                  iconSrc={feature.iconSrc}
                  iconAlt={feature.iconAlt}
                  pixelIconSrc={feature.pixelIconSrc}
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

      {/* ===== ICON ROW ===== */}
      <Box
        sx={{
          py: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? 3 : 5,
          flexWrap: 'wrap',
          opacity: 0.2,
        }}
        data-testid="landing-icon-row"
        id="landing-icon-row"
      >
        {iconRowItems.map((src, i) => (
          <PixelIcon
            key={i}
            src={src}
            alt={`icon-row-${i}`}
            size={isMobile ? 24 : 32}
            opacity={1}
            animation="float"
            delay={i * 0.3}
          />
        ))}
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
            background: `radial-gradient(ellipse, ${theme.palette.primary.main}1A 0%, ${theme.palette.secondary.main}0D 50%, transparent 70%)`,
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
            color: theme.palette.text.primary,
            mb: 2,
            position: 'relative',
            zIndex: 1,
            textShadow: `0 0 15px ${theme.palette.primary.main}40`,
          }}
        >
          Ready to start selling?
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
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
            borderRadius: '8px',
            background: 'transparent',
            color: theme.palette.primary.main,
            border: `1px solid ${theme.palette.primary.main}`,
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.3s ease',
            boxShadow: `0 0 10px ${theme.palette.primary.main}30`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: theme.palette.text.inverse,
              borderColor: 'transparent',
              boxShadow: `0 0 25px ${theme.palette.primary.main}60, 0 0 50px ${theme.palette.secondary.main}30`,
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
            color: theme.palette.text.disabled,
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
