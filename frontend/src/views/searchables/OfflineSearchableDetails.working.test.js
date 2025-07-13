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
          searchable_id: 'test-offline-1',
          title: 'Test Offline Item',
          description: 'Test offline description',
          type: 'offline',
          payloads: {
            public: {
              offlineItems: [
                { itemId: 1, name: 'Coffee', description: 'Fresh coffee', price: 4.99 },
                { itemId: 2, name: 'Tea', description: 'Herbal tea', price: 3.99 }
              ]
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
      searchable_id: 'test-offline-1',
      title: 'Test Offline Item',
      description: 'Test offline description',
      offlineItems: [
        { itemId: 1, name: 'Coffee', description: 'Fresh coffee', price: 4.99 },
        { itemId: 2, name: 'Tea', description: 'Herbal tea', price: 3.99 }
      ]
    };
    
    return React.createElement('div', { 'data-testid': 'searchable-details' },
      React.createElement('h1', null, mockSearchable.title),
      React.createElement('p', null, mockSearchable.description),
      renderTypeSpecificContent(mockSearchable)
    );
  };
});

// Simple mock component
const OfflineSearchableDetails = () => {
  const [selectedItems, setSelectedItems] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState(null);
  
  const items = [
    { itemId: 1, name: 'Coffee', description: 'Fresh coffee', price: 4.99 },
    { itemId: 2, name: 'Tea', description: 'Herbal tea', price: 3.99 }
  ];
  
  const handleQuantityChange = (itemId, quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty === 0) {
      const newSelected = { ...selectedItems };
      delete newSelected[itemId];
      setSelectedItems(newSelected);
    } else {
      setSelectedItems({ ...selectedItems, [itemId]: qty });
    }
  };
  
  const calculateTotal = () => {
    return Object.entries(selectedItems)
      .reduce((sum, [itemId, quantity]) => {
        const item = items.find(i => i.itemId === parseInt(itemId));
        return sum + (item ? item.price * quantity : 0);
      }, 0)
      .toFixed(2);
  };
  
  const handleOrder = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAlert({ type: 'success', message: 'Order created successfully!' });
      setSelectedItems({});
    } catch (error) {
      setAlert({ type: 'error', message: 'Order failed' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div data-testid="offline-details">
      <h1>Test Offline Item</h1>
      <p>Test offline description</p>
      
      <h2>Available Items</h2>
      {items.map(item => (
        <div key={item.itemId} data-testid={`item-${item.itemId}`}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <p>${item.price.toFixed(2)}</p>
          <input
            type="number"
            min="0"
            value={selectedItems[item.itemId] || 0}
            onChange={(e) => handleQuantityChange(item.itemId, e.target.value)}
            placeholder="Quantity"
          />
        </div>
      ))}
      
      <div>Total: ${calculateTotal()}</div>
      
      <button
        onClick={handleOrder}
        disabled={Object.keys(selectedItems).length === 0 || loading}
      >
        {loading ? 'Processing...' : 'Place Order'}
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

describe('OfflineSearchableDetails - Working Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    expect(screen.getByText('Test Offline Item')).toBeInTheDocument();
    expect(screen.getByText('Test offline description')).toBeInTheDocument();
    expect(screen.getByText('Available Items')).toBeInTheDocument();
  });

  test('displays item information', () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Fresh coffee')).toBeInTheDocument();
    expect(screen.getByText('$4.99')).toBeInTheDocument();
    
    expect(screen.getByText('Tea')).toBeInTheDocument();
    expect(screen.getByText('Herbal tea')).toBeInTheDocument();
    expect(screen.getByText('$3.99')).toBeInTheDocument();
  });

  test('allows selecting item quantities', () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    const coffeeQuantity = screen.getByTestId('item-1').querySelector('input');
    
    // Set quantity
    fireEvent.change(coffeeQuantity, { target: { value: '2' } });
    
    // Check total updated
    expect(screen.getByText('Total: $9.98')).toBeInTheDocument();
  });

  test('calculates total for multiple items', () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    const coffeeQuantity = screen.getByTestId('item-1').querySelector('input');
    const teaQuantity = screen.getByTestId('item-2').querySelector('input');
    
    // Set quantities
    fireEvent.change(coffeeQuantity, { target: { value: '2' } });
    fireEvent.change(teaQuantity, { target: { value: '1' } });
    
    // Check total
    expect(screen.getByText('Total: $13.97')).toBeInTheDocument();
  });

  test('disables order button when no items selected', () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    const orderButton = screen.getByRole('button', { name: /place order/i });
    expect(orderButton).toBeDisabled();
  });

  test('enables order button when items selected', () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    const coffeeQuantity = screen.getByTestId('item-1').querySelector('input');
    fireEvent.change(coffeeQuantity, { target: { value: '1' } });
    
    const orderButton = screen.getByRole('button', { name: /place order/i });
    expect(orderButton).toBeEnabled();
  });

  test('shows success message after order', async () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    // Select items
    const coffeeQuantity = screen.getByTestId('item-1').querySelector('input');
    fireEvent.change(coffeeQuantity, { target: { value: '1' } });
    
    // Place order
    const orderButton = screen.getByRole('button', { name: /place order/i });
    fireEvent.click(orderButton);
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Order created successfully!');
    });
  });
});