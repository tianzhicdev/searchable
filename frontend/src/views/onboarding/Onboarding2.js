import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Box,
  IconButton
} from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import { makeStyles } from '@material-ui/styles';
import { floppyDisk as downloadIcon, catPixel as physicalItemsIcon, heartPixel as donationIcon } from '../../assets/images/icons';
import DecorativeIcons from '../../components/DecorativeIcons';
import { smileyHappy, floppyDisk, heartPixel, sparkleStarPurple } from '../../assets/images/icons';


const onboarding2Icons = [
  { src: smileyHappy, alt: 'happy', top: '8%', left: '6%', size: 42, opacity: 0.12, animation: 'float' },
  { src: floppyDisk, alt: 'floppy', top: '12%', right: '7%', size: 44, opacity: 0.1, animation: 'pulse' },
  { src: heartPixel, alt: 'heart', bottom: '18%', left: '8%', size: 38, opacity: 0.12, animation: 'float' },
  { src: sparkleStarPurple, alt: 'sparkle', bottom: '14%', right: '5%', size: 40, opacity: 0.1, animation: 'float' },
];

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
  },
  paper: {
    padding: theme.spacing(4),
    textAlign: 'center',
    position: 'relative',
    boxShadow: 'none',
    border: 'none',
    background: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(4),
  },
  subtitle: {
    marginBottom: theme.spacing(3),
  },
  optionCard: {
    height: '100%',
    transition: 'all 0.3s ease',
    boxShadow: 'none !important',
    border: 'none !important',
    background: 'transparent !important',
    '& .MuiPaper-root': {
      boxShadow: 'none !important',
      border: 'none !important',
      background: 'transparent !important',
    },
    '& .MuiCard-root': {
      boxShadow: 'none !important',
      border: 'none !important',
      background: 'transparent !important',
    },
    '& .MuiCardActionArea-root': {
      '&:hover': {
        backgroundColor: 'transparent',
      }
    },
    '&:hover': {
      transform: 'translateY(-6px)',
      '& .MuiCardContent-root': {
        border: `1px solid ${theme.palette.primary.main}40`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
      },
    },
  },
  cardContent: {
    padding: theme.spacing(4),
    textAlign: 'center',
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider || 'rgba(167,139,250,0.2)'}`,
    borderRadius: '12px',
    transition: 'all 0.3s ease',
  },
  icon: {
    fontSize: 64,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  optionTitle: {
    marginBottom: theme.spacing(1),
    fontWeight: 600,
  },
  optionDescription: {
    color: theme.palette.text.secondary,
  }
}));

const Onboarding2 = () => {
  const classes = useStyles();
  const history = useHistory();

  const handleBack = () => {
    history.push('/onboarding-1');
  };

  const options = [
    {
      title: 'Sell my digital content',
      description: 'Upload and sell content like PDFs, music, videos, or software',
      icon: <img src={downloadIcon} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} className={classes.icon} />,
      path: '/onboarding-3'
    },
    {
      title: 'Create a donation page',
      description: 'Accept donations and tips from supporters',
      icon: <img src={donationIcon} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} className={classes.icon} />,
      path: '/onboarding-5'
    },
    {
      title: 'Create catalog for my store',
      description: 'Build a product catalog with multiple items and categories',
      icon: <img src={physicalItemsIcon} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} className={classes.icon} />,
      path: '/onboarding-4'
    },
  ];

  const handleOptionClick = (path) => {
    history.push(path);
  };

  return (
    <Box className={classes.root} style={{ position: 'relative' }}>
      <DecorativeIcons icons={onboarding2Icons} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper className={classes.paper} elevation={0}>
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBack />
          </IconButton>

          <Box style={{ paddingTop: 48 }}>
            <Typography variant="h3" className={classes.title} color="primary">
              Your first posting
            </Typography>
          </Box>
          <Typography variant="h6" className={classes.subtitle} color="textSecondary">
            Choose how you want to start earning
          </Typography>
          
          <Box style={{ marginTop: 32 }}>
            <Grid container spacing={3}>
              {options.map((option, index) => (
                <Grid item xs={12} key={index}>
                  <Card className={classes.optionCard} elevation={0}>
                    <CardActionArea onClick={() => handleOptionClick(option.path)}>
                      <CardContent className={classes.cardContent}>
                        {option.icon}
                        <Typography variant="h5" className={classes.optionTitle}>
                          {option.title}
                        </Typography>
                        <Typography variant="body1" className={classes.optionDescription}>
                          {option.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding2;
