import React from 'react';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  checkAccessibility
} from '../../utils/testUtils';
import PublishDirectSearchable from './PublishDirectSearchable';

// Mock the BasePublishSearchable component
jest.mock('../../components/BasePublishSearchable', () => {
  return function MockBasePublishSearchable({ 
    searchableType, 
    title, 
    subtitle, 
    renderTypeSpecificContent,
    getTypeSpecificPayload,
    isFormValid,
    customRedirectPath,
    editMode,
    submitText,
    loadingText
  }) {
    const [formData, setFormData] = React.useState({
      title: '',
      description: '',
      tags: []
    });
    const [loading, setLoading] = React.useState(false);
    
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = () => {
      setLoading(true);
      // Simulate async operation
      setTimeout(() => {
        setLoading(false);
        const response = { data: { searchable_id: 'mock-direct-id' } };
        console.log('Publishing with payload:', getTypeSpecificPayload(formData));
        console.log('Custom redirect path:', customRedirectPath(response));
      }, 100);
    };
    
    return (
      <div data-testid="base-publish-searchable">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div data-testid="searchable-type">{searchableType}</div>
        
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
        </form>
        
        {/* Render type-specific content */}
        {renderTypeSpecificContent({ formData, handleInputChange })}
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          data-testid="submit-button"
        >
          {loading ? loadingText : submitText}
        </button>
      </div>
    );
  };
});

describe('PublishDirectSearchable Page', () => {
  describe('Component Rendering', () => {
    test('renders publish direct searchable page with all elements', async () => {
      const { container } = renderWithProviders(<PublishDirectSearchable />);
      
      // Check main elements
      expect(screen.getByText('Publish Donation Item')).toBeInTheDocument();
      expect(screen.getByText(/Create an item where supporters can choose/i)).toBeInTheDocument();
      expect(screen.getByTestId('searchable-type')).toHaveTextContent('direct');
      
      // Check form fields
      expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
      
      // Check direct payment-specific content
      expect(screen.getByText('Donation Options')).toBeInTheDocument();
      expect(screen.getByText(/Choose how supporters can donate/i)).toBeInTheDocument();
      expect(screen.getByText('Pricing Mode')).toBeInTheDocument();
      
      // Check pricing mode options
      expect(screen.getByLabelText(/Fixed Amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Preset Options/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Flexible/i)).toBeInTheDocument();
      
      // Check default state (flexible should be selected)
      expect(screen.getByDisplayValue('flexible')).toBeChecked();
      
      // Check accessibility
      await checkAccessibility(container);
    });

    test('renders in edit mode with existing data', async () => {
      const editData = {
        title: 'Existing Donation',
        description: 'Existing description',
        payloads: {
          public: {
            pricingMode: 'fixed',
            fixedAmount: 25.00
          }
        }
      };
      
      renderWithProviders(
        <PublishDirectSearchable />,
        {
          route: '/publish-direct-searchables',
          history: {
            location: {
              state: { editMode: true, editData }
            }
          }
        }
      );
      
      // Check edit mode UI
      expect(screen.getByText('Edit Donation Item')).toBeInTheDocument();
      expect(screen.getByText('Update your donation item details')).toBeInTheDocument();
      
      // Check existing data is loaded
      await waitFor(() => {
        expect(screen.getByDisplayValue('fixed')).toBeChecked();
        expect(screen.getByDisplayValue('25')).toBeInTheDocument();
      });
    });

    test('handles backward compatibility with old defaultAmount', async () => {
      const editData = {
        title: 'Legacy Donation',
        defaultAmount: 15.99 // Old format
      };
      
      renderWithProviders(
        <PublishDirectSearchable />,
        {
          route: '/publish-direct-searchables',
          history: {
            location: {
              state: { editMode: true, editData }
            }
          }
        }
      );
      
      // Should convert to fixed pricing mode
      await waitFor(() => {
        expect(screen.getByDisplayValue('fixed')).toBeChecked();
        expect(screen.getByDisplayValue('15.99')).toBeInTheDocument();
      });
    });
  });

  describe('Pricing Mode Selection', () => {
    test('switches between pricing modes', async () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // Start with flexible (default)
      expect(screen.getByDisplayValue('flexible')).toBeChecked();
      expect(screen.getByText(/Supporters can enter any amount/i)).toBeInTheDocument();
      
      // Switch to fixed
      const fixedRadio = screen.getByLabelText(/Fixed Amount/i);
      fireEvent.click(fixedRadio);
      
      expect(screen.getByDisplayValue('fixed')).toBeChecked();
      expect(screen.getByText('Fixed Amount')).toBeInTheDocument();
      expect(screen.getByDisplayValue('9.99')).toBeInTheDocument(); // Default value
      
      // Switch to preset
      const presetRadio = screen.getByLabelText(/Preset Options/i);
      fireEvent.click(presetRadio);
      
      expect(screen.getByDisplayValue('preset')).toBeChecked();
      expect(screen.getByText('Preset Amount Options (1-3 options)')).toBeInTheDocument();
      
      // Should show default preset amounts
      expect(screen.getByDisplayValue('4.99')).toBeInTheDocument();
      expect(screen.getByDisplayValue('9.99')).toBeInTheDocument();
      expect(screen.getByDisplayValue('14.99')).toBeInTheDocument();
    });

    test('shows appropriate content for each pricing mode', () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // Test fixed mode
      const fixedRadio = screen.getByLabelText(/Fixed Amount/i);
      fireEvent.click(fixedRadio);
      
      expect(screen.getByText(/Supporters will donate exactly this amount/i)).toBeInTheDocument();
      
      // Test preset mode
      const presetRadio = screen.getByLabelText(/Preset Options/i);
      fireEvent.click(presetRadio);
      
      expect(screen.getByText(/Supporters will choose from these preset amounts/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add option/i })).toBeInTheDocument();
      
      // Test flexible mode
      const flexibleRadio = screen.getByLabelText(/Flexible/i);
      fireEvent.click(flexibleRadio);
      
      expect(screen.getByText(/Default quick options.*will be shown/i)).toBeInTheDocument();
    });
  });

  describe('Fixed Amount Mode', () => {
    beforeEach(() => {
      renderWithProviders(<PublishDirectSearchable />);
      // Switch to fixed mode
      const fixedRadio = screen.getByLabelText(/Fixed Amount/i);
      fireEvent.click(fixedRadio);
    });

    test('allows editing fixed amount', async () => {
      const amountInput = screen.getByDisplayValue('9.99');
      
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '25.50');
      
      expect(screen.getByDisplayValue('25.5')).toBeInTheDocument();
    });

    test('validates fixed amount is greater than zero', () => {
      const amountInput = screen.getByDisplayValue('9.99');
      
      fireEvent.change(amountInput, { target: { value: '0' } });
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    test('handles decimal values correctly', async () => {
      const amountInput = screen.getByDisplayValue('9.99');
      
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '12.345');
      
      // Should maintain decimal precision
      expect(screen.getByDisplayValue('12.345')).toBeInTheDocument();
    });
  });

  describe('Preset Amount Mode', () => {
    beforeEach(() => {
      renderWithProviders(<PublishDirectSearchable />);
      // Switch to preset mode
      const presetRadio = screen.getByLabelText(/Preset Options/i);
      fireEvent.click(presetRadio);
    });

    test('displays default preset amounts', () => {
      // Check default preset values
      expect(screen.getByDisplayValue('4.99')).toBeInTheDocument();
      expect(screen.getByDisplayValue('9.99')).toBeInTheDocument();
      expect(screen.getByDisplayValue('14.99')).toBeInTheDocument();
    });

    test('allows editing preset amounts', async () => {
      const firstAmountInput = screen.getByDisplayValue('4.99');
      
      await userEvent.clear(firstAmountInput);
      await userEvent.type(firstAmountInput, '5.99');
      
      expect(screen.getByDisplayValue('5.99')).toBeInTheDocument();
    });

    test('adds new preset amount', () => {
      // Initially should have 3 preset amounts
      expect(screen.getAllByDisplayValue(/\d+\.\d+/)).toHaveLength(3);
      
      // Remove one to make room for adding
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
      
      // Now add a new one
      const addButton = screen.getByRole('button', { name: /add option/i });
      fireEvent.click(addButton);
      
      // Should have 3 inputs again
      expect(screen.getAllByDisplayValue(/\d+/)).toHaveLength(3);
    });

    test('removes preset amount', () => {
      // Initially should have 3 preset amounts
      const initialInputs = screen.getAllByDisplayValue(/\d+\.\d+/);
      expect(initialInputs).toHaveLength(3);
      
      // Remove one
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
      
      // Should have 2 inputs
      expect(screen.getAllByDisplayValue(/\d+\.\d+/)).toHaveLength(2);
      expect(screen.queryByDisplayValue('4.99')).not.toBeInTheDocument();
    });

    test('limits maximum preset amounts to 3', () => {
      // Should already have 3 amounts, add button should not add more
      const addButton = screen.getByRole('button', { name: /add option/i });
      
      // Should be disabled or not add more than 3
      fireEvent.click(addButton);
      
      // Should still have only 3 inputs
      expect(screen.getAllByDisplayValue(/\d+\.\d+/)).toHaveLength(3);
    });

    test('prevents removing the last preset amount', () => {
      // Remove amounts until only 1 remains
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      
      fireEvent.click(deleteButtons[0]); // Remove first
      fireEvent.click(deleteButtons[1]); // Remove second (now first)
      
      // Should have 1 amount left
      expect(screen.getAllByDisplayValue(/\d+\.\d+/)).toHaveLength(1);
      
      // Should not show delete button for the last amount
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    test('validates at least one valid preset amount', () => {
      // Set all amounts to zero
      const amountInputs = screen.getAllByDisplayValue(/\d+\.\d+/);
      
      amountInputs.forEach(input => {
        fireEvent.change(input, { target: { value: '0' } });
      });
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Flexible Mode', () => {
    test('shows flexible mode description', () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // Flexible should be default
      expect(screen.getByText(/Supporters can enter any amount/i)).toBeInTheDocument();
      expect(screen.getByText(/Default quick options.*will be shown/i)).toBeInTheDocument();
    });

    test('does not require validation for flexible mode', () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // In flexible mode, form should be valid by default
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeEnabled();
    });
  });

  describe('Form Validation', () => {
    test('validates fixed amount greater than zero', () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // Switch to fixed mode
      const fixedRadio = screen.getByLabelText(/Fixed Amount/i);
      fireEvent.click(fixedRadio);
      
      // Set amount to zero
      const amountInput = screen.getByDisplayValue('9.99');
      fireEvent.change(amountInput, { target: { value: '0' } });
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
      
      // Set valid amount
      fireEvent.change(amountInput, { target: { value: '10.00' } });
      expect(submitButton).toBeEnabled();
    });

    test('validates preset amounts', () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // Switch to preset mode
      const presetRadio = screen.getByLabelText(/Preset Options/i);
      fireEvent.click(presetRadio);
      
      // Set all amounts to zero
      const amountInputs = screen.getAllByDisplayValue(/\d+\.\d+/);
      amountInputs.forEach(input => {
        fireEvent.change(input, { target: { value: '0' } });
      });
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
      
      // Set one valid amount
      fireEvent.change(amountInputs[0], { target: { value: '5.00' } });
      expect(submitButton).toBeEnabled();
    });
  });

  describe('Payload Generation', () => {
    test('generates correct payload for fixed mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      renderWithProviders(<PublishDirectSearchable />);
      
      // Switch to fixed mode and set amount
      const fixedRadio = screen.getByLabelText(/Fixed Amount/i);
      fireEvent.click(fixedRadio);
      
      const amountInput = screen.getByDisplayValue('9.99');
      fireEvent.change(amountInput, { target: { value: '15.50' } });
      
      // Submit to see payload
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Check console output for payload
      expect(consoleSpy).toHaveBeenCalledWith(
        'Publishing with payload:',
        expect.objectContaining({
          pricingMode: 'fixed',
          fixedAmount: 15.5,
          defaultAmount: 15.5 // Backward compatibility
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('generates correct payload for preset mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      renderWithProviders(<PublishDirectSearchable />);
      
      // Switch to preset mode
      const presetRadio = screen.getByLabelText(/Preset Options/i);
      fireEvent.click(presetRadio);
      
      // Submit to see payload
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Check console output for payload
      expect(consoleSpy).toHaveBeenCalledWith(
        'Publishing with payload:',
        expect.objectContaining({
          pricingMode: 'preset',
          presetAmounts: [4.99, 9.99, 14.99],
          defaultAmount: 4.99 // First preset as default
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('generates correct payload for flexible mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      renderWithProviders(<PublishDirectSearchable />);
      
      // Flexible is default, just submit
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Check console output for payload
      expect(consoleSpy).toHaveBeenCalledWith(
        'Publishing with payload:',
        expect.objectContaining({
          pricingMode: 'flexible',
          defaultAmount: null
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Custom Redirect', () => {
    test('generates correct redirect path', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      renderWithProviders(<PublishDirectSearchable />);
      
      // Submit to trigger redirect path generation
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Check console output for redirect path
      expect(consoleSpy).toHaveBeenCalledWith(
        'Custom redirect path:',
        '/direct-item/mock-direct-id'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    test('shows loading text during submission', async () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // Submit
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Check loading state
      expect(submitButton).toHaveTextContent('Publishing...');
      expect(submitButton).toBeDisabled();
    });

    test('shows update text in edit mode', () => {
      const editData = { title: 'Test', defaultAmount: 10 };
      
      renderWithProviders(
        <PublishDirectSearchable />,
        {
          route: '/publish-direct-searchables',
          history: {
            location: {
              state: { editMode: true, editData }
            }
          }
        }
      );
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveTextContent('Update');
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // Tab through radio buttons
      const fixedRadio = screen.getByLabelText(/Fixed Amount/i);
      const presetRadio = screen.getByLabelText(/Preset Options/i);
      const flexibleRadio = screen.getByLabelText(/Flexible/i);
      
      fixedRadio.focus();
      expect(document.activeElement).toBe(fixedRadio);
      
      userEvent.tab();
      expect(document.activeElement).toBe(presetRadio);
      
      userEvent.tab();
      expect(document.activeElement).toBe(flexibleRadio);
    });

    test('provides proper labels and fieldsets', () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // Check fieldset has proper legend
      expect(screen.getByRole('group', { name: /pricing mode/i })).toBeInTheDocument();
      
      // Check radio buttons have proper labels
      expect(screen.getByLabelText(/Fixed Amount.*Supporters donate exactly/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Preset Options.*choose from up to 3/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Flexible.*choose any amount/i)).toBeInTheDocument();
    });

    test('announces pricing mode changes', () => {
      renderWithProviders(<PublishDirectSearchable />);
      
      // Switch to fixed mode
      const fixedRadio = screen.getByLabelText(/Fixed Amount/i);
      fireEvent.click(fixedRadio);
      
      // Should show fixed amount section
      expect(screen.getByText('Fixed Amount')).toBeInTheDocument();
      
      // Switch to preset mode
      const presetRadio = screen.getByLabelText(/Preset Options/i);
      fireEvent.click(presetRadio);
      
      // Should show preset options section
      expect(screen.getByText('Preset Amount Options (1-3 options)')).toBeInTheDocument();
    });
  });
});