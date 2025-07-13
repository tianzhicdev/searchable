import React from 'react';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  checkAccessibility
} from '../../utils/testUtils';
import PublishOfflineSearchable from './PublishOfflineSearchable';

// Mock the BasePublishSearchable component
jest.mock('../../components/BasePublishSearchable', () => {
  return function MockBasePublishSearchable({ 
    searchableType, 
    title, 
    subtitle, 
    renderTypeSpecificContent,
    getTypeSpecificPayload,
    isFormValid,
    customValidation,
    editMode,
    isMinimalMode,
    initialFormData,
    onSuccess,
    submitText,
    loadingText
  }) {
    const [formData, setFormData] = React.useState({
      title: initialFormData?.title || '',
      description: initialFormData?.description || '',
      tags: initialFormData?.tags || [],
      require_address: initialFormData?.require_address || false
    });
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    
    const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    };
    
    const handleSubmit = () => {
      const validationError = customValidation();
      if (validationError) {
        setError(validationError);
      } else {
        setLoading(true);
        setError(null);
        // Simulate async operation
        setTimeout(() => {
          setLoading(false);
          console.log('Publishing with payload:', getTypeSpecificPayload(formData));
          if (onSuccess) onSuccess();
        }, 100);
      }
    };
    
    return (
      <div data-testid="base-publish-searchable">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div data-testid="searchable-type">{searchableType}</div>
        
        {!isMinimalMode && (
          <form>
            <input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Title"
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description"
            />
            
            <label>
              <input
                type="checkbox"
                name="require_address"
                checked={formData.require_address}
                onChange={handleInputChange}
              />
              Require Address
            </label>
          </form>
        )}
        
        {/* Render type-specific content */}
        {renderTypeSpecificContent({ formData, handleInputChange, setError })}
        
        {error && <div role="alert">{error}</div>}
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          data-testid="submit-button"
        >
          {loading ? loadingText : (submitText || 'Publish')}
        </button>
      </div>
    );
  };
});

describe('PublishOfflineSearchable Page', () => {
  describe('Component Rendering', () => {
    test('renders publish offline searchable page with all elements', async () => {
      const { container } = renderWithProviders(<PublishOfflineSearchable />);
      
      // Check main elements
      expect(screen.getByText('Publish Offline Item')).toBeInTheDocument();
      expect(screen.getByText(/Create an item for offline orders/i)).toBeInTheDocument();
      expect(screen.getByTestId('searchable-type')).toHaveTextContent('offline');
      
      // Check form fields
      expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
      expect(screen.getByText('Require Address')).toBeInTheDocument();
      
      // Check offline-specific content
      expect(screen.getByText('Product Items *')).toBeInTheDocument();
      expect(screen.getByText(/Add items that customers can order/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Item Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description (Optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Price (USD)')).toBeInTheDocument();
      
      // Check accessibility
      await checkAccessibility(container);
    });

    test('renders in edit mode with existing data', async () => {
      const editData = {
        title: 'Existing Offline Item',
        description: 'Existing description',
        payloads: {
          public: {
            offlineItems: [
              {
                itemId: 1,
                name: 'Coffee',
                description: 'Premium coffee',
                price: 5.99
              },
              {
                itemId: 2,
                name: 'Tea',
                description: 'Herbal tea',
                price: 3.99
              }
            ]
          }
        }
      };
      
      renderWithProviders(
        <PublishOfflineSearchable />,
        {
          route: '/publish-offline-searchables',
          history: {
            location: {
              state: { editMode: true, editData }
            }
          }
        }
      );
      
      // Check edit mode UI
      expect(screen.getByText('Edit Offline Item')).toBeInTheDocument();
      expect(screen.getByText('Update your offline item details')).toBeInTheDocument();
      
      // Check existing data is loaded
      await waitFor(() => {
        expect(screen.getByDisplayValue('Coffee')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Premium coffee')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5.99')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Tea')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Herbal tea')).toBeInTheDocument();
        expect(screen.getByDisplayValue('3.99')).toBeInTheDocument();
      });
    });

    test('renders in minimal mode', () => {
      renderWithProviders(<PublishOfflineSearchable isMinimalMode={true} />);
      
      // Check minimal mode UI
      expect(screen.getByText('Create Your Catalog')).toBeInTheDocument();
      expect(screen.getByText('Add items to your catalog')).toBeInTheDocument();
      
      // Should not show standard form fields in minimal mode
      expect(screen.queryByPlaceholderText('Title')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Description')).not.toBeInTheDocument();
      
      // Should still show item management
      expect(screen.getByText('Product Items *')).toBeInTheDocument();
    });
  });

  describe('Item Management', () => {
    test('adds new offline items', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Fill in new item details
      const nameInput = screen.getByPlaceholderText('Item Name');
      const descInput = screen.getByPlaceholderText('Description (Optional)');
      const priceInput = screen.getByPlaceholderText('Price (USD)');
      
      await userEvent.type(nameInput, 'Cappuccino');
      await userEvent.type(descInput, 'Rich espresso with steamed milk');
      await userEvent.type(priceInput, '4.50');
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);
      
      // Check item was added
      expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Cappuccino')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Rich espresso with steamed milk')).toBeInTheDocument();
      expect(screen.getByDisplayValue('4.5')).toBeInTheDocument();
      
      // Check form fields are cleared
      expect(screen.getByPlaceholderText('Item Name')).toHaveValue('');
      expect(screen.getByPlaceholderText('Description (Optional)')).toHaveValue('');
      expect(screen.getByPlaceholderText('Price (USD)')).toHaveValue('');
    });

    test('adds multiple items and shows correct count', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add first item
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Espresso');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '3.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      
      // Add second item
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Latte');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '4.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      expect(screen.getByText('Added Items (2)')).toBeInTheDocument();
      
      // Check both items are displayed
      expect(screen.getByDisplayValue('Espresso')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Latte')).toBeInTheDocument();
    });

    test('allows editing items inline', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add an item first
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Original Name');
      await userEvent.type(screen.getByPlaceholderText('Description (Optional)'), 'Original description');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Edit the item
      const nameInput = screen.getByDisplayValue('Original Name');
      const descInput = screen.getByDisplayValue('Original description');
      const priceInput = screen.getByDisplayValue('10');
      
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Name');
      
      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'Updated description');
      
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '15.50');
      
      // Check values were updated
      expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Updated description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('15.5')).toBeInTheDocument();
    });

    test('removes items from list', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add two items
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Item 1');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '5.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Item 2');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '7.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      expect(screen.getByText('Added Items (2)')).toBeInTheDocument();
      
      // Remove first item
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
      
      // Check item was removed
      expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Item 1')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Item 2')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('disables add button when required fields are missing', () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      const addButton = screen.getByRole('button', { name: /add/i });
      
      // Initially disabled
      expect(addButton).toBeDisabled();
      
      // Add name but no price
      fireEvent.change(screen.getByPlaceholderText('Item Name'), {
        target: { value: 'Test Item' }
      });
      expect(addButton).toBeDisabled();
      
      // Add price
      fireEvent.change(screen.getByPlaceholderText('Price (USD)'), {
        target: { value: '10.00' }
      });
      expect(addButton).toBeEnabled();
    });

    test('validates price is greater than zero', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add item with zero price
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Free Item');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '0');
      
      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);
      
      // Check for error message
      expect(screen.getByRole('alert')).toHaveTextContent(/Please enter a valid price greater than 0/i);
    });

    test('validates price is a valid number', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add item with invalid price
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Test Item');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), 'invalid');
      
      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);
      
      // Check for error message
      expect(screen.getByRole('alert')).toHaveTextContent(/Please enter a valid price greater than 0/i);
    });

    test('disables publish button when no items added', () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      const publishButton = screen.getByTestId('submit-button');
      expect(publishButton).toBeDisabled();
    });

    test('enables publish button when at least one item is added', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add an item
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Test Item');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Check publish button is enabled
      const publishButton = screen.getByTestId('submit-button');
      expect(publishButton).toBeEnabled();
    });

    test('shows validation error when trying to publish without items', () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Try to publish without items
      const publishButton = screen.getByTestId('submit-button');
      fireEvent.click(publishButton);
      
      // Check for validation error
      expect(screen.getByRole('alert')).toHaveTextContent(/Please add at least one offline item/i);
    });
  });

  describe('Props and Callbacks', () => {
    test('handles initial data prop', () => {
      const initialData = {
        title: 'Initial Title',
        items: [
          { itemId: 1, name: 'Preset Item', description: 'Preset description', price: 5.99 }
        ]
      };
      
      renderWithProviders(<PublishOfflineSearchable initialData={initialData} />);
      
      // Check initial data is displayed
      expect(screen.getByDisplayValue('Preset Item')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Preset description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5.99')).toBeInTheDocument();
    });

    test('calls onSuccess callback after successful submission', async () => {
      const onSuccess = jest.fn();
      renderWithProviders(<PublishOfflineSearchable onSuccess={onSuccess} />);
      
      // Add an item
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Test Item');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Submit
      const publishButton = screen.getByTestId('submit-button');
      fireEvent.click(publishButton);
      
      // Wait for callback
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    test('uses custom submit text', () => {
      renderWithProviders(<PublishOfflineSearchable submitText="Save Draft" />);
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveTextContent('Save Draft');
    });
  });

  describe('Price Formatting', () => {
    test('handles decimal prices correctly', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add item with decimal price
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Premium Item');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '12.99');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Check price is maintained correctly
      expect(screen.getByDisplayValue('12.99')).toBeInTheDocument();
    });

    test('converts string prices to numbers', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add item
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Test Item');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '15.50');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Edit price to ensure it's handled as number
      const priceInput = screen.getByDisplayValue('15.5');
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '20.75');
      
      expect(screen.getByDisplayValue('20.75')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('shows loading text during submission', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add an item
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Test Item');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Submit
      const publishButton = screen.getByTestId('submit-button');
      fireEvent.click(publishButton);
      
      // Check loading state
      expect(publishButton).toHaveTextContent('Publishing...');
      expect(publishButton).toBeDisabled();
    });

    test('shows custom loading text', async () => {
      renderWithProviders(<PublishOfflineSearchable loadingText="Saving..." />);
      
      // Add an item
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Test Item');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Submit
      const publishButton = screen.getByTestId('submit-button');
      fireEvent.click(publishButton);
      
      // Check custom loading text
      expect(publishButton).toHaveTextContent('Saving...');
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Tab through form elements
      const nameInput = screen.getByPlaceholderText('Item Name');
      const descInput = screen.getByPlaceholderText('Description (Optional)');
      const priceInput = screen.getByPlaceholderText('Price (USD)');
      
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
      
      userEvent.tab();
      expect(document.activeElement).toBe(descInput);
      
      userEvent.tab();
      expect(document.activeElement).toBe(priceInput);
    });

    test('provides proper labels and placeholders', () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Check all inputs have proper labels or placeholders
      expect(screen.getByPlaceholderText('Item Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description (Optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Price (USD)')).toBeInTheDocument();
      expect(screen.getByText('Product Items *')).toBeInTheDocument();
    });

    test('announces item additions to screen readers', async () => {
      renderWithProviders(<PublishOfflineSearchable />);
      
      // Add an item
      await userEvent.type(screen.getByPlaceholderText('Item Name'), 'Test Item');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10.00');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Check for announcement region
      const itemCount = screen.getByText('Added Items (1)');
      expect(itemCount).toBeInTheDocument();
    });
  });
});