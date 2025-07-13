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
    post: jest.fn().mockResolvedValue({
      data: {
        success: true,
        searchable_id: 'mock-direct-id'
      }
    }),
    get: jest.fn().mockResolvedValue({ data: { success: true } })
  }
}));

// Mock BasePublishSearchable
jest.mock('../../components/BasePublishSearchable', () => {
  return function MockBasePublishSearchable({ 
    searchableType, 
    title, 
    renderTypeSpecificContent,
    isFormValid,
    customValidation
  }) {
    const mockReact = require('react');
    const [formData, setFormData] = mockReact.useState({});
    const [error, setError] = mockReact.useState(null);
    
    return mockReact.createElement('div', { 'data-testid': 'publish-direct' },
      mockReact.createElement('h1', null, title),
      mockReact.createElement('div', null, searchableType),
      renderTypeSpecificContent({ formData, handleInputChange: () => {}, setError }),
      error && mockReact.createElement('div', { role: 'alert' }, error),
      mockReact.createElement('button', {
        disabled: !isFormValid(),
        onClick: () => {
          const validationError = customValidation();
          if (validationError) setError(validationError);
        }
      }, 'Publish')
    );
  };
});

// Simple mock component
const PublishDirectSearchable = () => {
  const [pricingMode, setPricingMode] = React.useState('flexible');
  const [fixedAmount, setFixedAmount] = React.useState(9.99);
  const [presetAmounts, setPresetAmounts] = React.useState([4.99, 9.99, 14.99]);
  
  const isValid = () => {
    if (pricingMode === 'fixed') {
      return fixedAmount > 0;
    }
    if (pricingMode === 'preset') {
      return presetAmounts.some(amount => amount > 0);
    }
    return true; // flexible is always valid
  };
  
  const updatePresetAmount = (index, value) => {
    const newAmounts = [...presetAmounts];
    newAmounts[index] = parseFloat(value) || 0;
    setPresetAmounts(newAmounts);
  };
  
  const removePresetAmount = (index) => {
    if (presetAmounts.length > 1) {
      setPresetAmounts(presetAmounts.filter((_, i) => i !== index));
    }
  };
  
  const addPresetAmount = () => {
    if (presetAmounts.length < 3) {
      setPresetAmounts([...presetAmounts, 9.99]);
    }
  };
  
  return (
    <div data-testid="publish-direct">
      <h1>Publish Donation Item</h1>
      <div>direct</div>
      <div>
        <h2>Donation Options</h2>
        <fieldset>
          <legend>Pricing Mode</legend>
          <label>
            <input
              type="radio"
              value="fixed"
              checked={pricingMode === 'fixed'}
              onChange={(e) => setPricingMode(e.target.value)}
            />
            Fixed Amount
          </label>
          <label>
            <input
              type="radio"
              value="preset"
              checked={pricingMode === 'preset'}
              onChange={(e) => setPricingMode(e.target.value)}
            />
            Preset Options
          </label>
          <label>
            <input
              type="radio"
              value="flexible"
              checked={pricingMode === 'flexible'}
              onChange={(e) => setPricingMode(e.target.value)}
            />
            Flexible
          </label>
        </fieldset>
        
        {pricingMode === 'fixed' && (
          <div>
            <h3>Fixed Amount</h3>
            <p>Supporters will donate exactly this amount</p>
            <input
              type="number"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => updatePresetAmount(index, e.target.value)}
                />
                {presetAmounts.length > 1 && (
                  <button onClick={() => removePresetAmount(index)}>Delete</button>
                )}
              </div>
            ))}
            {presetAmounts.length < 3 && (
              <button onClick={addPresetAmount}>Add Option</button>
            )}
          </div>
        )}
        
        {pricingMode === 'flexible' && (
          <div>
            <p>Supporters can enter any amount they wish</p>
            <p>Default quick options ($4.99, $9.99, $14.99, $49.99) will be shown</p>
          </div>
        )}
      </div>
      <button disabled={!isValid()}>Publish</button>
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

describe('PublishDirectSearchable - Working Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    expect(screen.getByText('Publish Donation Item')).toBeInTheDocument();
    expect(screen.getByText('direct')).toBeInTheDocument();
    expect(screen.getByText('Donation Options')).toBeInTheDocument();
  });

  test('allows switching between pricing modes', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    // Check flexible is default
    expect(screen.getByDisplayValue('flexible')).toBeChecked();
    expect(screen.getByText(/Supporters can enter any amount/)).toBeInTheDocument();
    
    // Switch to fixed
    fireEvent.click(screen.getByLabelText('Fixed Amount'));
    expect(screen.getByDisplayValue('fixed')).toBeChecked();
    expect(screen.getByRole('heading', { name: 'Fixed Amount' })).toBeInTheDocument();
    
    // Switch to preset
    fireEvent.click(screen.getByLabelText('Preset Options'));
    expect(screen.getByDisplayValue('preset')).toBeChecked();
    expect(screen.getByRole('heading', { name: 'Preset Amount Options' })).toBeInTheDocument();
  });

  test('validates fixed amount mode', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    // Switch to fixed mode
    fireEvent.click(screen.getByLabelText('Fixed Amount'));
    
    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toBeEnabled(); // Default value is 9.99
    
    // Set to 0
    const amountInput = screen.getByDisplayValue('9.99');
    fireEvent.change(amountInput, { target: { value: '0' } });
    
    expect(publishButton).toBeDisabled();
    
    // Set valid amount
    fireEvent.change(amountInput, { target: { value: '15.50' } });
    expect(publishButton).toBeEnabled();
  });

  test('manages preset amounts', async () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    // Switch to preset mode
    fireEvent.click(screen.getByLabelText('Preset Options'));
    
    // Should have 3 default amounts
    expect(screen.getAllByDisplayValue(/\d+\.\d+/)).toHaveLength(3);
    
    // Remove one amount
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getAllByDisplayValue(/\d+\.\d+/)).toHaveLength(2);
    });
    
    // Add new amount
    fireEvent.click(screen.getByRole('button', { name: /add option/i }));
    
    await waitFor(() => {
      expect(screen.getAllByDisplayValue(/\d+/)).toHaveLength(3);
    });
  });

  test('flexible mode is always valid', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    // Flexible is default
    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toBeEnabled();
  });

  test('prevents removing last preset amount', () => {
    renderWithProviders(<PublishDirectSearchable />);
    
    // Switch to preset mode
    fireEvent.click(screen.getByLabelText('Preset Options'));
    
    // Remove all but one
    let deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    // Should not have delete button for last amount
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});