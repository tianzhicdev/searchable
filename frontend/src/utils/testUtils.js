import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ThemeProvider } from '@material-ui/core/styles';
import { configureStore } from '@reduxjs/toolkit';
import theme from '../themes';
import rootReducer from '../store/reducer';

// Create a custom render function that includes all providers
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: rootReducer,
      preloadedState: {
        account: {
          loggedIn: true,
          user: {
            _id: 'test-user-id',
            username: 'testuser',
            email: 'test@example.com',
            displayName: 'Test User',
            balance: { usd: 100 }
          },
          token: 'test-token'
        },
        ...preloadedState
      }
    }),
    route = '/',
    history = createMemoryHistory({ initialEntries: [route] }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <Router history={history}>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </Router>
      </Provider>
    );
  }

  // Return an object with the store and all of RTL's query functions
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
    history
  };
}

// Helper to wait for loading states to complete
export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    const loadingElements = document.querySelectorAll('[role="progressbar"]');
    expect(loadingElements.length).toBe(0);
  }, { timeout: 3000 });
};

// Helper to mock specific API responses
export const mockApiResponse = (endpoint, response, options = {}) => {
  // Mock implementation without MSW
  console.log('Mock API response:', endpoint, response);
};

// Helper for accessibility testing
export const checkAccessibility = async (container) => {
  const { axe, toHaveNoViolations } = require('jest-axe');
  expect.extend(toHaveNoViolations);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';