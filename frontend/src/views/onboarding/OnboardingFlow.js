import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  CircularProgress,
  Typography
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { OnboardingProvider, useOnboarding } from './OnboardingProvider';
import StepRenderer from './StepRenderer';
import ProgressBar from './components/ProgressBar';
import NavigationButtons from './components/NavigationButtons';
import onboardingConfig from '../../onboarding.json';
import { componentSpacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    backgroundColor: theme.palette.background.default,
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  container: {
    maxWidth: 800,
  },
  paper: {
    ...componentSpacing.card(theme),
    position: 'relative',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  content: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  header: {
    marginBottom: theme.spacing(4),
  },
  title: {
    marginBottom: theme.spacing(1),
  },
  description: {
    color: theme.palette.text.secondary,
  },
  errorContainer: {
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  errorText: {
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
  },
}));

const OnboardingContent = () => {
  const classes = useStyles();
  const { stepId } = useParams();
  const history = useHistory();
  const {
    currentStep,
    setCurrentStep,
    getCurrentStepConfig,
    getProgress,
    isLoading,
    error,
  } = useOnboarding();

  useEffect(() => {
    // If stepId in URL is different from currentStep, update currentStep
    if (stepId && stepId !== currentStep) {
      // Verify the step exists before updating
      if (onboardingConfig.steps[stepId]) {
        setCurrentStep(stepId);
      }
    } else if (!stepId) {
      history.replace(`/onboarding/${currentStep}`);
    }
  }, [stepId, currentStep, history, setCurrentStep]);

  const stepConfig = getCurrentStepConfig();

  if (isLoading) {
    return (
      <Box className={classes.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={classes.errorContainer}>
        <Typography variant="h6" className={classes.errorText}>
          {error}
        </Typography>
        <NavigationButtons />
      </Box>
    );
  }

  if (!stepConfig) {
    return (
      <Box className={classes.errorContainer}>
        <Typography variant="h6" className={classes.errorText}>
          Invalid step configuration
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <ProgressBar progress={getProgress()} />
      
      <Box className={classes.header}>
        <Typography variant="h4" className={classes.title}>
          {stepConfig.title}
        </Typography>
        <Typography variant="body1" className={classes.description}>
          {stepConfig.text}
        </Typography>
      </Box>

      <Box className={classes.content}>
        <StepRenderer stepConfig={stepConfig} />
      </Box>

      <NavigationButtons stepConfig={stepConfig} />
    </>
  );
};

const OnboardingFlow = () => {
  const classes = useStyles();

  return (
    <OnboardingProvider>
      <Box className={classes.root}>
        <Container className={classes.container}>
          <Paper className={classes.paper} elevation={1}>
            <OnboardingContent />
          </Paper>
        </Container>
      </Box>
    </OnboardingProvider>
  );
};

export default OnboardingFlow;