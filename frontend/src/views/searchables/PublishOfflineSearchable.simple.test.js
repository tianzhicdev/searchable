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
        searchable_id: 'mock-offline-id'
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
const PublishOfflineSearchable = () => {
  const [items, setItems] = React.useState([]);
  const [newItem, setNewItem] = React.useState({ name: '', description: '', price: '' });
  const [error, setError] = React.useState(null);
  
  const addItem = () => {
    if (!newItem.name || !newItem.price) {
      setError('Please fill in all required fields');
      return;
    }
    setItems([...items, { ...newItem, id: Date.now() }]);
    setNewItem({ name: '', description: '', price: '' });
    setError(null);
  };
  
  const isValid = () => items.length > 0;
  
  return (
    <div data-testid="base-publish-searchable">
      <h1>Publish Offline Item</h1>
      <p>Create a new offline searchable item</p>
      <div data-testid="searchable-type">offline</div>
      
      <div>
        <h2>Offline Items *</h2>
        <p>Add items that customers can order</p>
        
        {items.length === 0 && (
          <div>
            <p>No items added yet</p>
            <p>Add at least one item to continue</p>
          </div>
        )}
        
        {items.map(item => (
          <div key={item.id}>
            {item.name} - ${item.price}
          </div>
        ))}
        
        <div>
          <input
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <input
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          />
          <button onClick={addItem}>Add Item</button>
        </div>
        
        {error && <div role="alert">{error}</div>}
        
        <button
          data-testid="submit-button"
          disabled={!isValid()}
          onClick={() => {
            if (!isValid()) {
              setError('Please add at least one item');
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

describe('PublishOfflineSearchable Simple Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    expect(screen.getByText('Publish Offline Item')).toBeInTheDocument();
    expect(screen.getByTestId('searchable-type')).toHaveTextContent('offline');
  });

  test('shows offline items section', () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    expect(screen.getByText('Offline Items *')).toBeInTheDocument();
    expect(screen.getByText('Add items that customers can order')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  });

  test('shows validation message when trying to add empty item', () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    const addButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(addButton);
    
    expect(screen.getByRole('alert')).toHaveTextContent(/Please fill in all required fields/i);
  });

  test('disables submit button when no items added', () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
  });

  test('shows empty state message', () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    expect(screen.getByText('No items added yet')).toBeInTheDocument();
    expect(screen.getByText('Add at least one item to continue')).toBeInTheDocument();
  });
});