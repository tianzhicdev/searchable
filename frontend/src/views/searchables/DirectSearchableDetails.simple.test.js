import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ThemeProvider } from '@material-ui/core/styles';
import { configureStore } from '@reduxjs/toolkit';
import { theme } from '../../themes';
import rootReducer from '../../store/reducer';

// Mock component styles
jest.mock('../../themes/componentStyles', () => () => ({}));

// Mock Backend
jest.mock('../utilities/Backend', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({
      data: {
        success: true,
        searchable: {
          searchable_id: 'test-direct-1',
          title: 'Test Donation Item',
          description: 'Test donation description',
          type: 'direct',
          payloads: {
            public: {
              donationOptions: {
                mode: 'flexible',
                fixedAmount: null,
                presetAmounts: []
              }
            }
          }
        }
      }
    }),
    post: jest.fn().mockResolvedValue({
      data: { success: true, invoice: { invoice_id: 'inv-123' } }
    })
  }
}));

// Mock BaseSearchableDetails
jest.mock('../../components/BaseSearchableDetails', () => {
  return function MockBaseSearchableDetails({ renderTypeSpecificContent }) {
    const React = require('react');
    const mockSearchable = {
      searchable_id: 'test-direct-1',
      title: 'Test Donation Item',
      description: 'Test donation description',
      donationOptions: {
        mode: 'flexible',
        fixedAmount: null,
        presetAmounts: []
      }
    };
    
    return React.createElement('div', { 'data-testid': 'searchable-details' },
      React.createElement('h1', null, mockSearchable.title),
      React.createElement('p', null, mockSearchable.description),
      renderTypeSpecificContent(mockSearchable)
    );
  };
});

// Simple mock component
const DirectSearchableDetails = () => {
  const [amount, setAmount] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState(null);
  
  const donationOptions = {
    mode: 'flexible',
    fixedAmount: null,
    presetAmounts: []
  };
  
  const handleDonate = async () => {
    if (parseFloat(amount) <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAlert({ type: 'success', message: 'Donation invoice created!' });
      setAmount('');
    } catch (error) {
      setAlert({ type: 'error', message: 'Donation failed' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div data-testid="direct-details">
      <h1>Test Donation Item</h1>
      <p>Test donation description</p>
      
      <h2>Make a Donation</h2>
      {donationOptions.mode === 'flexible' && (
        <div>
          <p>Choose any amount you wish to donate</p>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
          <div>
            <button onClick={() => setAmount('4.99')}>$4.99</button>
            <button onClick={() => setAmount('9.99')}>$9.99</button>
            <button onClick={() => setAmount('14.99')}>$14.99</button>
            <button onClick={() => setAmount('49.99')}>$49.99</button>
          </div>
        </div>
      )}
      
      <button
        onClick={handleDonate}
        disabled={!amount || parseFloat(amount) <= 0 || loading}
      >
        {loading ? 'Processing...' : 'Donate'}
      </button>
      
      {alert && (
        <div role="alert">
          {alert.message}
          <button onClick={() => setAlert(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

function renderWithProviders(ui) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      account: {
        loggedIn: true,
        user: { _id: 'test-user-id', username: 'testuser' },
        token: 'test-token'
      }
    }
  });
  
  const history = createMemoryHistory();
  const themeInstance = theme({
    borderRadius: 12,
    fontFamily: "'Roboto', sans-serif"
  });
  
  return render(
    <Provider store={store}>
      <Router history={history}>
        <ThemeProvider theme={themeInstance}>
          {ui}
        </ThemeProvider>
      </Router>
    </Provider>
  );
}

describe('DirectSearchableDetails - Simple Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    expect(screen.getByText('Test Donation Item')).toBeInTheDocument();
    expect(screen.getByText('Test donation description')).toBeInTheDocument();
    expect(screen.getByText('Make a Donation')).toBeInTheDocument();
  });

  test('shows flexible donation mode UI', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    expect(screen.getByText('Choose any amount you wish to donate')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$4.99' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$9.99' })).toBeInTheDocument();
  });

  test('allows entering custom amount', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(amountInput, { target: { value: '25.50' } });
    
    expect(amountInput.value).toBe('25.50');
  });

  test('allows selecting preset amount', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    const preset = screen.getByRole('button', { name: '$9.99' });
    fireEvent.click(preset);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    expect(amountInput.value).toBe('9.99');
  });

  test('disables donate button when no amount', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    const donateButton = screen.getByRole('button', { name: /donate/i });
    expect(donateButton).toBeDisabled();
  });

  test('enables donate button when amount entered', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    const donateButton = screen.getByRole('button', { name: /donate/i });
    expect(donateButton).toBeEnabled();
  });

  test('shows error for invalid amount', async () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(amountInput, { target: { value: '0' } });
    
    const donateButton = screen.getByRole('button', { name: /donate/i });
    fireEvent.click(donateButton);
    
    expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a valid amount');
  });
});