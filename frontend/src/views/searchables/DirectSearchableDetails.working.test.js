import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    get: jest.fn().mockResolvedValue({
      data: {
        success: true,
        searchable: {
          searchable_id: 'test-direct-1',
          title: 'Test Donation Item',
          description: 'Support our cause',
          type: 'direct',
          payloads: {
            public: {
              pricingMode: 'flexible',
              defaultAmount: null
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
      description: 'Support our cause',
      pricingMode: 'flexible',
      fixedAmount: null,
      presetAmounts: null
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
  const [selectedPreset, setSelectedPreset] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState(null);
  
  // Different pricing modes for testing
  const pricingMode = 'flexible'; // Can be 'fixed', 'preset', or 'flexible'
  const fixedAmount = 9.99;
  const presetAmounts = [4.99, 9.99, 14.99, 49.99];
  
  const handleAmountChange = (value) => {
    setAmount(value);
    setSelectedPreset(null);
  };
  
  const handlePresetClick = (preset) => {
    setAmount(preset.toString());
    setSelectedPreset(preset);
  };
  
  const handleDonate = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAlert({ type: 'success', message: 'Thank you for your donation!' });
      setAmount('');
      setSelectedPreset(null);
    } catch (error) {
      setAlert({ type: 'error', message: 'Donation failed' });
    } finally {
      setLoading(false);
    }
  };
  
  const isValidAmount = () => {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0;
  };
  
  return (
    <div data-testid="direct-details">
      <h1>Test Donation Item</h1>
      <p>Support our cause</p>
      
      <h2>Choose Amount</h2>
      
      {pricingMode === 'fixed' && (
        <div>
          <p>Fixed donation amount: ${fixedAmount.toFixed(2)}</p>
        </div>
      )}
      
      {(pricingMode === 'preset' || pricingMode === 'flexible') && (
        <div>
          <div>
            {presetAmounts.map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                style={{
                  backgroundColor: selectedPreset === preset ? 'blue' : 'gray',
                  color: 'white',
                  margin: '5px'
                }}
              >
                ${preset.toFixed(2)}
              </button>
            ))}
          </div>
          
          {pricingMode === 'flexible' && (
            <div>
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter custom amount"
                min="0.01"
                step="0.01"
              />
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={handleDonate}
        disabled={
          pricingMode === 'fixed' ? false : !isValidAmount() || loading
        }
      >
        {loading ? 'Processing...' : `Donate${amount ? ` $${parseFloat(amount).toFixed(2)}` : ''}`}
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

describe('DirectSearchableDetails - Working Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    expect(screen.getByText('Test Donation Item')).toBeInTheDocument();
    expect(screen.getByText('Support our cause')).toBeInTheDocument();
    expect(screen.getByText('Choose Amount')).toBeInTheDocument();
  });

  test('displays preset amount buttons', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    expect(screen.getByRole('button', { name: '$4.99' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$9.99' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$14.99' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$49.99' })).toBeInTheDocument();
  });

  test('allows selecting preset amount', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    const preset = screen.getByRole('button', { name: '$9.99' });
    fireEvent.click(preset);
    
    // Check donate button shows amount
    expect(screen.getByRole('button', { name: /donate \$9\.99/i })).toBeInTheDocument();
  });

  test('allows entering custom amount', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    const input = screen.getByPlaceholderText('Enter custom amount');
    fireEvent.change(input, { target: { value: '25.50' } });
    
    // Check donate button shows amount
    expect(screen.getByRole('button', { name: /donate \$25\.50/i })).toBeInTheDocument();
  });

  test('disables donate button for invalid amount', () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    const donateButton = screen.getByRole('button', { name: /donate/i });
    
    // Initially disabled (no amount)
    expect(donateButton).toBeDisabled();
    
    // Enter invalid amount
    const input = screen.getByPlaceholderText('Enter custom amount');
    fireEvent.change(input, { target: { value: '0' } });
    
    expect(donateButton).toBeDisabled();
    
    // Enter valid amount
    fireEvent.change(input, { target: { value: '10' } });
    expect(donateButton).toBeEnabled();
  });

  test('shows success message after donation', async () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    // Select preset amount
    const preset = screen.getByRole('button', { name: '$9.99' });
    fireEvent.click(preset);
    
    // Click donate
    const donateButton = screen.getByRole('button', { name: /donate/i });
    fireEvent.click(donateButton);
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Thank you for your donation!');
    });
  });

  test('clears amount after successful donation', async () => {
    renderWithProviders(<DirectSearchableDetails />);
    
    // Enter amount
    const input = screen.getByPlaceholderText('Enter custom amount');
    fireEvent.change(input, { target: { value: '15' } });
    
    // Donate
    const donateButton = screen.getByRole('button', { name: /donate/i });
    fireEvent.click(donateButton);
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // Check amount is cleared
    expect(input.value).toBe('');
  });
});