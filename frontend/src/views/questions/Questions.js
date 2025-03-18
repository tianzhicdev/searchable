import React, { useState, useEffect } from 'react';
import './Questions.css';
import { LANDING_QUESTIONS, MULTIPLE_CHOICE_QUESTIONS, FREE_QUESTIONS, BASIC_QUESTIONS, BINARY_QUESTIONS } from './config';
import landing from '../../assets/images/landing.jpg';


function Questions() {
  const allQuestions = [
    ...LANDING_QUESTIONS.map((q, index) => ({
      type: 'landing',
      id: q.name,
      question: q.question,
      options: ['Start'],
      image: null
    })),
    ...BINARY_QUESTIONS.map((q, index) => ({
      type: 'binary',
      id: q.name,
      question: q.question,
      options: q.options,
      image: null
    })),
    ...MULTIPLE_CHOICE_QUESTIONS.map((q, index) => ({
      type: 'range',
      id: q.name,
      question: q.rephrased_version,
      image: null
    })),
    ...FREE_QUESTIONS.map((q, index) => ({
      type: 'free',
      id: q.name,
      question: q.question,
      image: null
    })),
    ...BASIC_QUESTIONS.map((q, index) => ({
      type: 'basic',
      id: q.name,
      question: q.question,
      image: null
    })),
    {
      type: 'email',
      id: 'email',
      question: 'Please enter your email address',
      image: null
    }
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(
    allQuestions.reduce((acc, q) => {
      acc[q.id] = q.type === 'range' ? 5 : '';
      return acc;
    }, {})
  );
  const [message, setMessage] = useState('');
  const [questionsWithImages, setQuestionsWithImages] = useState(allQuestions);
  const [visitorId, setVisitorId] = useState('');

  useEffect(() => {
    const generateVisitorId = () => {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };
    
    const newVisitorId = generateVisitorId();
    setVisitorId(newVisitorId);
    
    // Track page load event
    trackUserEvent('page_load', {
      visitor_id: newVisitorId,
      page: 'questions',
      timestamp: new Date().toISOString(),
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      user_agent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookies_enabled: navigator.cookieEnabled,
      do_not_track: navigator.doNotTrack,
      connection_type: navigator.connection ? navigator.connection.effectiveType : 'unknown',
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer,
      browser_plugins: Array.from(navigator.plugins).map(p => p.name).join(','),
      device_memory: navigator.deviceMemory || 'unknown',
      hardware_concurrency: navigator.hardwareConcurrency || 'unknown',
      color_depth: window.screen.colorDepth,
      pixel_ratio: window.devicePixelRatio
    });
    
    // Track when user leaves the page
    const handleBeforeUnload = () => {
      trackUserEvent('page_exit', {
        page: 'questions',
        current_step: currentStep,
        questions_answered: Object.keys(formData).filter(key => formData[key] !== '').length
      });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Move loadRandomImages function before the return statement
    const loadRandomImages = async () => {
      try {
        const animalImages = [landing];
        const updatedQuestions = allQuestions.map(q => {
          const randomIndex = Math.floor(Math.random() * animalImages.length);
          return {
            ...q,
            image: animalImages[randomIndex]
          };
        });
        setQuestionsWithImages(updatedQuestions);
      } catch (error) {
        console.error('Failed to load animal images:', error);
      }
    };

    loadRandomImages();
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Function to track user events
  const trackUserEvent = async (action, details = {}) => {
    try {
      await fetch('https://2genders.dyndns.org/api/user_event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visitor_id: details.visitor_id || visitorId,
          timestamp: new Date().toISOString(),
          action,
          details
        })
      });
    } catch (error) {
      console.error('Failed to track user event:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

  };

  const isAgeValid = (age) => {
    const ageInt = parseInt(age, 10);
    return ageInt >= 15 && ageInt <= 100;
  };

  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isNicknameValid = (nickname) => {
    return nickname.length > 0 && nickname.length <= 20;
  };

  const handleButtonClick = (value, questionId) => {
    setFormData(prevData => ({
      ...prevData,
      [questionId]: value
    }));
    
    // Track button click event
    trackUserEvent('button_click', {
      question_id: questionId,
      question_type: questionsWithImages.find(q => q.id === questionId)?.type,
      selected_value: value
    });
    
    handleNext();
  };

  const handleNext = () => {
    const currentQuestion = questionsWithImages[currentStep];
    
    if (currentQuestion.type === 'basic' && currentQuestion.id === 'enter_your_age') {
      if (!isAgeValid(formData[currentQuestion.id])) {
        alert('Please enter a valid age between 15 and 100.');
        trackUserEvent('validation_error', {
          question_id: currentQuestion.id,
          error_type: 'invalid_age'
        });
        return;
      }
    }
    
    if (currentQuestion.type === 'basic' && currentQuestion.id === 'enter_your_nickname') {
      if (!isNicknameValid(formData[currentQuestion.id])) {
        alert('Please enter a nickname between 1 and 20 characters.');
        trackUserEvent('validation_error', {
          question_id: currentQuestion.id,
          error_type: 'invalid_nickname'
        });
        return;
      }
    }
    
    if (currentQuestion.type === 'email') {
      if (!isEmailValid(formData[currentQuestion.id])) {
        alert('Please enter a valid email address.');
        trackUserEvent('validation_error', {
          question_id: currentQuestion.id,
          error_type: 'invalid_email'
        });
        return;
      }
    }
    
    // Track next button click
    trackUserEvent('next_question', {
      from_question_id: currentQuestion.id,
      from_question_type: currentQuestion.type,
      to_question_index: currentStep + 1
    });
    
    if (currentStep < questionsWithImages.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Final email validation before submission
    if (!isEmailValid(formData.email)) {
      alert('Please enter a valid email address before submitting.');
      trackUserEvent('validation_error', {
        question_id: 'email',
        error_type: 'invalid_email_at_submission'
      });
      return;
    }
    
    // Track form submission
    trackUserEvent('form_submit', {
      total_questions_answered: currentStep + 1
    });
    
    try {
      const response = await fetch('https://2genders.dyndns.org/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          profile: formData,
          visitor_id: visitorId
        })
      });
      const result = await response.json();
      if (response.ok) {
        setMessage('We will search the database for your match. Search results will be sent to your email.');
        trackUserEvent('submission_success', {
          response: result
        });
      } else {
        setMessage(`Error: ${result.error}`);
        trackUserEvent('submission_error', {
          error: result.error
        });
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      trackUserEvent('submission_exception', {
        error_message: error.message
      });
    }
  };

  const renderQuestion = () => {
    const currentQuestion = questionsWithImages[currentStep];
    if (!currentQuestion) return null;

    // Count only multiple choice questions
    const multiChoiceQuestions = questionsWithImages.filter(q => q.type === 'range' );
    const currentMultiChoiceIndex = questionsWithImages.slice(0, currentStep + 1).filter(q => q.type === 'range').length;
    const totalMultiChoiceQuestions = multiChoiceQuestions.length;

    return (
      <div className="question md:py-8">
        <div className="progress-indicator md:text-xl lg:text-2xl">
          Question {currentMultiChoiceIndex}/{totalMultiChoiceQuestions}
          
        </div>
        <label className="question-label md:w-4/5 lg:w-3/4 md:max-w-2xl md:text-xl lg:text-2xl" htmlFor={currentQuestion.id}>
          {currentQuestion.question}
        </label>
        <div className="input-container md:my-12">
          {currentQuestion.type === 'landing' ? (
            <div className="button-group md:gap-4 md:w-4/5 lg:w-3/4 md:max-w-xl">
              <button
                type="button"
                onClick={() => handleButtonClick('Start', currentQuestion.id)}
                className="bg-blue-500 hover:opacity-80 md:py-4 md:text-lg lg:text-xl touch-manipulation"
              >
                Start
              </button>
            </div>
          ) : currentQuestion.type === 'range' ? (
            <div className="button-group md:gap-4 md:w-4/5 lg:w-3/4 md:max-w-xl">
              <button
                type="button"
                onClick={() => handleButtonClick(0, currentQuestion.id)}
                className="bg-green-500 hover:opacity-80 md:py-4 md:text-lg lg:text-xl touch-manipulation"
              >
                Not true at all
              </button>
              <button
                type="button"
                onClick={() => handleButtonClick(3.3, currentQuestion.id)}
                className="bg-green-600 hover:opacity-80 md:py-4 md:text-lg lg:text-xl touch-manipulation"
              >
                Meh
              </button>
              <button
                type="button"
                onClick={() => handleButtonClick(6.6, currentQuestion.id)}
                className="bg-green-700 hover:opacity-80 md:py-4 md:text-lg lg:text-xl touch-manipulation"
              >
                Kind of true
              </button>
              <button
                type="button"
                onClick={() => handleButtonClick(10, currentQuestion.id)}
                className="bg-green-800 hover:opacity-80 md:py-4 md:text-lg lg:text-xl touch-manipulation"
              >
                Totally
              </button>
            </div>
          ) : currentQuestion.type === 'binary' ? (
            <div className="button-group md:gap-4 md:w-4/5 lg:w-3/4 md:max-w-xl">
              {currentQuestion.options.map((option, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => handleButtonClick(option, currentQuestion.id)}
                  className={`bg-blue-500 hover:opacity-80 md:py-4 md:text-lg lg:text-xl touch-manipulation ${
                    option === 'Male' ? 'male-button' : option === 'Female' ? 'female-button' : ''
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : currentQuestion.type === 'free' ? (
            <textarea
              id={currentQuestion.id}
              name={currentQuestion.id}
              value={formData[currentQuestion.id]}
              onChange={handleChange}
              rows={5}
              cols={40}
              placeholder="Be accurate"
              required
              className="w-full p-2.5 mb-5 text-base md:p-4 md:text-lg lg:text-xl md:w-4/5 lg:w-3/4 md:max-w-2xl bg-white border border-gray-300 rounded-md shadow-sm"
            />
          ) : currentQuestion.type === 'email' ? (
            <input
              type="email"
              id={currentQuestion.id}
              name={currentQuestion.id}
              value={formData[currentQuestion.id]}
              onChange={handleChange}
              required
              className="w-full p-2.5 mb-5 text-base md:p-4 md:text-lg lg:text-xl md:w-4/5 lg:w-3/4 md:max-w-2xl bg-white border border-gray-300 rounded-md shadow-sm"
            />
          ) : (
            <input
              type="text"
              id={currentQuestion.id}
              name={currentQuestion.id}
              value={formData[currentQuestion.id]}
              onChange={handleChange}
              required
              className="w-full p-2.5 mb-5 text-base md:p-4 md:text-lg lg:text-xl md:w-4/5 lg:w-3/4 md:max-w-2xl bg-white border border-gray-300 rounded-md shadow-sm"
            />
          )}
        </div>
      </div>
    );
  };

  const currentQuestion = questionsWithImages[currentStep];
  const appStyle = currentQuestion && currentQuestion.image ? {
    backgroundImage: `url(${currentQuestion.image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh',
    height: 'auto'
  } : {};

  return (
    <div className="Questions md:py-6 lg:py-8" style={appStyle}>
      <label className="app-title md:text-3xl lg:text-4xl">2Genders - Find Your Match</label>
      {/* <div className="progress-indicator md:text-xl lg:text-2xl">
        Question {currentStep + 1}/{questionsWithImages.length}
      </div> */}
      {message ? (
        <label className="question-label md:w-4/5 lg:w-3/4 md:max-w-2xl md:text-xl lg:text-2xl">{message}</label>
      ) : (
        <form onSubmit={currentStep === questionsWithImages.length - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}
              className="md:h-auto flex flex-col justify-between">
          {renderQuestion()}
          <div className="buttons md:my-6">
            <div>
              {currentStep === questionsWithImages.length - 1 ? (
                <button
                  type="submit"
                  className="submit-button md:py-4 md:px-8 md:text-lg lg:text-xl touch-manipulation"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              ) : (
                (currentQuestion &&
                  (currentQuestion.type === 'basic' ||
                    currentQuestion.type === 'free' ||
                    currentQuestion.type === 'email')) && (
                  <button
                    type="button"
                    className="next-button md:py-4 md:px-8 md:text-lg lg:text-xl touch-manipulation"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                )
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default Questions;