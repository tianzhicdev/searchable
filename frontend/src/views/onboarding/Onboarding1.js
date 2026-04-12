import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Box
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { browserWindowsOk, floppyDisk as shopIcon } from '../../assets/images/icons';
import { componentSpacing } from '../../utils/spacing';
import config from '../../config';
import DecorativeIcons from '../../components/DecorativeIcons';
import { smileyCute, smileyBlushing, robotPixel, catPixel } from '../../assets/images/icons';


const onboardingIcons = [
  { src: smileyCute, alt: 'smiley', top: '10%', left: '5%', size: 40, opacity: 0.12, animation: 'float' },
  { src: robotPixel, alt: 'robot', top: '15%', right: '8%', size: 48, opacity: 0.1, animation: 'float' },
  { src: catPixel, alt: 'cat', bottom: '15%', left: '10%', size: 44, opacity: 0.12, animation: 'pulse' },
  { src: smileyBlushing, alt: 'blushing', bottom: '20%', right: '6%', size: 36, opacity: 0.1, animation: 'float' },
];

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
  },
  paper: {
    ...componentSpacing.card(theme),
    textAlign: 'center',
    boxShadow: 'none',
    border: 'none',
    background: 'transparent',
  },
  titleContainer: {
    marginBottom: theme.spacing(4),
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      width: '10%',
      height: '100%',
      zIndex: 1,
    },
    '&::before': {
      left: 0,
      background: `linear-gradient(90deg, ${theme.palette.background.default} 0%, transparent 100%)`,
      [theme.breakpoints.down('sm')]: {
        background: 'none',
      },
    },
    '&::after': {
      right: 0,
      background: `linear-gradient(90deg, transparent 0%, ${theme.palette.background.default} 100%)`,
      [theme.breakpoints.down('sm')]: {
        background: 'none',
      },
    },
  },
  title: {
    display: 'inline-block',
    paddingLeft: '20px',
    animation: '$marquee 5s linear infinite',
    whiteSpace: 'nowrap',
  },
  '@keyframes marquee': {
    from: { transform: 'translateX(0)' },
    to: { transform: 'translateX(-100%)' }
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
    ...componentSpacing.card(theme),
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
  },
  optionDescription: {
    color: theme.palette.text.secondary,
  }
}));

const Onboarding1 = () => {
  const classes = useStyles();
  const history = useHistory();

  const handleSellerClick = () => {
    history.push('/onboarding-2');
  };

  const handleShopperClick = () => {
    history.push('/search');
  };

  return (
    <Box className={classes.root} style={{ position: 'relative' }}>
      <DecorativeIcons icons={onboardingIcons} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper className={classes.paper} elevation={0}>

          <Typography variant="h5" className={classes.subtitle} gutterBottom color="primary">
            What would you like to do?
          </Typography>
          
          <Box style={{ marginTop: 32 }}>
            <Grid container spacing={3} id="container-1">
              <Grid item xs={12} className={classes.optionCard}>
                <Card elevation={0}>
                  <CardActionArea onClick={handleSellerClick}>
                    <CardContent className={classes.cardContent}>
                      <img src={browserWindowsOk} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} className={classes.icon} />
                      <Typography variant="h5" className={classes.optionTitle} color="primary">
                        I want to earn
                      </Typography>
                      <Typography variant="body1" className={classes.optionDescription}>
                        Create your store and start selling digital content or create a donation page
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              
              <Grid item xs={12} className={classes.optionCard}>
                <Card elevation={0}>
                  <CardActionArea onClick={handleShopperClick}>
                    <CardContent className={classes.cardContent}>
                      <img src={shopIcon} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} className={classes.icon} />
                      <Typography variant="h5" className={classes.optionTitle} color="primary">
                        I want to shop
                      </Typography>
                      <Typography variant="body1" className={classes.optionDescription}>
                        Browse and purchase digital content from creators
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding1;