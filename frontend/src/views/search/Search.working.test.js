import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ThemeProvider } from '@material-ui/core/styles';
import { configureStore } from '@reduxjs/toolkit';
import { theme } from '../../themes';
import rootReducer from '../../store/reducer';
import Search from './Search';

// Mock the Backend
jest.mock('../utilities/Backend', () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => Promise.resolve({
      data: {
        success: true,
        users: [
          {
            user_id: 'test-1',
            username: 'testuser',
            profile_image: 'test.jpg',
            rating_average: 4.5
          }
        ],
        pagination: { total: 1 }
      }
    })),
    get: jest.fn(() => Promise.resolve({
      data: {
        success: true,
        tags: ['test', 'example']
      }
    }))
  }
}));

// Mock child components to avoid their complexity
jest.mock('../search/SearchByUser', () => {
  return function MockSearchByUser() {
    return <div data-testid="search-by-user">Search By User Component</div>;
  };
});

jest.mock('../search/SearchByContent', () => {
  return function MockSearchByContent() {
    return <div data-testid="search-by-content">Search By Content Component</div>;
  };
});

// Simple render helper
function renderWithProviders(ui, { route = '/search?tab=creators' } = {}) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      account: {
        loggedIn: true,
        user: {
          _id: 'test-user-id',
          username: 'testuser'
        },
        token: 'test-token'
      }
    }
  });
  
  const history = createMemoryHistory({ initialEntries: [route] });
  
  // Create theme instance
  const themeInstance = theme({
    borderRadius: 12,
    fontFamily: "'Roboto', sans-serif"
  });
  
  return {
    ...render(
      <Provider store={store}>
        <Router history={history}>
          <ThemeProvider theme={themeInstance}>
            {ui}
          </ThemeProvider>
        </Router>
      </Provider>
    ),
    history
  };
}

describe('Search Page - Working Tests', () => {
  test('renders without crashing', async () => {
    await act(async () => {
      renderWithProviders(<Search />);
    });
    
    // Should render the search by user component by default
    expect(screen.getByTestId('search-by-user')).toBeInTheDocument();
  });

  test('redirects to creators tab when no tab specified', async () => {
    let result;
    await act(async () => {
      result = renderWithProviders(<Search />, { route: '/search' });
    });
    
    await waitFor(() => {
      expect(result.history.location.search).toBe('?tab=creators');
    });
  });

  test('shows SearchByUser when tab=creators', async () => {
    await act(async () => {
      renderWithProviders(<Search />, { route: '/search?tab=creators' });
    });
    
    expect(screen.getByTestId('search-by-user')).toBeInTheDocument();
    expect(screen.queryByTestId('search-by-content')).not.toBeInTheDocument();
  });

  test('shows SearchByContent when tab=content', async () => {
    await act(async () => {
      renderWithProviders(<Search />, { route: '/search?tab=content' });
    });
    
    expect(screen.getByTestId('search-by-content')).toBeInTheDocument();
    expect(screen.queryByTestId('search-by-user')).not.toBeInTheDocument();
  });
});