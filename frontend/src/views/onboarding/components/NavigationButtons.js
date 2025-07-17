import React from 'react';
import { Box, Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useOnboarding } from '../OnboardingProvider';
import onboardingConfig from '../../../onboarding.json';
import { testIdProps } from '../../../utils/testIds';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(4),
    paddingTop: theme.spacing(3),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  skipButton: {
    color: theme.palette.text.secondary,
  },
}));

const NavigationButtons = ({ stepConfig }) => {
  const classes = useStyles();
  const {
    currentStep,
    handleBack,
    handleSkip,
    handleNext,
    isLoading,
  } = useOnboarding();

  const showBackButton = onboardingConfig.metadata.allowBackNavigation && currentStep !== '1';
  const showSkipButton = stepConfig?.skipOption;
  const nextButtonText = stepConfig?.nextButton?.text || 'Continue';

  const handleContinue = () => {
    if (stepConfig?.type === 'component') {
      // Component steps handle their own validation
      // This will be triggered by the component itself
      return;
    }
    handleNext();
  };

  return (
    <Box className={classes.root} {...testIdProps('component', 'onboarding-navigation', 'container')}>
      <Box className={classes.leftSection} {...testIdProps('section', 'navigation', 'left')}>
        {showBackButton && (
          <Button
            onClick={handleBack}
            disabled={isLoading}
            variant="contained"
            {...testIdProps('button', 'onboarding', 'back')}
          >
            Back
          </Button>
        )}
        {showSkipButton && (
          <Button
            className={classes.skipButton}
            onClick={handleSkip}
            disabled={isLoading}
            variant="contained"
            {...testIdProps('button', 'onboarding', 'skip')}
          >
            {stepConfig.skipOption.text}
          </Button>
        )}
      </Box>

      {stepConfig?.type === 'component' && (
        <Typography 
          variant="caption" 
          color="textSecondary"
          {...testIdProps('text', 'onboarding', 'hint')}
        >
          Click continue when ready
        </Typography>
      )}
    </Box>
  );
};

export default NavigationButtons;