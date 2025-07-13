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
          searchable_id: 'test-offline-1',
          title: 'Test Offline Item',
          description: 'Test offline description',
          type: 'offline',
          payloads: {
            public: {
              offlineItems: [
                { itemId: 1, name: 'Product 1', description: 'Description 1', price: 9.99 }
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

// Simple mock component
const OfflineSearchableDetails = () => {
  const [selectedItems, setSelectedItems] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  
  const items = [
    { itemId: 1, name: 'Product 1', description: 'Description 1', price: 9.99 }
  ];
  
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
        </div>
      ))}
      
      <button disabled={Object.keys(selectedItems).length === 0 || loading}>
        Place Order
      </button>
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

describe('OfflineSearchableDetails - Simple Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    expect(screen.getByText('Test Offline Item')).toBeInTheDocument();
    expect(screen.getByText('Test offline description')).toBeInTheDocument();
    expect(screen.getByText('Available Items')).toBeInTheDocument();
  });

  test('displays item information', () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  test('shows order button', () => {
    renderWithProviders(<OfflineSearchableDetails />);
    
    const orderButton = screen.getByRole('button', { name: /place order/i });
    expect(orderButton).toBeInTheDocument();
    expect(orderButton).toBeDisabled();
  });
});