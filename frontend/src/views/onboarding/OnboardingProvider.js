import React, { createContext, useContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import onboardingConfig from '../../onboarding.json';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState('1');
  const [answers, setAnswers] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('onboarding_progress');
    if (savedProgress && onboardingConfig.metadata.persistProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentStep(progress.currentStep || '1');
        setAnswers(progress.answers || {});
        setUploadedFiles(progress.uploadedFiles || []);
      } catch (err) {
        console.error('Failed to load onboarding progress:', err);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (onboardingConfig.metadata.persistProgress) {
      const progress = {
        currentStep,
        answers,
        uploadedFiles,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('onboarding_progress', JSON.stringify(progress));
    }
  }, [currentStep, answers, uploadedFiles]);

  const getStepConfig = (stepId) => {
    return onboardingConfig.steps[stepId];
  };

  const getCurrentStepConfig = () => {
    return getStepConfig(currentStep);
  };

  const getTotalSteps = () => {
    return Object.keys(onboardingConfig.steps).length;
  };

  const getProgress = () => {
    const currentStepNumber = parseInt(currentStep);
    const totalSteps = getTotalSteps();
    return (currentStepNumber / totalSteps) * 100;
  };

  const navigateToStep = (stepId) => {
    console.log('navigateToStep called with:', stepId);
    console.log('Available steps:', Object.keys(onboardingConfig.steps));
    
    if (onboardingConfig.steps[stepId]) {
      console.log('Step found, navigating to:', stepId);
      setCurrentStep(stepId);
      history.push(`/onboarding/${stepId}`);
    } else {
      console.error('Step not found:', stepId);
    }
  };

  const handleAnswer = (stepId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [stepId]: answer
    }));
  };

  const handleNext = (answer) => {
    const step = getCurrentStepConfig();
    
    // Save the answer using the current numeric step ID
    if (answer !== undefined) {
      handleAnswer(currentStep, answer);
    }

    // Determine next destination
    let nextDestination;
    if (step.type === 'selection' && answer && answer.goto) {
      nextDestination = answer.goto;
    } else if (step.nextButton && step.nextButton.goto) {
      nextDestination = step.nextButton.goto;
    }

    console.log('Current step:', currentStep, 'Next destination:', nextDestination);

    if (!nextDestination) return;

    // Handle navigation
    if (nextDestination.startsWith('step:')) {
      const nextStepId = nextDestination.replace('step:', '');
      navigateToStep(nextStepId);
    } else if (nextDestination.startsWith('complete:')) {
      const completionType = nextDestination.replace('complete:', '');
      handleCompletion(completionType);
    } else if (nextDestination.startsWith('page:')) {
      const page = nextDestination.replace('page:', '');
      history.push(page);
    }
  };

  const handleBack = () => {
    if (!onboardingConfig.metadata.allowBackNavigation) return;
    
    const currentStepNumber = parseInt(currentStep);
    if (currentStepNumber > 1) {
      navigateToStep(String(currentStepNumber - 1));
    }
  };

  const handleSkip = () => {
    const step = getCurrentStepConfig();
    if (step.skipOption && step.skipOption.goto) {
      const destination = step.skipOption.goto;
      if (destination.startsWith('step:')) {
        const nextStepId = destination.replace('step:', '');
        navigateToStep(nextStepId);
      }
    }
  };

  const handleCompletion = async (completionType) => {
    setIsLoading(true);
    
    try {
      // Clear saved progress
      localStorage.removeItem('onboarding_progress');
      
      // Get completion config
      const completion = onboardingConfig.completions[completionType];
      
      if (completion) {
        // Show success message
        if (completion.message) {
          // You might want to show this in a toast/snackbar
          console.log(completion.message);
        }
        
        // Redirect to final destination
        setTimeout(() => {
          history.push(completion.redirect);
        }, 1000);
      }
    } catch (err) {
      setError('Failed to complete onboarding');
      console.error('Onboarding completion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetOnboarding = () => {
    setCurrentStep('1');
    setAnswers({});
    setUploadedFiles([]);
    setError(null);
    localStorage.removeItem('onboarding_progress');
    history.push('/onboarding/1');
  };

  const value = {
    // State
    currentStep,
    setCurrentStep,
    answers,
    uploadedFiles,
    isLoading,
    error,
    
    // Getters
    getCurrentStepConfig,
    getStepConfig,
    getTotalSteps,
    getProgress,
    
    // Actions
    handleNext,
    handleBack,
    handleSkip,
    handleAnswer,
    setUploadedFiles,
    resetOnboarding,
    setError
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};