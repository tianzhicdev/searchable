import React from 'react';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  checkAccessibility,
  mockApiResponse
} from '../../utils/testUtils';
import OfflineSearchableDetails from './OfflineSearchableDetails';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock the BaseSearchableDetails component
jest.mock('../../components/BaseSearchableDetails', () => {
  return function MockBaseSearchableDetails({ 
    renderTypeSpecificContent,
    showPricing = true
  }) {
    // Mock searchable data
    const mockSearchable = {
      searchable_id: 'test-offline-1',
      title: 'Coffee Shop Menu',
      description: 'Fresh coffee and pastries',
      seller: 'CoffeeShop',
      tags: ['coffee', 'cafe'],
      offlineItems: [
        {
          itemId: 'item-1',
          name: 'Cappuccino',
          description: 'Rich espresso with steamed milk',
          price: 4.50
        },
        {
          itemId: 'item-2',
          name: 'Croissant',
          description: 'Buttery French pastry',
          price: 3.50
        },
        {
          itemId: 'item-3',
          name: 'Latte',
          description: 'Smooth espresso with milk',
          price: 5.00
        }
      ]
    };
    
    return (
      <div data-testid="base-searchable-details">
        <h1>{mockSearchable.title}</h1>
        <p>{mockSearchable.description}</p>
        <div>Seller: {mockSearchable.seller}</div>
        <div>Tags: {mockSearchable.tags.join(', ')}</div>
        
        {/* Render type-specific content */}
        {renderTypeSpecificContent(mockSearchable)}
      </div>
    );
  };
});

// Mock the hooks
jest.mock('../../hooks/useSearchableDetails', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    SearchableItem: {
      searchable_id: 'test-offline-1',
      title: 'Coffee Shop Menu',
      offlineItems: [
        {
          itemId: 'item-1',
          name: 'Cappuccino',
          description: 'Rich espresso with steamed milk',
          price: 4.50
        },
        {
          itemId: 'item-2',
          name: 'Croissant',
          description: 'Buttery French pastry',
          price: 3.50
        },
        {
          itemId: 'item-3',
          name: 'Latte',
          description: 'Smooth espresso with milk',
          price: 5.00
        }
      ],
      require_address: false
    },
    searchableRating: { average: 4.8, count: 25 },
    loadingRatings: false,
    fetchRatings: jest.fn(),
    createInvoice: jest.fn(),
    createBalancePayment: jest.fn(),
    formatCurrency: jest.fn(price => `$${price.toFixed(2)}`),
    id: 'test-offline-1'
  }))
}));

// Mock the RatingDisplay component
jest.mock('../../components/Rating/RatingDisplay', () => {
  return function MockRatingDisplay({ rating, count }) {
    return (
      <div data-testid="rating-display">
        <span>{rating} stars</span>
        <span>({count} reviews)</span>
      </div>
    );
  };
});

describe('OfflineSearchableDetails Page', () => {
  describe('Component Rendering', () => {
    test('renders offline details page with all elements', async () => {
      const { container } = renderWithProviders(<OfflineSearchableDetails />);
      
      // Check main elements
      expect(screen.getByText('Coffee Shop Menu')).toBeInTheDocument();
      expect(screen.getByText('Fresh coffee and pastries')).toBeInTheDocument();
      expect(screen.getByText('Seller: CoffeeShop')).toBeInTheDocument();
      
      // Check menu items
      expect(screen.getByText('Menu Items')).toBeInTheDocument();
      expect(screen.getByText('Cappuccino')).toBeInTheDocument();
      expect(screen.getByText('Croissant')).toBeInTheDocument();
      expect(screen.getByText('Latte')).toBeInTheDocument();
      
      // Check prices
      expect(screen.getByText('$4.50')).toBeInTheDocument();
      expect(screen.getByText('$3.50')).toBeInTheDocument();
      expect(screen.getByText('$5.00')).toBeInTheDocument();
      
      // Check descriptions
      expect(screen.getByText('Rich espresso with steamed milk')).toBeInTheDocument();
      expect(screen.getByText('Buttery French pastry')).toBeInTheDocument();
      
      // Check accessibility
      await checkAccessibility(container);
    });

    test('displays rating information', () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      expect(screen.getByTestId('rating-display')).toBeInTheDocument();
      expect(screen.getByText('4.8 stars')).toBeInTheDocument();
      expect(screen.getByText('(25 reviews)')).toBeInTheDocument();
    });

    test('shows order button and total section', () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
      expect(screen.getByText('Total: $0.00')).toBeInTheDocument();
    });
  });

  describe('Item Selection', () => {
    test('increments item quantity', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Find increment button for first item
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      
      // Check quantity updated
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      
      // Check total updated
      expect(screen.getByText('Total: $4.50')).toBeInTheDocument();
    });

    test('decrements item quantity', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      // First increment
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      fireEvent.click(incrementButtons[0]);
      
      // Should have quantity 2
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      
      // Now decrement
      const decrementButtons = screen.getAllByRole('button', { name: /-/i });
      fireEvent.click(decrementButtons[0]);
      
      // Should have quantity 1
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      expect(screen.getByText('Total: $4.50')).toBeInTheDocument();
    });

    test('allows direct quantity input', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Find quantity input for first item
      const quantityInputs = screen.getAllByRole('spinbutton');
      
      await userEvent.clear(quantityInputs[0]);
      await userEvent.type(quantityInputs[0], '3');
      
      // Check total updated
      expect(screen.getByText('Total: $13.50')).toBeInTheDocument();
    });

    test('handles multiple item selection', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      
      // Add 2 cappuccinos
      fireEvent.click(incrementButtons[0]);
      fireEvent.click(incrementButtons[0]);
      
      // Add 1 croissant
      fireEvent.click(incrementButtons[1]);
      
      // Add 1 latte
      fireEvent.click(incrementButtons[2]);
      
      // Check total: (2 * 4.50) + 3.50 + 5.00 = 17.50
      expect(screen.getByText('Total: $17.50')).toBeInTheDocument();
    });

    test('prevents negative quantities', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Try to decrement from 0
      const decrementButtons = screen.getAllByRole('button', { name: /-/i });
      fireEvent.click(decrementButtons[0]);
      
      // Should still be 0
      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
      expect(screen.getByText('Total: $0.00')).toBeInTheDocument();
    });

    test('limits maximum quantity', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      const quantityInputs = screen.getAllByRole('spinbutton');
      
      // Try to set very high quantity
      await userEvent.clear(quantityInputs[0]);
      await userEvent.type(quantityInputs[0], '100');
      
      // Should be limited to max (e.g., 99)
      expect(screen.getByDisplayValue('99')).toBeInTheDocument();
    });
  });

  describe('Order Placement', () => {
    test('disables order button when no items selected', () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      const orderButton = screen.getByRole('button', { name: /place order/i });
      expect(orderButton).toBeDisabled();
    });

    test('enables order button when items are selected', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add an item
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      
      const orderButton = screen.getByRole('button', { name: /place order/i });
      expect(orderButton).toBeEnabled();
    });

    test('creates invoice when order is placed', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-456', amount: 4.50 }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add an item
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      
      // Place order
      const orderButton = screen.getByRole('button', { name: /place order/i });
      fireEvent.click(orderButton);
      
      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalledWith(
          'test-offline-1',
          expect.objectContaining({
            items: [{ itemId: 'item-1', quantity: 1 }]
          })
        );
      });
    });

    test('shows success message after order', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-456' }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add item and order
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      
      const orderButton = screen.getByRole('button', { name: /place order/i });
      fireEvent.click(orderButton);
      
      // Check for success message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Order placed successfully/i);
      });
    });

    test('resets cart after successful order', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-456' }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add items
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      fireEvent.click(incrementButtons[1]);
      
      // Place order
      const orderButton = screen.getByRole('button', { name: /place order/i });
      fireEvent.click(orderButton);
      
      // Wait for success
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      // Check cart is reset
      expect(screen.getByText('Total: $0.00')).toBeInTheDocument();
      expect(screen.getAllByDisplayValue('0')).toHaveLength(3);
    });

    test('handles order error', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockRejectedValue(new Error('Order failed'));
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add item and try to order
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      
      const orderButton = screen.getByRole('button', { name: /place order/i });
      fireEvent.click(orderButton);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Order failed/i);
      });
    });
  });

  describe('Address Requirement', () => {
    test('shows address form when required', () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        SearchableItem: {
          ...useSearchableDetails().SearchableItem,
          require_address: true
        }
      });
      
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Should show address fields
      expect(screen.getByLabelText(/delivery address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/street address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/city/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/zip/i)).toBeInTheDocument();
    });

    test('validates address when required', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        SearchableItem: {
          ...useSearchableDetails().SearchableItem,
          require_address: true
        }
      });
      
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add item
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      
      // Try to order without address
      const orderButton = screen.getByRole('button', { name: /place order/i });
      fireEvent.click(orderButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Please provide delivery address/i);
      });
    });

    test('includes address in order when provided', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-789' }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        SearchableItem: {
          ...useSearchableDetails().SearchableItem,
          require_address: true
        },
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add item
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      
      // Fill address
      await userEvent.type(screen.getByPlaceholderText(/street address/i), '123 Main St');
      await userEvent.type(screen.getByPlaceholderText(/city/i), 'San Francisco');
      await userEvent.type(screen.getByPlaceholderText(/zip/i), '94102');
      
      // Place order
      const orderButton = screen.getByRole('button', { name: /place order/i });
      fireEvent.click(orderButton);
      
      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalledWith(
          'test-offline-1',
          expect.objectContaining({
            address: {
              street: '123 Main St',
              city: 'San Francisco',
              zip: '94102'
            }
          })
        );
      });
    });
  });

  describe('Summary Section', () => {
    test('shows order summary', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add multiple items
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]); // 1 cappuccino
      fireEvent.click(incrementButtons[0]); // 2 cappuccinos
      fireEvent.click(incrementButtons[1]); // 1 croissant
      
      // Check summary
      expect(screen.getByText(/order summary/i)).toBeInTheDocument();
      expect(screen.getByText('2x Cappuccino')).toBeInTheDocument();
      expect(screen.getByText('1x Croissant')).toBeInTheDocument();
      expect(screen.getByText('Total: $12.50')).toBeInTheDocument();
    });

    test('updates summary in real-time', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add item
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      
      // Check summary appears
      expect(screen.getByText('1x Cappuccino')).toBeInTheDocument();
      
      // Add more
      fireEvent.click(incrementButtons[0]);
      
      // Check summary updates
      expect(screen.getByText('2x Cappuccino')).toBeInTheDocument();
      
      // Remove one
      const decrementButtons = screen.getAllByRole('button', { name: /-/i });
      fireEvent.click(decrementButtons[0]);
      
      // Check summary updates again
      expect(screen.getByText('1x Cappuccino')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('shows loading state during order placement', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Add item and order
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      fireEvent.click(incrementButtons[0]);
      
      const orderButton = screen.getByRole('button', { name: /place order/i });
      fireEvent.click(orderButton);
      
      // Should show loading
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(orderButton).toBeDisabled();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      const quantityInputs = screen.getAllByRole('spinbutton');
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      
      // Tab to first quantity input
      quantityInputs[0].focus();
      expect(document.activeElement).toBe(quantityInputs[0]);
      
      // Tab to increment button
      userEvent.tab();
      expect(document.activeElement).toBe(incrementButtons[0]);
    });

    test('announces quantity changes to screen readers', async () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      const quantityInputs = screen.getAllByRole('spinbutton');
      
      // Quantity inputs should have proper labels
      expect(quantityInputs[0]).toHaveAttribute('aria-label', expect.stringContaining('Cappuccino'));
      expect(quantityInputs[0]).toHaveAttribute('aria-valuemin', '0');
      expect(quantityInputs[0]).toHaveAttribute('aria-valuemax', '99');
      expect(quantityInputs[0]).toHaveAttribute('aria-valuenow', '0');
    });

    test('provides proper labels for all controls', () => {
      renderWithProviders(<OfflineSearchableDetails />);
      
      // Check button labels
      const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
      const decrementButtons = screen.getAllByRole('button', { name: /-/i });
      
      incrementButtons.forEach((button, index) => {
        expect(button).toHaveAttribute('aria-label');
      });
      
      decrementButtons.forEach((button, index) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
});