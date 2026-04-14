import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@material-ui/core';
import { Grid, Typography, Box, useMediaQuery } from '@material-ui/core';
import Logo from './../../../../ui-component/Logo';
import RestRegister from './RestRegister';
import useComponentStyles from '../../../../themes/componentStyles';
import { testIdProps } from '../../../../utils/testIds';
import DecorativeIcons from '../../../../components/DecorativeIcons';
import { moonCrescent, cloud, sparkleGradientLarge } from '../../../../assets/images/icons';
import useDarkBackground from '../../../../hooks/useDarkBackground';

const authIcons = [
  { src: moonCrescent, alt: 'moon', top: '8%', right: '6%', size: 44, opacity: 0.12, animation: 'float' },
  { src: cloud, alt: 'cloud', top: '30%', left: '5%', size: 40, opacity: 0.1, animation: 'float' },
  { src: sparkleGradientLarge, alt: 'sparkle', bottom: '20%', right: '8%', size: 36, opacity: 0.15, animation: 'pulse' },
  { src: cloud, alt: 'cloud2', bottom: '10%', left: '8%', size: 32, opacity: 0.08, animation: 'float' },
];

const Register = () => {
    const theme = useTheme();
    const classes = useComponentStyles();
    const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));

    useDarkBackground();

    return (
      <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <DecorativeIcons icons={authIcons} />
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 440,
          mx: 'auto',
          px: 3,
          position: 'relative',
          zIndex: 1,
        }} {...testIdProps('page', 'register', 'container')}>

          <Box sx={{ mb: 4 }} {...testIdProps('section', 'register', 'logo')}>
              <RouterLink to="#" {...testIdProps('link', 'register', 'logo-link')}>
                  <Logo />
              </RouterLink>
          </Box>

          <Box sx={{
            width: '100%',
            background: `${theme.palette.background.paper}`,
            border: `1px solid ${theme.palette.divider || 'rgba(167,139,250,0.2)'}`,
            borderRadius: '12px',
            padding: theme.spacing(4),
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4)`,
          }} {...testIdProps('section', 'register', 'form')}>
            <RestRegister />
          </Box>

          <Box sx={{ mt: 3 }} {...testIdProps('section', 'register', 'login-link')}>
              <Typography
                  component={RouterLink}
                  to="/login"
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.text.secondary,
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                  {...testIdProps('link', 'register', 'login')}
              >
                  Already have an account?
              </Typography>
          </Box>
        </Box>
      </Box>
    );
};

export default Register;
