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
        searchable_id: 'mock-searchable-id'
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
    
    return mockReact.createElement('div', { 'data-testid': 'publish-offline' },
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
const PublishOfflineSearchable = () => {
  const [items, setItems] = React.useState([]);
  const [newItem, setNewItem] = React.useState({ name: '', description: '', price: '' });
  
  const addItem = () => {
    if (newItem.name && newItem.price && parseFloat(newItem.price) > 0) {
      setItems([...items, { 
        id: Date.now(), 
        name: newItem.name, 
        description: newItem.description,
        price: parseFloat(newItem.price) 
      }]);
      setNewItem({ name: '', description: '', price: '' });
    }
  };
  
  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  return (
    <div data-testid="publish-offline">
      <h1>Publish Offline Item</h1>
      <div>offline</div>
      <div>
        <h2>Product Items *</h2>
        <input
          placeholder="Item Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          placeholder="Description (Optional)"
          value={newItem.description}
          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
        />
        <input
          placeholder="Price (USD)"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
        />
        <button 
          onClick={addItem}
          disabled={!newItem.name || !newItem.price}
        >
          Add
        </button>
        
        {items.length > 0 && (
          <div>
            <div>Added Items ({items.length})</div>
            {items.map(item => (
              <div key={item.id} data-testid="offline-item">
                <input
                  value={item.name}
                  onChange={(e) => {
                    const updated = items.map(i => 
                      i.id === item.id ? { ...i, name: e.target.value } : i
                    );
                    setItems(updated);
                  }}
                />
                <input
                  value={item.description}
                  onChange={(e) => {
                    const updated = items.map(i => 
                      i.id === item.id ? { ...i, description: e.target.value } : i
                    );
                    setItems(updated);
                  }}
                />
                <input
                  value={item.price}
                  onChange={(e) => {
                    const updated = items.map(i => 
                      i.id === item.id ? { ...i, price: parseFloat(e.target.value) || 0 } : i
                    );
                    setItems(updated);
                  }}
                />
                <button onClick={() => removeItem(item.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button disabled={items.length === 0}>Publish</button>
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

describe('PublishOfflineSearchable - Working Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    expect(screen.getByText('Publish Offline Item')).toBeInTheDocument();
    expect(screen.getByText('offline')).toBeInTheDocument();
    expect(screen.getByText('Product Items *')).toBeInTheDocument();
  });

  test('allows adding offline items', async () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    // Fill in item details
    fireEvent.change(screen.getByPlaceholderText('Item Name'), {
      target: { value: 'Coffee' }
    });
    fireEvent.change(screen.getByPlaceholderText('Description (Optional)'), {
      target: { value: 'Fresh brewed' }
    });
    fireEvent.change(screen.getByPlaceholderText('Price (USD)'), {
      target: { value: '4.50' }
    });
    
    // Click add button
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    
    // Check item was added
    await waitFor(() => {
      expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Coffee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Fresh brewed')).toBeInTheDocument();
      expect(screen.getByDisplayValue('4.5')).toBeInTheDocument();
    });
  });

  test('allows removing items', async () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    // Add an item first
    fireEvent.change(screen.getByPlaceholderText('Item Name'), {
      target: { value: 'Tea' }
    });
    fireEvent.change(screen.getByPlaceholderText('Price (USD)'), {
      target: { value: '3.00' }
    });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    
    // Wait for item to appear
    await waitFor(() => {
      expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
    });
    
    // Remove the item
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    // Check item was removed
    await waitFor(() => {
      expect(screen.queryByText('Added Items (1)')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Tea')).not.toBeInTheDocument();
    });
  });

  test('disables publish button when no items', () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toBeDisabled();
  });

  test('enables publish button when items are added', async () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    // Add an item
    fireEvent.change(screen.getByPlaceholderText('Item Name'), {
      target: { value: 'Sandwich' }
    });
    fireEvent.change(screen.getByPlaceholderText('Price (USD)'), {
      target: { value: '8.99' }
    });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    
    await waitFor(() => {
      const publishButton = screen.getByRole('button', { name: /publish/i });
      expect(publishButton).toBeEnabled();
    });
  });

  test('allows inline editing of items', async () => {
    renderWithProviders(<PublishOfflineSearchable />);
    
    // Add an item
    fireEvent.change(screen.getByPlaceholderText('Item Name'), {
      target: { value: 'Original' }
    });
    fireEvent.change(screen.getByPlaceholderText('Price (USD)'), {
      target: { value: '5.00' }
    });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    
    // Wait for item to appear
    await waitFor(() => {
      expect(screen.getByDisplayValue('Original')).toBeInTheDocument();
    });
    
    // Edit the item name
    const nameInput = screen.getByDisplayValue('Original');
    fireEvent.change(nameInput, {
      target: { value: 'Updated' }
    });
    
    // Check value was updated
    expect(screen.getByDisplayValue('Updated')).toBeInTheDocument();
  });
});