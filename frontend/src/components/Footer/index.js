import React from 'react';
import { Box, Typography, Link, Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import config from '../../config';
import { APP_VERSION } from '../../version';
import { spacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  footer: {
    paddingTop: theme.spacing(spacing.section.md), // 48px desktop
    paddingBottom: theme.spacing(spacing.section.md),
    [theme.breakpoints.down('sm')]: {
      paddingTop: theme.spacing(spacing.section.xs), // 24px mobile
      paddingBottom: theme.spacing(spacing.section.xs),
    }
  },
  copyright: {
    paddingBottom: theme.spacing(spacing.element.md), // 16px
    [theme.breakpoints.down('sm')]: {
      paddingBottom: theme.spacing(spacing.element.xs), // 12px mobile
    }
  },
  links: {
    paddingBottom: theme.spacing(spacing.element.md), // 16px
    [theme.breakpoints.down('sm')]: {
      paddingBottom: theme.spacing(spacing.element.xs), // 12px mobile
      fontSize: '0.875rem', // Slightly smaller on mobile
    }
  }
}));

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const classes = useStyles();
  
  return (
    <Box component="footer" className={classes.footer}>
      <Container maxWidth="lg">
        <Typography variant="body2" color="textSecondary" align="center" className={classes.copyright}>
          {'Copyright © '}
            {config.BRANDING_CONFIG.domain}
            {' '}
          {currentYear}
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" className={classes.links}>
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
          {/* <Link color="inherit" href="/getting-started" underline="hover">
            Getting Started
          </Link>
          {' | '} */}
          <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            {APP_VERSION}
          </span>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 