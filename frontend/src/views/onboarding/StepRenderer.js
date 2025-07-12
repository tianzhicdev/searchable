import React, { lazy, Suspense } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Icon,
  Box,
  CircularProgress
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useOnboarding } from './OnboardingProvider';

// Lazy load step components
const FileUpload = lazy(() => import('./components/steps/FileUpload'));
const StoreSetup = lazy(() => import('./components/steps/StoreSetup'));
const PricingSetup = lazy(() => import('./components/steps/PricingSetup'));
const Registration = lazy(() => import('./components/steps/Registration'));

const useStyles = makeStyles((theme) => ({
  optionCard: {
    height: '100%',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4],
    },
  },
  cardActionArea: {
    height: '100%',
    padding: theme.spacing(2),
  },
  cardContent: {
    textAlign: 'center',
  },
  icon: {
    fontSize: 48,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  optionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  optionDescription: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
}));

const componentMap = {
  FileUpload,
  StoreSetup,
  PricingSetup,
  Registration,
};

const SelectionStep = ({ stepConfig }) => {
  const classes = useStyles();
  const { handleNext } = useOnboarding();

  const handleOptionClick = (option) => {
    handleNext(option);
  };

  return (
    <Grid container spacing={3}>
      {stepConfig.options.map((option, index) => (
        <Grid item xs={12} key={index}>
          <Card className={classes.optionCard} elevation={2}>
            <CardActionArea
              className={classes.cardActionArea}
              onClick={() => handleOptionClick(option)}
            >
              <CardContent className={classes.cardContent}>
                {option.icon && (
                  <Icon className={classes.icon}>{option.icon}</Icon>
                )}
                <Typography variant="h6" className={classes.optionTitle}>
                  {option.text}
                </Typography>
                {option.description && (
                  <Typography variant="body2" className={classes.optionDescription}>
                    {option.description}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const ComponentStep = ({ stepConfig }) => {
  const classes = useStyles();
  const Component = componentMap[stepConfig.component];

  if (!Component) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">
          Component "{stepConfig.component}" not found
        </Typography>
      </Box>
    );
  }

  return (
    <Suspense
      fallback={
        <Box className={classes.loadingContainer}>
          <CircularProgress />
        </Box>
      }
    >
      <Component stepConfig={stepConfig} />
    </Suspense>
  );
};

const StepRenderer = ({ stepConfig }) => {
  if (!stepConfig) {
    return null;
  }

  switch (stepConfig.type) {
    case 'selection':
      return <SelectionStep stepConfig={stepConfig} />;
    case 'component':
      return <ComponentStep stepConfig={stepConfig} />;
    default:
      return (
        <Box p={3} textAlign="center">
          <Typography color="error">
            Unknown step type: {stepConfig.type}
          </Typography>
        </Box>
      );
  }
};

export default StepRenderer;