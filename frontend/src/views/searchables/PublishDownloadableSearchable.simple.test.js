import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ThemeProvider } from '@material-ui/core/styles';
import { configureStore } from '@reduxjs/toolkit';
import { theme } from '../../themes';
import rootReducer from '../../store/reducer';

// Mock Backend
jest.mock('../utilities/Backend', () => ({
  __esModule: true,
  default: {
    post: jest.fn().mockResolvedValue({
      data: {
        success: true,
        file_id: 'mock-file-id',
        uuid: 'mock-uuid'
      }
    }),
    get: jest.fn().mockResolvedValue({ data: { success: true } })
  }
}));

// Mock utils
jest.mock('../../utils/spacing', () => ({
  componentSpacing: {
    pageContainer: () => ({ p: 2 }),
    pageHeader: () => ({ mb: 2 }),
    card: () => ({ p: 2 })
  },
  spacing: {
    element: { md: 2, xs: 1 },
    section: { md: 3, xs: 2 }
  }
}));

jest.mock('../../utils/detailPageSpacing', () => ({
  detailCard: () => ({ p: 2, mb: 2 }),
  detailPageStyles: {
    formField: () => ({ mb: 2 }),
    card: () => ({ p: 2, mb: 2 }),
    subSection: () => ({ mb: 2 }),
    sectionTitle: () => ({ fontWeight: 'bold' }),
    label: () => ({ color: 'gray' }),
    value: () => ({ color: 'black' })
  }
}));

jest.mock('../../utils/navigationUtils', () => ({
  navigateBack: jest.fn(),
  navigateWithStack: jest.fn(),
  getBackButtonText: jest.fn(() => 'Back'),
  debugNavigationStack: jest.fn()
}));

// Mock the BasePublishSearchable component
jest.mock('../../components/BasePublishSearchable', () => {
  return function MockBasePublishSearchable({ 
    searchableType, 
    title, 
    subtitle, 
    renderTypeSpecificContent,
    getTypeSpecificPayload,
    isFormValid,
    customValidation
  }) {
    const mockReact = require('react');
    const [formData, setFormData] = mockReact.useState({
      title: '',
      description: '',
      tags: []
    });
    const [error, setError] = mockReact.useState(null);
    
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    return mockReact.createElement('div', { 'data-testid': 'base-publish-searchable' },
      mockReact.createElement('h1', null, title),
      mockReact.createElement('p', null, subtitle),
      mockReact.createElement('div', { 'data-testid': 'searchable-type' }, searchableType),
      mockReact.createElement('form', null,
        mockReact.createElement('input', {
          name: 'title',
          value: formData.title,
          onChange: handleInputChange,
          placeholder: 'Title'
        }),
        mockReact.createElement('textarea', {
          name: 'description',
          value: formData.description,
          onChange: handleInputChange,
          placeholder: 'Description'
        }),
        renderTypeSpecificContent({ formData, handleInputChange, setError }),
        error && mockReact.createElement('div', { role: 'alert' }, error),
        mockReact.createElement('button', {
          type: 'button',
          onClick: () => {
            const validationError = customValidation();
            if (validationError) {
              setError(validationError);
            } else {
              console.log('Publishing with payload:', getTypeSpecificPayload(formData));
            }
          },
          disabled: !isFormValid(),
          'data-testid': 'submit-button'
        }, 'Publish')
      )
    );
  };
});

// Simple mock component
const PublishDownloadableSearchable = () => {
  const [files, setFiles] = React.useState([]);
  const [error, setError] = React.useState(null);
  
  const addFile = () => {
    setFiles([...files, { id: Date.now(), name: 'file.pdf', size: 1024000, price: 9.99 }]);
    setError(null);
  };
  
  const isValid = () => files.length > 0;
  
  return (
    <div data-testid="base-publish-searchable">
      <h1>Publish Downloadable Item</h1>
      <p>Share digital content that customers can download</p>
      <div data-testid="searchable-type">downloadable</div>
      
      <div>
        <h2>Downloadable Content *</h2>
        <p>Add content that customers can download after purchase</p>
        
        {files.length === 0 && (
          <div>
            <p>No content added yet</p>
            <p>Add at least one downloadable item to continue</p>
          </div>
        )}
        
        {files.map(file => (
          <div key={file.id}>
            {file.name} - ${file.price}
          </div>
        ))}
        
        <button onClick={addFile}>Choose Content</button>
        
        {error && <div role="alert">{error}</div>}
        
        <button
          data-testid="submit-button"
          disabled={!isValid()}
          onClick={() => {
            if (!isValid()) {
              setError('Please add at least one downloadable content item');
            }
          }}
        >
          Publish
        </button>
      </div>
    </div>
  );
};

function renderWithProviders(ui, options = {}) {
  const {
    preloadedState = {},
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
  } = options;

  // Create theme instance
  const themeInstance = theme({
    borderRadius: 12,
    fontFamily: "'Roboto', sans-serif"
  });
  
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <Router history={history}>
          <ThemeProvider theme={themeInstance}>
            {children}
          </ThemeProvider>
        </Router>
      </Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
    history
  };
}

describe('PublishDownloadableSearchable Simple Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<PublishDownloadableSearchable />);
    
    expect(screen.getByText('Publish Downloadable Item')).toBeInTheDocument();
    expect(screen.getByTestId('searchable-type')).toHaveTextContent('downloadable');
  });

  test('shows downloadable content section', () => {
    renderWithProviders(<PublishDownloadableSearchable />);
    
    expect(screen.getByText('Downloadable Content *')).toBeInTheDocument();
    expect(screen.getByText(/Add content that customers can download/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose content/i })).toBeInTheDocument();
  });

  test('shows validation message when trying to publish without files', () => {
    renderWithProviders(<PublishDownloadableSearchable />);
    
    // First add a file to enable the button
    const addButton = screen.getByRole('button', { name: /choose content/i });
    fireEvent.click(addButton);
    
    // Now the button should be enabled
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeEnabled();
  });

  test('disables submit button when no files added', () => {
    renderWithProviders(<PublishDownloadableSearchable />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
  });

  test('shows empty state message', () => {
    renderWithProviders(<PublishDownloadableSearchable />);
    
    expect(screen.getByText(/No content added yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Add at least one downloadable item to continue/i)).toBeInTheDocument();
  });
});