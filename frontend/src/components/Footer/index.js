import React from 'react';
import { Box, Typography, Link, Container } from '@material-ui/core';
// import useComponentStyles from '../../themes/componentStyles';

const Footer = () => {
  const currentYear = new Date().getFullYear();
//   const classes = useComponentStyles();
  
  return (
    <Box component="footer" >
      <Container maxWidth="lg">
        <Typography variant="body2" color="textSecondary" align="center" style={{ padding: '16px 0' }}>
          {'Copyright © '}
            silkroadonlightning.com
            {' '}
          {currentYear}
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" style={{ paddingBottom: '16px' }}>
          <Link color="inherit" href="/faq" underline="hover">
            FAQ
          </Link>
          {' | '}
          <Link color="inherit" href="/declaration" underline="hover">
            About Us
          </Link>
          {' | '}
          <Link color="inherit" href="/contact-info" underline="hover">
            Contact Information
          </Link>
          {' | '}
          <Link color="inherit" href="/getting-started" underline="hover">
            Getting Started
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 