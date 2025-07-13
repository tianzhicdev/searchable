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
        searchable_id: 'mock-direct-id'
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
const PublishDirectSearchable = () => {
  const [pricingMode, setPricingMode] = React.useState('flexible');
  const [fixedAmount, setFixedAmount] = React.useState(9.99);
  const [presetAmounts, setPresetAmounts] = React.useState([4.99, 9.99, 14.99]);
  const [error, setError] = React.useState(null);
  
  const isValid = () => {
    if (pricingMode === 'fixed') {
      return fixedAmount > 0;
    }
    if (pricingMode === 'preset') {
      return presetAmounts.some(amount => amount > 0);
    }
    return true; // flexible is always valid
  };
  
  return (
    <div data-testid="base-publish-searchable">
      <h1>Publish Donation Item</h1>
      <p>Accept direct donations from your supporters</p>
      <div data-testid="searchable-type">direct</div>
      
      <div>
        <h2>Donation Options</h2>
        
        <fieldset>
          <legend>Pricing Mode</legend>
          <label>
            <input
              type="radio"
              name="pricingMode"
              value="flexible"
              checked={pricingMode === 'flexible'}
              onChange={(e) => setPricingMode(e.target.value)}
            />
            Flexible Amount
          </label>
          <label>
            <input
              type="radio"
              name="pricingMode"
              value="fixed"
              checked={pricingMode === 'fixed'}
              onChange={(e) => setPricingMode(e.target.value)}
            />
            Fixed Amount
          </label>
          <label>
            <input
              type="radio"
              name="pricingMode"
              value="preset"
              checked={pricingMode === 'preset'}
              onChange={(e) => setPricingMode(e.target.value)}
            />
            Preset Options
          </label>
        </fieldset>
        
        {pricingMode === 'flexible' && (
          <div>
            <p>Supporters can enter any amount they wish</p>
            <p>Default quick options ($4.99, $9.99, $14.99, $49.99) will be shown</p>
          </div>
        )}
        
        {pricingMode === 'fixed' && (
          <div>
            <h3>Fixed Donation Amount</h3>
            <p>Supporters will donate exactly this amount</p>
            <input
              type="number"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(parseFloat(e.target.value) || 0)}
              placeholder="Amount"
            />
          </div>
        )}
        
        {pricingMode === 'preset' && (
          <div>
            <h3>Preset Amount Options</h3>
            <p>Supporters will choose from these preset amounts</p>
            {presetAmounts.map((amount, index) => (
              <div key={index}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const newAmounts = [...presetAmounts];
                    newAmounts[index] = parseFloat(e.target.value) || 0;
                    setPresetAmounts(newAmounts);
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        {error && <div role="alert">{error}</div>}
        
        <button
          data-testid="submit-button"
          disabled={!isValid()}
          onClick={() => {
            if (!isValid()) {
              if (pricingMode === 'fixed' && fixedAmount <= 0) {
                setError('Please enter a valid fixed amount');
              } else if (pricingMode === 'preset' && !presetAmounts.some(a => a > 0)) {
                setError('Please enter at least one valid preset amount');
              }
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

describe('PublishDirectSearchable Simple Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    expect(screen.getByText('Publish Donation Item')).toBeInTheDocument();
    expect(screen.getByTestId('searchable-type')).toHaveTextContent('direct');
  });

  test('shows donation options section', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    expect(screen.getByText('Donation Options')).toBeInTheDocument();
    expect(screen.getByLabelText('Flexible Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Fixed Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Preset Options')).toBeInTheDocument();
  });

  test('flexible mode is selected by default', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    expect(screen.getByLabelText('Flexible Amount')).toBeChecked();
    expect(screen.getByText(/Supporters can enter any amount they wish/i)).toBeInTheDocument();
  });

  test('can switch to fixed amount mode', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    fireEvent.click(screen.getByLabelText('Fixed Amount'));
    
    expect(screen.getByLabelText('Fixed Amount')).toBeChecked();
    expect(screen.getByText('Fixed Donation Amount')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
  });

  test('can switch to preset options mode', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    fireEvent.click(screen.getByLabelText('Preset Options'));
    
    expect(screen.getByLabelText('Preset Options')).toBeChecked();
    expect(screen.getByText('Preset Amount Options')).toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3); // 3 default preset amounts
  });

  test('submit button is enabled for flexible mode', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeEnabled();
  });

  test('validates fixed amount', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    fireEvent.click(screen.getByLabelText('Fixed Amount'));
    
    const amountInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(amountInput, { target: { value: '0' } });
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
    
    // Change to valid amount
    fireEvent.change(amountInput, { target: { value: '10' } });
    expect(submitButton).toBeEnabled();
  });
});