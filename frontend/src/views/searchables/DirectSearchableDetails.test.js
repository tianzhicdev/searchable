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
import DirectSearchableDetails from './DirectSearchableDetails';

// Mock the BaseSearchableDetails component
jest.mock('../../components/BaseSearchableDetails', () => {
  return function MockBaseSearchableDetails({ 
    renderTypeSpecificContent,
    showPricing = true
  }) {
    // Mock searchable data
    const mockSearchable = {
      searchable_id: 'test-direct-1',
      title: 'Support My Work',
      description: 'Help me create more content',
      seller: 'ContentCreator',
      tags: ['donation', 'support'],
      pricingMode: 'flexible',
      fixedAmount: null,
      presetAmounts: null
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
      searchable_id: 'test-direct-1',
      title: 'Support My Work',
      pricingMode: 'flexible',
      fixedAmount: null,
      presetAmounts: null,
      defaultAmount: null
    },
    searchableRating: { average: 5.0, count: 50 },
    loadingRatings: false,
    fetchRatings: jest.fn(),
    createInvoice: jest.fn(),
    createBalancePayment: jest.fn(),
    formatCurrency: jest.fn(price => `$${price.toFixed(2)}`),
    id: 'test-direct-1'
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

describe('DirectSearchableDetails Page', () => {
  describe('Component Rendering', () => {
    test('renders direct details page with all elements', async () => {
      const { container } = renderWithProviders(<DirectSearchableDetails />);
      
      // Check main elements
      expect(screen.getByText('Support My Work')).toBeInTheDocument();
      expect(screen.getByText('Help me create more content')).toBeInTheDocument();
      expect(screen.getByText('Seller: ContentCreator')).toBeInTheDocument();
      
      // Check donation section
      expect(screen.getByText('Make a Donation')).toBeInTheDocument();
      
      // Check rating
      expect(screen.getByTestId('rating-display')).toBeInTheDocument();
      expect(screen.getByText('5 stars')).toBeInTheDocument();
      expect(screen.getByText('(50 reviews)')).toBeInTheDocument();
      
      // Check accessibility
      await checkAccessibility(container);
    });
  });

  describe('Flexible Pricing Mode', () => {
    test('renders flexible pricing options', () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Should show quick options
      expect(screen.getByRole('button', { name: '$4.99' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '$9.99' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '$14.99' })).toBeInTheDocument();
      
      // Should show custom amount input
      expect(screen.getByPlaceholderText(/enter amount/i)).toBeInTheDocument();
    });

    test('selects quick amount option', async () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Click $9.99 button
      const quickButton = screen.getByRole('button', { name: '$9.99' });
      fireEvent.click(quickButton);
      
      // Amount should be set
      expect(screen.getByDisplayValue('9.99')).toBeInTheDocument();
      
      // Button should be highlighted
      expect(quickButton).toHaveClass('MuiButton-contained');
    });

    test('allows custom amount entry', async () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      const amountInput = screen.getByPlaceholderText(/enter amount/i);
      
      await userEvent.type(amountInput, '25.50');
      
      expect(screen.getByDisplayValue('25.50')).toBeInTheDocument();
      
      // Quick buttons should not be highlighted
      const quickButtons = screen.getAllByRole('button', { name: /\$\d+\.\d+/ });
      quickButtons.forEach(button => {
        expect(button).toHaveClass('MuiButton-outlined');
      });
    });

    test('validates minimum amount', async () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      const amountInput = screen.getByPlaceholderText(/enter amount/i);
      await userEvent.type(amountInput, '0.50');
      
      const donateButton = screen.getByRole('button', { name: /donate/i });
      fireEvent.click(donateButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Minimum donation is \$1\.00/i);
      });
    });

    test('creates invoice with flexible amount', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-direct-1', amount: 10.00 }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<DirectSearchableDetails />);
      
      // Enter amount
      const amountInput = screen.getByPlaceholderText(/enter amount/i);
      await userEvent.type(amountInput, '10.00');
      
      // Click donate
      const donateButton = screen.getByRole('button', { name: /donate/i });
      fireEvent.click(donateButton);
      
      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalledWith(
          'test-direct-1',
          expect.objectContaining({
            amount: 10.00
          })
        );
      });
    });
  });

  describe('Fixed Pricing Mode', () => {
    beforeEach(() => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        SearchableItem: {
          searchable_id: 'test-direct-2',
          title: 'Fixed Donation',
          pricingMode: 'fixed',
          fixedAmount: 15.00,
          presetAmounts: null
        }
      });
    });

    test('renders fixed amount display', () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Should show fixed amount
      expect(screen.getByText('Fixed Donation Amount: $15.00')).toBeInTheDocument();
      
      // Should not show amount input
      expect(screen.queryByPlaceholderText(/enter amount/i)).not.toBeInTheDocument();
      
      // Should not show quick options
      expect(screen.queryByRole('button', { name: '$4.99' })).not.toBeInTheDocument();
    });

    test('creates invoice with fixed amount', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-direct-2' }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        SearchableItem: {
          searchable_id: 'test-direct-2',
          title: 'Fixed Donation',
          pricingMode: 'fixed',
          fixedAmount: 15.00
        },
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<DirectSearchableDetails />);
      
      // Click donate
      const donateButton = screen.getByRole('button', { name: /donate \$15\.00/i });
      fireEvent.click(donateButton);
      
      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalledWith(
          'test-direct-2',
          expect.objectContaining({
            amount: 15.00
          })
        );
      });
    });
  });

  describe('Preset Pricing Mode', () => {
    beforeEach(() => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        SearchableItem: {
          searchable_id: 'test-direct-3',
          title: 'Preset Donation',
          pricingMode: 'preset',
          fixedAmount: null,
          presetAmounts: [5.00, 10.00, 20.00]
        }
      });
    });

    test('renders preset amount options', () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Should show preset options
      expect(screen.getByRole('button', { name: '$5.00' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '$10.00' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '$20.00' })).toBeInTheDocument();
      
      // Should not show custom input
      expect(screen.queryByPlaceholderText(/enter amount/i)).not.toBeInTheDocument();
    });

    test('selects preset amount', async () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Click $10 option
      const presetButton = screen.getByRole('button', { name: '$10.00' });
      fireEvent.click(presetButton);
      
      // Should be selected
      expect(presetButton).toHaveClass('MuiButton-contained');
      
      // Donate button should show amount
      expect(screen.getByRole('button', { name: /donate \$10\.00/i })).toBeInTheDocument();
    });

    test('creates invoice with preset amount', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-direct-3' }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        SearchableItem: {
          searchable_id: 'test-direct-3',
          title: 'Preset Donation',
          pricingMode: 'preset',
          presetAmounts: [5.00, 10.00, 20.00]
        },
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<DirectSearchableDetails />);
      
      // Select preset amount
      const presetButton = screen.getByRole('button', { name: '$20.00' });
      fireEvent.click(presetButton);
      
      // Click donate
      const donateButton = screen.getByRole('button', { name: /donate \$20\.00/i });
      fireEvent.click(donateButton);
      
      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalledWith(
          'test-direct-3',
          expect.objectContaining({
            amount: 20.00
          })
        );
      });
    });
  });

  describe('Backward Compatibility', () => {
    test('handles legacy defaultAmount field', () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        SearchableItem: {
          searchable_id: 'test-direct-legacy',
          title: 'Legacy Donation',
          defaultAmount: 25.00, // Old format
          pricingMode: undefined
        }
      });
      
      renderWithProviders(<DirectSearchableDetails />);
      
      // Should treat as fixed amount
      expect(screen.getByText('Fixed Donation Amount: $25.00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /donate \$25\.00/i })).toBeInTheDocument();
    });
  });

  describe('Payment Flow', () => {
    test('shows success message after donation', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-success' }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<DirectSearchableDetails />);
      
      // Make donation
      const quickButton = screen.getByRole('button', { name: '$9.99' });
      fireEvent.click(quickButton);
      
      const donateButton = screen.getByRole('button', { name: /donate/i });
      fireEvent.click(donateButton);
      
      // Check success message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Thank you for your donation/i);
      });
    });

    test('handles payment error', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockRejectedValue(new Error('Payment failed'));
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<DirectSearchableDetails />);
      
      // Try to donate
      const quickButton = screen.getByRole('button', { name: '$9.99' });
      fireEvent.click(quickButton);
      
      const donateButton = screen.getByRole('button', { name: /donate/i });
      fireEvent.click(donateButton);
      
      // Check error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Payment failed/i);
      });
    });

    test('disables donate button when no amount selected', () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      const donateButton = screen.getByRole('button', { name: /donate/i });
      expect(donateButton).toBeDisabled();
    });

    test('enables donate button when amount is selected', async () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Select amount
      const quickButton = screen.getByRole('button', { name: '$9.99' });
      fireEvent.click(quickButton);
      
      const donateButton = screen.getByRole('button', { name: /donate/i });
      expect(donateButton).toBeEnabled();
    });
  });

  describe('Loading States', () => {
    test('shows loading state during payment', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<DirectSearchableDetails />);
      
      // Make donation
      const quickButton = screen.getByRole('button', { name: '$9.99' });
      fireEvent.click(quickButton);
      
      const donateButton = screen.getByRole('button', { name: /donate/i });
      fireEvent.click(donateButton);
      
      // Should show loading
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(donateButton).toBeDisabled();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Additional Features', () => {
    test('displays thank you message section', () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Should show motivational text
      expect(screen.getByText(/Your support helps/i)).toBeInTheDocument();
    });

    test('shows recent supporters section', () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Should show recent supporters
      expect(screen.getByText(/Recent Supporters/i)).toBeInTheDocument();
    });

    test('formats currency correctly', async () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      const amountInput = screen.getByPlaceholderText(/enter amount/i);
      
      // Test various formats
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '10.999');
      
      // Should round to 2 decimal places
      fireEvent.blur(amountInput);
      expect(screen.getByDisplayValue('11.00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Tab through quick options
      const quickButtons = screen.getAllByRole('button', { name: /\$\d+\.\d+/ });
      
      quickButtons[0].focus();
      expect(document.activeElement).toBe(quickButtons[0]);
      
      userEvent.tab();
      expect(document.activeElement).toBe(quickButtons[1]);
      
      userEvent.tab();
      expect(document.activeElement).toBe(quickButtons[2]);
      
      // Tab to amount input
      userEvent.tab();
      const amountInput = screen.getByPlaceholderText(/enter amount/i);
      expect(document.activeElement).toBe(amountInput);
    });

    test('announces selected amount to screen readers', async () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      const quickButton = screen.getByRole('button', { name: '$9.99' });
      fireEvent.click(quickButton);
      
      // Button should have aria-pressed
      expect(quickButton).toHaveAttribute('aria-pressed', 'true');
      
      // Amount input should be announced
      const amountInput = screen.getByPlaceholderText(/enter amount/i);
      expect(amountInput).toHaveAttribute('aria-label', expect.stringContaining('amount'));
      expect(amountInput).toHaveAttribute('aria-describedby');
    });

    test('provides proper labels for all controls', () => {
      renderWithProviders(<DirectSearchableDetails />);
      
      // Check donate button
      expect(screen.getByRole('button', { name: /donate/i })).toBeInTheDocument();
      
      // Check amount input
      const amountInput = screen.getByPlaceholderText(/enter amount/i);
      expect(amountInput).toHaveAttribute('aria-label');
      
      // Check quick option buttons
      const quickButtons = screen.getAllByRole('button', { name: /\$\d+\.\d+/ });
      quickButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });
});